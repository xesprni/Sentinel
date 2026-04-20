package com.alibaba.csp.sentinel.dashboard.config;

import com.alibaba.csp.sentinel.slots.block.flow.param.ParamFlowItem;
import com.alibaba.fastjson.JSON;
import org.apache.ibatis.type.BaseTypeHandler;
import org.apache.ibatis.type.JdbcType;

import java.sql.*;
import java.util.List;

public class ParamFlowItemListTypeHandler extends BaseTypeHandler<List<ParamFlowItem>> {

    @Override
    public void setNonNullParameter(PreparedStatement ps, int i, List<ParamFlowItem> parameter, JdbcType jdbcType) throws SQLException {
        ps.setString(i, JSON.toJSONString(parameter));
    }

    @Override
    public List<ParamFlowItem> getNullableResult(ResultSet rs, String columnName) throws SQLException {
        return parseJson(rs.getString(columnName));
    }

    @Override
    public List<ParamFlowItem> getNullableResult(ResultSet rs, int columnIndex) throws SQLException {
        return parseJson(rs.getString(columnIndex));
    }

    @Override
    public List<ParamFlowItem> getNullableResult(CallableStatement cs, int columnIndex) throws SQLException {
        return parseJson(cs.getString(columnIndex));
    }

    private List<ParamFlowItem> parseJson(String json) {
        if (json == null || json.isEmpty()) {
            return null;
        }
        return JSON.parseArray(json, ParamFlowItem.class);
    }
}
