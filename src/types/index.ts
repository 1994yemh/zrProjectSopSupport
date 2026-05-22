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
