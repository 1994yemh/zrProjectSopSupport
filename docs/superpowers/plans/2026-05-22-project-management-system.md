# 项目管理系统实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建项目管理系统，包含管理端（课程/产品/项目CRUD + 生命周期跟踪）和看板端（只读时间线查看）

**Architecture:** 单 Vite + Vue 3 应用，通过路由前缀 `/admin/*` 和 `/kanban` 分离两端。Node.js Express 后端，SQLite 持久化，JWT 简单认证。

**Tech Stack:** Vue 3 + TypeScript + Naive UI + Vite + Express + sql.js + jsonwebtoken + wangeditor

**Design Spec:** `docs/superpowers/specs/2026-05-22-project-management-system-design.md`

---

## File Structure

```
zrProjectSopSupport/
├── server/
│   ├── index.js                  # Express 入口，启动服务
│   ├── db.js                     # SQLite 初始化、建表、种子数据
│   ├── middleware/
│   │   └── auth.js               # JWT 认证中间件
│   └── routes/
│       ├── auth.js               # POST /api/auth/login
│       ├── courses.js            # 课程 CRUD
│       ├── products.js           # 产品 CRUD
│       ├── projects.js           # 项目 CRUD + 简介
│       └── lifecycle.js          # 生命周期模板 + 检查项
│
├── src/
│   ├── main.ts
│   ├── App.vue
│   ├── api/
│   │   ├── request.ts            # axios 封装
│   │   ├── auth.ts
│   │   ├── courses.ts
│   │   ├── products.ts
│   │   ├── projects.ts
│   │   └── lifecycle.ts
│   ├── router/
│   │   └── index.ts
│   ├── stores/
│   │   └── user.ts               # 用户状态（token）
│   ├── views/
│   │   ├── admin/
│   │   │   ├── Login.vue
│   │   │   ├── CourseManage.vue
│   │   │   ├── ProductManage.vue
│   │   │   └── ProjectManage.vue
│   │   └── kanban/
│   │       └── KanbanBoard.vue
│   ├── components/
│   │   ├── AdminLayout.vue       # 管理端侧边栏布局
│   │   ├── ProjectCard.vue       # 项目卡片
│   │   ├── ProjectProgress.vue   # 项目进展弹窗（5 tab）
│   │   ├── CheckItemList.vue     # 检查清单组件
│   │   └── LifecycleTimeline.vue # 看板时间线
│   └── types/
│       └── index.ts              # TypeScript 类型定义
│
├── package.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

---

## Task 1: 项目初始化

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `src/main.ts`
- Create: `src/App.vue`
- Create: `index.html`

- [ ] **Step 1: 初始化 Vite + Vue 3 + TypeScript 项目**

在 `zrProjectSopSupport/` 目录下初始化：

```bash
cd E:/myStudyProject/tool/zrProjectSopSupport/zrProjectSopSupport
npm create vite@latest . -- --template vue-ts
```

如果目录非空，确认覆盖。

- [ ] **Step 2: 安装依赖**

```bash
npm install naive-ui @vicons/ionicons5 vue-router@4 pinia axios
npm install wangeditor @wangeditor/editor @wangeditor/editor-for-vue
```

后端依赖：

```bash
npm install express better-sqlite3 jsonwebtoken cors
npm install -D @types/express @types/better-sqlite3 @types/jsonwebtoken @types/cors
```

- [ ] **Step 3: 配置 vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
```

- [ ] **Step 4: 创建最小 App.vue 和 main.ts**

`src/main.ts`:
```typescript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
```

`src/App.vue`:
```vue
<template>
  <router-view />
</template>
```

- [ ] **Step 5: 创建类型定义 src/types/index.ts**

