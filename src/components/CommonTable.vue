<script setup lang="ts">
import { computed } from 'vue'
import type { Column, Pagination } from '@/types'

interface Props {
  columns: Column[]
  data: any[]
  loading?: boolean
  pagination?: Pagination
  showSelection?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  pagination: () => ({ currentPage: 1, pageSize: 10, total: 0 }),
  showSelection: false
})

const emit = defineEmits<{
  'page-change': [page: number]
  'size-change': [size: number]
  'selection-change': [selection: any[]]
  'row-click': [row: any]
}>()

const handlePageChange = (page: number) => {
  emit('page-change', page)
}

const handleSizeChange = (size: number) => {
  emit('size-change', size)
}

const handleSelectionChange = (selection: any[]) => {
  emit('selection-change', selection)
}

const handleRowClick = (row: any) => {
  emit('row-click', row)
}

const pageSizes = computed(() => props.pagination.pageSizes || [10, 20, 50, 100])
</script>

<template>
  <div class="common-table">
    <el-table
      v-loading="loading"
      :data="data"
      @selection-change="handleSelectionChange"
      @row-click="handleRowClick"
      stripe
      border
      style="width: 100%"
    >
      <el-table-column v-if="showSelection" type="selection" width="55" fixed="left" />
      <el-table-column
        v-for="col in columns"
        :key="col.prop"
        :prop="col.prop"
        :label="col.label"
        :width="col.width"
        :min-width="col.minWidth"
        :sortable="col.sortable"
        :fixed="col.fixed"
      >
        <template #default="{ row }">
          {{ col.formatter ? col.formatter(row, {}, row[col.prop]) : row[col.prop] }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <slot name="actions" :row="row" />
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-container" v-if="pagination">
      <el-pagination
        v-model:current-page="pagination.currentPage"
        v-model:page-size="pagination.pageSize"
        :page-sizes="pageSizes"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.common-table {
  .pagination-container {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
  }
}
</style>
