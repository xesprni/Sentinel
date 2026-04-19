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
import java.sql.SQLException;
import java.util.concurrent.locks.ReentrantLock;

import com.alibaba.csp.sentinel.datasource.Converter;
import com.alibaba.csp.sentinel.datasource.WritableDataSource;
import com.alibaba.csp.sentinel.log.RecordLog;
import com.alibaba.csp.sentinel.util.AssertUtil;

/**
 * <p>
 * A {@link WritableDataSource} based on MySQL.
 * </p>
 * <p>
 * Users provide a custom SQL statement to write rule data to the database.
 * The data is first converted to a string using the provided encoder,
 * then written via the prepared statement.
 * </p>
 *
 * <p>Example usage:</p>
 * <pre>
 * MysqlConnectionConfig config = new MysqlConnectionConfig("localhost", 3306, "sentinel", "root", "password");
 * String sql = "INSERT INTO sentinel_rule (id, rule_data) VALUES (?, ?) "
 *            + "ON DUPLICATE KEY UPDATE rule_data = VALUES(rule_data)";
 * MysqlWritableDataSource&lt;List&lt;FlowRule&gt;&gt; dataSource = new MysqlWritableDataSource&lt;&gt;(
 *     config, sql, new String[]{"flow-rule"}, encoder);
 * </pre>
 *
 * @param <T> data type
 * @author Eric Zhao
 */
public class MysqlWritableDataSource<T> implements WritableDataSource<T> {

    private final MysqlConnectionConfig connectionConfig;
    private final String sql;
    private final String[] sqlParams;
    private final Converter<T, String> configEncoder;

    private final ReentrantLock lock = new ReentrantLock(true);
    private Connection connection;

    /**
     * Create a MySQL writable data source.
     *
     * @param connectionConfig MySQL connection configuration
     * @param sql              SQL statement to write data. The encoded value will be set
     *                         as the last parameter of the prepared statement.
     * @param sqlParams        preceding parameters for the prepared statement (optional, placed before encoded value)
     * @param configEncoder    encoder to convert data to string
     */
    public MysqlWritableDataSource(MysqlConnectionConfig connectionConfig, String sql,
                                   String[] sqlParams, Converter<T, String> configEncoder) {
        AssertUtil.notNull(connectionConfig, "MySQL connection config cannot be null");
        AssertUtil.notEmpty(sql, "SQL statement cannot be empty");
        AssertUtil.notNull(configEncoder, "Config encoder cannot be null");
        this.connectionConfig = connectionConfig;
        this.sql = sql;
        this.sqlParams = sqlParams;
        this.configEncoder = configEncoder;
        initConnection();
    }

    private void initConnection() {
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
            this.connection = DriverManager.getConnection(
                connectionConfig.getJdbcUrl(),
                connectionConfig.getUsername(),
                connectionConfig.getPassword());
            RecordLog.info("[MysqlWritableDataSource] Connected to MySQL at {}:{}/{}",
                connectionConfig.getHost(), connectionConfig.getPort(), connectionConfig.getDatabase());
        } catch (ClassNotFoundException e) {
            RecordLog.warn("[MysqlWritableDataSource] MySQL JDBC driver not found. "
                + "Please add mysql-connector-java to your classpath.", e);
        } catch (SQLException e) {
            RecordLog.warn("[MysqlWritableDataSource] Failed to connect to MySQL", e);
        }
    }

    @Override
    public void write(T value) throws Exception {
        lock.lock();
        try {
            if (connection == null || connection.isClosed()) {
                reconnect();
            }
            String convertedValue = configEncoder.convert(value);
            PreparedStatement ps = null;
            try {
                ps = connection.prepareStatement(sql);
                int paramIndex = 1;
                if (sqlParams != null) {
                    for (String param : sqlParams) {
                        ps.setString(paramIndex++, param);
                    }
                }
                ps.setString(paramIndex, convertedValue);
                RecordLog.info("[MysqlWritableDataSource] Writing to MySQL: {}", convertedValue);
                ps.executeUpdate();
            } finally {
                closeQuietly(ps);
            }
        } finally {
            lock.unlock();
        }
    }

    private void reconnect() throws SQLException {
        RecordLog.info("[MysqlWritableDataSource] Reconnecting to MySQL...");
        closeQuietly(connection);
        connection = DriverManager.getConnection(
            connectionConfig.getJdbcUrl(),
            connectionConfig.getUsername(),
            connectionConfig.getPassword());
    }

    @Override
    public void close() throws Exception {
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
