import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/indicator'
  },
  {
    path: '/indicator',
    name: 'Indicator',
    component: () => import('@/views/indicator/index.vue'),
    children: [
      {
        path: 'config/:id?',
        name: 'IndicatorConfig',
        component: () => import('@/views/indicator/config.vue')
      }
    ]
  },
  {
    path: '/process',
    name: 'Process',
    component: () => import('@/views/process/index.vue'),
    children: [
      {
        path: 'config/:id?',
        name: 'ProcessConfig',
        component: () => import('@/views/process/config.vue')
      }
    ]
  },
  {
    path: '/template',
    name: 'Template',
    component: () => import('@/views/template/index.vue'),
    children: [
      {
        path: 'config/:id?',
        name: 'TemplateConfig',
        component: () => import('@/views/template/config.vue')
      }
    ]
  },
  {
    path: '/report',
    name: 'Report',
    component: () => import('@/views/report/index.vue'),
    children: [
      {
        path: 'create',
        name: 'ReportCreate',
        component: () => import('@/views/report/create.vue')
      },
      {
        path: 'preview/:id',
        name: 'ReportPreview',
        component: () => import('@/views/report/preview.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