```typescript
// 课程
export interface Course {
  id: number
  name: string
  experiment_type: 'hardware_rack' | 'kvm' | 'eve'
  experiment_image: string
  description: string
  created_at: string
  updated_at: string
}

export interface CourseForm {
  name: string
  experiment_type: 'hardware_rack' | 'kvm' | 'eve'
  experiment_image: string
  description: string
}

// 产品
export interface Product {
  id: number
  name: string
  install_path: string
  install_manual_path: string
  usage_manual_path: string
  verification_path: string
  created_at: string
  updated_at: string
}

export interface ProductForm {
  name: string
  install_path: string
  install_manual_path: string
  usage_manual_path: string
  verification_path: string
}

// 项目
export interface Project {
  id: number
  name: string
  is_kvm: boolean
  is_eve: boolean
  deploy_method: 'centralized' | 'distributed'
  responsible_person: string
  after_sales_person: string
  delivery_start_date: string
  delivery_end_date: string
  product_ids?: number[]
  course_ids?: number[]
  products?: Product[]
  courses?: Course[]
  created_at: string
  updated_at: string
}

export interface ProjectForm {
  name: string
  is_kvm: boolean
  is_eve: boolean
  deploy_method: 'centralized' | 'distributed'
  responsible_person: string
  after_sales_person: string
  delivery_start_date: string
  delivery_end_date: string
  product_ids: number[]
  course_ids: number[]
}

// 生命周期
export type Phase = 'startup' | 'planning' | 'execution' | 'monitoring' | 'closure'

export interface LifecycleTemplate {
  id: number
  phase: Phase
  step_name: string
  check_items_json: string
  sort_order: number
}

export interface ProjectLifecycle {
  id: number
  project_id: number
  phase: Phase
  step_name: string
  sort_order: number
  checks?: LifecycleCheck[]
  notes?: string
}

export interface LifecycleCheck {
  id: number
  project_lifecycle_id: number
  check_content: string
  is_passed: boolean | null
  sort_order: number
}

export interface LifecycleNote {
  id: number
  project_lifecycle_id: number
  content: string
}

// 通用分页
export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

// API 响应
export interface ApiResponse<T = any> {
  code: number
  data: T
  message?: string
}
```

- [ ] **Step 6: 验证开发服务器启动**

```bash
npx vite --host
```

确认页面加载正常，然后停止。

- [ ] **Step 7: Commit**

```bash
git init
git add -A
git commit -m "chore: init project with Vue3 + TS + Naive UI"
```

---

## Task 2: 数据库初始化 + 种子数据

**Files:**
- Create: `server/db.js`
- Create: `server/index.js`

- [ ] **Step 1: 创建 server/db.js**

SQLite 初始化、建表、种子数据。包含：
- 9张表：users, courses, products, projects, project_products, project_courses, lifecycle_templates, project_lifecycle, lifecycle_checks, lifecycle_notes
- 预置 admin/admin 用户
- 19门课程种子数据（从《项目管理系统.md》）
- 9个产品种子数据（从《项目管理系统.md》）
- 生命周期模板数据（从 Excel SOP 映射，5阶段15子项含检查项）

完整代码见附件。

- [ ] **Step 2: 创建 server/index.js**

Express 服务入口：
```javascript
const express = require('express')
const cors = require('cors')
const path = require('path')
const { initDB } = require('./db')

// 初始化数据库
initDB()

const app = express()
app.use(cors())
app.use(express.json())

// 静态文件（生产环境）
app.use(express.static(path.join(__dirname, '../dist')))

// 路由
app.use('/api/auth', require('./routes/auth'))
app.use('/api/courses', require('./routes/courses'))
app.use('/api/products', require('./routes/products'))
app.use('/api/projects', require('./routes/projects'))
app.use('/api/lifecycle', require('./routes/lifecycle'))

// SPA fallback
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../dist/index.html'))
  }
})

const PORT = 3001
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
```

- [ ] **Step 3: 验证数据库初始化**

```bash
cd E:/myStudyProject/tool/zrProjectSopSupport/zrProjectSopSupport
node -e "require('./server/db.js').initDB(); console.log('DB initialized')"
```

确认 `data.db` 文件生成。

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add SQLite database init with seed data"
```

---

## Task 3: 认证中间件 + 登录 API

**Files:**
- Create: `server/middleware/auth.js`
- Create: `server/routes/auth.js`

- [ ] **Step 1: 创建 JWT 认证中间件**

`server/middleware/auth.js`:
```javascript
const jwt = require('jsonwebtoken')
const SECRET = 'project-mgmt-secret-key'

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ code: 401, message: '未登录' })
  try {
    req.user = jwt.verify(token, SECRET)
    next()
  } catch {
    res.status(401).json({ code: 401, message: 'token无效' })
  }
}

module.exports = { authMiddleware, SECRET }
```

- [ ] **Step 2: 创建登录路由**

`server/routes/auth.js`:
```javascript
const express = require('express')
const jwt = require('jsonwebtoken')
const Database = require('better-sqlite3')
const { SECRET } = require('../middleware/auth')
const router = express.Router()
const db = new Database('data.db')

