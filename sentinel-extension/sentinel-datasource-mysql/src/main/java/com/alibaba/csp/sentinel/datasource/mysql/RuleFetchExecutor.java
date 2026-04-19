/*
 * Copyright 1999-2018 Alibaba Group Holding Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.alibaba.csp.sentinel.datasource.mysql;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReentrantLock;

import com.alibaba.csp.sentinel.datasource.AbstractDataSource;
import com.alibaba.csp.sentinel.log.RecordLog;
import com.alibaba.csp.sentinel.transport.config.TransportConfig;
import com.alibaba.csp.sentinel.transport.endpoint.Endpoint;
import com.alibaba.csp.sentinel.util.AppNameUtil;
import com.alibaba.csp.sentinel.util.StringUtil;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;

/**
 * <p>
 * Executor that fetches Sentinel rules from Dashboard via HTTP long polling.
 * Dashboard stores rules in MySQL and serves them through REST API.
 * </p>
 *
 * <p>
 * The flow:
 * <ol>
 *     <li>Full sync: fetch all rule types from Dashboard via {@code /rule/list}</li>
 *     <li>Long polling: check version changes via {@code /rule/watch/version},
 *         Dashboard holds the request until a change is detected or timeout</li>
 *     <li>On change detected: fetch the changed rule type(s) from Dashboard</li>
 * </ol>
 * </p>
 *
 * <p>Required Dashboard endpoints:</p>
 * <ul>
 *     <li>{@code POST /rule/list} - query rules by app and rule type</li>
 *     <li>{@code POST /rule/watch/version} - long polling for version changes</li>
 * </ul>
 *
 * @author Eric Zhao
 */
public class RuleFetchExecutor {

    private static final String RULE_LIST_PATH = "/rule/list";
    private static final String RULE_WATCH_VERSION_PATH = "/rule/watch/version";

    /**
     * Default long polling timeout in milliseconds.
     */
    static long DEFAULT_TIMEOUT_MS = 60000;

    private static final int CONNECT_TIMEOUT_MS = 5000;
    private static final int READ_TIMEOUT_MS = 5000;

    private static final ReentrantLock lock = new ReentrantLock();

    /**
     * Rule type -> data source
     */
    private final Map<String, AbstractDataSource<String, ?>> ruleDataSources = new ConcurrentHashMap<>();

    /**
     * Rule type -> last known version (from release_message)
     */
    private final Map<String, Long> ruleVersions = new ConcurrentHashMap<>();

    private volatile boolean syncAllCompleted = false;
    private volatile String dashboardAddress;

    public RuleFetchExecutor() {
    }

    /**
     * Register a rule type with its data source.
     *
     * @param ruleType   rule type identifier (e.g. "flow", "degrade")
     * @param dataSource the data source whose property will be updated
     */
    public void register(String ruleType, AbstractDataSource<String, ?> dataSource) {
        ruleDataSources.put(ruleType, dataSource);
    }

    /**
     * Full sync: fetch all registered rule types from Dashboard.
     */
    void sync() {
        lock.lock();
        try {
            RecordLog.info("[RuleFetchExecutor] Start syncing all rule data");
            for (Map.Entry<String, AbstractDataSource<String, ?>> entry : ruleDataSources.entrySet()) {
                try {
                    fetchRuleData(entry.getKey());
                } catch (Exception e) {
                    RecordLog.warn("[RuleFetchExecutor] Failed to fetch rule data for type: " + entry.getKey(), e);
                }
            }
            syncAllCompleted = true;
        } finally {
            lock.unlock();
        }
    }

    /**
     * Long polling loop: continuously check for version changes and fetch updates.
     */
    void longPollingFetch() {
        RecordLog.info("[RuleFetchExecutor] Long polling fetch task started");
        while (true) {
            try {
                checkVersion();
            } catch (InterruptedException e) {
                RecordLog.info("[RuleFetchExecutor] Long polling fetch task interrupted");
                Thread.currentThread().interrupt();
                break;
            } catch (Throwable e) {
                RecordLog.warn("[RuleFetchExecutor] Error during version check", e);
            }
        }
    }

    /**
     * Send version check request to Dashboard via long polling.
     * Dashboard holds the request until a change is detected or timeout.
     */
    private void checkVersion() throws InterruptedException {
        if (!syncAllCompleted) {
            Thread.sleep(100);
            return;
        }

        String app = AppNameUtil.getAppName();
        JSONObject request = new JSONObject();
        JSONArray ruleInfos = new JSONArray();
        for (Map.Entry<String, AbstractDataSource<String, ?>> entry : ruleDataSources.entrySet()) {
            JSONObject info = new JSONObject();
            info.put("app", app);
            info.put("ruleType", entry.getKey());
            Long version = ruleVersions.get(entry.getKey());
            info.put("version", version == null ? 0L : version);
            ruleInfos.add(info);
        }
        request.put("ruleInfos", ruleInfos);
        request.put("timeOut", DEFAULT_TIMEOUT_MS);

        String response = null;
        try {
            response = doPost(RULE_WATCH_VERSION_PATH, request.toJSONString(), (int) (DEFAULT_TIMEOUT_MS + CONNECT_TIMEOUT_MS));
        } catch (Exception ignore) {
        }

        if (StringUtil.isNotBlank(response)) {
            try {
                JSONObject result = JSON.parseObject(response);
                if (result != null && result.getBooleanValue("success") && result.getJSONObject("data") != null) {
                    JSONObject data = result.getJSONObject("data");
                    JSONArray checkResults = data.getJSONArray("checkResults");
                    if (checkResults != null) {
                        for (int i = 0; i < checkResults.size(); i++) {
                            JSONObject checkResult = checkResults.getJSONObject(i);
                            String ruleType = checkResult.getString("ruleType");
                            Long newVersion = checkResult.getLong("version");
                            if (newVersion != null) {
                                ruleVersions.put(ruleType, newVersion);
                            }
                            fetchRuleData(ruleType);
                        }
                    }
                } else {
                    RecordLog.warn("[RuleFetchExecutor] Version check returned non-success: {}", response);
                }
            } catch (Exception e) {
                RecordLog.warn("[RuleFetchExecutor] Failed to parse version check response", e);
            }
        } else {
            // No response or timeout, short sleep before retry
            Thread.sleep(200);
        }
    }

