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

import java.util.Collections;
import java.util.List;

import com.alibaba.csp.sentinel.slots.block.authority.AuthorityRule;
import com.alibaba.csp.sentinel.slots.block.flow.FlowRule;
import com.alibaba.csp.sentinel.slots.block.flow.param.ParamFlowRule;
import com.alibaba.csp.sentinel.transport.endpoint.Endpoint;
import com.alibaba.csp.sentinel.transport.endpoint.Protocol;
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

    @Test
    public void testRuleJsonConverterForFlowRules() {
        List<FlowRule> rules = RuleJsonConverter.convert(
            "[{\"app\":\"demo\",\"resource\":\"/foo\",\"grade\":1,\"count\":3.0}]",
            FlowRule.class);

        assertEquals(1, rules.size());
        assertEquals("/foo", rules.get(0).getResource());
        assertEquals(3.0, rules.get(0).getCount(), 0.0);
    }

    @Test
    public void testRuleJsonConverterForNestedAuthorityRules() {
        List<AuthorityRule> rules = RuleJsonConverter.convert(
            "[{\"app\":\"demo\",\"rule\":{\"resource\":\"/bar\",\"limitApp\":\"callerA\",\"strategy\":0}}]",
            AuthorityRule.class);

        assertEquals(1, rules.size());
        assertEquals("/bar", rules.get(0).getResource());
        assertEquals("callerA", rules.get(0).getLimitApp());
    }

    @Test
    public void testRuleJsonConverterForNestedParamFlowRules() {
        List<ParamFlowRule> rules = RuleJsonConverter.convert(
            "[{\"app\":\"demo\",\"rule\":{\"resource\":\"/hot\",\"grade\":1,\"count\":4.0,\"paramIdx\":0}}]",
            ParamFlowRule.class);

        assertEquals(1, rules.size());
        assertEquals("/hot", rules.get(0).getResource());
        assertEquals(Integer.valueOf(0), rules.get(0).getParamIdx());
        assertEquals(4.0, rules.get(0).getCount(), 0.0);
    }

    @Test
    public void testRuleJsonConverterBlankSource() {
        assertTrue(RuleJsonConverter.convert("", FlowRule.class).isEmpty());
    }

    @Test
    public void testMysqlDataSourceInitFuncEnabledByDefault() {
        assertTrue(MysqlDataSourceInitFunc.isAutoFetchEnabled(null));
        assertTrue(MysqlDataSourceInitFunc.isAutoFetchEnabled(""));
        assertTrue(MysqlDataSourceInitFunc.isAutoFetchEnabled("true"));
    }

    @Test
    public void testMysqlDataSourceInitFuncDisabledByProperty() {
        assertFalse(MysqlDataSourceInitFunc.isAutoFetchEnabled("false"));
        assertFalse(MysqlDataSourceInitFunc.isAutoFetchEnabled("0"));
    }

    @Test
    public void testMysqlDataSourceInitFuncShouldAutoInit() {
        List<Endpoint> endpoints = Collections.singletonList(new Endpoint(Protocol.HTTP, "127.0.0.1", 8080));
        assertTrue(MysqlDataSourceInitFunc.shouldAutoInit(null, "demo-app", endpoints));
        assertFalse(MysqlDataSourceInitFunc.shouldAutoInit("false", "demo-app", endpoints));
        assertFalse(MysqlDataSourceInitFunc.shouldAutoInit(null, "", endpoints));
        assertFalse(MysqlDataSourceInitFunc.shouldAutoInit(null, "demo-app", Collections.emptyList()));
    }
}
