# Sentinel Dashboard 前后端分离重构方案

## 1. 现状分析

### 1.1 当前前端技术栈

| 技术 | 版本/说明 |
|------|----------|
| AngularJS (1.x) | `angular@^1.4.8` — 已停止维护 |
| Bootstrap 3 | CSS 框架 |
| G2 (AntV) | 数据可视化图表 |
| jQuery | DOM 操作 |
| Gulp 3 | 构建工具 |
| ocLazyLoad | 路由懒加载 |
| ngDialog | 模态框 |
| selectize | 下拉选择器 |
| ui-router | 路由 (AngularJS 1.x 版) |

### 1.2 当前前端结构

```
sentinel-dashboard/src/main/webapp/resources/
├── app/
│   ├── scripts/
│   │   ├── app.js                          # 路由配置 & 模块定义
│   │   ├── controllers/                    # 23 个控制器
│   │   │   ├── login.js                    # 登录页
│   │   │   ├── main.js / home.js           # 首页
│   │   │   ├── flow_v1.js                  # 流控规则 V1 (按机器维度)
│   │   │   ├── flow_v2.js                  # 流控规则 V2 (按应用维度, 推送模式)
│   │   │   ├── degrade.js                  # 熔断规则
│   │   │   ├── system.js                   # 系统规则
│   │   │   ├── authority.js                # 授权规则
│   │   │   ├── param_flow.js               # 热点规则
│   │   │   ├── metric.js                   # 实时监控 (G2 图表)
│   │   │   ├── identity.js                 # 簇点链路
│   │   │   ├── machine.js                  # 机器列表
│   │   │   ├── cluster_single.js           # 集群单机配置
│   │   │   ├── cluster_app_*.js (5个)      # 集群流控管理
│   │   │   └── gateway/                    # 网关相关
│   │   │       ├── identity.js             # 网关请求链路
│   │   │       ├── api.js                  # API 管理
│   │   │       └── flow.js                 # 网关流控规则
│   │   ├── services/                       # 14 个 API 服务
│   │   ├── directives/                     # sidebar, header 组件
│   │   └── filters/                        # 过滤器
│   ├── views/                              # 23 个 HTML 模板
│   │   ├── login.html
│   │   ├── dashboard/ (home, main)
│   │   ├── dialog/ (7 个规则编辑弹窗)
│   │   ├── cluster/ (client, server)
│   │   └── gateway/ (api, flow, identity)
│   └── styles/ (CSS)
├── lib/ (第三方库)
└── dist/ (构建产物)
```

### 1.3 页面/路由清单

| 路由 | 视图 | 功能 | 条件 |
|------|------|------|------|
| `/login` | login.html | 登录页 | - |
| `/dashboard/home` | home.html | 首页欢迎 | - |
| `/dashboard/flow/:app` | flow_v1.html | 流控规则 (V1, 按机器) | 非网关应用 |
| `/dashboard/v2/flow/:app` | flow_v2.html | 流控规则 (V2, 按应用) | 非网关应用 |
| `/dashboard/degrade/:app` | degrade.html | 熔断降级规则 | - |
| `/dashboard/system/:app` | system.html | 系统保护规则 | - |
| `/dashboard/authority/:app` | authority.html | 授权规则 | 非网关应用 |
| `/dashboard/paramFlow/:app` | param_flow.html | 热点参数规则 | 非网关应用 |
| `/dashboard/metric/:app` | metric.html | 实时监控 (含 G2 图表) | - |
| `/dashboard/identity/:app` | identity.html | 簇点链路 | 非网关应用 |
| `/dashboard/app/:app` | machine.html | 机器列表 | - |
| `/dashboard/cluster/server/:app` | cluster_app_server_list.html | 集群 Server 列表 | 非网关应用 |
| `/dashboard/cluster/client/:app` | cluster_app_client_list.html | 集群 Client 列表 | 非网关应用 |
| `/dashboard/cluster/assign_manage/:app` | cluster_app_assign_manage.html | 集群分配管理 | 非网关应用 |
| `/dashboard/cluster/single/:app` | cluster_single_config.html | 集群单机配置 | 非网关应用 |
| `/dashboard/gateway/identity/:app` | gateway/identity.html | 网关请求链路 | 网关应用 |
| `/dashboard/gateway/api/:app` | gateway/api.html | API 管理 | 网关应用 |
| `/dashboard/gateway/flow/:app` | gateway/flow.html | 网关流控规则 | 网关应用 |