    /**
     * Fetch rule data for a specific rule type via Dashboard REST API.
     */
    private void fetchRuleData(String ruleType) throws Exception {
        AbstractDataSource<String, ?> dataSource = ruleDataSources.get(ruleType);
        if (dataSource == null) {
            return;
        }

        String app = AppNameUtil.getAppName();
        JSONObject request = new JSONObject();
        request.put("app", app);
        request.put("ruleType", ruleType);
        request.put("startId", 0L);
        request.put("pageSize", 1000);

        String response = doPost(RULE_LIST_PATH, request.toJSONString(), READ_TIMEOUT_MS);

        if (StringUtil.isBlank(response)) {
            RecordLog.warn("[RuleFetchExecutor] Empty response for rule type: {}", ruleType);
            return;
        }

        // Parse paginated response and collect all rule entities
        List<Object> allEntities = new ArrayList<>();
        JSONObject pageResponse = JSON.parseObject(response);
        if (pageResponse == null || !pageResponse.getBooleanValue("success")) {
            RecordLog.warn("[RuleFetchExecutor] Failed response for rule type {}: {}", ruleType, response);
            return;
        }

        JSONObject data = pageResponse.getJSONObject("data");
        if (data != null) {
            JSONArray entities = data.getJSONArray("ruleEntities");
            if (entities != null) {
                for (int i = 0; i < entities.size(); i++) {
                    allEntities.add(entities.get(i));
                }
            }
            // Update version from response
            Long version = data.getLong("version");
            if (version != null) {
                ruleVersions.put(ruleType, version);
            }
        }

        String ruleJson = JSON.toJSONString(allEntities);
        updateDataSource(dataSource, ruleJson);
        RecordLog.info("[RuleFetchExecutor] Updated rules for type [{}], count: {}", ruleType, allEntities.size());
    }

    /**
     * Execute HTTP POST to Dashboard.
     */
    private String doPost(String path, String body, int timeoutMs) throws Exception {
        String address = getDashboardAddress();
        if (address == null) {
            throw new IllegalStateException("Dashboard address not configured");
        }

        String urlStr = address + path;
        HttpURLConnection conn = null;
        try {
            URL url = new URL(urlStr);
            conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setDoOutput(true);
            conn.setRequestProperty("Content-Type", "application/json;charset=UTF-8");
            conn.setConnectTimeout(CONNECT_TIMEOUT_MS);
            conn.setReadTimeout(timeoutMs);

            byte[] bodyBytes = body.getBytes(StandardCharsets.UTF_8);
            try (OutputStream os = conn.getOutputStream()) {
                os.write(bodyBytes);
                os.flush();
            }

            int responseCode = conn.getResponseCode();
            if (responseCode == 200) {
                try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
                    StringBuilder sb = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) {
                        sb.append(line);
                    }
                    return sb.toString();
                }
            } else if (responseCode == 304) {
                // Not modified
                return null;
            } else {
                RecordLog.warn("[RuleFetchExecutor] HTTP POST {} returned status {}", urlStr, responseCode);
                return null;
            }
        } finally {
            if (conn != null) {
                conn.disconnect();
            }
        }
    }

    /**
     * Get Dashboard address from TransportConfig.
     */
    private String getDashboardAddress() {
        if (StringUtil.isNotBlank(dashboardAddress)) {
            return dashboardAddress;
        }
        List<Endpoint> servers = TransportConfig.getConsoleServerList();
        if (servers == null || servers.isEmpty()) {
            RecordLog.warn("[RuleFetchExecutor] Dashboard server address is not configured");
            return null;
        }
        Endpoint server = servers.get(0);
        String protocol = server.getProtocol() != null ? server.getProtocol().name().toLowerCase() : "http";
        dashboardAddress = protocol + "://" + server.getHost() + ":" + server.getPort();
        RecordLog.info("[RuleFetchExecutor] Dashboard address: {}", dashboardAddress);
        return dashboardAddress;
    }

    @SuppressWarnings("unchecked")
    private <S, T> void updateDataSource(AbstractDataSource<S, T> ds, S source) throws Exception {
        T parsed = ds.loadConfig(source);
        ds.getProperty().updateValue(parsed);
    }
}