router.post('/login', (req, res) => {
  const { username, password } = req.body
  const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password)
  if (!user) return res.json({ code: 400, message: '账号或密码错误' })
  const token = jwt.sign({ id: user.id, username: user.username }, SECRET, { expiresIn: '7d' })
  res.json({ code: 0, data: { token } })
})

module.exports = router
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add JWT auth middleware and login API"
```

---

## Task 4: 课程 CRUD API

**Files:**
- Create: `server/routes/courses.js`

- [ ] **Step 1: 实现课程增删改查分页接口**

```javascript
const express = require('express')
const Database = require('better-sqlite3')
const { authMiddleware } = require('../middleware/auth')
const router = express.Router()
const db = new Database('data.db')

router.use(authMiddleware)

// 分页查询
router.get('/', (req, res) => {
  const page = Number(req.query.page) || 1
  const pageSize = Number(req.query.pageSize) || 10
  const keyword = req.query.keyword || ''
  const offset = (page - 1) * pageSize

  let where = ''
  const params = []
  if (keyword) {
    where = 'WHERE name LIKE ?'
    params.push(`%${keyword}%`)
  }

  const total = db.prepare(`SELECT COUNT(*) as count FROM courses ${where}`).get(...params).count
  const list = db.prepare(`SELECT * FROM courses ${where} ORDER BY id DESC LIMIT ? OFFSET ?`).all(...params, pageSize, offset)

  res.json({ code: 0, data: { list, total, page, pageSize } })
})

// 新增
router.post('/', (req, res) => {
  const { name, experiment_type, experiment_image, description } = req.body
  const now = new Date().toISOString()
  const result = db.prepare('INSERT INTO courses (name, experiment_type, experiment_image, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(name, experiment_type, experiment_image, description, now, now)
  res.json({ code: 0, data: { id: result.lastInsertRowid } })
})

// 编辑
router.put('/:id', (req, res) => {
  const { name, experiment_type, experiment_image, description } = req.body
  const now = new Date().toISOString()
  db.prepare('UPDATE courses SET name=?, experiment_type=?, experiment_image=?, description=?, updated_at=? WHERE id=?')
    .run(name, experiment_type, experiment_image, description, now, req.params.id)
  res.json({ code: 0 })
})

// 删除
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM courses WHERE id=?').run(req.params.id)
  res.json({ code: 0 })
})

// 全量列表（供项目新增时多选用）
router.get('/all', (req, res) => {
  const list = db.prepare('SELECT id, name, experiment_type FROM courses ORDER BY id').all()
  res.json({ code: 0, data: list })
})

module.exports = router
```

注意：`/all` 路由要在 `/:id` 之前不会有冲突，因为 GET `/all` 没有数字参数，但需要把 `/all` 放在 `router.get('/:id', ...)` 前面，或者这里不定义 `/:id` 的 GET 路由（前端不需要单独课程详情）。

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: add courses CRUD API with pagination"
```

---

## Task 5: 产品 CRUD API

**Files:**
- Create: `server/routes/products.js`

- [ ] **Step 1: 实现产品增删改查分页接口**

与课程类似，字段不同。路径：`/api/products`，包含分页查询、新增、编辑、删除、全量列表。

