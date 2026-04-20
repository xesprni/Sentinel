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
package com.alibaba.csp.sentinel.dashboard.service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import com.alibaba.csp.sentinel.dashboard.datasource.entity.MachineEntity;
import com.alibaba.csp.sentinel.dashboard.discovery.MachineInfo;
import com.alibaba.csp.sentinel.dashboard.repository.mapper.MachineInfoMapper;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Implementation of {@link MachineInfoService} backed by MySQL.
 *
 * @author Eric Zhao
 */
@Service
@ConditionalOnProperty(name = "sentinel.mysql.enabled", havingValue = "true")
public class MachineInfoServiceImpl implements MachineInfoService {

    private final MachineInfoMapper machineInfoMapper;

    public MachineInfoServiceImpl(MachineInfoMapper machineInfoMapper) {
        this.machineInfoMapper = machineInfoMapper;
    }

    @Override
    @Transactional
    public void registerMachine(MachineInfo machineInfo) {
        MachineEntity entity = MachineEntity.fromMachineInfo(machineInfo);
        machineInfoMapper.insertOrUpdate(entity);
    }

    @Override
    public List<MachineInfo> getMachinesByApp(String app) {
        List<MachineEntity> entities = machineInfoMapper.listByApp(app);
        return entities.stream()
            .map(MachineEntity::toMachineInfo)
            .collect(Collectors.toList());
    }

    @Override
    public List<MachineInfo> getAliveMachinesByApp(String app) {
        List<MachineEntity> entities = machineInfoMapper.listAliveByApp(app);
        return entities.stream()
            .map(MachineEntity::toMachineInfo)
            .collect(Collectors.toList());
    }

    @Override
    public List<String> getAppNames() {
        return machineInfoMapper.listApps();
    }

    @Override
    @Transactional
    public void removeMachine(String app, String ip, int port) {
        machineInfoMapper.deleteByAppAndIpAndPort(app, ip, port);
    }

    @Override
    public int countByApp(String app) {
        return machineInfoMapper.countByApp(app);
    }

    @Override
    @Transactional
    public void expireStaleMachines(long threshold) {
        machineInfoMapper.expireStaleMachines(threshold);
    }
}
