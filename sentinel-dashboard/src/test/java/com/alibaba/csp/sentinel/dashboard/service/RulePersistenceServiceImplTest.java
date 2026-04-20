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

import com.alibaba.csp.sentinel.dashboard.datasource.entity.rule.AuthorityRuleEntity;
import com.alibaba.csp.sentinel.dashboard.datasource.entity.rule.FlowRuleEntity;
import com.alibaba.csp.sentinel.slots.block.authority.AuthorityRule;
import org.junit.Test;

import static org.junit.Assert.assertEquals;

public class RulePersistenceServiceImplTest {

    @Test
    public void testNormalizeFlowRuleForPersistence() {
        FlowRuleEntity entity = new FlowRuleEntity();

        RulePersistenceServiceImpl.normalizeForPersistence("demo-app", entity);

        assertEquals("demo-app", entity.getApp());
        assertEquals(RulePersistenceServiceImpl.EMPTY_RULE_MACHINE_IP, entity.getIp());
        assertEquals(Integer.valueOf(RulePersistenceServiceImpl.EMPTY_RULE_MACHINE_PORT), entity.getPort());
    }

    @Test
    public void testNormalizeAuthorityRuleForPersistence() {
        AuthorityRuleEntity entity = new AuthorityRuleEntity(new AuthorityRule());

        RulePersistenceServiceImpl.normalizeForPersistence("demo-app", entity);

        assertEquals("demo-app", entity.getApp());
        assertEquals(RulePersistenceServiceImpl.EMPTY_RULE_MACHINE_IP, entity.getIp());
        assertEquals(Integer.valueOf(RulePersistenceServiceImpl.EMPTY_RULE_MACHINE_PORT), entity.getPort());
    }
}
