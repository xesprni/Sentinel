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

import com.alibaba.csp.sentinel.util.AssertUtil;

/**
 * MySQL connection configuration.
 *
 * @author Eric Zhao
 */
public class MysqlConnectionConfig {

    private static final String DEFAULT_CHARSET = "utf-8";
    private static final String DEFAULT_TIMEZONE = "Asia/Shanghai";

    private String host;
    private int port = 3306;
    private String database;
    private String username;
    private String password;
    private String charset = DEFAULT_CHARSET;
    private String serverTimezone = DEFAULT_TIMEZONE;

    public MysqlConnectionConfig() {
    }

    public MysqlConnectionConfig(String host, int port, String database, String username, String password) {
        AssertUtil.notEmpty(host, "MySQL host cannot be empty");
        AssertUtil.notEmpty(database, "MySQL database cannot be empty");
        AssertUtil.notEmpty(username, "MySQL username cannot be empty");
        this.host = host;
        this.port = port;
        this.database = database;
        this.username = username;
        this.password = password;
    }

    public String getJdbcUrl() {
        return "jdbc:mysql://" + host + ":" + port + "/" + database
            + "?useUnicode=true&characterEncoding=" + charset
            + "&useSSL=false&serverTimezone=" + serverTimezone;
    }

    public String getHost() {
        return host;
    }

    public MysqlConnectionConfig setHost(String host) {
        this.host = host;
        return this;
    }

    public int getPort() {
        return port;
    }

    public MysqlConnectionConfig setPort(int port) {
        this.port = port;
        return this;
    }

    public String getDatabase() {
        return database;
    }

    public MysqlConnectionConfig setDatabase(String database) {
        this.database = database;
        return this;
    }

    public String getUsername() {
        return username;
    }

    public MysqlConnectionConfig setUsername(String username) {
        this.username = username;
        return this;
    }

    public String getPassword() {
        return password;
    }

    public MysqlConnectionConfig setPassword(String password) {
        this.password = password;
        return this;
    }

    public String getCharset() {
        return charset;
    }

    public MysqlConnectionConfig setCharset(String charset) {
        this.charset = charset;
        return this;
    }

    public String getServerTimezone() {
        return serverTimezone;
    }

    public MysqlConnectionConfig setServerTimezone(String serverTimezone) {
        this.serverTimezone = serverTimezone;
        return this;
    }

    @Override
    public String toString() {
        return "MysqlConnectionConfig{" +
            "host='" + host + '\'' +
            ", port=" + port +
            ", database='" + database + '\'' +
            ", username='" + username + '\'' +
            '}';
    }
}
