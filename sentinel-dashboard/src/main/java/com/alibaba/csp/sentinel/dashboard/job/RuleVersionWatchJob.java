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
package com.alibaba.csp.sentinel.dashboard.job;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CopyOnWriteArrayList;

import com.alibaba.csp.sentinel.dashboard.datasource.entity.ReleaseMessageEntity;
import com.alibaba.csp.sentinel.dashboard.domain.Result;
import com.alibaba.csp.sentinel.dashboard.repository.mapper.ReleaseMessageMapper;
import com.alibaba.csp.sentinel.dashboard.service.ReleaseMessageServiceImpl;
import com.alibaba.csp.sentinel.dashboard.service.VersionQueryResult;
import com.alibaba.csp.sentinel.dashboard.service.VersionQueryResult.CheckResult;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.async.DeferredResult;

/**
 * Periodically polls t_release_message for new records and notifies
 * waiting DeferredResult watchers via long polling.
 */
@Component
@ConditionalOnProperty(name = "sentinel.mysql.enabled", havingValue = "true")
public class RuleVersionWatchJob {

    private static final Logger logger = LoggerFactory.getLogger(RuleVersionWatchJob.class);

    @Autowired
    private ReleaseMessageMapper releaseMessageMapper;

    @Autowired
    private ReleaseMessageServiceImpl releaseMessageService;

    private volatile long maxId = 0;

    /**
     * Poll new release messages every 1 second and notify watchers.
     */
    @Scheduled(fixedDelay = 1000)
    public void executeWatchJob() {
        try {
            if (maxId <= 0) {
                Long dbMaxId = releaseMessageMapper.getMaxId();
                maxId = dbMaxId != null ? dbMaxId : 0L;
            }

            List<ReleaseMessageEntity> messages = releaseMessageMapper.getFirst500ByIdDesc(maxId);
            if (messages == null || messages.isEmpty()) {
                return;
            }

            // Group by app -> ruleTypes
            Map<String, Set<String>> notifyMap = new HashMap<>();
            for (ReleaseMessageEntity msg : messages) {
                String[] parts = msg.getMessage().split("\\+", 2);
                if (parts.length == 2) {
                    String app = parts[0];
                    String ruleType = parts[1];
                    notifyMap.computeIfAbsent(app, k -> new HashSet<>()).add(ruleType);
                }
            }

            // Notify watchers for each app
            for (Map.Entry<String, Set<String>> entry : notifyMap.entrySet()) {
                String app = entry.getKey();
                Set<String> ruleTypes = entry.getValue();

                Set<CheckResult> checkResults = new HashSet<>();
                for (String ruleType : ruleTypes) {
                    checkResults.add(new CheckResult(app, ruleType));
                }

                VersionQueryResult result = new VersionQueryResult();
                result.setCheckResults(checkResults);
                result.setTotalCount(checkResults.size());

                CopyOnWriteArrayList<DeferredResult<Result<VersionQueryResult>>> watcherList =
                    releaseMessageService.getWatcherMap().getOrDefault(app, new CopyOnWriteArrayList<>());

                for (DeferredResult<Result<VersionQueryResult>> deferredResult : watcherList) {
                    if (deferredResult != null && !deferredResult.isSetOrExpired()) {
                        deferredResult.setResult(Result.ofSuccess(result));
                    }
                }
            }

            // Update maxId to the latest message id
            maxId = messages.get(messages.size() - 1).getId();
        } catch (Throwable e) {
            logger.error("[RuleVersionWatchJob] Error executing watch job", e);
        }
    }
}
