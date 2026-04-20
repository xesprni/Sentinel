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

import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

import com.alibaba.csp.sentinel.config.SentinelConfig;
import com.alibaba.csp.sentinel.init.InitFunc;
import com.alibaba.csp.sentinel.init.InitOrder;
import com.alibaba.csp.sentinel.log.RecordLog;
import com.alibaba.csp.sentinel.slots.block.authority.AuthorityRule;
import com.alibaba.csp.sentinel.slots.block.authority.AuthorityRuleManager;
import com.alibaba.csp.sentinel.slots.block.degrade.DegradeRule;
import com.alibaba.csp.sentinel.slots.block.degrade.DegradeRuleManager;
import com.alibaba.csp.sentinel.slots.block.flow.FlowRule;
import com.alibaba.csp.sentinel.slots.block.flow.FlowRuleManager;
import com.alibaba.csp.sentinel.slots.block.flow.param.ParamFlowRule;
import com.alibaba.csp.sentinel.slots.block.flow.param.ParamFlowRuleManager;
import com.alibaba.csp.sentinel.slots.system.SystemRule;
import com.alibaba.csp.sentinel.slots.system.SystemRuleManager;
import com.alibaba.csp.sentinel.transport.config.TransportConfig;
import com.alibaba.csp.sentinel.transport.endpoint.Endpoint;
import com.alibaba.csp.sentinel.util.AppNameUtil;
import com.alibaba.csp.sentinel.util.StringUtil;

/**
 * Auto bootstrap MySQL-backed rule pull when the module is present on client classpath.
 */
@InitOrder(0)
public class MysqlDataSourceInitFunc implements InitFunc {

    static final String RULE_FETCH_ENABLED = "sentinel.rule.fetch.enabled";

    private static final AtomicBoolean INITIALIZED = new AtomicBoolean(false);

    private static volatile RuleFetchConfig ruleFetchConfig;

    @Override
    public void init() {
        if (!INITIALIZED.compareAndSet(false, true)) {
            return;
        }
        if (!shouldAutoInit(SentinelConfig.getConfig(RULE_FETCH_ENABLED), AppNameUtil.getAppName(),
            TransportConfig.getConsoleServerList())) {
            return;
        }

        RuleFetchExecutor executor = new RuleFetchExecutor();
        registerRuleSources(executor);

        RuleFetchConfig config = new RuleFetchConfig(executor);
        config.init();
        if (!config.isInitialized()) {
            RecordLog.info("[MysqlDataSourceInitFunc] Dashboard rule pull API unavailable, skip MySQL rule auto-fetch");
            return;
        }

        ruleFetchConfig = config;
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            RuleFetchConfig fetchConfig = ruleFetchConfig;
            if (fetchConfig != null) {
                fetchConfig.shutdown();
            }
        }, "sentinel-mysql-rule-fetch-shutdown"));

        RecordLog.info("[MysqlDataSourceInitFunc] MySQL rule auto-fetch initialized for app: {}",
            AppNameUtil.getAppName());
    }

    static boolean shouldAutoInit(String enabledConfig, String appName, List<Endpoint> dashboardServers) {
        if (!isAutoFetchEnabled(enabledConfig)) {
            RecordLog.info("[MysqlDataSourceInitFunc] Rule fetch disabled by property: {}", RULE_FETCH_ENABLED);
            return false;
        }
        if (StringUtil.isBlank(appName)) {
            RecordLog.warn("[MysqlDataSourceInitFunc] App name is blank, skip MySQL rule auto-fetch");
            return false;
        }
        if (dashboardServers == null || dashboardServers.isEmpty()) {
            RecordLog.info("[MysqlDataSourceInitFunc] Dashboard server not configured, skip MySQL rule auto-fetch");
            return false;
        }
        return true;
    }

    static boolean isAutoFetchEnabled(String configValue) {
        return StringUtil.isBlank(configValue)
            || (!"false".equalsIgnoreCase(configValue) && !"0".equals(configValue));
    }

    private void registerRuleSources(RuleFetchExecutor executor) {
        MysqlAutoRuleDataSource<FlowRule> flowRuleDataSource = new MysqlAutoRuleDataSource<>(FlowRule.class);
        FlowRuleManager.register2Property(flowRuleDataSource.getProperty());
        executor.register(RuleTypeEnum.FLOW.getType(), flowRuleDataSource);

        MysqlAutoRuleDataSource<DegradeRule> degradeRuleDataSource = new MysqlAutoRuleDataSource<>(DegradeRule.class);
        DegradeRuleManager.register2Property(degradeRuleDataSource.getProperty());
        executor.register(RuleTypeEnum.DEGRADE.getType(), degradeRuleDataSource);

        MysqlAutoRuleDataSource<SystemRule> systemRuleDataSource = new MysqlAutoRuleDataSource<>(SystemRule.class);
        SystemRuleManager.register2Property(systemRuleDataSource.getProperty());
        executor.register(RuleTypeEnum.SYSTEM.getType(), systemRuleDataSource);

        MysqlAutoRuleDataSource<AuthorityRule> authorityRuleDataSource =
            new MysqlAutoRuleDataSource<>(AuthorityRule.class);
        AuthorityRuleManager.register2Property(authorityRuleDataSource.getProperty());
        executor.register(RuleTypeEnum.AUTHORITY.getType(), authorityRuleDataSource);

        MysqlAutoRuleDataSource<ParamFlowRule> paramFlowRuleDataSource =
            new MysqlAutoRuleDataSource<>(ParamFlowRule.class);
        ParamFlowRuleManager.register2Property(paramFlowRuleDataSource.getProperty());
        executor.register(RuleTypeEnum.PARAM_FLOW.getType(), paramFlowRuleDataSource);
    }
}