### 1.4 后端 REST API 清单

#### 认证
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/auth/login` | 登录 (username, password) |
| POST | `/auth/logout` | 登出 |
| POST | `/auth/check` | 检查登录状态 |

#### 应用 & 机器
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/app/names.json` | 获取应用名列表 |
| GET | `/app/briefinfos.json` | 获取应用简要信息 |
| GET | `/app/{app}/machines.json` | 获取应用下机器列表 |
| POST | `/app/{app}/machine/remove.json` | 移除机器 |
| POST | `/registry/machine` | 机器心跳注册 |

#### 流控规则 V1 (按机器)
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/v1/flow/rules` | 查询流控规则 |
| POST | `/v1/flow/rule` | 新增流控规则 |
| PUT | `/v1/flow/save.json` | 编辑流控规则 |
| DELETE | `/v1/flow/delete.json` | 删除流控规则 |

#### 流控规则 V2 (按应用, 推送模式)
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/v2/flow/rules` | 查询流控规则 |
| POST | `/v2/flow/rule` | 新增流控规则 |
| PUT | `/v2/flow/rule/{id}` | 编辑流控规则 |
| DELETE | `/v2/flow/rule/{id}` | 删除流控规则 |

#### 熔断降级规则
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/degrade/rules.json` | 查询熔断规则 |
| POST | `/degrade/rule` | 新增熔断规则 |
| PUT | `/degrade/rule/{id}` | 编辑熔断规则 |
| DELETE | `/degrade/rule/{id}` | 删除熔断规则 |

#### 系统规则
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/system/rules.json` | 查询系统规则 |
| POST | `/system/new.json` | 新增系统规则 |
| GET | `/system/save.json` | 编辑系统规则 |
| POST/GET | `/system/delete.json` | 删除系统规则 |

#### 授权规则
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/authority/rules` | 查询授权规则 |
| POST | `/authority/rule` | 新增授权规则 |
| PUT | `/authority/rule/{id}` | 编辑授权规则 |
| DELETE | `/authority/rule/{id}` | 删除授权规则 |

#### 热点参数规则
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/paramFlow/rules` | 查询热点规则 |
| POST | `/paramFlow/rule` | 新增热点规则 |
| PUT | `/paramFlow/rule/{id}` | 编辑热点规则 |
| DELETE | `/paramFlow/rule/{id}` | 删除热点规则 |

#### 实时监控
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/metric/queryTopResourceMetric.json` | 查询 Top 资源指标 |
| GET | `/metric/queryByAppAndResource.json` | 查询资源详细指标 |

#### 簇点链路
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/resource/machineResource.json` | 获取机器资源树 |

#### 网关 API 管理
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/gateway/api/list.json` | 查询 API 列表 |
| POST | `/gateway/api/new.json` | 新增 API |
| POST | `/gateway/api/save.json` | 编辑 API |
| POST | `/gateway/api/delete.json` | 删除 API |

#### 网关流控规则
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/gateway/flow/list.json` | 查询网关流控规则 |
| POST | `/gateway/flow/new.json` | 新增网关流控规则 |
| POST | `/gateway/flow/save.json` | 编辑网关流控规则 |
| POST | `/gateway/flow/delete.json` | 删除网关流控规则 |

#### 集群流控
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/cluster/server/{app}` | 获取集群 Server 状态 |
| GET | `/cluster/client/{app}` | 获取集群 Client 状态 |
| GET | `/cluster/single/{app}` | 获取单机集群状态 |
| POST | `/cluster/config/modify_single` | 修改单机集群配置 |
| POST | `/cluster/assign/all_server/{app}` | 全量分配集群 Server |
| POST | `/cluster/assign/single_server/{app}` | 单 Server 分配 |
| POST | `/cluster/assign/unbind_server/{app}` | 解绑 Server |

#### 其他
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/version` | 获取版本信息 |

> **统一响应格式**: `Result<T>` — `{ success: boolean, code: number, msg: string, data: T }`

