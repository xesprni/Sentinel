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
package com.alibaba.csp.sentinel.dashboard.controller;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import javax.annotation.PostConstruct;

import com.alibaba.csp.sentinel.dashboard.datasource.entity.rule.AuthorityRuleEntity;
import com.alibaba.csp.sentinel.dashboard.datasource.entity.rule.DegradeRuleEntity;
import com.alibaba.csp.sentinel.dashboard.datasource.entity.rule.FlowRuleEntity;
import com.alibaba.csp.sentinel.dashboard.datasource.entity.rule.ParamFlowRuleEntity;
import com.alibaba.csp.sentinel.dashboard.datasource.entity.rule.RuleEntity;
import com.alibaba.csp.sentinel.dashboard.datasource.entity.rule.SystemRuleEntity;
import com.alibaba.csp.sentinel.dashboard.domain.Result;
import com.alibaba.csp.sentinel.dashboard.repository.rule.InMemAuthorityRuleStore;
import com.alibaba.csp.sentinel.dashboard.repository.rule.InMemDegradeRuleStore;
import com.alibaba.csp.sentinel.dashboard.repository.rule.InMemFlowRuleStore;
import com.alibaba.csp.sentinel.dashboard.repository.rule.InMemParamFlowRuleStore;
import com.alibaba.csp.sentinel.dashboard.repository.rule.InMemSystemRuleStore;
import com.alibaba.csp.sentinel.dashboard.repository.rule.InMemoryRuleRepositoryAdapter;
import com.alibaba.csp.sentinel.dashboard.service.ReleaseMessageService;
import com.alibaba.csp.sentinel.dashboard.service.VersionQueryResult;
import com.alibaba.csp.sentinel.util.StringUtil;

import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.context.request.async.DeferredResult;

/**
 * REST controller for rule long polling and listing.
 * Provides endpoints for client-side RuleFetchExecutor to detect
 * rule changes and fetch rule data.
 *
 * <p>Only active when sentinel.mysql.enabled=true.</p>
 */
@RestController
@RequestMapping("/rule")
@ConditionalOnProperty(name = "sentinel.mysql.enabled", havingValue = "true")
public class RuleNotifyController {

    private static final Logger logger = LoggerFactory.getLogger(RuleNotifyController.class);

    @Autowired
    private ReleaseMessageService releaseMessageService;

    @Autowired
    private InMemFlowRuleStore flowRuleStore;
    @Autowired
    private InMemDegradeRuleStore degradeRuleStore;
    @Autowired
    private InMemSystemRuleStore systemRuleStore;
    @Autowired
    private InMemAuthorityRuleStore authorityRuleStore;
    @Autowired
    private InMemParamFlowRuleStore paramFlowRuleStore;

    private final Map<String, InMemoryRuleRepositoryAdapter<? extends RuleEntity>> repositoryMap = new HashMap<>();

    @PostConstruct
    public void init() {
        repositoryMap.put("flow", flowRuleStore);
        repositoryMap.put("degrade", degradeRuleStore);
        repositoryMap.put("system", systemRuleStore);
        repositoryMap.put("authority", authorityRuleStore);
        repositoryMap.put("param_flow", paramFlowRuleStore);
    }

    /**
     * Long polling endpoint for version change detection.
     * First checks client versions against current DB versions.
     * If any are behind, returns immediately; otherwise registers DeferredResult.
     */
    @PostMapping("/watch/version")
    public DeferredResult<Result<VersionQueryResult>> watchVersion(@RequestBody JSONObject body) {
        JSONArray ruleInfos = body.getJSONArray("ruleInfos");
        long timeOut = body.getLongValue("timeOut");

        if (ruleInfos == null || ruleInfos.isEmpty()) {
            DeferredResult<Result<VersionQueryResult>> result = new DeferredResult<>();
            result.setResult(Result.ofFail(-1, "ruleInfos is empty"));
            return result;
        }

        String app = ruleInfos.getJSONObject(0).getString("app");
        if (StringUtil.isBlank(app)) {
            DeferredResult<Result<VersionQueryResult>> result = new DeferredResult<>();
            result.setResult(Result.ofFail(-1, "app is blank"));
            return result;
        }

        // Immediate version comparison: check if client is behind
        Set<VersionQueryResult.CheckResult> changed = new HashSet<>();
        for (int i = 0; i < ruleInfos.size(); i++) {
            JSONObject info = ruleInfos.getJSONObject(i);
            String ruleType = info.getString("ruleType");
            long clientVersion = info.getLongValue("version");
            String message = app + "+" + ruleType;
            long serverVersion = releaseMessageService.getLastReleaseIdByMessage(message);
            if (serverVersion > clientVersion) {
                changed.add(new VersionQueryResult.CheckResult(app, ruleType));
            }
        }

        if (!changed.isEmpty()) {
            VersionQueryResult queryResult = new VersionQueryResult();
            queryResult.setCheckResults(changed);
            queryResult.setTotalCount(changed.size());
            DeferredResult<Result<VersionQueryResult>> result = new DeferredResult<>();
            result.setResult(Result.ofSuccess(queryResult));
            return result;
        }

        return releaseMessageService.addWatcher(app, timeOut);
    }

    /**
     * Fetch rule data for a specific app and rule type.
     */
    @PostMapping("/list")
    public Result<JSONObject> listRule(@RequestBody JSONObject body) {
        String app = body.getString("app");
        String ruleType = body.getString("ruleType");

        if (StringUtil.isBlank(app)) {
            return Result.ofFail(-1, "app can't be null or empty");
        }
        if (StringUtil.isBlank(ruleType)) {
            return Result.ofFail(-1, "ruleType can't be null or empty");
        }

        InMemoryRuleRepositoryAdapter<? extends RuleEntity> repository = repositoryMap.get(ruleType);
        if (repository == null) {
            return Result.ofFail(-1, "unknown ruleType: " + ruleType);
        }

        List<? extends RuleEntity> rules = repository.findAllByApp(app);

        String message = app + "+" + ruleType;
        long version = releaseMessageService.getLastReleaseIdByMessage(message);

        JSONObject data = new JSONObject();
        data.put("ruleEntities", rules);
        data.put("version", version);
        data.put("ruleType", ruleType);

        return Result.ofSuccess(data);
    }
}
