-- 流控规则表
CREATE TABLE IF NOT EXISTS sentinel_flow_rule (
                                                  id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                                  app VARCHAR(128) NOT NULL COMMENT '应用名',
    ip VARCHAR(64) NOT NULL COMMENT '机器IP',
    port INT NOT NULL COMMENT '机器端口',
    limit_app VARCHAR(64) NOT NULL DEFAULT 'default' COMMENT '来源应用',
    resource VARCHAR(256) NOT NULL COMMENT '资源名',
    grade TINYINT NOT NULL DEFAULT 1 COMMENT '限流阈值类型: 0-线程数, 1-QPS',
    count DOUBLE NOT NULL COMMENT '限流阈值',
    strategy TINYINT NOT NULL DEFAULT 0 COMMENT '流控策略: 0-直接, 1-关联, 2-链路',
    ref_resource VARCHAR(256) DEFAULT NULL COMMENT '关联资源/入口资源',
    control_behavior TINYINT NOT NULL DEFAULT 0 COMMENT '流控效果: 0-快速失败, 1-warm up,
     2-排队等待',
    warm_up_period_sec INT DEFAULT NULL COMMENT '预热时间(秒)',
    max_queueing_time_ms INT DEFAULT NULL COMMENT '最大排队等待时间(ms)',
    cluster_mode TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否集群模式',
    cluster_config TEXT DEFAULT NULL COMMENT '集群流控配置(JSON)',
    gmt_create DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    gmt_modified DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_app (app),
    INDEX idx_app_resource (app, resource)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='流控规则';

-- 降级规则表
CREATE TABLE IF NOT EXISTS sentinel_degrade_rule (
                                                     id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                                     app VARCHAR(128) NOT NULL,
    ip VARCHAR(64) NOT NULL,
    port INT NOT NULL,
    resource VARCHAR(256) NOT NULL COMMENT '资源名',
    limit_app VARCHAR(64) NOT NULL DEFAULT 'default',
    count DOUBLE NOT NULL COMMENT '阈值',
    time_window INT NOT NULL COMMENT '熔断时长(s)',
    grade TINYINT NOT NULL COMMENT '熔炼策略: 0-慢调用比例, 1-异常比例, 2-异常数',
    min_request_amount INT DEFAULT NULL COMMENT '最小请求数',
    slow_ratio_threshold DOUBLE DEFAULT NULL COMMENT '慢调用比例阈值',
    stat_interval_ms INT DEFAULT NULL COMMENT '统计时长(ms)',
    gmt_create DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    gmt_modified DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_app (app),
    INDEX idx_app_resource (app, resource)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='降级规则';

-- 系统规则表
CREATE TABLE IF NOT EXISTS sentinel_system_rule (
                                                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                                    app VARCHAR(128) NOT NULL,
    ip VARCHAR(64) NOT NULL,
    port INT NOT NULL,
    highest_system_load DOUBLE DEFAULT NULL COMMENT '系统最高负载',
    avg_rt BIGINT DEFAULT NULL COMMENT '平均RT',
    max_thread BIGINT DEFAULT NULL COMMENT '最大并发线程数',
    qps DOUBLE DEFAULT NULL COMMENT '系统入口QPS',
    highest_cpu_usage DOUBLE DEFAULT NULL COMMENT 'CPU使用率阈值',
    grade TINYINT NOT NULL COMMENT '阈值类型: 0-Load, 1-RT, 2-线程数, 3-QPS, 4-CPU',
    gmt_create DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    gmt_modified DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_app (app)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统保护规则';

-- 授权规则表
CREATE TABLE IF NOT EXISTS sentinel_authority_rule (
                                                       id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                                       app VARCHAR(128) NOT NULL,
    ip VARCHAR(64) NOT NULL,
    port INT NOT NULL,
    resource VARCHAR(256) NOT NULL COMMENT '资源名',
    limit_app VARCHAR(256) NOT NULL COMMENT '来源应用(逗号分隔)',
    strategy TINYINT NOT NULL DEFAULT 0 COMMENT '授权策略: 0-白名单, 1-黑名单',
    gmt_create DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    gmt_modified DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_app (app),
    INDEX idx_app_resource (app, resource)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='授权规则';

-- 热点参数规则表
CREATE TABLE IF NOT EXISTS sentinel_param_flow_rule (
                                                        id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                                        app VARCHAR(128) NOT NULL,
    ip VARCHAR(64) NOT NULL,
    port INT NOT NULL,
    resource VARCHAR(256) NOT NULL,
    limit_app VARCHAR(64) NOT NULL DEFAULT 'default',
    grade TINYINT NOT NULL DEFAULT 1,
    count DOUBLE NOT NULL,
    duration_in_sec INT NOT NULL DEFAULT 1,
    cluster_mode TINYINT(1) NOT NULL DEFAULT 0,
    cluster_config TEXT DEFAULT NULL,
    param_flow_items TEXT DEFAULT NULL COMMENT '热点参数例外项(JSON)',
    gmt_create DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    gmt_modified DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_app (app),
    INDEX idx_app_resource (app, resource)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='热点参数流控规则';

-- 应用机器信息表
CREATE TABLE IF NOT EXISTS sentinel_machine_info (
                                                     id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                                     app VARCHAR(256) NOT NULL COMMENT '应用名',
    app_type INT NOT NULL DEFAULT 0 COMMENT '应用类型',
    hostname VARCHAR(256) DEFAULT NULL COMMENT '机器主机名',
    ip VARCHAR(128) NOT NULL COMMENT '机器IP',
    port INT NOT NULL COMMENT 'Sentinel客户端端口',
    sentinel_version VARCHAR(64) DEFAULT NULL COMMENT 'Sentinel客户端版本',
    heartbeat_version BIGINT DEFAULT 0 COMMENT '心跳版本号',
    last_heartbeat BIGINT DEFAULT 0 COMMENT '最后心跳时间戳(ms)',
    status TINYINT(1) NOT NULL DEFAULT 1 COMMENT '状态: 1-存活, 0-离线',
    is_deleted TINYINT(1) NOT NULL DEFAULT 0 COMMENT '逻辑删除',
    gmt_create DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    gmt_modified DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_app_ip_port (app, ip, port),
    INDEX idx_app (app),
    INDEX idx_status (status, is_deleted)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='应用机器信息';