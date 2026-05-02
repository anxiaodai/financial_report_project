<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import type { Template, TemplateCell, IndicatorProcess, Indicator, TemplateVersion } from '@/types'
import { getTemplateDetail, createTemplate, updateTemplate, saveVersion, getVersionList, rollbackVersion } from '@/api/template'
import { getValidProcessList } from '@/api/indicatorProcess'
import { getValidIndicatorList } from '@/api/indicator'

const route = useRoute()
const router = useRouter()

const formRef = ref<FormInstance>()
const loading = ref(false)
const isEdit = ref(false)
const id = ref<number>()

const processList = ref<IndicatorProcess[]>([])
const indicatorList = ref<Indicator[]>([])
const versionList = ref<TemplateVersion[]>([])
const showVersionDialog = ref(false)

const selectedCell = ref<TemplateCell | null>(null)
const expandedGroups = ref<string[]>(['process', 'indicator'])

const formModel = reactive<Template>({
  templateCode: '',
  templateName: '',
  reportType: '',
  orgRange: '全集团',
  content: '',
  rows: [],
  status: 1,
  version: 'v1.0',
  remark: ''
})

const reportTypeOptions = [
  { label: '资产负债表', value: '资产负债表' },
  { label: '利润表', value: '利润表' },
  { label: '现金流量表', value: '现金流量表' },
  { label: '自定义', value: '自定义' }
]

const orgRangeOptions = [
  { label: '全集团', value: '全集团' },
  { label: '指定公司', value: '指定公司' }
]

const cellTypeOptions = [
  { label: '文本', value: 'text' },
  { label: '指标', value: 'indicator' },
  { label: '公式', value: 'formula' },
  { label: '参数', value: 'param' }
]

const formRules: FormRules = {
  templateCode: [
    { required: true, message: '请输入模板编码', trigger: 'blur' },
    { pattern: /^[A-Z][A-Z0-9_]*$/, message: '编码格式：英文大写字母开头', trigger: 'blur' }
  ],
  templateName: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
  reportType: [{ required: true, message: '请选择报表类型', trigger: 'change' }]
}

const indicatorCount = computed(() => {
  let count = 0
  formModel.rows.forEach(row => {
    row.cells.forEach(cell => {
      if (cell.cellType === 'indicator') count++
    })
  })
  return count
})

const initGrid = () => {
  const rows: TemplateRow[] = []
  for (let i = 0; i < 10; i++) {
    const cells: TemplateCell[] = []
    for (let j = 0; j < 5; j++) {
      cells.push({
        row: i,
        col: j,
        rowSpan: 1,
        colSpan: 1,
        cellType: 'text',
        content: '',
        style: {
          textAlign: 'left',
          borderTop: '1px solid #ebeef5',
          borderRight: '1px solid #ebeef5',
          borderBottom: '1px solid #ebeef5',
          borderLeft: '1px solid #ebeef5'
        }
      })
    }
    rows.push({ rowIndex: i, height: 40, cells })
  }
  formModel.rows = rows
}

const handleCellClick = (cell: TemplateCell) => {
  selectedCell.value = cell
}

const handleAddRow = () => {
  const newRowIndex = formModel.rows.length
  const cells: TemplateCell[] = []
  for (let j = 0; j < 5; j++) {
    cells.push({
      row: newRowIndex,
      col: j,
      rowSpan: 1,
      colSpan: 1,
      cellType: 'text',
      content: '',
      style: {
        textAlign: 'left',
        borderTop: '1px solid #ebeef5',
        borderRight: '1px solid #ebeef5',
        borderBottom: '1px solid #ebeef5',
        borderLeft: '1px solid #ebeef5'
      }
    })
  }
  formModel.rows.push({ rowIndex: newRowIndex, height: 40, cells })
}

const handleDeleteRow = () => {
  if (formModel.rows.length <= 1) {
    ElMessage.warning('至少保留一行')
    return
  }
  formModel.rows.pop()
}

const handleAddCol = () => {
  formModel.rows.forEach(row => {
    row.cells.push({
      row: row.rowIndex,
      col: row.cells.length,
      rowSpan: 1,
      colSpan: 1,
      cellType: 'text',
      content: '',
      style: {
        textAlign: 'left',
        borderTop: '1px solid #ebeef5',
        borderRight: '1px solid #ebeef5',
        borderBottom: '1px solid #ebeef5',
        borderLeft: '1px solid #ebeef5'
      }
    })
  })
}

