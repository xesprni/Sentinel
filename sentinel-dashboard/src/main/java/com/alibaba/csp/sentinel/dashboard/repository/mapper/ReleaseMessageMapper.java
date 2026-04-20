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
package com.alibaba.csp.sentinel.dashboard.repository.mapper;

import java.util.List;

import com.alibaba.csp.sentinel.dashboard.datasource.entity.ReleaseMessageEntity;

import org.apache.ibatis.annotations.Param;

/**
 * Mapper for t_release_message table.
 */
public interface ReleaseMessageMapper {

    void insert(ReleaseMessageEntity entity);

    Long getLastReleaseIdByMessage(@Param("message") String message);

    List<ReleaseMessageEntity> getFirst500ByIdDesc(@Param("maxId") Long maxId);

    Long getMaxId();
}
