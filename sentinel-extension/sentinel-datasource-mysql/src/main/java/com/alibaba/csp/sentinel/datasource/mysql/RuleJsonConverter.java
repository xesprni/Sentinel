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

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import com.alibaba.csp.sentinel.util.StringUtil;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;

/**
 * Convert dashboard rule entity JSON to client-side Sentinel rules.
 */
final class RuleJsonConverter {

    private static final String RULE_FIELD = "rule";

    private RuleJsonConverter() {}

    static <T> List<T> convert(String source, Class<T> ruleClass) {
        if (StringUtil.isBlank(source)) {
            return Collections.emptyList();
        }

        JSONArray jsonArray = JSON.parseArray(source);
        if (jsonArray == null || jsonArray.isEmpty()) {
            return Collections.emptyList();
        }

        List<T> rules = new ArrayList<>(jsonArray.size());
        for (int i = 0; i < jsonArray.size(); i++) {
            JSONObject entity = jsonArray.getJSONObject(i);
            if (entity == null) {
                continue;
            }
            JSONObject ruleBody = entity.getJSONObject(RULE_FIELD);
            JSONObject target = ruleBody != null ? ruleBody : entity;
            rules.add(target.toJavaObject(ruleClass));
        }
        return rules;
    }
}
