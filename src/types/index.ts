export interface Column {
  prop: string
  label: string
  width?: string
  minWidth?: string
  sortable?: boolean
  fixed?: boolean | 'left' | 'right'
  formatter?: (row: any, column: any, cellValue: any) => string
}

export interface Pagination {
  currentPage: number
  pageSize: number
  total: number
  pageSizes?: number[]
}

export interface ApiResponse<T = any> {
  code: number
  data: T
  message: string
}

export interface ListResponse<T> {
  list: T[]
  total: number
}

export interface Indicator {
  id?: number
  indicatorCode: string
  indicatorName: string
  dbSource: string
  tableName: string
  fieldName: string
  calcType: 'SUM' | 'AVG' | 'COUNT' | 'MAX' | 'MIN' | '直接取值'
  calcFormula?: string
  filterCondition?: string
  status: number
  remark?: string
  createTime?: string
  updateTime?: string
}

export interface RefIndicator {
  id?: number
  indicatorId: number
  indicatorCode: string
  indicatorName: string
  alias: string
  refType: '原始值' | '累计值' | '同比' | '环比'
}

export interface IndicatorProcess {
  id?: number
  processCode: string
  processName: string
  outputIndicator: string
  processFormula: string
  refIndicators: RefIndicator[]
  refIndicatorCount?: number
  status: number
  remark?: string
  createTime?: string
  updateTime?: string
}

export interface CellStyle {
  fontSize?: number
  fontWeight?: string
  textAlign?: 'left' | 'center' | 'right'
  backgroundColor?: string
  color?: string
  borderTop?: string
  borderRight?: string
  borderBottom?: string
  borderLeft?: string
}

export interface TemplateCell {
  id?: string
  row: number
  col: number
  rowSpan: number
  colSpan: number
  cellType: 'text' | 'indicator' | 'formula' | 'param'
  content: string
  format?: string
  style?: CellStyle
  indicatorCode?: string
}

export interface TemplateRow {
  rowIndex: number
  height?: number
  cells: TemplateCell[]
}

export interface TemplateVersion {
  id?: number
  version: string
  createTime: string
  creator: string
  remark?: string
}

export interface Template {
  id?: number
  templateCode: string
  templateName: string
  reportType: string
  orgRange: string
  content: string
  rows?: TemplateRow[]
  indicatorCount?: number
  status: number
  version: string
  remark?: string
  createTime?: string
  updateTime?: string
}

export interface Report {
  id?: number
  reportName: string
  templateId: number
  templateName?: string
  reportType?: string
  period: string
  companyIds: number[]
  companyNames?: string[]
  currency: string
  params: string
  status: number
  taskId?: string
  createTime?: string
  updateTime?: string
}

export interface ReportParams {
  templateId: number
  period: string
  companyIds: number[]
  currency: string
}

export interface ReportData {
  title: string
  subtitle: string
  headers: string[]
  rows: ReportRow[]
}

export interface ReportRow {
  cells: ReportCell[]
  level?: number
  expandable?: boolean
  expanded?: boolean
}

export interface ReportCell {
  content: string
  value?: number
  format?: string
  style?: CellStyle
  isHighlight?: boolean
}

export interface Organization {
  id: number
  name: string
  code: string
  parentId?: number
  children?: Organization[]
}

export interface DataSource {
  id?: number
  name: string
  type: string
  host: string
  port: number
  database: string
  username: string
  password: string
  status: number
  createTime?: string
  updateTime?: string
}

export interface TableInfo {
  tableName: string
  tableComment?: string
}

export interface FieldInfo {
  fieldName: string
  fieldType: string
  fieldComment?: string
}