### 1.5 核心痛点

1. **AngularJS 1.x 已 EOL** — 无安全更新，社区生态萎缩
2. **构建工具陈旧** — Gulp 3 + 手动 concat/uglify，无 HMR/Tree-shaking
3. **无类型安全** — 纯 JS，API 调用无类型校验
4. **UI 组件原始** — Bootstrap 3 + 手写 HTML，无组件化体系
5. **前后端耦合** — 前端资源打包在 Spring Boot JAR 中
6. **无状态管理** — 全靠 `$scope` 和 Service 作用域传递

---

## 2. 目标方案

### 2.1 新技术栈

| 类别 | 选型 | 理由 |
|------|------|------|
| **框架** | React 18 + TypeScript | 生态成熟、类型安全、社区活跃 |
| **构建** | Vite 6 | 极速 HMR、原生 ESM、开箱即用 |
| **UI 组件库** | shadcn/ui + Tailwind CSS 4 | 可定制、无运行时依赖、代码可控 |
| **路由** | React Router v7 | 声明式路由、数据加载、布局嵌套 |
| **状态管理** | TanStack Query (React Query) v5 | 服务端状态管理，自动缓存/重试/刷新 |
| **HTTP 客户端** | ky / fetch wrapper | 轻量、基于 fetch、拦截器支持 |
| **图表** | Recharts | React 原生、声明式、轻量 |
| **表单** | React Hook Form + Zod | 高性能表单、Schema 校验 |
| **国际化** | (可选) i18next | 当前为中文，预留国际化能力 |
| **包管理** | pnpm | 快速、节省磁盘空间 |

### 2.2 项目结构

