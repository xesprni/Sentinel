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
package com.alibaba.csp.sentinel.dashboard.datasource.entity;

import java.util.Date;

import com.alibaba.csp.sentinel.dashboard.discovery.MachineInfo;

/**
 * Entity mapping to sentinel_machine_info table.
 *
 * @author leyou
 * @author Eric Zhao
 */
public class MachineEntity {
    private Long id;
    private Date gmtCreate;
    private Date gmtModified;
    private String app;
    private Integer appType;
    private String ip;
    private String hostname;
    private Integer port;
    private String sentinelVersion;
    private Long heartbeatVersion;
    private Long lastHeartbeat;
    private Boolean status;
    private Boolean isDeleted;

    public MachineEntity() {
    }

    public static MachineEntity fromMachineInfo(MachineInfo machineInfo) {
        MachineEntity entity = new MachineEntity();
        entity.setApp(machineInfo.getApp());
        entity.setAppType(machineInfo.getAppType());
        entity.setHostname(machineInfo.getHostname());
        entity.setIp(machineInfo.getIp());
        entity.setPort(machineInfo.getPort());
        entity.setSentinelVersion(machineInfo.getVersion());
        entity.setHeartbeatVersion(machineInfo.getHeartbeatVersion());
        entity.setLastHeartbeat(machineInfo.getLastHeartbeat());
        entity.setStatus(true);
        entity.setIsDeleted(false);
        return entity;
    }

    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }

    public Date getGmtCreate() {
        return gmtCreate;
    }

    public void setGmtCreate(Date gmtCreate) {
        this.gmtCreate = gmtCreate;
    }

    public Date getGmtModified() {
        return gmtModified;
    }

    public void setGmtModified(Date gmtModified) {
        this.gmtModified = gmtModified;
    }

    public String getApp() {
        return app;
    }

    public void setApp(String app) {
        this.app = app;
    }

    public Integer getAppType() {
        return appType;
    }

    public void setAppType(Integer appType) {
        this.appType = appType;
    }

    public String getIp() {
        return ip;
    }

    public void setIp(String ip) {
        this.ip = ip;
    }

    public String getHostname() {
        return hostname;
    }

    public void setHostname(String hostname) {
        this.hostname = hostname;
    }

    public Integer getPort() {
        return port;
    }

    public void setPort(Integer port) {
        this.port = port;
    }

    public String getSentinelVersion() {
        return sentinelVersion;
    }

    public void setSentinelVersion(String sentinelVersion) {
        this.sentinelVersion = sentinelVersion;
    }

    public Long getHeartbeatVersion() {
        return heartbeatVersion;
    }

    public void setHeartbeatVersion(Long heartbeatVersion) {
        this.heartbeatVersion = heartbeatVersion;
    }

    public Long getLastHeartbeat() {
        return lastHeartbeat;
    }

    public void setLastHeartbeat(Long lastHeartbeat) {
        this.lastHeartbeat = lastHeartbeat;
    }

    public Boolean getStatus() {
        return status;
    }

    public void setStatus(Boolean status) {
        this.status = status;
    }

    public Boolean getIsDeleted() {
        return isDeleted;
    }

    public void setIsDeleted(Boolean isDeleted) {
        this.isDeleted = isDeleted;
    }

    public MachineInfo toMachineInfo() {
        MachineInfo machineInfo = new MachineInfo();
        machineInfo.setApp(app);
        machineInfo.setAppType(appType != null ? appType : 0);
        machineInfo.setHostname(hostname);
        machineInfo.setIp(ip);
        machineInfo.setPort(port);
        machineInfo.setVersion(sentinelVersion);
        machineInfo.setHeartbeatVersion(heartbeatVersion != null ? heartbeatVersion : 0L);
        machineInfo.setLastHeartbeat(lastHeartbeat != null ? lastHeartbeat : 0L);
        return machineInfo;
    }

    @Override
    public String toString() {
        return "MachineEntity{" +
            "id=" + id +
            ", gmtCreate=" + gmtCreate +
            ", gmtModified=" + gmtModified +
            ", app='" + app + '\'' +
            ", ip='" + ip + '\'' +
            ", hostname='" + hostname + '\'' +
            ", port=" + port +
            ", sentinelVersion='" + sentinelVersion + '\'' +
            ", status=" + status +
            '}';
    }
}
