package com.alibaba.csp.sentinel.dashboard.repository.mapper;

import com.alibaba.csp.sentinel.dashboard.datasource.entity.rule.FlowRuleEntity;
import org.apache.ibatis.annotations.Param;

import java.util.List;

public interface FlowRuleMapper {

    void deleteByApp(@Param("app") String app);

    void insert(@Param("e") FlowRuleEntity e, @Param("clusterConfigJson") String clusterConfigJson);

    List<FlowRuleEntity> selectByApp(@Param("app") String app);
}