```
sentinel-dashboard-ui/                    # 独立前端项目 (与 sentinel-dashboard 平级)
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── components.json                       # shadcn/ui 配置
├── public/
│   └── favicon.ico
├── src/
│   ├── main.tsx                          # 入口
│   ├── App.tsx                           # 根组件 + 路由
│   ├── vite-env.d.ts
│   │
│   ├── api/                              # API 层
│   │   ├── client.ts                     # HTTP 客户端 (baseURL, 拦截器, auth)
│   │   ├── types.ts                      # 统一响应 Result<T> 等类型
│   │   ├── auth.ts                       # 登录/登出/校验
│   │   ├── app.ts                        # 应用 & 机器
│   │   ├── flow-v1.ts                    # 流控规则 V1
│   │   ├── flow-v2.ts                    # 流控规则 V2
│   │   ├── degrade.ts                    # 熔断降级
│   │   ├── system.ts                     # 系统规则
│   │   ├── authority.ts                  # 授权规则
│   │   ├── param-flow.ts                 # 热点参数
│   │   ├── metric.ts                     # 实时监控
│   │   ├── resource.ts                   # 簇点链路
│   │   ├── gateway-api.ts                # 网关 API
│   │   ├── gateway-flow.ts               # 网关流控
│   │   ├── cluster.ts                    # 集群流控
│   │   └── version.ts                    # 版本
│   │
│   ├── components/                       # shadcn/ui 组件 + 自定义组件
│   │   ├── ui/                           # shadcn/ui 基础组件 (Button, Table, Dialog, etc.)
│   │   ├── layout/
│   │   │   ├── app-layout.tsx            # 主布局 (sidebar + header + content)
│   │   │   ├── sidebar.tsx               # 侧边栏 (应用列表 + 菜单)
│   │   │   └── header.tsx                # 顶部栏
│   │   ├── rules/
│   │   │   ├── rule-table.tsx            # 通用规则表格 (分页, 搜索, 操作)
│   │   │   ├── flow-rule-dialog.tsx      # 流控规则编辑弹窗
│   │   │   ├── degrade-rule-dialog.tsx   # 熔断规则编辑弹窗
│   │   │   ├── system-rule-dialog.tsx    # 系统规则编辑弹窗
│   │   │   ├── authority-rule-dialog.tsx # 授权规则编辑弹窗
│   │   │   ├── param-flow-rule-dialog.tsx # 热点规则编辑弹窗
│   │   │   ├── gateway-api-dialog.tsx    # 网关 API 编辑弹窗
│   │   │   └── gateway-flow-dialog.tsx   # 网关流控编辑弹窗
│   │   ├── metric/
│   │   │   ├── metric-chart.tsx          # 监控图表组件 (Recharts)
│   │   │   ├── metric-table.tsx          # 监控数据表格
│   │   │   └── metric-page.tsx           # 监控页 (图表+表格)
│   │   ├── cluster/
│   │   │   ├── cluster-server-list.tsx   # 集群 Server 列表
│   │   │   ├── cluster-client-list.tsx   # 集群 Client 列表
│   │   │   ├── cluster-assign-dialog.tsx # 集群分配弹窗
│   │   │   └── cluster-single-config.tsx # 单机集群配置
│   │   ├── machine/
│   │   │   ├── machine-table.tsx         # 机器列表表格
│   │   │   └── machine-selector.tsx      # 机器选择器 (替代 selectize)
│   │   └── shared/
│   │       ├── app-selector.tsx          # 应用选择器
│   │       ├── confirm-dialog.tsx        # 确认弹窗
│   │       ├── pagination.tsx            # 分页组件
│   │       └── search-input.tsx          # 搜索输入框
│   │
│   ├── hooks/                            # 自定义 Hooks
│   │   ├── use-auth.ts                   # 认证状态管理
│   │   ├── use-apps.ts                   # 应用列表
│   │   ├── use-machines.ts              # 机器列表
│   │   ├── use-machines-polling.ts       # 机器列表自动轮询
│   │   └── use-interval.ts              # 定时器 Hook
│   │
│   ├── pages/                            # 页面组件 (路由对应)
│   │   ├── login.tsx                     # /login
│   │   ├── home.tsx                      # /dashboard/home
│   │   ├── flow-v1.tsx                   # /dashboard/flow/:app
│   │   ├── flow-v2.tsx                   # /dashboard/v2/flow/:app
│   │   ├── degrade.tsx                   # /dashboard/degrade/:app
│   │   ├── system.tsx                    # /dashboard/system/:app
│   │   ├── authority.tsx                 # /dashboard/authority/:app
│   │   ├── param-flow.tsx                # /dashboard/paramFlow/:app
│   │   ├── metric.tsx                    # /dashboard/metric/:app
│   │   ├── identity.tsx                  # /dashboard/identity/:app
│   │   ├── machine.tsx                   # /dashboard/app/:app
│   │   ├── cluster/
│   │   │   ├── server-list.tsx           # /dashboard/cluster/server/:app
│   │   │   ├── client-list.tsx           # /dashboard/cluster/client/:app
│   │   │   ├── assign-manage.tsx         # /dashboard/cluster/assign_manage/:app
│   │   │   └── single-config.tsx         # /dashboard/cluster/single/:app
│   │   └── gateway/
│   │       ├── identity.tsx              # /dashboard/gateway/identity/:app
│   │       ├── api-management.tsx        # /dashboard/gateway/api/:app
│   │       └── flow.tsx                  # /dashboard/gateway/flow/:app
│   │
│   ├── lib/
│   │   └── utils.ts                      # cn(), formatDate() 等工具
│   │
│   └── types/
│       ├── rule.ts                        # 规则相关类型定义
│       ├── app.ts                         # 应用/机器类型
│       ├── metric.ts                      # 监控数据类型
│       ├── cluster.ts                     # 集群类型
│       └── gateway.ts                     # 网关类型
│
├── .env.development                       # VITE_API_BASE_URL=http://localhost:8080
└── .env.production                        # VITE_API_BASE_URL=/
```

---

## 3. 路由设计