表单字段：name, install_path, install_manual_path, usage_manual_path, verification_path

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: add products CRUD API with pagination"
```

---

## Task 6: 项目 CRUD API + 简介

**Files:**
- Create: `server/routes/projects.js`

- [ ] **Step 1: 实现项目增删改查接口**

关键点：
- 新增时同时写入 project_products 和 project_courses 关联表
- 新增时从 lifecycle_templates 复制模板到 project_lifecycle + lifecycle_checks
- 查询详情时 JOIN 关联表返回 products 和 courses
- 删除时级联删除关联表和生命周期数据

GET `/` — 分页查询项目列表
GET `/:id` — 项目详情（含关联产品和课程）
POST `/` — 新增项目（含关联 + 生命周期初始化）
PUT `/:id` — 编辑项目
DELETE `/:id` — 删除项目
GET `/:id/summary` — 项目简介数据

新增项目的核心逻辑：
```javascript
// 事务处理
const transaction = db.transaction(() => {
  // 1. 插入项目
  const projectResult = db.prepare('INSERT INTO projects (...) VALUES (...)').run(...)

  // 2. 关联产品
  const insertProduct = db.prepare('INSERT INTO project_products (project_id, product_id) VALUES (?, ?)')
  product_ids.forEach(pid => insertProduct.run(projectResult.lastInsertRowid, pid))

  // 3. 关联课程
  const insertCourse = db.prepare('INSERT INTO project_courses (project_id, course_id) VALUES (?, ?)')
  course_ids.forEach(cid => insertCourse.run(projectResult.lastInsertRowid, cid))

  // 4. 复制生命周期模板
  const templates = db.prepare('SELECT * FROM lifecycle_templates ORDER BY phase, sort_order').all()
  const insertLC = db.prepare('INSERT INTO project_lifecycle (project_id, phase, step_name, sort_order) VALUES (?, ?, ?, ?)')
  const insertCheck = db.prepare('INSERT INTO lifecycle_checks (project_lifecycle_id, check_content, is_passed, sort_order) VALUES (?, ?, NULL, ?)')

  templates.forEach(t => {
    const lcResult = insertLC.run(projectResult.lastInsertRowid, t.phase, t.step_name, t.sort_order)
    const items = JSON.parse(t.check_items_json)
    items.forEach((content, idx) => {
      insertCheck.run(lcResult.lastInsertRowid, content, idx)
    })
  })
})
transaction()
```

GET `/:id/summary` 返回：
```javascript
{
  project: { name, deploy_method, is_kvm, is_eve, ... },
  products: [{ name, install_path, install_manual_path, usage_manual_path, verification_path }],
  courses: [{ name, experiment_type, experiment_image, description }]
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: add projects CRUD API with lifecycle initialization"
```

---

## Task 7: 生命周期 API

**Files:**
- Create: `server/routes/lifecycle.js`

- [ ] **Step 1: 实现生命周期查询和更新接口**

```
GET /api/lifecycle/project/:projectId  — 获取项目生命周期数据（按阶段分组）
PUT /api/lifecycle/checks/:id          — 更新检查项状态 { is_passed: boolean }
PUT /api/lifecycle/notes/:projectLifecycleId  — 更新子项备注 { content: string }
GET /api/lifecycle/project/:projectId/progress — 获取进度概览（各阶段完成比例）
```

GET `project/:projectId` 返回格式：
```javascript
{
  startup: [
    {
      id, phase, step_name, sort_order,
      checks: [{ id, check_content, is_passed, sort_order }],
      notes: "富文本内容"
    }
  ],
  planning: [...],
  execution: [...],
  monitoring: [...],
  closure: [...]
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: add lifecycle API for checks and notes"
```

---

## Task 8: 前端路由 + 布局 + 认证守卫

**Files:**
- Create: `src/router/index.ts`
- Create: `src/stores/user.ts`
- Create: `src/api/request.ts`
- Create: `src/components/AdminLayout.vue`

- [ ] **Step 1: 创建 axios 封装 `src/api/request.ts`**

```typescript
import axios from 'axios'
import router from '../router'

const request = axios.create({ baseURL: '/api' })

request.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

request.interceptors.response.use(
  res => res.data,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      router.push('/admin/login')
    }
    return Promise.reject(err)
  }
)

export default request
```

- [ ] **Step 2: 创建 Pinia user store `src/stores/user.ts`**

```typescript
import { defineStore } from 'pinia'
import request from '../api/request'

export const useUserStore = defineStore('user', {
  state: () => ({ token: localStorage.getItem('token') || '' }),
  getters: { isLoggedIn: state => !!state.token },
  actions: {
    async login(username: string, password: string) {
      const res = await request.post('/auth/login', { username, password })
      if (res.code === 0) {
        this.token = res.data.token
        localStorage.setItem('token', res.data.token)
      }
      return res
    },
    logout() {
      this.token = ''
      localStorage.removeItem('token')
    }
  }
})
```

- [ ] **Step 3: 创建路由 `src/router/index.ts`**

路由配置：
- `/admin/login` → Login.vue
- `/admin/courses` → CourseManage.vue
- `/admin/products` → ProductManage.vue
- `/admin/projects` → ProjectManage.vue
- `/kanban` → KanbanBoard.vue

管理端路由使用 AdminLayout 作为布局组件，带导航守卫检查 token。
看板路由无守卫。

- [ ] **Step 4: 创建 AdminLayout.vue**

左侧 Naive UI Menu 侧边栏，包含：
- Logo/标题
- 课程管理
- 产品管理
- 项目管理
- 退出登录按钮

右侧 `<router-view />`

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add router, auth guard, and admin layout"
```

---

## Task 9: 登录页

