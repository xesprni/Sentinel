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

import org.junit.Test;

import static org.junit.Assert.*;

/**
 * Test cases for sentinel-datasource-mysql module.
 */
public class MysqlDataSourceTest {

    // --- RuleTypeEnum tests ---

    @Test
    public void testRuleTypeEnumValues() {
        assertEquals("flow", RuleTypeEnum.FLOW.getType());
        assertEquals("degrade", RuleTypeEnum.DEGRADE.getType());
        assertEquals("system", RuleTypeEnum.SYSTEM.getType());
        assertEquals("authority", RuleTypeEnum.AUTHORITY.getType());
        assertEquals("param_flow", RuleTypeEnum.PARAM_FLOW.getType());
    }

    @Test
    public void testRuleTypeEnumFromType() {
        assertEquals(RuleTypeEnum.FLOW, RuleTypeEnum.fromType("flow"));
        assertEquals(RuleTypeEnum.DEGRADE, RuleTypeEnum.fromType("degrade"));
        assertEquals(RuleTypeEnum.SYSTEM, RuleTypeEnum.fromType("system"));
        assertEquals(RuleTypeEnum.AUTHORITY, RuleTypeEnum.fromType("authority"));
        assertEquals(RuleTypeEnum.PARAM_FLOW, RuleTypeEnum.fromType("param_flow"));
    }

    @Test(expected = IllegalArgumentException.class)
    public void testRuleTypeEnumFromTypeInvalid() {
        RuleTypeEnum.fromType("invalid");
    }

    // --- RuleFetchExecutor tests ---

    @Test
    public void testRuleFetchExecutorRegister() {
        RuleFetchExecutor executor = new RuleFetchExecutor();
        assertNotNull(executor);
    }

    // --- RuleFetchConfig tests ---

    @Test(expected = IllegalArgumentException.class)
    public void testRuleFetchConfigNullExecutor() {
        new RuleFetchConfig(null);
    }
}
