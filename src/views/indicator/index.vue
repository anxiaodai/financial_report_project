<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import CommonTable from '@/components/CommonTable.vue'
import type { Column, Pagination, Indicator } from '@/types'
import { getIndicatorList, deleteIndicator, batchDeleteIndicator } from '@/api/indicator'

const router = useRouter()

const loading = ref(false)
const tableData = ref<Indicator[]>([])
const selectedRows = ref<Indicator[]>([])
const pagination = reactive<Pagination>({
  currentPage: 1,
  pageSize: 10,
  total: 0,
  pageSizes: [10, 20, 50, 100]
})

const searchForm = reactive({
  keyword: '',
  status: ''
})

const statusOptions = [
  { label: '全部', value: '' },
  { label: '启用', value: 1 },
  { label: '禁用', value: 0 }
]

const columns: Column[] = [
  { prop: 'indicatorCode', label: '指标编码', minWidth: '140' },
  { prop: 'indicatorName', label: '指标名称', minWidth: '140' },
  { prop: 'dbSource', label: '数据来源', minWidth: '120' },
  { prop: 'tableName', label: '数据表', minWidth: '150' },
  { prop: 'fieldName', label: '数据字段', minWidth: '120' },
  { prop: 'calcType', label: '计算类型', width: '100' },
  { prop: 'status', label: '状态', width: '80', formatter: (row) => row.status === 1 ? '启用' : '禁用' },
  { prop: 'createTime', label: '创建时间', minWidth: '160' }
]

const loadData = async () => {
  loading.value = true
  try {
    const res = await getIndicatorList({
      page: pagination.currentPage,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword,
      status: searchForm.status
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
  searchForm.status = ''
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

const handleSelectionChange = (selection: Indicator[]) => {
  selectedRows.value = selection
}

const handleAdd = () => {
  router.push('/indicator/config')
}

const handleEdit = (row: Indicator) => {
  router.push(`/indicator/config/${row.id}`)
}

const handleDelete = async (row: Indicator) => {
  try {
    await ElMessageBox.confirm('确认删除该指标吗？', '提示', { type: 'warning' })
    await deleteIndicator(row.id!)
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
    await ElMessageBox.confirm(`确认删除选中的 ${selectedRows.value.length} 条指标吗？`, '提示', { type: 'warning' })
    const ids = selectedRows.value.map(row => row.id!)
    await batchDeleteIndicator(ids)
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
      <el-breadcrumb-item>指标配置</el-breadcrumb-item>
    </el-breadcrumb>

    <div class="page-header">
      <h2>指标配置</h2>
      <div class="header-actions">
        <el-button type="danger" :disabled="selectedRows.length === 0" @click="handleBatchDelete">
          批量删除
        </el-button>
        <el-button type="primary" @click="handleAdd">新增指标</el-button>
      </div>
    </div>

    <div class="card-container search-container">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="请输入指标编码或名称"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择" clearable>
            <el-option
              v-for="item in statusOptions"
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