const handleDeleteCol = () => {
  if (formModel.rows[0]?.cells.length <= 1) {
    ElMessage.warning('至少保留一列')
    return
  }
  formModel.rows.forEach(row => {
    row.cells.pop()
  })
}

const handleDragStart = (event: DragEvent, item: any, type: 'process' | 'indicator') => {
  event.dataTransfer?.setData('indicator', JSON.stringify({ ...item, type }))
}

const handleDrop = (event: DragEvent, cell: TemplateCell) => {
  event.preventDefault()
  const data = event.dataTransfer?.getData('indicator')
  if (data) {
    const item = JSON.parse(data)
    cell.cellType = 'indicator'
    cell.content = item.indicatorName || item.outputIndicator || item.indicatorName
    cell.indicatorCode = item.processCode || item.indicatorCode
    ElMessage.success('已绑定指标')
  }
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
}

const updateCellStyle = (style: Partial<CellStyle>) => {
  if (selectedCell.value && selectedCell.value.style) {
    Object.assign(selectedCell.value.style, style)
  }
}

const updateCellType = (cellType: string) => {
  if (selectedCell.value) {
    selectedCell.value.cellType = cellType as any
    if (cellType === 'text') {
      selectedCell.value.indicatorCode = ''
    }
  }
}

const loadProcessList = async () => {
  try {
    const res = await getValidProcessList()
    processList.value = res.data || []
  } catch (error) {
    console.error('加载加工指标失败', error)
  }
}

const loadIndicatorList = async () => {
  try {
    const res = await getValidIndicatorList()
    indicatorList.value = res.data || []
  } catch (error) {
    console.error('加载原始指标失败', error)
  }
}

const loadVersionList = async () => {
  if (!id.value) return
  try {
    const res = await getVersionList(id.value)
    versionList.value = res.data || []
  } catch (error) {
    console.error('加载版本列表失败', error)
  }
}

const loadDetail = async () => {
  if (!id.value) return
  loading.value = true
  try {
    const res = await getTemplateDetail(id.value)
    Object.assign(formModel, res.data)
    if (!formModel.rows || formModel.rows.length === 0) {
      initGrid()
    }
    loadVersionList()
  } catch (error) {
    console.error('加载失败', error)
  } finally {
    loading.value = false
  }
}

const handleSaveVersion = async () => {
  if (!id.value) {
    ElMessage.warning('请先保存模板')
    return
  }
  try {
    await saveVersion(id.value, { remark: formModel.remark })
    ElMessage.success('保存版本成功')
    loadVersionList()
  } catch (error) {
    console.error('保存版本失败', error)
  }
}

const handleRollback = async (version: TemplateVersion) => {
  try {
    await rollbackVersion(id.value!, version.id!)
    ElMessage.success('回滚成功')
    loadDetail()
    showVersionDialog.value = false
  } catch (error) {
    console.error('回滚失败', error)
  }
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate()
  if (!valid) return

  loading.value = true
  try {
    formModel.content = JSON.stringify(formModel.rows)
    if (isEdit.value) {
      await updateTemplate(id.value!, formModel)
      ElMessage.success('更新成功')
    } else {
      await createTemplate(formModel)
      ElMessage.success('创建成功')
    }
    router.push('/template')
  } catch (error) {
    console.error('保存失败', error)
  } finally {
    loading.value = false
  }
}

const handlePreview = () => {
  ElMessage.info('预览功能开发中...')
}

onMounted(() => {
  initGrid()
  loadProcessList()
  loadIndicatorList()

  const routeId = route.params.id
  if (routeId) {
    isEdit.value = true
    id.value = Number(routeId)
    loadDetail()
  }
})
</script>