```tsx
// App.tsx
<Routes>
  <Route path="/login" element={<LoginPage />} />

  <Route element={<ProtectedLayout />}>          {/* 需要登录 */}
    <Route path="/dashboard/home" element={<HomePage />} />

    {/* 以 :app 为参数，所有子页面 */}
    <Route path="/dashboard/flow/:app" element={<FlowV1Page />} />
    <Route path="/dashboard/v2/flow/:app" element={<FlowV2Page />} />
    <Route path="/dashboard/degrade/:app" element={<DegradePage />} />
    <Route path="/dashboard/system/:app" element={<SystemPage />} />
    <Route path="/dashboard/authority/:app" element={<AuthorityPage />} />
    <Route path="/dashboard/paramFlow/:app" element={<ParamFlowPage />} />
    <Route path="/dashboard/metric/:app" element={<MetricPage />} />
    <Route path="/dashboard/identity/:app" element={<IdentityPage />} />
    <Route path="/dashboard/app/:app" element={<MachinePage />} />

    {/* 集群流控 */}
    <Route path="/dashboard/cluster/server/:app" element={<ClusterServerListPage />} />
    <Route path="/dashboard/cluster/client/:app" element={<ClusterClientListPage />} />
    <Route path="/dashboard/cluster/assign_manage/:app" element={<ClusterAssignManagePage />} />
    <Route path="/dashboard/cluster/single/:app" element={<ClusterSingleConfigPage />} />

    {/* 网关 */}
    <Route path="/dashboard/gateway/identity/:app" element={<GatewayIdentityPage />} />
    <Route path="/dashboard/gateway/api/:app" element={<GatewayApiPage />} />
    <Route path="/dashboard/gateway/flow/:app" element={<GatewayFlowPage />} />
  </Route>
</Routes>
```

路由结构与现有 AngularJS 版本 **完全一致**，确保所有用户收藏/书签兼容。

---

## 4. 核心功能实现对照

### 4.1 认证与会话

| 原实现 | 新实现 |
|--------|--------|
| `$httpProvider.interceptors` + localStorage | Axios/Fetch 拦截器 + `useAuth` Hook |
| `AuthInterceptor` 监听 401 跳转登录 | HTTP Client 拦截器 + React Router `navigate` |
| Session-based (cookie) | 保持 Session 模式，无需变更后端 |

### 4.2 侧边栏 (应用列表 + 菜单)

| 原实现 | 新实现 |
|--------|--------|
| AngularJS directive + `$interval` 轮询 | `Sidebar` 组件 + `useApps` Hook + TanStack Query `refetchInterval` |
| selectize 搜索框 | Command 组件 (shadcn/ui) 或 Input + fuzzy search |
| 区分网关/普通应用渲染不同菜单 | 条件渲染 (`isGateway` flag) |

### 4.3 规则管理页 (7 类规则)

统一模式 — 每个规则页面复用同一结构：

```
┌─ 页面标题 + 应用名 ─────────────────────┐
│  [机器选择器]  [搜索框]  [刷新]  [新增]  │
├─────────────────────────────────────────┤
│  数据表格 (shadcn Table)                │
│  - 列: 规则字段 + 操作列 (编辑/删除)     │
│  - 分页                                 │
├─────────────────────────────────────────┤
│  编辑弹窗 (shadcn Dialog + Form)        │
│  - 新增/编辑共用                         │
│  - Zod Schema 校验                      │
└─────────────────────────────────────────┘
```

7 个弹窗对应 7 个规则表单组件：
1. **FlowRuleDialog** — 流控规则 (阈值类型, 流控模式, 流控效果, 集群模式, 高级选项)
2. **DegradeRuleDialog** — 熔断规则 (策略: 慢RT/异常比例/异常数, 时间窗口)
3. **SystemRuleDialog** — 系统规则 (Load/CPU/RT/线程/QPS, 单选)
4. **AuthorityRuleDialog** — 授权规则 (资源名, 来源, 策略: 黑/白名单)
5. **ParamFlowRuleDialog** — 热点规则 (参数索引, 阈值, 参数例外项)
6. **GatewayApiDialog** — 网关 API (API名称, 匹配模式列表)
7. **GatewayFlowDialog** — 网关流控 (API/路由ID, 阈值, 间隔, 参数项)

### 4.4 实时监控页 (Metric)

| 原实现 | 新实现 |
|--------|--------|
| G2 图表 | Recharts `LineChart` + `ResponsiveContainer` |
| `$interval` 10s 轮询 | TanStack Query `refetchInterval: 10_000` |
| 每资源一个图表+表格 | `MetricPage` 组件循环渲染 `MetricChart` + `MetricTable` |
| 升序/降序切换 | Button 切换 `desc` 参数 |
| 分页 6 条/页 | 同样分页逻辑 |

