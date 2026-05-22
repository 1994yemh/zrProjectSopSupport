# 项目管理系统设计文档

## 概述

辅助项目管理系统，包含管理端和看板端两个独立 URL 入口。管理端用于课程、产品、项目的 CRUD 管理，以及项目生命周期进展跟踪；看板端用于只读查看项目生命周期进度。

## 技术栈

- **前端**：Vue 3 + TypeScript + Naive UI + Vite
- **后端**：Node.js + Express
- **数据库**：SQLite (better-sqlite3)
- **富文本**：wangeditor 或 tiptap

## 整体架构

单 Vue 应用 + 路由前缀分离管理端和看板端。

```
zrProjectSopSupport/
├── server/                    # Node.js 后端
│   ├── index.js               # 入口，Express 服务
│   ├── db.js                  # SQLite 初始化 + 种子数据
│   └── routes/
│       ├── auth.js            # 登录接口
│       ├── courses.js         # 课程 CRUD
│       ├── products.js        # 产品 CRUD
│       ├── projects.js        # 项目 CRUD + 生命周期
│       └── lifecycle.js       # 生命周期检查项操作
│
├── src/                       # Vue 3 前端
│   ├── views/
│   │   ├── admin/             # 管理端页面
│   │   │   ├── Login.vue
│   │   │   ├── CourseManage.vue
│   │   │   ├── ProductManage.vue
│   │   │   └── ProjectManage.vue
│   │   └── kanban/            # 看板端页面
│   │       └── KanbanBoard.vue
│   ├── components/            # 共享组件
│   │   ├── Layout/            # 布局组件
│   │   ├── LifecycleTimeline.vue
│   │   ├── ProjectCard.vue
│   │   └── CheckItemList.vue
│   ├── router/index.ts
│   ├── stores/
│   ├── App.vue
│   └── main.ts
│
├── package.json
└── vite.config.ts
```

## 路由设计

| 路径 | 说明 | 需要登录 |
|------|------|---------|
| `/admin/login` | 登录页 | 否 |
| `/admin/courses` | 课程管理 | 是 |
| `/admin/products` | 产品管理 | 是 |
| `/admin/projects` | 项目管理 | 是 |
| `/kanban` | 看板首页 | 否 |

## 数据模型

### users
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 自增 |
| username | TEXT | 用户名 |
| password | TEXT | 密码 |

预置数据：admin / admin

### courses
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 自增 |
| name | TEXT | 课程名称 |
| experiment_type | TEXT | 实验类型：hardware_rack / kvm / eve |
| experiment_image | TEXT | 实验镜像，多个用逗号分隔 |
| description | TEXT | 说明 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

种子数据：19门课程，来源见《项目管理系统.md》

### products
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 自增 |
| name | TEXT | 产品名称 |
| install_path | TEXT | 安装包位置（NAS路径） |
| install_manual_path | TEXT | 安装手册位置 |
| usage_manual_path | TEXT | 使用手册位置 |
| verification_path | TEXT | 验收参数位置 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

种子数据：9个产品，来源见《项目管理系统.md》

### projects
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 自增 |
| name | TEXT | 项目名称 |
| is_kvm | BOOLEAN | 是否KVM实验 |
| is_eve | BOOLEAN | 是否EVE实验 |
| deploy_method | TEXT | 部署方式：centralized / distributed |
| responsible_person | TEXT | 负责人 |
| after_sales_person | TEXT | 售后人员 |
| delivery_start_date | DATE | 交付开始时间 |
| delivery_end_date | DATE | 交付截止时间 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

### project_products（多对多）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 自增 |
| project_id | INTEGER FK | 项目ID |
| product_id | INTEGER FK | 产品ID |

### project_courses（多对多）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 自增 |
| project_id | INTEGER FK | 项目ID |
| course_id | INTEGER FK | 课程ID |

### lifecycle_templates（生命周期模板）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 自增 |
| phase | TEXT | 阶段：startup / planning / execution / monitoring / closure |
| step_name | TEXT | 子项名称 |
| check_items_json | TEXT | JSON数组，检查项列表 |
| sort_order | INTEGER | 排序 |

### project_lifecycle（项目生命周期实例）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 自增 |
| project_id | INTEGER FK | 项目ID |
| phase | TEXT | 阶段 |
| step_name | TEXT | 子项名称 |
| sort_order | INTEGER | 排序 |

### lifecycle_checks（检查明细）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 自增 |
| project_lifecycle_id | INTEGER FK | 关联 project_lifecycle |
| check_content | TEXT | 检查项内容 |
| is_passed | BOOLEAN | 是否通过（null=未检查） |
| sort_order | INTEGER | 排序 |

### lifecycle_notes（子项备注）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 自增 |
| project_lifecycle_id | INTEGER FK | 关联 project_lifecycle |
| content | TEXT | 富文本内容 |

## 生命周期模板映射（参考 Excel SOP）

### 项目启动 (startup)
| 子项 | 检查项 |
|------|--------|
| 确定交付物 | 确认标准产品清单（网络产品/数据中心/AI/基础产品）；确认非标准产品（定制开发）需求范围 |
| 识别干系人 | 发货申请同步至产研项目组；发货申请同步至采购；发货申请同步至售前、售后、部门领导 |
| 现场勘探 | 销售协调代理渠道安排勘察时间；检查学校假期因素确认施工窗口期；检查校园机房网络连通性；检查机房外网可达性；检查设备接地是否正常；检查电源供电及功率；检查机房安装空间；检查安全环境 |
| 确认交付周期 | 确定交付策略（一次性/分批/分阶段）；输出各产品具体部署时间节点排期表 |

