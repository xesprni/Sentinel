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
package com.alibaba.csp.sentinel.dashboard.service;

import java.util.Collection;

import com.alibaba.csp.sentinel.dashboard.datasource.entity.ReleaseMessageEntity;
import com.alibaba.csp.sentinel.dashboard.domain.Result;
import com.alibaba.csp.sentinel.dashboard.repository.mapper.ReleaseMessageMapper;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.async.DeferredResult;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Implementation of {@link ReleaseMessageService}.
 * Manages DeferredResult watchers grouped by app name.
 */
@Service
@ConditionalOnProperty(name = "sentinel.mysql.enabled", havingValue = "true")
public class ReleaseMessageServiceImpl implements ReleaseMessageService {

    private static final Logger logger = LoggerFactory.getLogger(ReleaseMessageServiceImpl.class);

    private static final long MIN_TIMEOUT_MS = 10000;

    private final ConcurrentHashMap<String, CopyOnWriteArrayList<DeferredResult<Result<VersionQueryResult>>>> watcherMap =
        new ConcurrentHashMap<>();

    @Autowired
    private ReleaseMessageMapper releaseMessageMapper;

    /**
     * Get the watcher map for external access (e.g. RuleVersionWatchJob).
     */
    public ConcurrentHashMap<String, CopyOnWriteArrayList<DeferredResult<Result<VersionQueryResult>>>> getWatcherMap() {
        return watcherMap;
    }

    @Override
    public DeferredResult<Result<VersionQueryResult>> addWatcher(String app, long timeOut) {
        if (timeOut < MIN_TIMEOUT_MS) {
            timeOut = MIN_TIMEOUT_MS;
        }
        DeferredResult<Result<VersionQueryResult>> deferredResult = new DeferredResult<>(timeOut);

        watcherMap.computeIfAbsent(app, k -> new CopyOnWriteArrayList<>()).add(deferredResult);

        deferredResult.onCompletion(() -> {
            CopyOnWriteArrayList<DeferredResult<Result<VersionQueryResult>>> list = watcherMap.get(app);
            if (list != null) {
                list.remove(deferredResult);
            }
        });

        deferredResult.onTimeout(() -> {
            CopyOnWriteArrayList<DeferredResult<Result<VersionQueryResult>>> list = watcherMap.get(app);
            if (list != null) {
                list.remove(deferredResult);
            }
        });

        return deferredResult;
    }

    @Override
    public long getLastReleaseIdByMessage(String message) {
        Long id = releaseMessageMapper.getLastReleaseIdByMessage(message);
        return id == null ? 0L : id;
    }

    @Override
    public void insertNewRelease(String app, String ruleType) {
        String message = app + "+" + ruleType;
        ReleaseMessageEntity entity = new ReleaseMessageEntity(message);
        releaseMessageMapper.insert(entity);
        logger.info("[ReleaseMessage] Inserted new release: app={}, ruleType={}, id={}", app, ruleType, entity.getId());
    }
}
