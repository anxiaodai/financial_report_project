<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import type { IndicatorProcess, Indicator, RefIndicator } from '@/types'
import { getProcessDetail, createProcess, updateProcess, validateFormula, testProcess } from '@/api/indicatorProcess'
import { getValidIndicatorList } from '@/api/indicator'

const route = useRoute()
const router = useRouter()

const formRef = ref<FormInstance>()
const loading = ref(false)
const testLoading = ref(false)
const isEdit = ref(false)
const id = ref<number>()
const activeStep = ref(0)

const availableIndicators = ref<Indicator[]>([])
const showIndicatorSelect = ref(false)

const formModel = reactive<IndicatorProcess>({
  processCode: '',
  processName: '',
  outputIndicator: '',
  processFormula: '',
  refIndicators: [],
  status: 1,
  remark: ''
})

const testForm = reactive({
  period: ''
})

const testResult = ref<any>(null)

const formRules: FormRules = {
  processCode: [
    { required: true, message: '请输入加工编码', trigger: 'blur' },
    { pattern: /^[A-Z][A-Z0-9_]*$/, message: '编码格式：英文大写字母开头，可包含数字和下划线', trigger: 'blur' }
  ],
  processName: [{ required: true, message: '请输入加工名称', trigger: 'blur' }],
  outputIndicator: [{ required: true, message: '请输入输出指标名称', trigger: 'blur' }],
  processFormula: [{ required: true, message: '请输入加工公式', trigger: 'blur' }]
}

const refTypeOptions = [
  { label: '原始值', value: '原始值' },
  { label: '累计值', value: '累计值' },
  { label: '同比', value: '同比' },
  { label: '环比', value: '环比' }
]

const formulaPreview = computed(() => {
  if (!formModel.processFormula || formModel.refIndicators.length === 0) return ''
  let preview = formModel.processFormula
  formModel.refIndicators.forEach(item => {
    preview = preview.replace(new RegExp(item.alias, 'g'), `[${item.indicatorName}]`)
  })
  return preview
})

const loadAvailableIndicators = async () => {
  try {
    const res = await getValidIndicatorList()
    availableIndicators.value = res.data || []
  } catch (error) {
    console.error('加载指标列表失败', error)
  }
}

const handleAddIndicator = (indicator: Indicator) => {
  const exists = formModel.refIndicators.find(item => item.indicatorId === indicator.id)
  if (exists) {
    ElMessage.warning('该指标已添加')
    return
  }
  const alias = String.fromCharCode(65 + formModel.refIndicators.length)
  formModel.refIndicators.push({
    indicatorId: indicator.id!,
    indicatorCode: indicator.indicatorCode,
    indicatorName: indicator.indicatorName,
    alias,
    refType: '原始值'
  })
  showIndicatorSelect.value = false
}

const handleRemoveIndicator = (index: number) => {
  formModel.refIndicators.splice(index, 1)
}

const insertAlias = (alias: string) => {
  formModel.processFormula += alias
}

const handleValidateFormula = async () => {
  if (formModel.refIndicators.length === 0) {
    ElMessage.warning('请先添加引用指标')
    return
  }
  if (!formModel.processFormula) {
    ElMessage.warning('请输入加工公式')
    return
  }
  try {
    await validateFormula({
      formula: formModel.processFormula,
      aliases: formModel.refIndicators.map(item => item.alias)
    })
    ElMessage.success('公式验证通过')
  } catch (error: any) {
    ElMessage.error(error.message || '公式验证失败')
  }
}

const handleTest = async () => {
  if (!testForm.period) {
    ElMessage.warning('请选择会计期间')
    return
  }
  testLoading.value = true
  try {
    const res = await testProcess({
      ...formModel,
      period: testForm.period
    })
    testResult.value = res.data
    ElMessage.success('测试计算完成')
  } catch (error) {
    console.error('测试计算失败', error)
  } finally {
    testLoading.value = false
  }
}

const loadDetail = async () => {
  if (!id.value) return
  loading.value = true
  try {
    const res = await getProcessDetail(id.value)
    Object.assign(formModel, res.data)
  } catch (error) {
    console.error('加载失败', error)
  } finally {
    loading.value = false
  }
}

const handleSubmit = async () => {
  if (formModel.refIndicators.length === 0) {
    ElMessage.warning('请至少添加一个引用指标')
    activeStep.value = 1
    return
  }
  const valid = await formRef.value?.validate()
  if (!valid) return

  loading.value = true
  try {
    if (isEdit.value) {
      await updateProcess(id.value!, formModel)
      ElMessage.success('更新成功')
    } else {
      await createProcess(formModel)
      ElMessage.success('创建成功')
    }
    router.push('/process')
  } catch (error) {
    console.error('保存失败', error)
  } finally {
    loading.value = false
  }
}

const nextStep = () => {
  if (activeStep.value === 0) {
    formRef.value?.validateField(['processCode', 'processName', 'outputIndicator'], (valid) => {
      if (valid) {
        activeStep.value = 1
      }
    })
  } else if (activeStep.value === 1) {
    if (formModel.refIndicators.length === 0) {
      ElMessage.warning('请至少添加一个引用指标')
      return
    }
    activeStep.value = 2
  }
}

const prevStep = () => {
  if (activeStep.value > 0) {
    activeStep.value--
  }
}

onMounted(() => {
  loadAvailableIndicators()
  const routeId = route.params.id
  if (routeId) {
    isEdit.value = true
    id.value = Number(routeId)
    loadDetail()
  }
})
</script>

