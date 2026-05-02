<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElLoading } from 'element-plus'
import type { Report, ReportData } from '@/types'
import { getReportDetail, getReportData, exportExcel, exportPdf } from '@/api/report'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const report = ref<Report>()
const reportData = ref<ReportData | null>(null)

const formatNumber = (value: number | string | undefined, format?: string): string => {
  if (value === undefined || value === null || value === '') return '-'
  const num = Number(value)
  if (isNaN(num)) return String(value)

  if (format === 'percentage') {
    return (num * 100).toFixed(2) + '%'
  }
  return num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const loadDetail = async () => {
  const id = route.params.id
  if (!id) return

  loading.value = true
  const loadingInstance = ElLoading.service({
    lock: true,
    text: '加载报表数据...',
    background: 'rgba(255, 255, 255, 0.8)'
  })

  try {
    const res = await getReportDetail(Number(id))
    report.value = res.data

    const dataRes = await getReportData(Number(id))
    reportData.value = dataRes.data
  } catch (error) {
    console.error('加载失败', error)
    ElMessage.error('加载报表失败')
  } finally {
    loading.value = false
    loadingInstance.close()
  }
}

const handleExportExcel = async () => {
  if (!report.value?.id) return
  try {
    await exportExcel(report.value.id)
    ElMessage.success('导出Excel成功')
  } catch (error) {
    console.error('导出Excel失败', error)
  }
}

const handleExportPdf = async () => {
  if (!report.value?.id) return
  try {
    await exportPdf(report.value.id)
    ElMessage.success('导出PDF成功')
  } catch (error) {
    console.error('导出PDF失败', error)
  }
}

const handlePrint = () => {
  window.print()
}

const getStatusText = (status: number): string => {
  const statusMap: Record<number, string> = { 0: '生成中', 1: '已完成', 2: '失败' }
  return statusMap[status] || '未知'
}

const getStatusType = (status: number): string => {
  const typeMap: Record<number, string> = { 0: 'warning', 1: 'success', 2: 'danger' }
  return typeMap[status] || 'info'
}

onMounted(() => {
  loadDetail()
})
</script>

<template>
  <div class="page-container">
    <el-breadcrumb separator="/">
      <el-breadcrumb-item :to="{ path: '/report' }">报表生成</el-breadcrumb-item>
      <el-breadcrumb-item>报表预览</el-breadcrumb-item>
    </el-breadcrumb>

    <div class="page-header">
      <div class="header-left">
        <h2>报表预览</h2>
        <el-tag v-if="report" :type="getStatusType(report.status)" style="margin-left: 12px">
          {{ getStatusText(report.status) }}
        </el-tag>
      </div>
      <div class="header-actions">
        <el-button type="success" @click="handleExportExcel">导出Excel</el-button>
        <el-button type="danger" @click="handleExportPdf">导出PDF</el-button>
        <el-button @click="handlePrint">打印</el-button>
        <el-button @click="router.push('/report')">返回</el-button>
      </div>
    </div>

    <div class="report-meta" v-if="report">
      <el-descriptions :column="4" border>
        <el-descriptions-item label="报表名称">{{ report.reportName }}</el-descriptions-item>
        <el-descriptions-item label="模板名称">{{ report.templateName }}</el-descriptions-item>
        <el-descriptions-item label="报表类型">{{ report.reportType }}</el-descriptions-item>
        <el-descriptions-item label="会计期间">{{ report.period }}</el-descriptions-item>
        <el-descriptions-item label="币种">{{ report.currency }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ report.createTime }}</el-descriptions-item>
      </el-descriptions>
    </div>

    <div class="card-container preview-container" v-loading="loading">
      <div class="report-content" v-if="reportData">
        <div class="report-title">
          <h2>{{ reportData.title }}</h2>
          <p>{{ reportData.subtitle }}</p>
        </div>
        <table class="report-table" border="1">
          <thead>
            <tr>
              <th v-for="(header, index) in reportData.headers" :key="index">{{ header }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, rowIndex) in reportData.rows" :key="rowIndex">
              <td
                v-for="(cell, cellIndex) in row.cells"
                :key="cellIndex"
                :class="{ 'is-highlight': cell.isHighlight, 'is-number': cell.value !== undefined }"
                :style="cell.style"
              >
                {{ cell.value !== undefined ? formatNumber(cell.value, cell.format) : cell.content }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <el-empty v-else-if="!loading" description="暂无报表数据" />
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

    .header-left {
      display: flex;
      align-items: center;

      h2 {
        font-size: 18px;
        font-weight: 500;
        color: #303133;
        margin: 0;
      }
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }
  }

  .report-meta {
    margin-bottom: 16px;
  }

  .preview-container {
    min-height: 400px;

    .report-content {
      padding: 24px;
      overflow: auto;

      .report-title {
        text-align: center;
        margin-bottom: 24px;

        h2 {
          font-size: 20px;
          font-weight: 500;
          margin: 0 0 8px 0;
        }

        p {
          color: #909399;
          margin: 0;
        }
      }

      .report-table {
        width: 100%;
        border-collapse: collapse;
        border-color: #ebeef5;

        th, td {
          padding: 10px 12px;
          text-align: left;
          font-size: 14px;
        }

        th {
          background: #f5f7fa;
          font-weight: 500;
          color: #303133;
        }

        td {
          &.is-number {
            text-align: right;
            font-family: 'Courier New', monospace;
          }

          &.is-highlight {
            color: #f56c6c;
            font-weight: 500;
          }
        }

        tbody tr:hover {
          background: #fafafa;
        }
      }
    }
  }
}
</style>
