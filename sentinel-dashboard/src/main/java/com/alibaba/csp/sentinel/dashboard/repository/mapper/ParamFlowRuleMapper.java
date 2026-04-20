package com.alibaba.csp.sentinel.dashboard.repository.mapper;

import com.alibaba.csp.sentinel.dashboard.datasource.entity.rule.ParamFlowRuleEntity;
import org.apache.ibatis.annotations.Param;

import java.util.List;

public interface ParamFlowRuleMapper {

    void deleteByApp(@Param("app") String app);

    void insert(@Param("e") ParamFlowRuleEntity e,
                @Param("clusterConfigJson") String clusterConfigJson,
                @Param("paramFlowItemsJson") String paramFlowItemsJson);

    List<ParamFlowRuleEntity> selectByApp(@Param("app") String app);
}
