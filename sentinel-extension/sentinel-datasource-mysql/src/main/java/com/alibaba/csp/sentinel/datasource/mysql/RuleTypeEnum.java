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

/**
 * Rule type enum for MySQL data source.
 *
 * @author Eric Zhao
 */
public enum RuleTypeEnum {

    FLOW("flow", "Flow control rule"),
    DEGRADE("degrade", "Circuit breaking rule"),
    SYSTEM("system", "System protection rule"),
    AUTHORITY("authority", "Authority rule"),
    PARAM_FLOW("param_flow", "Hot parameter flow control rule");

    private final String type;
    private final String description;

    RuleTypeEnum(String type, String description) {
        this.type = type;
        this.description = description;
    }

    public String getType() {
        return type;
    }

    public String getDescription() {
        return description;
    }

    public static RuleTypeEnum fromType(String type) {
        for (RuleTypeEnum ruleType : values()) {
            if (ruleType.type.equals(type)) {
                return ruleType;
            }
        }
        throw new IllegalArgumentException("Unknown rule type: " + type);
    }
}