**Files:**
- Create: `src/views/admin/Login.vue`
- Create: `src/api/auth.ts`

- [ ] **Step 1: 创建 API `src/api/auth.ts`**

```typescript
import request from './request'
export const loginApi = (username: string, password: string) =>
  request.post('/auth/login', { username, password })
```

- [ ] **Step 2: 创建 Login.vue**

居中卡片布局：
- 项目名称标题
- NInput 账号
- NInput 密码
- NButton 登录
- 登录成功跳转 `/admin/projects`

- [ ] **Step 3: 验证登录流程**

启动后端 `node server/index.js`，前端 `npx vite`，测试 admin/admin 登录。

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add login page with auth"
```

---

## Task 10: 课程管理页

**Files:**
- Create: `src/views/admin/CourseManage.vue`
- Create: `src/api/courses.ts`

- [ ] **Step 1: 创建课程 API `src/api/courses.ts`**

```typescript
import request from './request'

export const getCourses = (params: { page: number; pageSize: number; keyword?: string }) =>
  request.get('/courses', { params })

export const createCourse = (data: any) => request.post('/courses', data)
export const updateCourse = (id: number, data: any) => request.put(`/courses/${id}`, data)
export const deleteCourse = (id: number) => request.delete(`/courses/${id}`)
export const getAllCourses = () => request.get('/courses/all')
```

- [ ] **Step 2: 创建 CourseManage.vue**

功能：
- 顶部：NInput 搜索框 + NButton 新增
- NDataTable 分页展示
- 操作列：NButton 编辑 + NButton 删除（NPopconfirm 确认）
- 新增/编辑 NModal 弹窗表单：
  - 课程名称：NInput
  - 实验类型：NSelect（硬件机架/KVM虚拟机/EVE模拟器）
  - 实验镜像：NInput
  - 说明：NInput type="textarea"

- [ ] **Step 3: 验证课程 CRUD**

测试新增、编辑、删除、分页、搜索。

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add course management page with CRUD"
```

---

## Task 11: 产品管理页

**Files:**
- Create: `src/views/admin/ProductManage.vue`
- Create: `src/api/products.ts`

- [ ] **Step 1: 创建产品 API `src/api/products.ts`**

与课程 API 类似，路径为 `/products`。

- [ ] **Step 2: 创建 ProductManage.vue**

与课程管理页结构相同，表单字段：
- 产品名称：NInput
- 安装包位置：NInput
- 安装手册位置：NInput
- 使用手册位置：NInput
- 验收参数位置：NInput

- [ ] **Step 3: 验证产品 CRUD**

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add product management page with CRUD"
```

---

## Task 12: 项目管理页

**Files:**
- Create: `src/views/admin/ProjectManage.vue`
- Create: `src/api/projects.ts`
- Create: `src/components/ProjectCard.vue`

- [ ] **Step 1: 创建项目 API `src/api/projects.ts`**

```typescript
import request from './request'

export const getProjects = (params: { page: number; pageSize: number }) =>
  request.get('/projects', { params })
export const getProject = (id: number) => request.get(`/projects/${id}`)
export const createProject = (data: any) => request.post('/projects', data)
export const updateProject = (id: number, data: any) => request.put(`/projects/${id}`, data)
export const deleteProject = (id: number) => request.delete(`/projects/${id}`)
export const getProjectSummary = (id: number) => request.get(`/projects/${id}/summary`)
```

- [ ] **Step 2: 创建 ProjectCard.vue**

卡片网格组件，每张卡片显示：
- 项目名称（标题）
- NTag 标签：KVM / EVE / 部署方式
- 负责人、售后人员
- 交付时间范围
- 产品数量、课程数量
- 创建时间
- 当前阶段进度条
- 操作按钮：查看简介、项目进展

- [ ] **Step 3: 创建 ProjectManage.vue**

功能：
- 顶部 NButton 新增项目
- 卡片网格展示项目列表（NGrid）
- 点击新增 → NModal 弹窗表单：
  - 项目名称：NInput
  - 产品：NSelect multiple（从 `/products/all` 加载）
  - 课程：NSelect multiple（从 `/courses/all` 加载）
  - 是否KVM：NSwitch
  - 是否EVE：NSwitch
  - 部署方式：NRadioGroup（集中式/分布式）
  - 负责人：NInput
  - 售后人员：NInput
  - 交付开始时间：NDatePicker
  - 交付截止时间：NDatePicker
- 确认后展示项目简介（只读）
- 简介展示：产品详情表格 + 课程详情表格

- [ ] **Step 4: 验证项目新增和简介**

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add project management page with summary"
```

