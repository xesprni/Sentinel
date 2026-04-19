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

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

import com.alibaba.csp.sentinel.concurrent.NamedThreadFactory;
import com.alibaba.csp.sentinel.log.RecordLog;
import com.alibaba.csp.sentinel.transport.config.TransportConfig;
import com.alibaba.csp.sentinel.util.StringUtil;

/**
 * <p>
 * Configuration and lifecycle manager for rule fetching via HTTP long polling.
 * Follows the same pattern as amh's implementation:
 * <ul>
 *     <li>Scheduled full sync thread: periodically fetches all rules (default: 5 minutes)</li>
 *     <li>Long polling thread: continuously checks for version changes via Dashboard</li>
 * </ul>
 * </p>
 *
 * <p>Usage example:</p>
 * <pre>
 * RuleFetchExecutor executor = new RuleFetchExecutor();
 *
 * // Register data sources for each rule type
 * executor.register("flow", flowDataSource);
 * executor.register("degrade", degradeDataSource);
 *
 * // Initialize and start
 * RuleFetchConfig fetchConfig = new RuleFetchConfig(executor);
 * fetchConfig.init();
 *
 * // On shutdown
 * fetchConfig.shutdown();
 * </pre>
 *
 * <p>Required system properties:</p>
 * <ul>
 *     <li>{@code csp.sentinel.dashboard.server} - Dashboard address (e.g. "localhost:8080")</li>
 * </ul>
 *
 * <p>Optional system properties:</p>
 * <ul>
 *     <li>{@code sentinel.rule.fetch.full.sync.interval.seconds} - full sync interval, default 300s</li>
 *     <li>{@code sentinel.long.polling.timeout.ms} - long polling timeout, default 60000ms</li>
 * </ul>
 *
 * @author Eric Zhao
 */
public class RuleFetchConfig {

    private static final long DEFAULT_FULL_SYNC_INTERVAL_SECONDS = 300;

    private final RuleFetchExecutor executor;

    private ScheduledExecutorService fullSyncScheduler;
    private ExecutorService longPollingExecutor;

    public RuleFetchConfig(RuleFetchExecutor executor) {
        if (executor == null) {
            throw new IllegalArgumentException("executor cannot be null");
        }
        this.executor = executor;
    }

    /**
     * Initialize and start the rule fetching threads.
     */
    public void init() {
        RecordLog.info("[RuleFetchConfig] Initializing rule fetch via long polling");

        // First full sync
        executor.sync();

        // Configure long polling timeout
        configureLongPollingTimeout();

        // Scheduled full sync thread (every 5 minutes by default)
        long syncIntervalSeconds = getFullSyncIntervalSeconds();
        fullSyncScheduler = Executors.newScheduledThreadPool(1,
            new NamedThreadFactory("sentinel-mysql-full-sync", true));
        fullSyncScheduler.scheduleAtFixedRate(() -> {
            try {
                executor.sync();
            } catch (Throwable e) {
                RecordLog.warn("[RuleFetchConfig] Full sync failed", e);
            }
        }, syncIntervalSeconds, syncIntervalSeconds, TimeUnit.SECONDS);

        // Long polling thread (runs continuously)
        longPollingExecutor = new ThreadPoolExecutor(1, 1, 0L, TimeUnit.MILLISECONDS,
            new LinkedBlockingQueue<>(),
            new NamedThreadFactory("sentinel-rule-long-polling", true));
        longPollingExecutor.execute(() -> executor.longPollingFetch());

        RecordLog.info("[RuleFetchConfig] Rule fetch initialized. Full sync interval: {}s, long polling timeout: {}ms",
            syncIntervalSeconds, RuleFetchExecutor.DEFAULT_TIMEOUT_MS);
    }

    /**
     * Shutdown all fetching threads.
     */
    public void shutdown() {
        if (fullSyncScheduler != null) {
            fullSyncScheduler.shutdownNow();
            fullSyncScheduler = null;
        }
        if (longPollingExecutor != null) {
            longPollingExecutor.shutdownNow();
            longPollingExecutor = null;
        }
        RecordLog.info("[RuleFetchConfig] Rule fetch shutdown");
    }

    private void configureLongPollingTimeout() {
        try {
            String timeoutStr = System.getProperty("sentinel.long.polling.timeout.ms");
            if (StringUtil.isNotBlank(timeoutStr)) {
                long timeout = Long.parseLong(timeoutStr);
                if (timeout > 0 && timeout < RuleFetchExecutor.DEFAULT_TIMEOUT_MS) {
                    RuleFetchExecutor.DEFAULT_TIMEOUT_MS = timeout;
                }
            }
        } catch (Throwable e) {
            RecordLog.warn("[RuleFetchConfig] Failed to configure long polling timeout", e);
        }
    }

    private long getFullSyncIntervalSeconds() {
        try {
            String val = System.getProperty("sentinel.rule.fetch.full.sync.interval.seconds");
            if (StringUtil.isNotBlank(val)) {
                long seconds = Long.parseLong(val);
                if (seconds > 0) {
                    return seconds;
                }
            }
        } catch (Throwable ignore) {
        }
        return DEFAULT_FULL_SYNC_INTERVAL_SECONDS;
    }
}
