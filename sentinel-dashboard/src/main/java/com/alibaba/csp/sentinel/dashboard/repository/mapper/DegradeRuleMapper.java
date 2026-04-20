package com.alibaba.csp.sentinel.dashboard.repository.mapper;

import com.alibaba.csp.sentinel.dashboard.datasource.entity.rule.DegradeRuleEntity;
import org.apache.ibatis.annotations.Param;

import java.util.List;

public interface DegradeRuleMapper {

    void deleteByApp(@Param("app") String app);

    void insert(DegradeRuleEntity e);

    List<DegradeRuleEntity> selectByApp(@Param("app") String app);
}
