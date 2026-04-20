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

import com.alibaba.csp.sentinel.dashboard.datasource.entity.rule.RuleEntity;

import java.util.List;

/**
 * Service for persisting rules to MySQL.
 */
public interface RulePersistenceService {

    /**
     * Save all rules for a given app and rule type.
     * Overwrites existing data for this app+ruleType.
     *
     * @param app      application name
     * @param ruleType rule type identifier
     * @param rules    list of rule entities
     */
    void saveRules(String app, String ruleType, List<? extends RuleEntity> rules);

    /**
     * Load rules for a given app and rule type.
     *
     * @param app      application name
     * @param ruleType rule type identifier
     * @param clazz    rule entity class
     * @param <T>      rule entity type
     * @return list of rule entities, or empty list if none
     */
    <T extends RuleEntity> List<T> loadRules(String app, String ruleType, Class<T> clazz);
}
