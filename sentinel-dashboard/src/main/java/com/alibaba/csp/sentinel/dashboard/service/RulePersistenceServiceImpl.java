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

import java.util.Collections;
import java.util.List;

import com.alibaba.csp.sentinel.dashboard.datasource.entity.rule.*;
import com.alibaba.csp.sentinel.dashboard.repository.mapper.*;
import com.alibaba.fastjson.JSON;
import com.alibaba.csp.sentinel.util.StringUtil;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@ConditionalOnProperty(name = "sentinel.mysql.enabled", havingValue = "true")
public class RulePersistenceServiceImpl implements RulePersistenceService {

    private static final Logger logger = LoggerFactory.getLogger(RulePersistenceServiceImpl.class);
    static final String EMPTY_RULE_MACHINE_IP = "";
    static final int EMPTY_RULE_MACHINE_PORT = 0;

    @Autowired
    private FlowRuleMapper flowRuleMapper;
    @Autowired
    private DegradeRuleMapper degradeRuleMapper;
    @Autowired
    private SystemRuleMapper systemRuleMapper;
    @Autowired
    private AuthorityRuleMapper authorityRuleMapper;
    @Autowired
    private ParamFlowRuleMapper paramFlowRuleMapper;

    @Override
    @Transactional
    @SuppressWarnings("unchecked")
    public void saveRules(String app, String ruleType, List<? extends RuleEntity> rules) {
        switch (ruleType) {
            case "flow":
                saveFlowRules(app, (List<FlowRuleEntity>) rules);
                break;
            case "degrade":
                saveDegradeRules(app, (List<DegradeRuleEntity>) rules);
                break;
            case "system":
                saveSystemRules(app, (List<SystemRuleEntity>) rules);
                break;
            case "authority":
                saveAuthorityRules(app, (List<AuthorityRuleEntity>) rules);
                break;
            case "param_flow":
                saveParamFlowRules(app, (List<ParamFlowRuleEntity>) rules);
                break;
            default:
                throw new IllegalArgumentException("Unknown rule type: " + ruleType);
        }
    }

    @Override
    @SuppressWarnings("unchecked")
    public <T extends RuleEntity> List<T> loadRules(String app, String ruleType, Class<T> clazz) {
        try {
            switch (ruleType) {
                case "flow":
                    return (List<T>) flowRuleMapper.selectByApp(app);
                case "degrade":
                    return (List<T>) degradeRuleMapper.selectByApp(app);
                case "system":
                    return (List<T>) systemRuleMapper.selectByApp(app);
                case "authority":
                    return (List<T>) authorityRuleMapper.selectByApp(app);
                case "param_flow":
                    return (List<T>) paramFlowRuleMapper.selectByApp(app);
                default:
                    logger.warn("[RulePersistence] Unknown rule type: {}", ruleType);
                    return Collections.emptyList();
            }
        } catch (Exception e) {
            logger.error("[RulePersistence] Failed to load rules for app={}, type={}", app, ruleType, e);
            return Collections.emptyList();
        }
    }

    private void saveFlowRules(String app, List<FlowRuleEntity> rules) {
        flowRuleMapper.deleteByApp(app);
        for (FlowRuleEntity e : rules) {
            normalizeForPersistence(app, e);
            String clusterConfigJson = e.getClusterConfig() != null
                ? JSON.toJSONString(e.getClusterConfig()) : null;
            flowRuleMapper.insert(e, clusterConfigJson);
        }
    }

    private void saveDegradeRules(String app, List<DegradeRuleEntity> rules) {
        degradeRuleMapper.deleteByApp(app);
        for (DegradeRuleEntity e : rules) {
            normalizeForPersistence(app, e);
            degradeRuleMapper.insert(e);
        }
    }

    private void saveSystemRules(String app, List<SystemRuleEntity> rules) {
        systemRuleMapper.deleteByApp(app);
        for (SystemRuleEntity e : rules) {
            normalizeForPersistence(app, e);
            systemRuleMapper.insert(e);
        }
    }

    private void saveAuthorityRules(String app, List<AuthorityRuleEntity> rules) {
        authorityRuleMapper.deleteByApp(app);
        for (AuthorityRuleEntity e : rules) {
            if (e.getRule() == null) {
                continue;
            }
            normalizeForPersistence(app, e);
            authorityRuleMapper.insert(e);
        }
    }

    private void saveParamFlowRules(String app, List<ParamFlowRuleEntity> rules) {
        paramFlowRuleMapper.deleteByApp(app);
        for (ParamFlowRuleEntity e : rules) {
            if (e.getRule() == null) {
                continue;
            }
            normalizeForPersistence(app, e);
            String clusterConfigJson = e.getClusterConfig() != null
                ? JSON.toJSONString(e.getClusterConfig()) : null;
            String paramFlowItemsJson = e.getParamFlowItemList() != null
                ? JSON.toJSONString(e.getParamFlowItemList()) : null;
            paramFlowRuleMapper.insert(e, clusterConfigJson, paramFlowItemsJson);
        }
    }

    static void normalizeForPersistence(String app, FlowRuleEntity entity) {
        entity.setApp(resolveRuleApp(app, entity.getApp()));
        entity.setIp(resolveRuleIp(entity.getIp()));
        entity.setPort(resolveRulePort(entity.getPort()));
    }

    static void normalizeForPersistence(String app, DegradeRuleEntity entity) {
        entity.setApp(resolveRuleApp(app, entity.getApp()));
        entity.setIp(resolveRuleIp(entity.getIp()));
        entity.setPort(resolveRulePort(entity.getPort()));
    }

    static void normalizeForPersistence(String app, SystemRuleEntity entity) {
        entity.setApp(resolveRuleApp(app, entity.getApp()));
        entity.setIp(resolveRuleIp(entity.getIp()));
        entity.setPort(resolveRulePort(entity.getPort()));
    }

    static void normalizeForPersistence(String app, AuthorityRuleEntity entity) {
        entity.setApp(resolveRuleApp(app, entity.getApp()));
        entity.setIp(resolveRuleIp(entity.getIp()));
        entity.setPort(resolveRulePort(entity.getPort()));
    }

    static void normalizeForPersistence(String app, ParamFlowRuleEntity entity) {
        entity.setApp(resolveRuleApp(app, entity.getApp()));
        entity.setIp(resolveRuleIp(entity.getIp()));
        entity.setPort(resolveRulePort(entity.getPort()));
    }

    private static String resolveRuleApp(String app, String entityApp) {
        return StringUtil.isBlank(entityApp) ? app : entityApp;
    }

    private static String resolveRuleIp(String ip) {
        return ip == null ? EMPTY_RULE_MACHINE_IP : ip;
    }

    private static int resolveRulePort(Integer port) {
        return port == null ? EMPTY_RULE_MACHINE_PORT : port;
    }
}