---

## Task 13: 项目进展弹窗（生命周期）

**Files:**
- Create: `src/components/ProjectProgress.vue`
- Create: `src/components/CheckItemList.vue`
- Create: `src/api/lifecycle.ts`

- [ ] **Step 1: 创建生命周期 API `src/api/lifecycle.ts`**

```typescript
import request from './request'

export const getProjectLifecycle = (projectId: number) =>
  request.get(`/lifecycle/project/${projectId}`)
export const updateCheck = (id: number, is_passed: boolean) =>
  request.put(`/lifecycle/checks/${id}`, { is_passed })
export const updateNotes = (projectLifecycleId: number, content: string) =>
  request.put(`/lifecycle/notes/${projectLifecycleId}`, { content })
```

- [ ] **Step 2: 创建 CheckItemList.vue**

可折叠面板（NCollapseItem），每个子项包含：
- 子项名称 + 进度统计（如 3/5 已通过）
- 展开后：检查项列表，每项 NCheckbox 或 NButton 勾选通过/不通过
- 底部：wangeditor 富文本备注框
- 自动保存：勾选变化和备注变化时调用 API 更新

- [ ] **Step 3: 创建 ProjectProgress.vue**

NTabs 组件，5个 NTabPane：
- 项目启动
- 项目规划
- 项目执行
- 项目监控
- 项目收尾

每个 TabPane 内：NCollapse 包含该阶段所有子项的 CheckItemList。

顶部显示整体进度：NProgress 组件。

- [ ] **Step 4: 集成到 ProjectManage.vue**

在 ProjectCard 的操作按钮中添加"项目进展"按钮，点击后打开 NModal 显示 ProjectProgress。

- [ ] **Step 5: 验证生命周期操作**

测试勾选检查项、编辑备注、切换阶段 tab。

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add project progress dialog with lifecycle tracking"
```

---

## Task 14: 看板端页面

**Files:**
- Create: `src/views/kanban/KanbanBoard.vue`
- Create: `src/components/LifecycleTimeline.vue`

- [ ] **Step 1: 创建 LifecycleTimeline.vue**

纵向时间线组件（使用 Naive UI NTimeline 或自定义 CSS）：

5个阶段节点按顺序排列，每个节点：
- 阶段名称 + 完成进度（如 2/8）
- 展开后显示子项列表
- 每个子项：名称 + 检查项状态（绿色✓/红色✗/灰色○）
- 备注内容（富文本渲染为 HTML）

Props:
```typescript
interface Props {
  data: Record<Phase, ProjectLifecycle[]>
  projectInfo: Project
}
```

- [ ] **Step 2: 创建 KanbanBoard.vue**

- 无需登录，直接访问 `/kanban`
- 顶部：NSelect 下拉选择项目（从 `/api/projects` 获取列表，无需认证）
- 下方：LifecycleTimeline 组件
- 选择项目后加载生命周期数据
- 只读展示，无编辑操作

注意：看板端 API 需要在后端添加无需认证的公开接口：
- `GET /api/projects/public` — 获取项目列表（仅 id + name）
- `GET /api/lifecycle/project/:projectId/public` — 获取生命周期数据

这两个接口不使用 authMiddleware。

- [ ] **Step 3: 验证看板端**

选择项目，查看时间线数据。

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add kanban board with timeline view"
```

---

## Task 15: 整体联调 + 优化

**Files:**
- Modify: `package.json` (添加 scripts)
- Modify: `server/index.js` (生产环境配置)

- [ ] **Step 1: 添加 package.json scripts**

```json
{
  "scripts": {
    "dev": "concurrently \"vite\" \"node server/index.js\"",
    "dev:front": "vite",
    "dev:server": "node server/index.js",
    "build": "vue-tsc && vite build",
    "start": "node server/index.js"
  }
}
```

安装 concurrently：`npm install -D concurrently`

- [ ] **Step 2: 全流程测试**

