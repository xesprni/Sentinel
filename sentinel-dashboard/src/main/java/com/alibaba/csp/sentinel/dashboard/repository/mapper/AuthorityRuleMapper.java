package com.alibaba.csp.sentinel.dashboard.repository.mapper;

import com.alibaba.csp.sentinel.dashboard.datasource.entity.rule.AuthorityRuleEntity;
import org.apache.ibatis.annotations.Param;

import java.util.List;

public interface AuthorityRuleMapper {

    void deleteByApp(@Param("app") String app);

    void insert(AuthorityRuleEntity e);

    List<AuthorityRuleEntity> selectByApp(@Param("app") String app);
}
