package com.alibaba.csp.sentinel.dashboard.repository.mapper;

import com.alibaba.csp.sentinel.dashboard.datasource.entity.rule.SystemRuleEntity;
import org.apache.ibatis.annotations.Param;

import java.util.List;

public interface SystemRuleMapper {

    void deleteByApp(@Param("app") String app);

    void insert(SystemRuleEntity e);

    List<SystemRuleEntity> selectByApp(@Param("app") String app);
}
