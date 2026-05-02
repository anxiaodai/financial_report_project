<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import type { Indicator, DataSource, TableInfo, FieldInfo } from '@/types'
import { getIndicatorDetail, createIndicator, updateIndicator, testIndicator } from '@/api/indicator'
import { getDataSourceList } from '@/api/datasource'
import { getTableList, getFieldList } from '@/api/datasource'

const route = useRoute()
const router = useRouter()

const formRef = ref<FormInstance>()
const loading = ref(false)
const testLoading = ref(false)
const isEdit = ref(false)
const id = ref<number>()

const dataSourceList = ref<DataSource[]>([])
const tableList = ref<TableInfo[]>([])
const fieldList = ref<FieldInfo[]>([])
const previewData = ref<any[]>([])

const formModel = reactive<Indicator>({
  indicatorCode: '',
  indicatorName: '',
  dbSource: '',
  tableName: '',
  fieldName: '',
  calcType: '直接取值',
  calcFormula: '',
  filterCondition: '',
  status: 1,
  remark: ''
})

const calcTypeOptions = [
  { label: '直接取值', value: '直接取值' },
  { label: '求和 (SUM)', value: 'SUM' },
  { label: '平均值 (AVG)', value: 'AVG' },
  { label: '计数 (COUNT)', value: 'COUNT' },
  { label: '最大值 (MAX)', value: 'MAX' },
  { label: '最小值 (MIN)', value: 'MIN' }
]

const calcTypeRules: FormRules = {
  calcType: [{ required: true, message: '请选择计算类型', trigger: 'change' }]
}

const formRules: FormRules = {
  indicatorCode: [
    { required: true, message: '请输入指标编码', trigger: 'blur' },
    { pattern: /^[A-Z][A-Z0-9_]*$/, message: '编码格式：英文大写字母开头，可包含数字和下划线', trigger: 'blur' }
  ],
  indicatorName: [{ required: true, message: '请输入指标名称', trigger: 'blur' }],
  dbSource: [{ required: true, message: '请选择数据库来源', trigger: 'change' }],
  tableName: [{ required: true, message: '请选择数据表', trigger: 'change' }],
  fieldName: [{ required: true, message: '请选择数据字段', trigger: 'change' }],
  calcType: [{ required: true, message: '请选择计算类型', trigger: 'change' }]
}

const loadDataSources = async () => {
  try {
    const res = await getDataSourceList({ page: 1, pageSize: 100 })
    dataSourceList.value = res.data.list
  } catch (error) {
    console.error('加载数据源失败', error)
  }
}

const loadTables = async () => {
  if (!formModel.dbSource) return
  try {
    const res = await getTableList(formModel.dbSource)
    tableList.value = res.data
  } catch (error) {
    console.error('加载数据表失败', error)
  }
}

const loadFields = async () => {
  if (!formModel.dbSource || !formModel.tableName) return
  try {
    const res = await getFieldList(formModel.dbSource, formModel.tableName)
    fieldList.value = res.data
  } catch (error) {
    console.error('加载字段失败', error)
  }
}

const handleDbSourceChange = () => {
  formModel.tableName = ''
  formModel.fieldName = ''
  tableList.value = []
  fieldList.value = []
  loadTables()
}

const handleTableChange = () => {
  formModel.fieldName = ''
  fieldList.value = []
  loadFields()
}

const loadDetail = async () => {
  if (!id.value) return
  loading.value = true
  try {
    const res = await getIndicatorDetail(id.value)
    Object.assign(formModel, res.data)
    if (formModel.dbSource) {
      await loadTables()
    }
    if (formModel.tableName) {
      await loadFields()
    }
  } catch (error) {
    console.error('加载失败', error)
  } finally {
    loading.value = false
  }
}

