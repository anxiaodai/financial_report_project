<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const menuItems = [
  { path: '/indicator', title: '指标配置', icon: 'DataAnalysis' },
  { path: '/process', title: '指标加工', icon: 'Setting' },
  { path: '/template', title: '模板配置', icon: 'Document' },
  { path: '/report', title: '报表生成', icon: 'PieChart' }
]

const selectedPath = ref(route.path.startsWith('/indicator') ? '/indicator' : 
                         route.path.startsWith('/process') ? '/process' :
                         route.path.startsWith('/template') ? '/template' : '/report')

const handleMenuSelect = (path: string) => {
  router.push(path)
}
</script>

<template>
  <el-container class="layout-container">
    <el-aside width="200px">
      <div class="logo">财务报表系统</div>
      <el-menu
        :default-active="selectedPath"
        router
        @select="handleMenuSelect"
      >
        <el-menu-item v-for="item in menuItems" :key="item.path" :index="item.path">
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.title }}</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-main>
        <RouterView />
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped lang="scss">
.layout-container {
  height: 100vh;

  .el-aside {
    background-color: #304156;
    color: #fff;

    .logo {
      height: 60px;
      line-height: 60px;
      text-align: center;
      font-size: 18px;
      font-weight: 500;
      color: #fff;
      background-color: #2b3a4a;
    }

    :deep(.el-menu) {
      border-right: none;
      background-color: #304156;

      .el-menu-item {
        color: #bfcbd9;

        &:hover {
          background-color: #263445;
          color: #fff;
        }

        &.is-active {
          background-color: #409eff !important;
          color: #fff;
        }
      }
    }
  }

  .el-main {
    background-color: #f5f7fa;
    padding: 0;
  }
}
</style>