1. `npm run dev` 启动
2. 访问 `/admin/login`，admin/admin 登录
3. 课程管理：查看种子数据、新增、编辑、删除、搜索分页
4. 产品管理：同上
5. 项目管理：新增项目、查看简介、项目卡片展示
6. 项目进展：打开生命周期弹窗、勾选检查项、编辑备注
7. 访问 `/kanban`：选择项目、查看时间线

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: complete project management system"
```

---

## Spec Coverage Check

| 需求 | 对应 Task |
|------|-----------|
| Vue 3 + TS + Naive UI + Vite | Task 1 |
| Node.js + SQLite | Task 2 |
| 登录页 admin/admin | Task 3, 9 |
| 课程管理 CRUD + 分页 | Task 4, 10 |
| 产品管理 CRUD + 分页 | Task 5, 11 |
| 项目管理 CRUD + 简介 + 卡片 | Task 6, 12 |
| 生命周期 5 阶段 tab + 检查清单 + 富文本 | Task 7, 13 |
| 看板端只读时间线 | Task 14 |
| 种子数据导入（课程19门 + 产品9个） | Task 2 |
| 生命周期模板（Excel SOP 映射） | Task 2, 7 |
| 全流程联调 | Task 15 |
## 变更记录

### 2026-05-22 分页总数显示修复

- 修复范围：`src/views/admin/CourseManage.vue`、`src/views/admin/ProductManage.vue`。
- 根因：`remote: true` 写入了分页配置对象，Naive UI DataTable 未启用远程分页，导致分页器按当前页 `data.length=10` 计算总数。
- 执行：将 `remote` 作为 `n-data-table` 组件属性，并移除分页对象里的无效 `remote` 字段。
- 构建验证调整：当前 TypeScript 6 环境下，`tsconfig.json` 增加 `ignoreDeprecations: "6.0"`，并移除不必要的 `tsconfig.node.json` project reference。
- 类型验证调整：补充 `@wangeditor/editor-for-vue` 与 `window.$message` 声明，并移除 `LifecycleDialog.vue` 未使用代码。
- 验收：后端返回 `total=20`、`pageSize=10` 时，分页器显示 `共 20 条` 且第 2 页可点击。

### 2026-05-22 分页控件中文化

- 修复范围：`src/App.vue`。
- 执行：在 Naive UI `n-config-provider` 上配置 `zhCN` 和 `dateZhCN`。
- 验收：分页器内置英文文案 `page`、`Goto` 改为中文显示。

### 2026-05-22 课程实验类型修复与主题切换

- 修复范围：`server/db.js`、`data.db`、`src/stores/theme.ts`、`src/App.vue`、`src/components/Layout/AdminLayout.vue`。
- 数据修复：将 `网络安全设备配置与管理` 规范为 `eve,hardware_rack,kvm`，将 `以太网络全光技术` 规范为 `hardware_rack,kvm`。
- 持久化策略：`server/db.js` 在服务启动时执行幂等规范化，保证已有数据库和新初始化数据库一致。
- 主题功能：新增 Pinia theme store，管理 Naive UI 明暗主题并写入 `localStorage`。
- 交互入口：管理端顶部用户栏增加 `更换主题` 按钮。

### 2026-05-22 系统按钮图标优化

- 修复范围：`src/views/admin/CourseManage.vue`、`src/views/admin/ProductManage.vue`、`src/views/admin/ProjectManage.vue`、`src/views/admin/Login.vue`、`src/components/Layout/AdminLayout.vue`。
- 执行：基于已有 `@vicons/ionicons5` 为常用按钮增加语义图标。
- 图标映射：新增 `AddOutline`、搜索 `SearchOutline`、编辑 `CreateOutline`、删除 `TrashOutline`、项目简介 `DocumentTextOutline`、项目进展 `TrendingUpOutline`、登录 `LogInOutline`、退出登录 `LogOutOutline`、更换主题 `ColorPaletteOutline`。
- 验收：按钮文字保留，图标只增强识别，不替代文字。

### 2026-05-22 左侧菜单图标与登录背景

- 修复范围：`src/components/Layout/AdminLayout.vue`、`src/views/admin/Login.vue`、`src/assets/login-bg.svg`。
- 执行：系统名称使用 `AppsOutline`，左侧菜单使用 `SchoolOutline`、`CubeOutline`、`FolderOpenOutline`。
- 登录页：新增本地 SVG 背景，并通过 scoped CSS 引用。
- 验收：菜单、系统名称、登录页背景均完成视觉增强，构建通过。

### 2026-05-22 项目表单字段顺序与部署方式显示

- 修复范围：`src/views/admin/ProjectManage.vue`。
- 执行：项目表单字段顺序调整为项目名称、所需产品、所需课程、EVE实验、KVM实验、部署方式。
- 条件显示：部署方式字段使用 `v-if="formData.is_eve || formData.is_kvm"`，仅在 EVE/KVM 任意一个开启时显示。
- 兼容策略：部署方式默认值仍保留为 `centralized`，隐藏时不清空，避免影响后端字段约束和历史数据。

### 2026-05-22 项目简介弹窗Tab化与字段返显修复

- 修复范围：`src/views/admin/ProjectManage.vue`。
- 根因：项目简介接口返回扁平结构，前端错误按 `summaryData.project` 嵌套对象读取，导致项目名称、负责人、售后人员为空。
- 执行：基本信息字段改为读取 `summaryData.name`、`summaryData.responsible_person`、`summaryData.after_sales_person`。
- 交互：项目简介弹窗改为 `基本信息 / 交付产品 / 交付课程` 三个 Tab。
- 展示：交付课程实验类型支持多值中文格式化。

### 2026-05-22 项目编辑返显与弹窗样式修复

- 修复范围：`src/views/admin/ProjectManage.vue`、`src/components/LifecycleDialog.vue`。
- 项目简介样式：产品/课程描述表格左侧 label 列设置 `white-space: nowrap`。
- 编辑返显：点击编辑时调用 `GET /api/projects/:id`，从详情中的 `products[].id`、`courses[].id` 回填多选字段。
- 类型回填：`is_eve`、`is_kvm` 转为 boolean，确保 Naive UI Switch 正确显示。
- 进展弹窗：`n-modal` 增加内容区最大高度和 `overflowY: auto`，避免多折叠项展开时溢出。
- 富文本：编辑器容器宽度稳定，工具栏允许换行。

### 2026-05-22 富文本保存与项目卡片分页优化

- 修复范围：`src/components/LifecycleDialog.vue`、`src/views/admin/ProjectManage.vue`。
- 富文本保存：维护 `savedHtml` 快照，`onChange` 时规范化 HTML 并与快照比较，内容无变化不保存。
- 保存提示：保存成功后提示 `保存成功`，同时更新快照。
- 备注分割线：去掉分割线上的 `备注` 文案。
- 项目卡片：新增浅蓝毛玻璃样式、hover 上浮、柔和阴影和微光边框。
- 项目分页：改用 `item-count`、`page-size`、`page-sizes`、`prefix`、`show-size-picker`、`show-quick-jumper`，与课程/产品管理分页体验统一。

### 2026-05-22 富文本保存策略二次优化（降低提示噪音）

- 修复范围：`src/components/LifecycleDialog.vue`。
- 根因：此前保存触发点与输入事件绑定过紧，导致编辑过程中出现高频保存提示，影响录入体验。
- 执行：
  - 引入 `savedHtml`、`pendingHtml`、`dirtyMap`、`savingMap` 四组状态，改为“脏数据驱动保存”。
  - `onChange` 仅更新脏状态，不直接触发接口调用。
  - `onBlur` 触发显式保存（提示 `保存成功`）。
  - 折叠切换、Tab 切换、弹窗关闭、组件卸载时统一执行静默保存（不提示）。
- 验收：
  - 输入过程中不再频繁弹出保存成功提示。
  - 内容未变化时不调用保存接口。
  - 用户离开当前编辑上下文前，修改内容可自动持久化。

### 2026-05-22 管理端浅蓝风格与主题方案优化

- 修复范围：`src/stores/theme.ts`、`src/App.vue`、`src/components/Layout/AdminLayout.vue`、`src/views/admin/ProjectManage.vue`、`src/components/LifecycleDialog.vue`。
- 设计依据：使用 `ui-ux-pro-max` 与 `example-skills:frontend-design`，将后台定位为清爽、可扫描、贴合项目管理场景的浅蓝工作台。
- 主题方案：
  - 移除原黑色主题，避免与页面局部浅色样式不兼容。
  - 改为 `ocean/classic` 两个浅色主题，并通过 Naive UI `themeOverrides` 统一主色、状态色和圆角。
- 页面风格：
  - 管理端布局增加浅蓝渐变背景、轻量网格纹理、玻璃质感侧边栏和顶部栏。
  - 项目卡片改为浅蓝毛玻璃卡片，包含顶部光带、柔和阴影和 hover 上浮动效。
- 富文本：
  - 项目进展弹窗加宽到 `1040px`。
  - 富文本编辑器高度提升到 `340px`，移动端为 `260px`，满足至少 10 行备注录入。
- 验收：`npm run build` 通过，`http://localhost:3000/admin/projects` 返回 200。
