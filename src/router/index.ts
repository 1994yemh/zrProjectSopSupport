import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/admin/login',
      name: 'Login',
      component: () => import('../views/admin/Login.vue'),
    },
    {
      path: '/admin',
      component: () => import('../components/Layout/AdminLayout.vue'),
      children: [
        { path: '', redirect: '/admin/projects' },
        { path: 'courses', name: 'Courses', component: () => import('../views/admin/CourseManage.vue') },
        { path: 'products', name: 'Products', component: () => import('../views/admin/ProductManage.vue') },
        { path: 'projects', name: 'Projects', component: () => import('../views/admin/ProjectManage.vue') },
      ],
    },
    {
      path: '/kanban',
      name: 'Kanban',
      component: () => import('../views/kanban/KanbanBoard.vue'),
    },
    { path: '/', redirect: '/admin/login' },
  ],
})

router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('token')
  if (to.path.startsWith('/admin') && to.path !== '/admin/login') {
    if (!token) {
      next('/admin/login')
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router