### 项目规划 (planning)
| 子项 | 检查项 |
|------|--------|
| 项目评估 | 评估学校假期对工期影响；评估校园网限制情况；评估服务器/网络设备权限获取；评估设备到货时间及型号匹配风险；完成风险评估表并提交审批 |
| 制定部署方案 | 制定课程方案；制定服务器配置方案；制定网络设备方案 |
| 进度计划 | 制定项目排期表，标注关键路径 |

### 项目执行 (execution)
| 子项 | 检查项 |
|------|--------|
| 设备采购 | 关注硬件市场价格波动并反馈；根据产品交付清单确认BOM清单；供应商下单并跟踪订单；确认服务器发往公司时间；确认硬件设备发往项目现场时间 |
| 准出可交付产品 | 机柜上架完成；网络布线完成；IP地址配置完成；网段划分完成；网络联通测试通过；平台初始化完成；账号权限配置完成；第三方系统对接完成 |
| 实施部署 | 逐项核对功能正常；业务流程闭环；并发测试达标；响应时间达标；问题记录并反馈；问题修复后回归验证 |
| 项目验收 | 合同范围内所有功能完成；文档齐全；已知问题全部关闭；合同范围核对；功能演示确认；数量清点确认；性能测试确认；培训完成确认；文档交付确认；输出验收单并签字盖章；管理员培训完成；教师培训完成；学生培训完成；运维人员培训完成 |

### 项目监控 (monitoring)
| 子项 | 检查项 |
|------|--------|
| 进度跟踪 | 技术问题远程支持或派驻解决；方案调整评估后快速响应；资源协调（开发、测试等）到位 |
| 需求变更 | 收集客户变更需求并输出变更文档 |

### 项目收尾 (closure)
| 子项 | 检查项 |
|------|--------|
| 总结报告 | 梳理高频问题并根因分析；识别可自动化部署步骤；评估工期合理性；评估沟通顺畅度；评估成本预算执行；输出项目复盘报告并签字 |
| 经验教训 | 高频问题纳入知识库；可优化流程纳入下一版SOP；优秀实践形成标准模板 |

## 页面交互设计

### 管理端 - 登录页
- 居中卡片，账号密码输入框 + 登录按钮
- 仅 admin/admin 可登录
- 登录后 token 存 localStorage，跳转 `/admin/projects`

### 管理端 - 课程管理
- 顶部搜索框 + 新增按钮
- Naive UI DataTable 分页展示（每页10条）
- 操作列：编辑、删除
- 新增/编辑弹窗表单：课程名称、实验类型（下拉）、实验镜像（输入）、说明（文本域）

### 管理端 - 产品管理
- 布局同课程管理
- 新增/编辑弹窗表单：产品名称、安装包位置、安装手册位置、使用手册位置、验收参数位置

### 管理端 - 项目管理
- 新增弹窗表单：项目名称、产品（多选下拉）、课程（多选下拉）、是否KVM（开关）、是否EVE（开关）、部署方式（单选）、负责人、售后人员、交付开始/截止时间
- 确认后自动生成项目简介（只读展示）
- 简介内容：
  - 项目名称
  - 所需产品详情：产品名称、安装包位置、安装手册位置、使用手册位置、验收参数位置
  - 所需课程详情：课程名称、实验类型、实验镜像、说明
- 记录列表：卡片网格展示
  - 卡片字段：项目名称、产品数、课程数、KVM/EVE标签、部署方式、负责人、售后人员、交付时间、创建时间、当前阶段状态
- 卡片操作：查看详情、项目进展

### 管理端 - 项目进展弹窗
- 5个 Tab 对应5个生命周期阶段
- 顶部显示阶段整体进度（已完成/总数）
- 每个 Tab 内：子项列表可展开折叠
  - 展开后：检查清单（逐条勾选 通过/不通过）+ 富文本备注输入框

### 看板端
- 无需登录
- 顶部下拉选择项目
- 纵向时间线展示5个阶段
- 每个阶段节点内展示子项
- 子项显示检查项状态（绿色通过/红色不通过/灰色未检查）+ 备注内容
- 只读，不可操作

## API 设计

### 认证
- `POST /api/auth/login` — 登录，返回 token

### 课程
- `GET /api/courses?page=1&pageSize=10&keyword=` — 分页查询
- `POST /api/courses` — 新增
- `PUT /api/courses/:id` — 编辑
- `DELETE /api/courses/:id` — 删除

### 产品
- `GET /api/products?page=1&pageSize=10&keyword=` — 分页查询
- `POST /api/products` — 新增
- `PUT /api/products/:id` — 编辑
- `DELETE /api/products/:id` — 删除

### 项目
- `GET /api/projects?page=1&pageSize=10` — 分页查询
- `GET /api/projects/:id` — 详情（含关联产品和课程）
- `POST /api/projects` — 新增（含产品和课程关联）
- `PUT /api/projects/:id` — 编辑
- `DELETE /api/projects/:id` — 删除
- `GET /api/projects/:id/summary` — 获取项目简介

### 生命周期
- `GET /api/projects/:id/lifecycle` — 获取项目生命周期数据
- `PUT /api/lifecycle/checks/:id` — 更新检查项状态
- `PUT /api/lifecycle/notes/:projectLifecycleId` — 更新子项备注

## 项目新增流程

1. 用户填写项目表单（名称、产品多选、课程多选、KVM/EVE开关、部署方式、负责人、售后人员、交付时间）
2. 点击确认 → 后端创建项目记录 + 关联表 + 从模板复制生命周期数据
3. 前端跳转到项目简介展示页（只读，展示产品和课程详情）
4. 用户确认后返回项目列表

## 认证机制

- 简单 JWT token 认证
- 管理端 API 通过中间件校验 token
- 看板端 API（GET /api/projects、GET /api/projects/:id/lifecycle）无需认证