图表展示字段不变：**通过 QPS**, **拒绝 QPS**, **响应时间 (ms)** 对比时间轴。

### 4.5 簇点链路 (Identity)

| 原实现 | 新实现 |
|--------|--------|
| treeTable jQuery 插件 | shadcn `Tree` 或 `DataTable` + 展开行 |
| 类型切换 (root/default/cluster) | Tabs 组件切换 |
| 搜索过滤 | Input + 客户端过滤 |
| 每行"流控"/"降级"快捷按钮 | DropdownMenu 操作 |

### 4.6 机器列表

| 原实现 | 新实现 |
|--------|--------|
| 静态表格 | DataTable + 状态 Badge (健康/失联) |
| 移除按钮 | 确认弹窗 + 调用 API |

### 4.7 集群流控 (4 个子页面)

| 页面 | 功能 |
|------|------|
| Server 列表 | Token Server 状态展示、连接详情 |
| Client 列表 | Client 状态、配置修改弹窗 |
| 分配管理 | Server/Client 角色分配交互 |
| 单机配置 | 切换模式 (embedded/独立/Client)、参数配置 |

---

## 5. 后端改造

### 5.1 CORS 配置

在 `sentinel-dashboard` 后端添加 CORS 支持，开发环境允许前端 `localhost:5173` 跨域访问：

```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
            .allowedOrigins("http://localhost:5173")  // 开发环境
            .allowedMethods("GET", "POST", "PUT", "DELETE")
            .allowedHeaders("*")
            .allowCredentials(true);
    }
}
```

### 5.2 部署模式

| 模式 | 说明 |
|------|------|
| **开发** | 前端 `vite dev` (5173) → 后端 Spring Boot (8080)，通过 CORS 跨域 |
| **生产 A** | 前端构建为静态文件 → 放入 Spring Boot `src/main/webapp/resources/` |
| **生产 B** | 前端独立部署 (Nginx) → 反向代理 `/api` 到后端 |

推荐 **生产 A** 保持向后兼容（单 JAR 部署），同时支持 **生产 B** 独立部署。

### 5.3 后端改动范围

| 改动 | 说明 |
|------|------|
| 添加 CORS 配置 | 新增一个 `@Configuration` 类 |
| 保留 Session 认证 | 不变，前端通过 `credentials: 'include'` 携带 Cookie |
| 保留所有 REST API | 路径和参数完全不变 |
| 移除旧前端资源 (可选) | 后续可删除 `src/main/webapp/resources/app/` 和 `lib/` 目录 |

---

## 6. 实施计划

### Phase 0: 项目初始化 (1 天)

- [ ] 在 `sentinel-dashboard-ui/` 创建 Vite + React + TypeScript 项目
- [ ] 配置 Tailwind CSS 4 + shadcn/ui
- [ ] 配置路径别名 (`@/` → `src/`)
- [ ] 配置 `.env.development` 和 `.env.production`
- [ ] 添加 shadcn/ui 基础组件: Button, Input, Label, Table, Dialog, Form, Select, RadioGroup, Checkbox, Tabs, Badge, DropdownMenu, Command, Card, Tooltip, Toast/Sonner
- [ ] 后端添加 CORS 配置类

### Phase 1: 基础框架 (2 天)

- [ ] **API 层**: HTTP Client + TypeScript 类型定义 + 所有 API 模块
- [ ] **认证**: `useAuth` Hook + 登录页 + 路由守卫 + 401 拦截
- [ ] **布局**: `AppLayout` (侧边栏 + 头部 + 内容区)
- [ ] **侧边栏**: 应用列表加载 + 搜索 + 菜单展开 (区分网关/普通应用)
- [ ] **首页**: Home 页 (欢迎页)

### Phase 2: 核心规则页 (4 天)

- [ ] **流控规则 V1** — 表格 + 机器选择器 + 新增/编辑弹窗
- [ ] **流控规则 V2** — 表格 + 新增/编辑弹窗 (无机器选择, 按应用维度)
- [ ] **熔断降级** — 表格 + 弹窗 (3 种策略切换)
- [ ] **系统规则** — 表格 + 弹窗 (单选阈值类型)
- [ ] **授权规则** — 表格 + 弹窗 (黑/白名单)
- [ ] **热点参数** — 表格 + 弹窗 (参数例外项动态表单)

