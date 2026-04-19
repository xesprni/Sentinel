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

import java.util.Arrays;
import java.util.List;

import com.alibaba.csp.sentinel.datasource.Converter;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.TypeReference;

import org.junit.Test;

import static org.junit.Assert.*;

/**
 * Test cases for MySQL datasource classes.
 *
 * @author Eric Zhao
 */
public class MysqlDataSourceTest {

    // --- MysqlConnectionConfig tests ---

    @Test
    public void testMysqlConnectionConfig() {
        MysqlConnectionConfig config = new MysqlConnectionConfig("localhost", 3306, "sentinel", "root", "123456");
        String jdbcUrl = config.getJdbcUrl();
        assertTrue(jdbcUrl.contains("localhost:3306/sentinel"));
        assertTrue(jdbcUrl.contains("useUnicode=true"));
        assertTrue(jdbcUrl.contains("characterEncoding=utf-8"));
        assertEquals("localhost", config.getHost());
        assertEquals(3306, config.getPort());
        assertEquals("sentinel", config.getDatabase());
        assertEquals("root", config.getUsername());
        assertEquals("123456", config.getPassword());
    }

    @Test
    public void testMysqlConnectionConfigBuilderPattern() {
        MysqlConnectionConfig config = new MysqlConnectionConfig()
            .setHost("127.0.0.1")
            .setPort(3307)
            .setDatabase("test_db")
            .setUsername("admin")
            .setPassword("pass")
            .setCharset("utf8mb4")
            .setServerTimezone("UTC");

        assertEquals("127.0.0.1", config.getHost());
        assertEquals(3307, config.getPort());
        assertEquals("test_db", config.getDatabase());
        assertTrue(config.getJdbcUrl().contains("characterEncoding=utf8mb4"));
        assertTrue(config.getJdbcUrl().contains("serverTimezone=UTC"));
    }

    @Test
    public void testMysqlConnectionConfigToString() {
        MysqlConnectionConfig config = new MysqlConnectionConfig("localhost", 3306, "db", "root", "pass");
        String str = config.toString();
        assertTrue(str.contains("localhost"));
        assertTrue(str.contains("3306"));
        assertTrue(str.contains("db"));
        assertTrue(str.contains("root"));
        assertFalse(str.contains("pass"));
    }

    @Test(expected = IllegalArgumentException.class)
    public void testMysqlConnectionConfigNullHost() {
        new MysqlConnectionConfig(null, 3306, "db", "user", "pass");
    }

    @Test(expected = IllegalArgumentException.class)
    public void testMysqlConnectionConfigEmptyDatabase() {
        new MysqlConnectionConfig("localhost", 3306, "", "user", "pass");
    }

    // --- MysqlDataSource validation tests ---

    @Test(expected = IllegalArgumentException.class)
    public void testMysqlDataSourceNullConfig() {
        Converter<String, String> parser = source -> source;
        new MysqlDataSource<>(null, "SELECT 1", parser);
    }

    @Test(expected = IllegalArgumentException.class)
    public void testMysqlDataSourceEmptySql() {
        MysqlConnectionConfig config = new MysqlConnectionConfig("localhost", 3306, "db", "user", "pass");
        Converter<String, String> parser = source -> source;
        new MysqlDataSource<>(config, "", parser);
    }

    // --- MysqlWritableDataSource validation tests ---

    @Test(expected = IllegalArgumentException.class)
    public void testMysqlWritableDataSourceNullEncoder() {
        MysqlConnectionConfig config = new MysqlConnectionConfig("localhost", 3306, "db", "user", "pass");
        new MysqlWritableDataSource<>(config, "INSERT INTO t VALUES(?)", null, null);
    }

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

    // --- JSON converter tests ---

    @Test
    public void testConverterWithJson() {
        String json = "[{\"resource\":\"test\",\"count\":10.0,\"grade\":1}]";
        Converter<String, List<TestRule>> parser = source ->
            JSON.parseObject(source, new TypeReference<List<TestRule>>() {});

        List<TestRule> rules = parser.convert(json);
        assertNotNull(rules);
        assertEquals(1, rules.size());
        assertEquals("test", rules.get(0).getResource());
        assertEquals(10.0, rules.get(0).getCount(), 0.001);
        assertEquals(1, rules.get(0).getGrade());
    }

    @Test
    public void testWritableDataSourceEncoder() {
        Converter<List<TestRule>, String> encoder = JSON::toJSONString;

        List<TestRule> rules = Arrays.asList(
            new TestRule("res1", 10.0, 1),
            new TestRule("res2", 20.0, 0)
        );

        String json = encoder.convert(rules);
        assertNotNull(json);
        assertTrue(json.contains("res1"));
        assertTrue(json.contains("res2"));

        // Verify round-trip
        List<TestRule> parsed = JSON.parseObject(json, new TypeReference<List<TestRule>>() {});
        assertEquals(2, parsed.size());
    }

    static class TestRule {
        private String resource;
        private double count;
        private int grade;

        public TestRule() {}

        public TestRule(String resource, double count, int grade) {
            this.resource = resource;
            this.count = count;
            this.grade = grade;
        }

        public String getResource() { return resource; }
        public void setResource(String resource) { this.resource = resource; }
        public double getCount() { return count; }
        public void setCount(double count) { this.count = count; }
        public int getGrade() { return grade; }
        public void setGrade(int grade) { this.grade = grade; }
    }
}
