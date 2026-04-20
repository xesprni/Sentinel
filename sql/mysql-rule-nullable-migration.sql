ALTER TABLE sentinel_flow_rule
    MODIFY COLUMN ip VARCHAR(64) NULL COMMENT '机器IP，可为空（应用级规则）',
    MODIFY COLUMN port INT NULL COMMENT '机器端口，可为空（应用级规则）';

ALTER TABLE sentinel_degrade_rule
    MODIFY COLUMN ip VARCHAR(64) NULL COMMENT '机器IP，可为空（应用级规则）',
    MODIFY COLUMN port INT NULL COMMENT '机器端口，可为空（应用级规则）';

ALTER TABLE sentinel_system_rule
    MODIFY COLUMN ip VARCHAR(64) NULL COMMENT '机器IP，可为空（应用级规则）',
    MODIFY COLUMN port INT NULL COMMENT '机器端口，可为空（应用级规则）';

ALTER TABLE sentinel_authority_rule
    MODIFY COLUMN ip VARCHAR(64) NULL COMMENT '机器IP，可为空（应用级规则）',
    MODIFY COLUMN port INT NULL COMMENT '机器端口，可为空（应用级规则）';

ALTER TABLE sentinel_param_flow_rule
    MODIFY COLUMN ip VARCHAR(64) NULL COMMENT '机器IP，可为空（应用级规则）',
    MODIFY COLUMN port INT NULL COMMENT '机器端口，可为空（应用级规则）';