### Phase 3: 监控与链路 (2 天)

- [ ] **实时监控** — Recharts 图表 + 数据表格 + 分页 + 自动刷新
- [ ] **簇点链路** — 资源树展示 + 搜索 + 类型切换 + 快捷操作

### Phase 4: 网关与集群 (3 天)

- [ ] **网关 API 管理** — 列表 + 弹窗 (匹配模式动态行)
- [ ] **网关流控规则** — 列表 + 弹窗 (参数项配置)
- [ ] **网关请求链路** — 资源展示
- [ ] **集群 Server 列表** — 状态展示 + 连接详情
- [ ] **集群 Client 列表** — 状态 + 配置修改
- [ ] **集群分配管理** — Server/Client 分配交互
- [ ] **集群单机配置** — 模式切换 + 参数配置

### Phase 5: 机器与收尾 (1 天)

- [ ] **机器列表** — 表格 + 状态展示 + 移除操作
- [ ] 全局: 错误处理, Toast 通知, Loading 状态
- [ ] 全局: 响应式布局优化
- [ ] 全局: 暗色模式支持 (shadcn/ui 内置)

### Phase 6: 测试与部署 (2 天)

- [ ] 功能对照测试: 逐一验证每个页面与原版功能一致
- [ ] 生产构建配置: `vite build` → 静态文件打包到 Spring Boot
- [ ] 配置 Nginx 独立部署方案 (可选)
- [ ] 清理旧前端代码 (可选)
- [ ] 编写 README

**预计总工期: 约 15 个工作日**

---

## 7. 风险与应对

| 风险 | 影响 | 应对措施 |
|------|------|----------|
| 后端 Session 认证依赖 Cookie | 跨域部署时 Cookie 不可用 | 开发环境用 CORS + `credentials: include`；生产环境推荐同域部署或 Nginx 反代 |
| 实时监控 G2 → Recharts 图表样式差异 | 视觉不一致 | 对比截图调整 Recharts 配色和布局，保持数据展示逻辑一致 |
| 集群流控交互复杂 | 分配管理页面状态多 | 参考 AngularJS 版本逐功能复刻，状态用 React Query 管理 |
| 流控 V1/V2 共存 | 两套 API 逻辑不同 | 保持两套独立页面，不合并 |
| 旧版 IE 兼容性 | React 18 不支持 IE | Sentinel Dashboard 通常在现代浏览器运行，无影响 |

---

## 8. shadcn/ui 组件使用映射

| 原组件 | shadcn/ui 替代 |
|--------|---------------|
| Bootstrap Table | `Table` + `DataTable` (TanStack Table) |
| Bootstrap Modal (ngDialog) | `Dialog` / `Sheet` |
| Bootstrap Form | `Form` (React Hook Form) + `Input` + `Select` + `RadioGroup` + `Checkbox` |
| Bootstrap Button | `Button` |
| Bootstrap Badge | `Badge` |
| Bootstrap Dropdown | `DropdownMenu` |
| selectize (下拉选择) | `Select` / `Command` / `Combobox` |
| Bootstrap Tabs | `Tabs` |
| Bootstrap Pagination | 自定义 `Pagination` 组件 |
| Bootstrap Switch | `Switch` |
| AngularJS Toast | `Sonner` |
| AngularJS Tooltip | `Tooltip` |
| AngularJS Loading Bar | `Spinner` / `Skeleton` |
| G2 Chart | `Recharts` (LineChart, AreaChart) |

---

## 9. 目录位置建议

前端项目建议放在 Sentinel 根目录下作为独立模块：

```
Sentinel/
├── sentinel-core/
├── sentinel-dashboard/          # 后端 (保留)
│   └── src/main/webapp/...      # 旧前端 (后续可移除)
├── sentinel-dashboard-ui/       # 新前端 (独立项目)
│   ├── package.json
│   ├── vite.config.ts
│   └── src/...
├── sentinel-adapter/
└── ...
```

`pom.xml` 不需要改动，前端独立构建部署。如需集成到 JAR，可通过 `maven-resources-plugin` 在 build 阶段拷贝前端产物。
