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

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;

import com.alibaba.csp.sentinel.datasource.AutoRefreshDataSource;
import com.alibaba.csp.sentinel.datasource.Converter;
import com.alibaba.csp.sentinel.log.RecordLog;
import com.alibaba.csp.sentinel.util.AssertUtil;

/**
 * <p>
 * A read-only {@code DataSource} with MySQL backend.
 * </p>
 * <p>
 * The data source periodically polls MySQL for rule configurations.
 * Users provide a custom SQL query to read rule data from the database.
 * </p>
 *
 * <p>Example usage:</p>
 * <pre>
 * MysqlConnectionConfig config = new MysqlConnectionConfig("localhost", 3306, "sentinel", "root", "password");
 * String sql = "SELECT rule_data FROM sentinel_rule WHERE app = ? AND rule_type = 'flow'";
 * MysqlDataSource&lt;List&lt;FlowRule&gt;&gt; dataSource = new MysqlDataSource&lt;&gt;(
 *     config, sql, "my-app", parser);
 * FlowRuleManager.register2Property(dataSource.getProperty());
 * </pre>
 *
 * @param <T> target data type after parsing
 * @author Eric Zhao
 */
public class MysqlDataSource<T> extends AutoRefreshDataSource<String, T> {

    private static final long DEFAULT_REFRESH_MS = 3000;

    private final MysqlConnectionConfig connectionConfig;
    private final String sql;
    private final String[] sqlParams;

    private Connection connection;

    /**
     * Create a MySQL data source with default refresh interval (3 seconds).
     *
     * @param connectionConfig MySQL connection configuration
     * @param sql              SQL query to read rule data, may contain '?' placeholders
     * @param parser           data parser to convert SQL result string to target type
     */
    public MysqlDataSource(MysqlConnectionConfig connectionConfig, String sql,
                           Converter<String, T> parser) {
        this(connectionConfig, sql, null, parser, DEFAULT_REFRESH_MS);
    }

    /**
     * Create a MySQL data source with SQL parameters and default refresh interval.
     *
     * @param connectionConfig MySQL connection configuration
     * @param sql              SQL query to read rule data
     * @param sqlParams        parameters for the prepared statement (optional)
     * @param parser           data parser to convert SQL result string to target type
     */
    public MysqlDataSource(MysqlConnectionConfig connectionConfig, String sql,
                           String[] sqlParams, Converter<String, T> parser) {
        this(connectionConfig, sql, sqlParams, parser, DEFAULT_REFRESH_MS);
    }

    /**
     * Create a MySQL data source with custom refresh interval.
     *
     * @param connectionConfig MySQL connection configuration
     * @param sql              SQL query to read rule data
     * @param sqlParams        parameters for the prepared statement (optional)
     * @param parser           data parser to convert SQL result string to target type
     * @param refreshMs        refresh interval in milliseconds
     */
    public MysqlDataSource(MysqlConnectionConfig connectionConfig, String sql,
                           String[] sqlParams, Converter<String, T> parser, long refreshMs) {
        super(parser, refreshMs);
        AssertUtil.notNull(connectionConfig, "MySQL connection config cannot be null");
        AssertUtil.notEmpty(sql, "SQL query cannot be empty");
        this.connectionConfig = connectionConfig;
        this.sql = sql;
        this.sqlParams = sqlParams;
        initConnection();
        loadInitialConfig();
    }

    private void initConnection() {
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
            this.connection = DriverManager.getConnection(
                connectionConfig.getJdbcUrl(),
                connectionConfig.getUsername(),
                connectionConfig.getPassword());
            RecordLog.info("[MysqlDataSource] Connected to MySQL at {}:{}/{}",
                connectionConfig.getHost(), connectionConfig.getPort(), connectionConfig.getDatabase());
        } catch (ClassNotFoundException e) {
            RecordLog.warn("[MysqlDataSource] MySQL JDBC driver not found. "
                + "Please add mysql-connector-java to your classpath.", e);
        } catch (SQLException e) {
            RecordLog.warn("[MysqlDataSource] Failed to connect to MySQL", e);
        }
    }

    private void loadInitialConfig() {
        try {
            T newValue = loadConfig();
            if (newValue == null) {
                RecordLog.warn("[MysqlDataSource] WARN: initial config is null, "
                    + "you may have to check your data source");
            }
            getProperty().updateValue(newValue);
        } catch (Exception ex) {
            RecordLog.warn("[MysqlDataSource] Error when loading initial config", ex);
        }
    }

    @Override
    public String readSource() throws Exception {
        if (connection == null || connection.isClosed()) {
            reconnect();
        }
        PreparedStatement ps = null;
        ResultSet rs = null;
        try {
            ps = connection.prepareStatement(sql);
            if (sqlParams != null) {
                for (int i = 0; i < sqlParams.length; i++) {
                    ps.setString(i + 1, sqlParams[i]);
                }
            }
            rs = ps.executeQuery();
            StringBuilder sb = new StringBuilder();
            while (rs.next()) {
                String value = rs.getString(1);
                if (value != null) {
                    if (sb.length() > 0) {
                        sb.append("\n");
                    }
                    sb.append(value);
                }
            }
            return sb.length() > 0 ? sb.toString() : null;
        } finally {
            closeQuietly(rs);
            closeQuietly(ps);
        }
    }

    private void reconnect() throws SQLException {
        RecordLog.info("[MysqlDataSource] Reconnecting to MySQL...");
        closeQuietly(connection);
        connection = DriverManager.getConnection(
            connectionConfig.getJdbcUrl(),
            connectionConfig.getUsername(),
            connectionConfig.getPassword());
    }

    @Override
    public void close() throws Exception {
        super.close();
        closeQuietly(connection);
        connection = null;
    }

    private void closeQuietly(AutoCloseable closeable) {
        if (closeable != null) {
            try {
                closeable.close();
            } catch (Exception ignore) {
            }
        }
    }
}
