<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import CommonTable from '@/components/CommonTable.vue'
import type { Column, Pagination, Report, Template, Organization } from '@/types'
import { getReportList, deleteReport, batchDeleteReport, getHistoryList } from '@/api/report'
import { getTemplateByType } from '@/api/template'
import { getOrganizationTree } from '@/api/organization'

const router = useRouter()

const loading = ref(false)
const tableData = ref<Report[]>([])
const selectedRows = ref<Report[]>([])
const pagination = reactive<Pagination>({
  currentPage: 1,
  pageSize: 10,
  total: 0,
  pageSizes: [10, 20, 50, 100]
})

const searchForm = reactive({
  reportType: '',
  templateId: '',
  period: ''
})

const reportTypeOptions = [
  { label: '全部', value: '' },
  { label: '资产负债表', value: '资产负债表' },
  { label: '利润表', value: '利润表' },
  { label: '现金流量表', value: '现金流量表' },
  { label: '自定义', value: '自定义' }
]

const templateList = ref<Template[]>([])
const organizationList = ref<Organization[]>([])

const columns: Column[] = [
  { prop: 'reportName', label: '报表名称', minWidth: '180' },
  { prop: 'templateName', label: '模板名称', minWidth: '140' },
  { prop: 'reportType', label: '报表类型', minWidth: '100' },
  { prop: 'period', label: '会计期间', minWidth: '100' },
  { prop: 'companyNames', label: '公司', minWidth: '150', formatter: (row) => row.companyNames?.join(', ') || '-' },
  { prop: 'status', label: '状态', width: '90', formatter: (row) => {
    const statusMap: Record<number, string> = { 0: '生成中', 1: '已完成', 2: '失败' }
    return statusMap[row.status] || '未知'
  }},
  { prop: 'createTime', label: '创建时间', minWidth: '160' }
]

const loadData = async () => {
  loading.value = true
  try {
    const res = await getReportList({
      page: pagination.currentPage,
      pageSize: pagination.pageSize,
      reportType: searchForm.reportType,
      templateId: searchForm.templateId,
      period: searchForm.period
    })
    tableData.value = res.data.list
    pagination.total = res.data.total
  } catch (error) {
    console.error('加载失败', error)
  } finally {
    loading.value = false
  }
}

const loadTemplates = async () => {
  if (!searchForm.reportType) {
    templateList.value = []
    return
  }
  try {
    const res = await getTemplateByType(searchForm.reportType)
    templateList.value = res.data || []
  } catch (error) {
    console.error('加载模板失败', error)
  }
}

const loadOrganizations = async () => {
  try {
    const res = await getOrganizationTree()
    organizationList.value = res.data || []
  } catch (error) {
    console.error('加载组织失败', error)
  }
}

const handleSearch = () => {
  pagination.currentPage = 1
  loadData()
}

const handleReset = () => {
  searchForm.reportType = ''
  searchForm.templateId = ''
  searchForm.period = ''
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

const handleSelectionChange = (selection: Report[]) => {
  selectedRows.value = selection
}

const handleAdd = () => {
  router.push('/report/create')
}

const handlePreview = (row: Report) => {
  router.push(`/report/preview/${row.id}`)
}

const handleRegenerate = async (row: Report) => {
  router.push(`/report/create?templateId=${row.templateId}&period=${row.period}`)
}

const handleDelete = async (row: Report) => {
  try {
    await ElMessageBox.confirm('确认删除该报表吗？', '提示', { type: 'warning' })
    await deleteReport(row.id!)
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
    await ElMessageBox.confirm(`确认删除选中的 ${selectedRows.value.length} 条报表吗？`, '提示', { type: 'warning' })
    const ids = selectedRows.value.map(row => row.id!)
    await batchDeleteReport(ids)
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
  loadOrganizations()
})
</script>

<template>
  <div class="page-container">
    <el-breadcrumb separator="/">
      <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item>报表生成</el-breadcrumb-item>
    </el-breadcrumb>

    <div class="page-header">
      <h2>报表生成</h2>
      <div class="header-actions">
        <el-button type="danger" :disabled="selectedRows.length === 0" @click="handleBatchDelete">
          批量删除
        </el-button>
        <el-button type="primary" @click="handleAdd">生成报表</el-button>
      </div>
    </div>

    <div class="card-container search-container">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="报表类型">
          <el-select v-model="searchForm.reportType" placeholder="请选择" clearable @change="loadTemplates">
            <el-option
              v-for="item in reportTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="模板">
          <el-select v-model="searchForm.templateId" placeholder="请先选择报表类型" clearable :disabled="!searchForm.reportType">
            <el-option
              v-for="tpl in templateList"
              :key="tpl.id"
              :label="tpl.templateName"
              :value="tpl.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="会计期间">
          <el-date-picker
            v-model="searchForm.period"
            type="month"
            placeholder="选择月份"
            value-format="YYYY-MM"
            clearable
          />
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
          <el-button type="primary" link @click="handlePreview(row)">预览</el-button>
          <el-button type="warning" link @click="handleRegenerate(row)">重新生成</el-button>
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
