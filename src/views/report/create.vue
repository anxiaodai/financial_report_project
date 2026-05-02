<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElLoading } from 'element-plus'
import type { FormInstance } from 'element-plus'
import type { Template, Organization, ReportData, ReportParams } from '@/types'
import { getTemplateList, getTemplateDetail } from '@/api/template'
import { generateReport, getReportData, exportExcel, exportPdf } from '@/api/report'
import { getOrganizationTree } from '@/api/organization'

const router = useRouter()
const route = useRoute()

const formRef = ref<FormInstance>()
const loading = ref(false)
const generating = ref(false)

const reportTypeOptions = [
  { label: '资产负债表', value: '资产负债表' },
  { label: '利润表', value: '利润表' },
  { label: '现金流量表', value: '现金流量表' },
  { label: '自定义', value: '自定义' }
]

const currencyOptions = [
  { label: '人民币 (CNY)', value: 'CNY' },
  { label: '美元 (USD)', value: 'USD' },
  { label: '欧元 (EUR)', value: 'EUR' },
  { label: '日元 (JPY)', value: 'JPY' }
]

const formModel = reactive({
  reportType: '',
  templateId: '',
  period: '',
  companyIds: [] as number[],
  currency: 'CNY'
})

const templateList = ref<Template[]>([])
const organizationList = ref<Organization[]>([])
const selectedTemplate = ref<Template | null>(null)
const reportData = ref<ReportData | null>(null)
const generatedReportId = ref<number>()

const defaultProps = {
  children: 'children',
  label: 'name'
}

const handleReportTypeChange = () => {
  formModel.templateId = ''
  selectedTemplate.value = null
  reportData.value = null
  if (formModel.reportType) {
    loadTemplates()
  } else {
    templateList.value = []
  }
}

const handleTemplateChange = async () => {
  reportData.value = null
  if (!formModel.templateId) {
    selectedTemplate.value = null
    return
  }
  try {
    const res = await getTemplateDetail(Number(formModel.templateId))
    selectedTemplate.value = res.data
  } catch (error) {
    console.error('加载模板详情失败', error)
  }
}