const handleTest = async () => {
  const valid = await formRef.value?.validateField(['dbSource', 'tableName', 'fieldName', 'calcType'])
  if (valid) return

  testLoading.value = true
  try {
    const res = await testIndicator(formModel)
    previewData.value = res.data || []
    if (previewData.value.length === 0) {
      ElMessage.warning('暂无数据')
    } else {
      ElMessage.success('测试成功')
    }
  } catch (error) {
    console.error('测试失败', error)
  } finally {
    testLoading.value = false
  }
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate()
  if (!valid) return

  loading.value = true
  try {
    if (isEdit.value) {
      await updateIndicator(id.value!, formModel)
      ElMessage.success('更新成功')
    } else {
      await createIndicator(formModel)
      ElMessage.success('创建成功')
    }
    router.push('/indicator')
  } catch (error) {
    console.error('保存失败', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadDataSources()
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
      <el-breadcrumb-item :to="{ path: '/indicator' }">指标配置</el-breadcrumb-item>
      <el-breadcrumb-item>{{ isEdit ? '编辑指标' : '新增指标' }}</el-breadcrumb-item>
    </el-breadcrumb>

    <div class="page-header">
      <h2>{{ isEdit ? '编辑指标' : '新增指标' }}</h2>
      <el-button @click="router.push('/indicator')">返回</el-button>
    </div>

    <div class="card-container">
      <el-form
        ref="formRef"
        :model="formModel"
        :rules="formRules"
        label-width="140px"
        class="indicator-form"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="指标编码" prop="indicatorCode">
              <el-input
                v-model="formModel.indicatorCode"
                placeholder="如: REVENUE_001"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="指标名称" prop="indicatorName">
              <el-input
                v-model="formModel.indicatorName"
                placeholder="如: 营业收入"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="数据库来源" prop="dbSource">
              <el-select
                v-model="formModel.dbSource"
                placeholder="请选择数据库"
                @change="handleDbSourceChange"
              >
                <el-option
                  v-for="ds in dataSourceList"
                  :key="ds.id"
                  :label="ds.name"
                  :value="ds.name"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="数据表" prop="tableName">
              <el-select
                v-model="formModel.tableName"
                placeholder="请先选择数据库"
                :disabled="!formModel.dbSource"
                @change="handleTableChange"
              >
                <el-option
                  v-for="table in tableList"
                  :key="table.tableName"
                  :label="table.tableName"
                  :value="table.tableName"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="数据字段" prop="fieldName">
              <el-select
                v-model="formModel.fieldName"
                placeholder="请先选择数据表"
                :disabled="!formModel.tableName"
              >
                <el-option
                  v-for="field in fieldList"
                  :key="field.fieldName"
                  :label="`${field.fieldName} (${field.fieldType})`"
                  :value="field.fieldName"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="计算类型" prop="calcType">
              <el-select v-model="formModel.calcType" placeholder="请选择计算类型">
                <el-option
                  v-for="opt in calcTypeOptions"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="计算公式">
              <el-input
                v-model="formModel.calcFormula"
                type="textarea"
                :rows="2"
                placeholder="复杂计算时填写，如: (a + b) / c"
                :disabled="formModel.calcType === '直接取值'"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="过滤条件">
              <el-input
                v-model="formModel.filterCondition"
                type="textarea"
                :rows="2"
                placeholder="SQL WHERE条件，如: status = 'valid' AND year = 2024"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
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
          <el-col :span="12">
            <el-form-item label="备注">
              <el-input
                v-model="formModel.remark"
                type="textarea"
                :rows="2"
                placeholder="请输入备注"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item>
              <el-button type="primary" :loading="loading" @click="handleSubmit">
                {{ isEdit ? '保存修改' : '创建指标' }}
              </el-button>
              <el-button type="success" :loading="testLoading" @click="handleTest">
                测试数据
              </el-button>
              <el-button @click="router.push('/indicator')">取消</el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <div v-if="previewData.length > 0" class="preview-section">
        <h4>数据预览</h4>
        <el-table :data="previewData" border max-height="300">
          <el-table-column
            v-for="(value, key) in previewData[0]"
            :key="key"
            :prop="String(key)"
            :label="String(key)"
            min-width="120"
          />
        </el-table>
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

  .indicator-form {
    max-width: 900px;
  }

  .preview-section {
    margin-top: 24px;
    padding-top: 24px;
    border-top: 1px solid #ebeef5;

    h4 {
      margin: 0 0 12px 0;
      font-size: 16px;
      font-weight: 500;
    }
  }
}
</style>
