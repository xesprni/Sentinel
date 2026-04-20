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
package com.alibaba.csp.sentinel.dashboard.config;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import com.alibaba.csp.sentinel.dashboard.datasource.entity.rule.AuthorityRuleEntity;
import com.alibaba.csp.sentinel.dashboard.datasource.entity.rule.DegradeRuleEntity;
import com.alibaba.csp.sentinel.dashboard.datasource.entity.rule.FlowRuleEntity;
import com.alibaba.csp.sentinel.dashboard.datasource.entity.rule.ParamFlowRuleEntity;
import com.alibaba.csp.sentinel.dashboard.datasource.entity.rule.RuleEntity;
import com.alibaba.csp.sentinel.dashboard.datasource.entity.rule.SystemRuleEntity;
import com.alibaba.csp.sentinel.dashboard.discovery.AppManagement;
import com.alibaba.csp.sentinel.dashboard.discovery.MachineInfo;
import com.alibaba.csp.sentinel.dashboard.repository.rule.InMemAuthorityRuleStore;
import com.alibaba.csp.sentinel.dashboard.repository.rule.InMemDegradeRuleStore;
import com.alibaba.csp.sentinel.dashboard.repository.rule.InMemFlowRuleStore;
import com.alibaba.csp.sentinel.dashboard.repository.rule.InMemParamFlowRuleStore;
import com.alibaba.csp.sentinel.dashboard.repository.rule.InMemSystemRuleStore;
import com.alibaba.csp.sentinel.dashboard.repository.rule.InMemoryRuleRepositoryAdapter;
import com.alibaba.csp.sentinel.dashboard.service.MachineInfoService;
import com.alibaba.csp.sentinel.dashboard.service.RulePersistenceService;

import org.mybatis.spring.annotation.MapperScan;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

import javax.annotation.PostConstruct;

/**
 * MySQL persistence configuration.
 * Only activated when sentinel.mysql.enabled=true.
 *
 * <p>Without this property, the dashboard runs purely in-memory as before.</p>
 */
@Configuration
@ConditionalOnProperty(name = "sentinel.mysql.enabled", havingValue = "true")
@Import(DataSourceAutoConfiguration.class)
@MapperScan("com.alibaba.csp.sentinel.dashboard.repository.mapper")
@EnableScheduling
public class MysqlPersistenceConfiguration {

    private static final Logger logger = LoggerFactory.getLogger(MysqlPersistenceConfiguration.class);

    @Autowired
    private AppManagement appManagement;

    @Autowired
    private MachineInfoService machineInfoService;

    @Autowired
    private RulePersistenceService rulePersistenceService;

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

    @Value("${sentinel.mysql.heartbeat-expire-seconds:300}")
    private long heartbeatExpireSeconds;

    @PostConstruct
    public void loadFromDatabase() {
        loadMachinesFromDatabase();
        loadRulesFromDatabase();
    }

    private void loadMachinesFromDatabase() {
        try {
            List<String> apps = machineInfoService.getAppNames();
            int loaded = 0;
            for (String app : apps) {
                List<MachineInfo> machines = machineInfoService.getAliveMachinesByApp(app);
                for (MachineInfo machine : machines) {
                    appManagement.addMachine(machine);
                    loaded++;
                }
            }
            logger.info("[MySQL] Loaded {} alive machines from database across {} apps", loaded, apps.size());
        } catch (Exception e) {
            logger.error("[MySQL] Failed to load machines from database on startup", e);
        }
    }

    @SuppressWarnings("unchecked")
    private void loadRulesFromDatabase() {
        try {
            Set<String> apps = new HashSet<>(machineInfoService.getAppNames());
            int totalRules = 0;

            Map<String, InMemoryRuleRepositoryAdapter<? extends RuleEntity>> storeMap = createStoreMap();
            Map<String, Class<? extends RuleEntity>> classMap = createClassMap();

            for (String app : apps) {
                for (Map.Entry<String, InMemoryRuleRepositoryAdapter<? extends RuleEntity>> entry : storeMap.entrySet()) {
                    String ruleType = entry.getKey();
                    InMemoryRuleRepositoryAdapter<RuleEntity> store =
                        (InMemoryRuleRepositoryAdapter<RuleEntity>) entry.getValue();
                    Class<? extends RuleEntity> clazz = classMap.get(ruleType);

                    List<RuleEntity> rules = (List<RuleEntity>) rulePersistenceService.loadRules(app, ruleType, clazz);
                    for (RuleEntity rule : rules) {
                        store.save(rule);
                    }
                    totalRules += rules.size();
                }
            }
            logger.info("[MySQL] Loaded {} rules from database across {} apps", totalRules, apps.size());
        } catch (Exception e) {
            logger.error("[MySQL] Failed to load rules from database on startup", e);
        }
    }

    private Map<String, InMemoryRuleRepositoryAdapter<? extends RuleEntity>> createStoreMap() {
        Map<String, InMemoryRuleRepositoryAdapter<? extends RuleEntity>> map = new java.util.LinkedHashMap<>();
        map.put("flow", flowRuleStore);
        map.put("degrade", degradeRuleStore);
        map.put("system", systemRuleStore);
        map.put("authority", authorityRuleStore);
        map.put("param_flow", paramFlowRuleStore);
        return map;
    }

    private Map<String, Class<? extends RuleEntity>> createClassMap() {
        Map<String, Class<? extends RuleEntity>> map = new java.util.LinkedHashMap<>();
        map.put("flow", FlowRuleEntity.class);
        map.put("degrade", DegradeRuleEntity.class);
        map.put("system", SystemRuleEntity.class);
        map.put("authority", AuthorityRuleEntity.class);
        map.put("param_flow", ParamFlowRuleEntity.class);
        return map;
    }

    @Scheduled(fixedDelay = 30000)
    public void expireStaleMachines() {
        try {
            long now = System.currentTimeMillis();
            long threshold = now - heartbeatExpireSeconds * 1000;
            machineInfoService.expireStaleMachines(threshold);
        } catch (Exception e) {
            logger.error("[MySQL] Failed to expire stale machines", e);
        }
    }
}
