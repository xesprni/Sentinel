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

import com.alibaba.csp.sentinel.dashboard.domain.Result;

import org.springframework.web.context.request.async.DeferredResult;

/**
 * Service for managing rule release messages and long polling notifications.
 */
public interface ReleaseMessageService {

    /**
     * Register a DeferredResult watcher for long polling version check.
     *
     * @param app      application name
     * @param timeOut  timeout in milliseconds
     * @return deferred result that will be completed on version change or timeout
     */
    DeferredResult<Result<VersionQueryResult>> addWatcher(String app, long timeOut);

    /**
     * Get the latest release id for the given message key.
     *
     * @param message message key (app+ruleType)
     * @return latest release id, or 0 if none
     */
    long getLastReleaseIdByMessage(String message);

    /**
     * Insert a new release message record for rule change notification.
     *
     * @param app      application name
     * @param ruleType rule type identifier
     */
    void insertNewRelease(String app, String ruleType);
}
