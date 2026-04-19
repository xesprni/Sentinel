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

import java.util.List;

import com.alibaba.csp.sentinel.dashboard.discovery.AppManagement;
import com.alibaba.csp.sentinel.dashboard.discovery.MachineInfo;
import com.alibaba.csp.sentinel.dashboard.service.MachineInfoService;

import org.mybatis.spring.annotation.MapperScan;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

import javax.annotation.PostConstruct;

/**
 * MySQL persistence configuration.
 * Only activated when spring.profiles.active includes "mysql"
 * or sentinel.mysql.enabled=true.
 *
 * <p>Without this profile, the dashboard runs purely in-memory as before.</p>
 */
@Configuration
@ConditionalOnProperty(name = "sentinel.mysql.enabled", havingValue = "true")
@MapperScan("com.alibaba.csp.sentinel.dashboard.repository.mapper")
@EnableScheduling
public class MysqlPersistenceConfiguration {

    private static final Logger logger = LoggerFactory.getLogger(MysqlPersistenceConfiguration.class);

    @Autowired
    private AppManagement appManagement;

    @Autowired
    private MachineInfoService machineInfoService;

    @Value("${sentinel.mysql.heartbeat-expire-seconds:300}")
    private long heartbeatExpireSeconds;

    /**
     * On startup, load persisted machine info from MySQL into in-memory discovery.
     */
    @PostConstruct
    public void loadMachinesFromDatabase() {
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

    /**
     * Periodically check heartbeat expiry and mark stale machines as offline.
     * Runs every 30 seconds.
     */
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
