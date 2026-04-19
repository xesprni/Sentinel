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

import java.util.List;

import com.alibaba.csp.sentinel.dashboard.discovery.MachineInfo;

/**
 * Service for managing machine info persistence.
 *
 * @author Eric Zhao
 */
public interface MachineInfoService {

    /**
     * Register or update a machine (called on heartbeat).
     *
     * @param machineInfo the machine info from heartbeat
     */
    void registerMachine(MachineInfo machineInfo);

    /**
     * Get all machines for an app (including offline ones).
     *
     * @param app application name
     * @return list of machine info
     */
    List<MachineInfo> getMachinesByApp(String app);

    /**
     * Get alive machines for an app.
     *
     * @param app application name
     * @return list of alive machine info
     */
    List<MachineInfo> getAliveMachinesByApp(String app);

    /**
     * Get all application names with at least one alive machine.
     *
     * @return list of app names
     */
    List<String> getAppNames();

    /**
     * Remove a machine (soft delete).
     *
     * @param app  application name
     * @param ip   machine IP
     * @param port machine port
     */
    void removeMachine(String app, String ip, int port);

    /**
     * Count alive machines for an app.
     *
     * @param app application name
     * @return count of alive machines
     */
    int countByApp(String app);

    /**
     * Mark machines as offline if their last heartbeat is older than the threshold.
     *
     * @param threshold heartbeat timestamp threshold in milliseconds
     */
    void expireStaleMachines(long threshold);
}