<template>
  <div class="page-container">
    <el-breadcrumb separator="/">
      <el-breadcrumb-item :to="{ path: '/process' }">指标加工</el-breadcrumb-item>
      <el-breadcrumb-item>{{ isEdit ? '编辑加工' : '新增加工' }}</el-breadcrumb-item>
    </el-breadcrumb>

    <div class="page-header">
      <h2>{{ isEdit ? '编辑加工' : '新增加工' }}</h2>
      <el-button @click="router.push('/process')">返回</el-button>
    </div>

    <div class="card-container">
      <el-steps :active="activeStep" finish-status="success" simple style="margin-bottom: 24px">
        <el-step title="基础信息" />
        <el-step title="引用指标" />
        <el-step title="配置公式" />
      </el-steps>

      <el-form
        ref="formRef"
        :model="formModel"
        :rules="formRules"
        label-width="140px"
        class="process-form"
      >
        <div v-show="activeStep === 0">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="加工编码" prop="processCode">
                <el-input v-model="formModel.processCode" placeholder="如: CALC_PROFIT_001" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="加工名称" prop="processName">
                <el-input v-model="formModel.processName" placeholder="如: 毛利润计算" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="输出指标" prop="outputIndicator">
                <el-input v-model="formModel.outputIndicator" placeholder="如: 毛利润" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="状态">
                <el-switch
                  v-model="formModel.status"
                  :active-value="1"
                  :inactive-value="0"
                  active-text="启用"
                  inactive-text="禁用"
                />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="24">
              <el-form-item label="备注">
                <el-input v-model="formModel.remark" type="textarea" :rows="2" placeholder="请输入备注" />
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <div v-show="activeStep === 1">
          <div class="ref-indicator-header">
            <el-button type="primary" @click="showIndicatorSelect = true">添加指标</el-button>
          </div>
          <el-table :data="formModel.refIndicators" border style="margin-top: 12px">
            <el-table-column type="index" label="序号" width="60" />
            <el-table-column prop="indicatorCode" label="指标编码" min-width="140" />
            <el-table-column prop="indicatorName" label="指标名称" min-width="120" />
            <el-table-column label="别名" width="80">
              <template #default="{ row }">
                <el-tag>{{ row.alias }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="引用方式" width="120">
              <template #default="{ row }">
                <el-select v-model="row.refType" size="small">
                  <el-option
                    v-for="opt in refTypeOptions"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                  />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80">
              <template #default="{ $index }">
                <el-button type="danger" link @click="handleRemoveIndicator($index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div v-show="activeStep === 2">
          <el-row :gutter="20">
            <el-col :span="24">
              <el-form-item label="加工公式" prop="processFormula">
                <el-input
                  v-model="formModel.processFormula"
                  type="textarea"
                  :rows="4"
                  placeholder="如: (A - B) / A * 100"
                />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="24">
              <el-form-item label="别名快捷输入">
                <el-button
                  v-for="item in formModel.refIndicators"
                  :key="item.alias"
                  type="success"
                  size="small"
                  @click="insertAlias(item.alias)"
                >
                  {{ item.alias }}: {{ item.indicatorName }}
                </el-button>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="24">
              <el-form-item label="公式预览">
                <div class="formula-preview">{{ formulaPreview || '暂无' }}</div>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="24">
              <el-form-item>
                <el-button type="warning" @click="handleValidateFormula">验证公式</el-button>
              </el-form-item>
            </el-col>
          </el-row>
          <el-divider />
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="会计期间">
                <el-date-picker
                  v-model="testForm.period"
                  type="month"
                  placeholder="选择月份"
                  value-format="YYYY-MM"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item>
                <el-button type="primary" :loading="testLoading" @click="handleTest">
                  测试计算
                </el-button>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row v-if="testResult">
            <el-col :span="24">
              <el-form-item label="计算结果">
                <div class="test-result">
                  <el-descriptions :column="2" border>
                    <el-descriptions-item label="输出指标">{{ testResult.outputIndicator }}</el-descriptions-item>
                    <el-descriptions-item label="计算值">{{ testResult.value }}</el-descriptions-item>
                    <el-descriptions-item label="会计期间">{{ testResult.period }}</el-descriptions-item>
                    <el-descriptions-item label="计算状态">
                      <el-tag :type="testResult.success ? 'success' : 'danger'">
                        {{ testResult.success ? '成功' : '失败' }}
                      </el-tag>
                    </el-descriptions-item>
                  </el-descriptions>
                </div>
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <el-row>
          <el-col :span="24">
            <el-form-item>
              <el-button v-if="activeStep > 0" @click="prevStep">上一步</el-button>
              <el-button v-if="activeStep < 2" type="primary" @click="nextStep">下一步</el-button>
              <el-button v-if="activeStep === 2" type="primary" :loading="loading" @click="handleSubmit">
                {{ isEdit ? '保存修改' : '创建加工' }}
              </el-button>
              <el-button @click="router.push('/process')">取消</el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <el-dialog v-model="showIndicatorSelect" title="选择指标" width="600px">
      <el-table :data="availableIndicators" border max-height="400">
        <el-table-column prop="indicatorCode" label="指标编码" />
        <el-table-column prop="indicatorName" label="指标名称" />
        <el-table-column prop="tableName" label="数据表" />
        <el-table-column label="操作" width="80">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleAddIndicator(row)">添加</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
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

  .process-form {
    max-width: 900px;
  }

  .ref-indicator-header {
    display: flex;
    justify-content: flex-end;
  }

  .formula-preview {
    padding: 12px;
    background: #f5f7fa;
    border-radius: 4px;
    font-size: 14px;
    color: #409eff;
    word-break: break-all;
  }

  .test-result {
    width: 100%;
  }
}
</style>