const loadTemplates = async () => {
  if (!formModel.reportType) return
  try {
    const res = await getTemplateList({
      page: 1,
      pageSize: 100,
      reportType: formModel.reportType,
      status: 1
    })
    templateList.value = res.data.list || []
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

const handleGenerate = async () => {
  const valid = await formRef.value?.validate()
  if (!valid) return

  generating.value = true
  const loadingInstance = ElLoading.service({
    lock: true,
    text: '正在生成报表，请稍候...',
    background: 'rgba(255, 255, 255, 0.8)'
  })

  try {
    const params: ReportParams = {
      templateId: Number(formModel.templateId),
      period: formModel.period,
      companyIds: formModel.companyIds,
      currency: formModel.currency
    }

    const res = await generateReport(params)
    generatedReportId.value = res.data.id

    const dataRes = await getReportData(res.data.taskId || res.data.id)
    reportData.value = dataRes.data

    ElMessage.success('报表生成成功')
  } catch (error) {
    console.error('生成报表失败', error)
    ElMessage.error('生成报表失败，请稍后重试')
  } finally {
    generating.value = false
    loadingInstance.close()
  }
}

const handleExportExcel = async () => {
  if (!generatedReportId.value) {
    ElMessage.warning('请先生成报表')
    return
  }
  try {
    await exportExcel(generatedReportId.value)
    ElMessage.success('导出Excel成功')
  } catch (error) {
    console.error('导出Excel失败', error)
  }
}

const handleExportPdf = async () => {
  if (!generatedReportId.value) {
    ElMessage.warning('请先生成报表')
    return
  }
  try {
    await exportPdf(generatedReportId.value)
    ElMessage.success('导出PDF成功')
  } catch (error) {
    console.error('导出PDF失败', error)
  }
}

const handlePrint = () => {
  window.print()
}

const handleSave = async () => {
  if (!generatedReportId.value) {
    ElMessage.warning('请先生成报表')
    return
  }
  ElMessage.success('报表已保存')
  router.push('/report')
}

const formatNumber = (value: number | string | undefined, format?: string): string => {
  if (value === undefined || value === null || value === '') return '-'
  const num = Number(value)
  if (isNaN(num)) return String(value)

  if (format === 'percentage') {
    return (num * 100).toFixed(2) + '%'
  }
  return num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

onMounted(() => {
  loadOrganizations()

  const templateId = route.query.templateId
  const period = route.query.period
  if (templateId) {
    formModel.templateId = String(templateId)
  }
  if (period) {
    formModel.period = String(period)
  }
})
</script>

<template>
  <div class="page-container">
    <el-breadcrumb separator="/">
      <el-breadcrumb-item :to="{ path: '/report' }">报表生成</el-breadcrumb-item>
      <el-breadcrumb-item>生成报表</el-breadcrumb-item>
    </el-breadcrumb>

    <div class="page-header">
      <h2>生成报表</h2>
      <el-button @click="router.push('/report')">返回</el-button>
    </div>

    <div class="report-container">
      <div class="params-panel">
        <div class="panel-header">查询条件</div>
        <el-form ref="formRef" :model="formModel" label-width="100px" class="params-form">
          <el-form-item label="报表类型" prop="reportType" required>
            <el-select v-model="formModel.reportType" placeholder="请选择报表类型" @change="handleReportTypeChange">
              <el-option
                v-for="opt in reportTypeOptions"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="模板选择" prop="templateId" required>
            <el-select v-model="formModel.templateId" placeholder="请先选择报表类型" @change="handleTemplateChange" :disabled="!formModel.reportType">
              <el-option
                v-for="tpl in templateList"
                :key="tpl.id"
                :label="tpl.templateName"
                :value="tpl.id!"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="会计期间" prop="period" required>
            <el-date-picker
              v-model="formModel.period"
              type="month"
              placeholder="选择月份"
              value-format="YYYY-MM"
            />
          </el-form-item>
          <el-form-item label="公司/组织" prop="companyIds" required>
            <el-tree-select
              v-model="formModel.companyIds"
              :data="organizationList"
              :props="defaultProps"
              placeholder="请选择公司"
              multiple
              check-strictly
              :render-after-expand="false"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="币种" prop="currency">
            <el-select v-model="formModel.currency" placeholder="请选择币种">
              <el-option
                v-for="opt in currencyOptions"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="generating" @click="handleGenerate">
              {{ generating ? '生成中...' : '生成报表' }}
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <div class="result-panel">
        <div class="panel-header">
          <span>报表结果</span>
          <div class="result-actions" v-if="reportData">
            <el-button type="success" @click="handleExportExcel">导出Excel</el-button>
            <el-button type="danger" @click="handleExportPdf">导出PDF</el-button>
            <el-button @click="handlePrint">打印</el-button>
            <el-button type="primary" @click="handleSave">保存</el-button>
          </div>
        </div>

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

        <el-empty v-else description="请选择参数并生成报表" />
      </div>
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
  }

  .report-container {
    display: flex;
    gap: 16px;
    min-height: 500px;

    .params-panel {
      width: 320px;
      background: #fff;
      border-radius: 4px;
      flex-shrink: 0;

      .panel-header {
        padding: 12px 16px;
        border-bottom: 1px solid #ebeef5;
        font-weight: 500;
      }

      .params-form {
        padding: 16px;
      }
    }

    .result-panel {
      flex: 1;
      background: #fff;
      border-radius: 4px;
      overflow: hidden;

      .panel-header {
        padding: 12px 16px;
        border-bottom: 1px solid #ebeef5;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: 500;

        .result-actions {
          display: flex;
          gap: 8px;
        }
      }

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
}
</style>
