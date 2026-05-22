const initSqlJs = require('sql.js')
const fs = require('fs')
const path = require('path')

const DB_PATH = path.join(__dirname, '..', 'data.db')

let db = null

async function initDB() {
  const SQL = await initSqlJs()

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH)
    db = new SQL.Database(buffer)
  } else {
    db = new SQL.Database()
  }

  createTables()
  seedData()
  normalizeCourseData()
  saveDB()
}

function saveDB() {
  const data = db.export()
  const buffer = Buffer.from(data)
  fs.writeFileSync(DB_PATH, buffer)
}

function getDB() {
  return db
}

function createTables() {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    );
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      experiment_type TEXT NOT NULL,
      experiment_image TEXT DEFAULT '',
      description TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      install_path TEXT DEFAULT '',
      install_manual_path TEXT DEFAULT '',
      usage_manual_path TEXT DEFAULT '',
      verification_path TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      is_kvm INTEGER DEFAULT 0,
      is_eve INTEGER DEFAULT 0,
      deploy_method TEXT DEFAULT 'centralized',
      responsible_person TEXT DEFAULT '',
      after_sales_person TEXT DEFAULT '',
      delivery_start_date TEXT DEFAULT '',
      delivery_end_date TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS project_products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS project_courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id),
      FOREIGN KEY (course_id) REFERENCES courses(id)
    );
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS lifecycle_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phase TEXT NOT NULL,
      step_name TEXT NOT NULL,
      check_items_json TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0
    );
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS project_lifecycle (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      phase TEXT NOT NULL,
      step_name TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (project_id) REFERENCES projects(id)
    );
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS lifecycle_checks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_lifecycle_id INTEGER NOT NULL,
      check_content TEXT NOT NULL,
      is_passed INTEGER DEFAULT NULL,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (project_lifecycle_id) REFERENCES project_lifecycle(id)
    );
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS lifecycle_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_lifecycle_id INTEGER NOT NULL UNIQUE,
      content TEXT DEFAULT '',
      FOREIGN KEY (project_lifecycle_id) REFERENCES project_lifecycle(id)
    );
  `)
}

function seedData() {
  // Check if seed data already exists
  const result = db.exec("SELECT COUNT(*) as cnt FROM users")
  const userCount = result.length > 0 ? result[0].values[0][0] : 0
  if (userCount > 0) return

  // 1. Seed user
  db.run("INSERT INTO users (username, password) VALUES ('admin', 'admin')")

  // 2. Seed courses
  const courses = [
    { name: '大中企业网络构建', type: 'hardware_rack', image: '无', desc: '满足所有硬件机架实训，每组需要2台二层交换机、2台三层交换机、2台路由器、2台配备对应供电模块的AP' },
    { name: '中小企业网络构建', type: 'hardware_rack', image: '无', desc: '满足所有硬件机架实训，每组需要3台二层交换机、2台三层交换机、2台路由器' },
    { name: '无线网络技术', type: 'hardware_rack', image: '无', desc: '满足所有硬件机架实训，每组需要3台二层交换机、2台三层交换机、2台路由器' },
    { name: 'Windows服务管理与配置', type: 'kvm', image: 'Windows.qcow2', desc: '满足所有KVM环境实训，每组需要20线程，20G内存（每台设备4线程4G内存）' },
    { name: 'Linux系统管理与服务', type: 'kvm', image: 'rhel9.qcow2', desc: '满足所有KVM环境实训，每组需要16线程，16G内存（每台设备4线程4G内存）' },
    { name: '高级路由交换技术', type: 'eve', image: 'Ruijieroute-1.0、Ruijieswitch-1.0', desc: '满足所有EVE环境实训，每组需要5线程，10G内存（每台设备1线程2G内存）' },
    { name: '初级路由交换技术', type: 'eve', image: 'Ruijieroute-1.0、Ruijieswitch-1.0', desc: '满足所有EVE环境实训，每组需要7线程，14G内存（每台设备1线程2G内存）' },
    { name: 'IPv6网络技术与应用', type: 'eve', image: 'Ruijieroute-1.0、Ruijieswitch-1.0', desc: '满足所有EVE环境实训，每组需要6线程，12G内存（每台设备1线程2G内存）' },
    { name: 'SDN技术与应用', type: 'kvm', image: 'SDN-server.qcow2、ryu.qcow2、mininet.qcow2、onos.qcow2、Cbench.qcow2', desc: '满足所有KVM环境实训，每组需要12线程，12G内存（每台设备4线程4G内存）' },
    { name: '锐捷SDN技术应用实践', type: 'hardware_rack', image: 'SDN-server.qcow2', desc: '无' },
    { name: '以太网络全光技术', type: 'hardware_rack,kvm', image: 'Ubuntu-22.04.3-live-server.iso', desc: '1.满足所有硬件机架实训，每组需要2台二层交换机、1台模块化8口透明汇聚、2台接入测千兆采光模块、2台三层交换机、1台透明汇聚光裂变器扩展模块、2台核心侧SFG千兆超聚合彩光模块、1台虚拟Linux、1台服务器、2台拓展模块\n2.满足所有KVM环境实训，每组需要4线程，4G内存（每台设备4线程4G内存）' },
    { name: '网络自动化运维', type: 'eve', image: 'Ruijieroute-1.0、Ruijieswitch-1.0、linux-ubuntu', desc: '满足所有EVE环境实训，每组需要8线程，16G内存（每台网络设备1线程2G内存/每台服务设备4线程4G内存）' },
    { name: '网络安全设备配置与管理', type: 'eve,hardware_rack,kvm', image: 'Ruijiefirewall-V1.03、win-10、EG3210 V2、pfsenseInsiso.iso、windows7.qcow2、pfsense-2.7.2、linux-Center、Ruijieroute-1.0、Ruijieswitch-1.0、linux-JumpServer', desc: '满足所有EVE环境实训，每组需要23线程，26G内存（每台网络设备1线程2G内存/每台服务设备4线程4G内存）' },
    { name: '云计算基础技术与部署', type: 'kvm', image: 'openstack-yw.qcow2', desc: '满足所有KVM环境实训，每组需要20线程，20G内存（设备8线程8G内存和2线程2G内存）' },
    { name: '智慧运维管理平台实战', type: 'hardware_rack', image: '无', desc: '满足所有KVM环境实训，每组需要20线程，20G内存（设备8线程8G内存和2线程2G内存）' },
    { name: 'WEB渗透测试与分析', type: 'kvm', image: 'windows7.qcow2、Kali-1.qcow2', desc: '满足所有KVM环境实训，每组需要16线程，16G内存（每台设备4线程4G内存）' },
    { name: '网络安全', type: 'kvm', image: 'Kali-1.qcow2、windows7-netsafe.qcow2、metasploitable.qcow2、Kali-1.qcow2', desc: '满足所有KVM环境实训，每组需要12线程，12G内存（每台设备4线程4G内存）' },
    { name: '数据灾备技术（2023版）', type: 'kvm', image: 'Server2016-DataBakup.qcow2', desc: '满足所有KVM环境实训，每组需要8线程，8G内存（每台设备4线程4G内存）' },
    { name: '操作系统安全', type: 'kvm', image: 'WinSer-OSSafe.qcow2', desc: '满足所有KVM环境实训，每组需要8线程，8G内存（每台设备4线程4G内存）' },
    { name: '信息安全-288', type: 'kvm', image: 'SE-Windows7-4.qcow2、SE-Kali-1.qcow2', desc: '无' },
  ]

  for (const c of courses) {
    db.run(
      "INSERT INTO courses (name, experiment_type, experiment_image, description) VALUES (?, ?, ?, ?)",
      [c.name, c.type, c.image, c.desc]
    )
  }

  // 3. Seed products
  const products = [
    { name: '网络教学实验一体化平台（集中式）', install: '教育行业解决方案\\运维部署\\产品交付标准化\\网络产品线\\网络教学实验一体化平台)\\安装包\\集中式', install_manual: '教育行业解决方案\\运维部署\\产品交付标准化\\网络产品线\\网络教学实验一体化平台)\\安装手册\\集中式', usage_manual: '教育行业解决方案\\运维部署\\产品交付标准化\\网络产品线\\网络教学实验一体化平台)\\使用手册\\集中式', verification: '教育行业解决方案\\运维部署\\产品交付标准化\\网络产品线\\网络教学实验一体化平台)\\验收参数\\j集中式' },
    { name: '网络教学实验一体化平台（分布式）', install: '教育行业解决方案\\运维部署\\产品交付标准化\\网络产品线\\网络教学实验一体化平台)\\安装包\\分布式', install_manual: '教育行业解决方案\\运维部署\\产品交付标准化\\网络产品线\\网络教学实验一体化平台)\\安装手册\\分布式', usage_manual: '教育行业解决方案\\运维部署\\产品交付标准化\\网络产品线\\网络教学实验一体化平台)\\使用手册\\分布式', verification: '教育行业解决方案\\运维部署\\产品交付标准化\\网络产品线\\网络教学实验一体化平台)\\验收参数\\分布式' },
    { name: '基础网络机架(全光)', install: '教育行业解决方案\\运维部署\\产品交付标准化\\网络产品线\\基础网络机架(全光)\\安装包', install_manual: '教育行业解决方案\\运维部署\\产品交付标准化\\网络产品线\\基础网络机架(全光)\\安装手册', usage_manual: '教育行业解决方案\\运维部署\\产品交付标准化\\网络产品线\\基础网络机架(全光)\\使用手册', verification: '教育行业解决方案\\运维部署\\产品交付标准化\\网络产品线\\基础网络机架(全光)验收参数' },
    { name: '基础网络机架(乐享)', install: '教育行业解决方案\\运维部署\\产品交付标准化\\网络产品线\\基础网络机架(乐享)\\安装包', install_manual: '教育行业解决方案\\运维部署\\产品交付标准化\\网络产品线\\基础网络机架(乐享)\\安装手册', usage_manual: '教育行业解决方案\\运维部署\\产品交付标准化\\网络产品线\\基础网络机架(乐享)\\使用手册', verification: '教育行业解决方案\\运维部署\\产品交付标准化\\网络产品线\\基础网络机架(乐享)验收参数' },
    { name: '基础网络机架(RCMS)', install: '教育行业解决方案\\运维部署\\产品交付标准化\\网络产品线\\基础网络机架(RCMS)\\安装包', install_manual: '教育行业解决方案\\运维部署\\产品交付标准化\\网络产品线\\基础网络机架(RCMS)\\安装手册', usage_manual: '教育行业解决方案\\运维部署\\产品交付标准化\\网络产品线\\基础网络机架(RCMS)\\使用手册', verification: '教育行业解决方案\\运维部署\\产品交付标准化\\网络产品线\\基础网络机架(RCMS)\\验收参数' },
    { name: 'UNC-AS软件平台', install: '教育行业解决方案\\运维部署\\产品交付标准化\\网络产品线\\UNC-AS软件平台\\安装包', install_manual: '教育行业解决方案\\运维部署\\产品交付标准化\\网络产品线\\UNC-AS软件平台\\安装手册', usage_manual: '教育行业解决方案\\运维部署\\产品交付标准化\\网络产品线\\UNC-AS软件平台\\使用手册', verification: '教育行业解决方案\\运维部署\\产品交付标准化\\网络产品线\\UNC-AS软件平台\\验收参数' },
    { name: 'IT综合运维管理平台(乐享)', install: '教育行业解决方案\\运维部署\\产品交付标准化\\网络产品线\\IT综合运维管理平台(乐享)\\安装包', install_manual: '教育行业解决方案\\运维部署\\产品交付标准化\\网络产品线\\IT综合运维管理平台(乐享)\\安装手册', usage_manual: '教育行业解决方案\\运维部署\\产品交付标准化\\网络产品线\\IT综合运维管理平台(乐享)\\使用手册', verification: '教育行业解决方案\\运维部署\\产品交付标准化\\网络产品线\\IT综合运维管理平台(乐享)\\验收参数' },
    { name: '数字孪生', install: '教育行业解决方案\\运维部署\\产品交付标准化\\数据中心产品线\\数字孪生\\安装包', install_manual: '教育行业解决方案\\运维部署\\产品交付标准化\\数据中心产品线\\数字孪生\\安装手册', usage_manual: '教育行业解决方案\\运维部署\\产品交付标准化\\数据中心产品线\\数字孪生\\使用手册', verification: '教育行业解决方案\\运维部署\\产品交付标准化\\数据中心产品线\\数字孪生\\验收参数' },
    { name: '虚拟仿真客户端', install: '教育行业解决方案\\运维部署\\产品交付标准化\\数据中心产品线\\虚拟仿真客户端\\安装包', install_manual: '教育行业解决方案\\运维部署\\产品交付标准化\\数据中心产品线\\虚拟仿真客户端\\安装手册', usage_manual: '教育行业解决方案\\运维部署\\产品交付标准化\\数据中心产品线\\虚拟仿真客户端\\使用手册', verification: '教育行业解决方案\\运维部署\\产品交付标准化\\数据中心产品线\\虚拟仿真客户端\\验收参数' },
    { name: '智能动环机柜', install: '教育行业解决方案\\运维部署\\产品交付标准化\\数据中心产品线\\智能动环机柜\\安装包', install_manual: '教育行业解决方案\\运维部署\\产品交付标准化\\数据中心产品线\\智能动环机柜\\安装手册', usage_manual: '教育行业解决方案\\运维部署\\产品交付标准化\\数据中心产品线\\智能动环机柜\\使用手册', verification: '教育行业解决方案\\运维部署\\产品交付标准化\\数据中心产品线\\智能动环机柜\\验收参数' },
  ]

  for (const p of products) {
    db.run(
      "INSERT INTO products (name, install_path, install_manual_path, usage_manual_path, verification_path) VALUES (?, ?, ?, ?, ?)",
      [p.name, p.install, p.install_manual, p.usage_manual, p.verification]
    )
  }

  // 4. Seed lifecycle templates
  const lifecycleTemplates = [
    // === 项目启动 (startup) ===
    {
      phase: 'startup', step: '确定交付物', order: 1,
      checks: ['确认标准产品清单（网络产品/数据中心/AI/基础产品）', '确认非标准产品（定制开发）需求范围']
    },
    {
      phase: 'startup', step: '识别干系人', order: 2,
      checks: ['发货申请同步至产研项目组', '发货申请同步至采购', '发货申请同步至售前、售后、部门领导']
    },
    {
      phase: 'startup', step: '现场勘探', order: 3,
      checks: ['销售协调代理渠道安排勘察时间', '检查学校假期因素确认施工窗口期', '检查校园机房网络连通性', '检查机房外网可达性', '检查设备接地是否正常', '检查电源供电及功率', '检查机房安装空间', '检查安全环境']
    },
    {
      phase: 'startup', step: '确认交付周期', order: 4,
      checks: ['确定交付策略（一次性/分批/分阶段）', '输出各产品具体部署时间节点排期表']
    },

    // === 项目规划 (planning) ===
    {
      phase: 'planning', step: '项目评估', order: 1,
      checks: ['评估学校假期对工期影响', '评估校园网限制情况', '评估服务器/网络设备权限获取', '评估设备到货时间及型号匹配风险', '完成风险评估表并提交审批']
    },
    {
      phase: 'planning', step: '制定部署方案', order: 2,
      checks: ['制定课程方案', '制定服务器配置方案', '制定网络设备方案']
    },
    {
      phase: 'planning', step: '进度计划', order: 3,
      checks: ['制定项目排期表，标注关键路径']
    },

    // === 项目执行 (execution) ===
    {
      phase: 'execution', step: '设备采购', order: 1,
      checks: ['关注硬件市场价格波动并反馈', '根据产品交付清单确认BOM清单', '供应商下单并跟踪订单', '确认服务器发往公司时间', '确认硬件设备发往项目现场时间']
    },
    {
      phase: 'execution', step: '准出可交付产品', order: 2,
      checks: ['机柜上架完成', '网络布线完成', 'IP地址配置完成', '网段划分完成', '网络联通测试通过', '平台初始化完成', '账号权限配置完成', '第三方系统对接完成']
    },
    {
      phase: 'execution', step: '实施部署', order: 3,
      checks: ['逐项核对功能正常', '业务流程闭环', '并发测试达标', '响应时间达标', '问题记录并反馈', '问题修复后回归验证']
    },
    {
      phase: 'execution', step: '项目验收', order: 4,
      checks: ['合同范围内所有功能完成', '文档齐全', '已知问题全部关闭', '合同范围核对', '功能演示确认', '数量清点确认', '性能测试确认', '培训完成确认', '文档交付确认', '输出验收单并签字盖章', '管理员培训完成', '教师培训完成', '学生培训完成', '运维人员培训完成']
    },

    // === 项目监控 (monitoring) ===
    {
      phase: 'monitoring', step: '进度跟踪', order: 1,
      checks: ['技术问题远程支持或派驻解决', '方案调整评估后快速响应', '资源协调（开发、测试等）到位']
    },
    {
      phase: 'monitoring', step: '需求变更', order: 2,
      checks: ['收集客户变更需求并输出变更文档']
    },

    // === 项目收尾 (closure) ===
    {
      phase: 'closure', step: '总结报告', order: 1,
      checks: ['梳理高频问题并根因分析', '识别可自动化部署步骤', '评估工期合理性', '评估沟通顺畅度', '评估成本预算执行', '输出项目复盘报告并签字']
    },
    {
      phase: 'closure', step: '经验教训', order: 2,
      checks: ['高频问题纳入知识库', '可优化流程纳入下一版SOP', '优秀实践形成标准模板']
    },
  ]

  for (const t of lifecycleTemplates) {
    db.run(
      "INSERT INTO lifecycle_templates (phase, step_name, check_items_json, sort_order) VALUES (?, ?, ?, ?)",
      [t.phase, t.step, JSON.stringify(t.checks), t.order]
    )
  }
}

function normalizeCourseData() {
  const courseTypeFixes = [
    ['以太网络全光技术', 'hardware_rack,kvm'],
    ['网络安全设备配置与管理', 'eve,hardware_rack,kvm'],
  ]

  for (const [name, experimentType] of courseTypeFixes) {
    db.run(
      'UPDATE courses SET experiment_type = ?, updated_at = CURRENT_TIMESTAMP WHERE name = ?',
      [experimentType, name]
    )
  }
}

module.exports = { initDB, getDB, saveDB }
