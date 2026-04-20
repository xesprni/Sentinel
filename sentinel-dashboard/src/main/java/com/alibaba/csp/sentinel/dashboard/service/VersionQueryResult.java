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

import java.util.Set;

/**
 * Result of version query for long polling.
 */
public class VersionQueryResult {

    private Set<CheckResult> checkResults;
    private int totalCount;

    public Set<CheckResult> getCheckResults() {
        return checkResults;
    }

    public void setCheckResults(Set<CheckResult> checkResults) {
        this.checkResults = checkResults;
    }

    public int getTotalCount() {
        return totalCount;
    }

    public void setTotalCount(int totalCount) {
        this.totalCount = totalCount;
    }

    /**
     * Single check result entry.
     */
    public static class CheckResult {
        private String app;
        private String ruleType;

        public CheckResult() {
        }

        public CheckResult(String app, String ruleType) {
            this.app = app;
            this.ruleType = ruleType;
        }

        public String getApp() {
            return app;
        }

        public void setApp(String app) {
            this.app = app;
        }

        public String getRuleType() {
            return ruleType;
        }

        public void setRuleType(String ruleType) {
            this.ruleType = ruleType;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            CheckResult that = (CheckResult) o;
            return java.util.Objects.equals(app, that.app)
                && java.util.Objects.equals(ruleType, that.ruleType);
        }

        @Override
        public int hashCode() {
            return java.util.Objects.hash(app, ruleType);
        }
    }
}
