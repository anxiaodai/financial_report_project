<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import CommonTable from '@/components/CommonTable.vue'
import type { Column, Pagination, Template } from '@/types'
import { getTemplateList, deleteTemplate, batchDeleteTemplate, copyTemplate } from '@/api/template'

const router = useRouter()

const loading = ref(false)
const tableData = ref<Template[]>([])
const selectedRows = ref<Template[]>([])
const pagination = reactive<Pagination>({
  currentPage: 1,
  pageSize: 10,
  total: 0,
  pageSizes: [10, 20, 50, 100]
})

const searchForm = reactive({
  keyword: '',
  reportType: ''
})

const reportTypeOptions = [
  { label: '全部', value: '' },
  { label: '资产负债表', value: '资产负债表' },
  { label: '利润表', value: '利润表' },
  { label: '现金流量表', value: '现金流量表' },
  { label: '自定义', value: '自定义' }
]

const columns: Column[] = [
  { prop: 'templateCode', label: '模板编码', minWidth: '160' },
  { prop: 'templateName', label: '模板名称', minWidth: '150' },
  { prop: 'reportType', label: '报表类型', minWidth: '120' },
  { prop: 'orgRange', label: '适用组织', minWidth: '120' },
  { prop: 'indicatorCount', label: '指标数量', width: '90' },
  { prop: 'version', label: '版本', width: '70' },
  { prop: 'status', label: '状态', width: '80', formatter: (row) => row.status === 1 ? '启用' : '禁用' },
  { prop: 'createTime', label: '创建时间', minWidth: '160' }
]

const loadData = async () => {
  loading.value = true
  try {
    const res = await getTemplateList({
      page: pagination.currentPage,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword,
      reportType: searchForm.reportType
    })
    tableData.value = res.data.list
    pagination.total = res.data.total
  } catch (error) {
    console.error('加载失败', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.currentPage = 1
  loadData()
}

const handleReset = () => {
  searchForm.keyword = ''
  searchForm.reportType = ''
  pagination.currentPage = 1
  loadData()
}

const handlePageChange = (page: number) => {
  pagination.currentPage = page
  loadData()
}

const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.currentPage = 1
  loadData()
}

const handleSelectionChange = (selection: Template[]) => {
  selectedRows.value = selection
}

const handleAdd = () => {
  router.push('/template/config')
}

const handleEdit = (row: Template) => {
  router.push(`/template/config/${row.id}`)
}

const handleCopy = async (row: Template) => {
  try {
    await copyTemplate(row.id!)
    ElMessage.success('复制成功')
    loadData()
  } catch (error) {
    console.error('复制失败', error)
  }
}

const handleDelete = async (row: Template) => {
  try {
    await ElMessageBox.confirm('确认删除该模板吗？', '提示', { type: 'warning' })
    await deleteTemplate(row.id!)
    ElMessage.success('删除成功')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const handleBatchDelete = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请选择要删除的数据')
    return
  }
  try {
    await ElMessageBox.confirm(`确认删除选中的 ${selectedRows.value.length} 条模板吗？`, '提示', { type: 'warning' })
    const ids = selectedRows.value.map(row => row.id!)
    await batchDeleteTemplate(ids)
    ElMessage.success('批量删除成功')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量删除失败')
    }
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="page-container">
    <el-breadcrumb separator="/">
      <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item>模板配置</el-breadcrumb-item>
    </el-breadcrumb>

    <div class="page-header">
      <h2>模板配置</h2>
      <div class="header-actions">
        <el-button type="danger" :disabled="selectedRows.length === 0" @click="handleBatchDelete">
          批量删除
        </el-button>
        <el-button type="primary" @click="handleAdd">新增模板</el-button>
      </div>
    </div>

    <div class="card-container search-container">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="请输入模板编码或名称"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="报表类型">
          <el-select v-model="searchForm.reportType" placeholder="请选择" clearable>
            <el-option
              v-for="item in reportTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="card-container">
      <CommonTable
        :columns="columns"
        :data="tableData"
        :loading="loading"
        :pagination="pagination"
        show-selection
        @page-change="handlePageChange"
        @size-change="handleSizeChange"
        @selection-change="handleSelectionChange"
      >
        <template #actions="{ row }">
          <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
          <el-button type="success" link @click="handleCopy(row)">复制</el-button>
          <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
        </template>
      </CommonTable>
    </div>
  </div>
</template>

<style scoped lang="scss">
.page-container {
  .el-breadcrumb {
    margin-bottom: 16px;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    h2 {
      font-size: 18px;
      font-weight: 500;
      color: #303133;
      margin: 0;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }
  }

  .search-container {
    margin-bottom: 16px;

    .el-form-item {
      margin-bottom: 0;
    }
  }
}
</style>