<template>
  <div class="page-container template-designer">
    <el-breadcrumb separator="/">
      <el-breadcrumb-item :to="{ path: '/template' }">模板配置</el-breadcrumb-item>
      <el-breadcrumb-item>{{ isEdit ? '编辑模板' : '新增模板' }}</el-breadcrumb-item>
    </el-breadcrumb>

    <div class="page-header">
      <h2>{{ isEdit ? '编辑模板' : '新增模板' }}</h2>
      <div class="header-actions">
        <el-button @click="handlePreview">预览</el-button>
        <el-button @click="router.push('/template')">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleSubmit">
          {{ isEdit ? '保存修改' : '创建模板' }}
        </el-button>
      </div>
    </div>

    <div class="designer-container">
      <div class="designer-left">
        <div class="panel-header">
          <span>指标库</span>
        </div>
        <el-input placeholder="搜索指标" clearable style="padding: 8px" />
        
        <el-collapse v-model="expandedGroups">
          <el-collapse-item title="指标加工" name="process">
            <div
              v-for="process in processList"
              :key="process.id"
              class="indicator-item"
              draggable="true"
              @dragstart="handleDragStart($event, process, 'process')"
            >
              <span class="indicator-name">{{ process.outputIndicator }}</span>
              <span class="indicator-code">{{ process.processCode }}</span>
            </div>
          </el-collapse-item>
          <el-collapse-item title="原始指标" name="indicator">
            <div
              v-for="indicator in indicatorList"
              :key="indicator.id"
              class="indicator-item"
              draggable="true"
              @dragstart="handleDragStart($event, indicator, 'indicator')"
            >
              <span class="indicator-name">{{ indicator.indicatorName }}</span>
              <span class="indicator-code">{{ indicator.indicatorCode }}</span>
            </div>
          </el-collapse-item>
        </el-collapse>

        <div class="drag-tip">拖拽指标到单元格绑定</div>
      </div>

      <div class="designer-center">
        <div class="panel-header">
          <span>报表设计器</span>
          <div class="grid-actions">
            <el-button size="small" @click="handleAddRow">添加行</el-button>
            <el-button size="small" @click="handleDeleteRow">删除行</el-button>
            <el-button size="small" @click="handleAddCol">添加列</el-button>
            <el-button size="small" @click="handleDeleteCol">删除列</el-button>
          </div>
        </div>
        
        <div class="grid-container">
          <table class="design-grid">
            <tbody>
              <tr v-for="(row, rowIndex) in formModel.rows" :key="rowIndex" :style="{ height: row.height + 'px' }">
                <td
                  v-for="(cell, colIndex) in row.cells"
                  :key="colIndex"
                  :rowspan="cell.rowSpan"
                  :colspan="cell.colSpan"
                  :class="{ selected: selectedCell === cell }"
                  :style="cell.style"
                  @click="handleCellClick(cell)"
                  @drop="handleDrop($event, cell)"
                  @dragover="handleDragOver"
                >
                  <span v-if="cell.cellType === 'indicator'" class="cell-indicator">[{{ cell.indicatorCode }}]</span>
                  <span v-else-if="cell.cellType === 'formula'" class="cell-formula">={{ cell.content }}</span>
                  <span v-else-if="cell.cellType === 'param'" class="cell-param">{{ '{' + cell.content + '}' }}</span>
                  <span v-else class="cell-text">{{ cell.content || '&nbsp;' }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="base-info">
          <el-form ref="formRef" :model="formModel" :rules="formRules" label-width="100px">
            <el-row :gutter="20">
              <el-col :span="6">
                <el-form-item label="模板编码" prop="templateCode">
                  <el-input v-model="formModel.templateCode" placeholder="如: TMPL_BALANCE_001" />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="模板名称" prop="templateName">
                  <el-input v-model="formModel.templateName" placeholder="如: 资产负债表模板" />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="报表类型" prop="reportType">
                  <el-select v-model="formModel.reportType" placeholder="请选择">
                    <el-option
                      v-for="opt in reportTypeOptions"
                      :key="opt.value"
                      :label="opt.label"
                      :value="opt.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="适用组织">
                  <el-select v-model="formModel.orgRange">
                    <el-option
                      v-for="opt in orgRangeOptions"
                      :key="opt.value"
                      :label="opt.label"
                      :value="opt.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="6">
                <el-form-item label="版本">
                  <el-input v-model="formModel.version" disabled />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="指标数量">
                  <el-input :value="indicatorCount" disabled />
                </el-form-item>
              </el-col>
              <el-col :span="6">
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
              <el-col :span="6">
                <el-button type="warning" size="small" @click="showVersionDialog = true">版本管理</el-button>
              </el-col>
            </el-row>
          </el-form>
        </div>
      </div>

      <div class="designer-right">
        <div class="panel-header">
          <span>属性配置</span>
        </div>
        
        <div v-if="selectedCell" class="cell-properties">
          <el-form label-width="80px" size="small">
            <el-form-item label="行号">
              <el-input :value="selectedCell.row + 1" disabled />
            </el-form-item>
            <el-form-item label="列号">
              <el-input :value="selectedCell.col + 1" disabled />
            </el-form-item>
            <el-form-item label="类型">
              <el-select v-model="selectedCell.cellType" @change="updateCellType">
                <el-option
                  v-for="opt in cellTypeOptions"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item v-if="selectedCell.cellType === 'indicator'" label="指标编码">
              <el-input v-model="selectedCell.indicatorCode" />
            </el-form-item>
            <el-form-item label="内容">
              <el-input v-model="selectedCell.content" type="textarea" :rows="2" />
            </el-form-item>
            <el-form-item label="格式">
              <el-input v-model="selectedCell.format" placeholder="如: #,##0.00" />
            </el-form-item>
            <el-divider>样式</el-divider>
            <el-form-item label="对齐">
              <el-radio-group v-model="selectedCell.style.textAlign" @change="(val: any) => updateCellStyle({ textAlign: val })">
                <el-radio-button label="left">左</el-radio-button>
                <el-radio-button label="center">中</el-radio-button>
                <el-radio-button label="right">右</el-radio-button>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="字体大小">
              <el-input-number v-model="selectedCell.style.fontSize" :min="10" :max="24" />
            </el-form-item>
            <el-form-item label="加粗">
              <el-switch v-model="selectedCell.style.fontWeight" active-value="bold" inactive-value="normal" />
            </el-form-item>
            <el-form-item label="背景色">
              <el-color-picker v-model="selectedCell.style.backgroundColor" />
            </el-form-item>
          </el-form>
        </div>
        <div v-else class="no-selection">
          请选择单元格进行配置
        </div>
      </div>
    </div>

    <el-dialog v-model="showVersionDialog" title="版本管理" width="600px">
      <div style="margin-bottom: 16px">
        <el-input v-model="formModel.remark" placeholder="版本备注" style="width: 300px" />
        <el-button type="primary" @click="handleSaveVersion">保存新版本</el-button>
      </div>
      <el-table :data="versionList" border>
        <el-table-column prop="version" label="版本" width="100" />
        <el-table-column prop="createTime" label="创建时间" />
        <el-table-column prop="creator" label="创建人" width="100" />
        <el-table-column prop="remark" label="备注" />
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleRollback(row)">回滚</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.template-designer {
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

  .designer-container {
    display: flex;
    height: calc(100vh - 220px);
    gap: 16px;

    .designer-left {
      width: 240px;
      background: #fff;
      border-radius: 4px;
      overflow: auto;

      .panel-header {
        padding: 12px 16px;
        border-bottom: 1px solid #ebeef5;
        font-weight: 500;
      }

      .indicator-item {
        padding: 8px 12px;
        cursor: grab;
        border-bottom: 1px solid #f5f7fa;
        display: flex;
        justify-content: space-between;
        font-size: 12px;

        &:hover {
          background: #f5f7fa;
        }

        .indicator-name {
          color: #303133;
        }

        .indicator-code {
          color: #909399;
        }
      }

      .drag-tip {
        padding: 12px;
        text-align: center;
        color: #909399;
        font-size: 12px;
        border-top: 1px solid #ebeef5;
      }
    }

    .designer-center {
      flex: 1;
      background: #fff;
      border-radius: 4px;
      display: flex;
      flex-direction: column;
      overflow: hidden;

      .panel-header {
        padding: 12px 16px;
        border-bottom: 1px solid #ebeef5;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: 500;

        .grid-actions {
          display: flex;
          gap: 8px;
        }
      }

      .grid-container {
        flex: 1;
        overflow: auto;
        padding: 16px;

        .design-grid {
          border-collapse: collapse;
          width: 100%;

          td {
            padding: 4px 8px;
            min-width: 100px;
            height: 40px;
            cursor: pointer;
            transition: all 0.2s;

            &:hover {
              background: #f5f7fa;
            }

            &.selected {
              outline: 2px solid #409eff;
              outline-offset: -2px;
            }

            .cell-indicator {
              color: #409eff;
              font-weight: 500;
            }

            .cell-formula {
              color: #e6a23c;
            }

            .cell-param {
              color: #67c23a;
            }
          }
        }
      }

      .base-info {
        padding: 16px;
        border-top: 1px solid #ebeef5;
      }
    }

    .designer-right {
      width: 280px;
      background: #fff;
      border-radius: 4px;
      overflow: auto;

      .panel-header {
        padding: 12px 16px;
        border-bottom: 1px solid #ebeef5;
        font-weight: 500;
      }

      .cell-properties {
        padding: 16px;
      }

      .no-selection {
        padding: 40px 16px;
        text-align: center;
        color: #909399;
      }
    }
  }
}
</style>
