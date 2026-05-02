import httpClient from '@/utils/http'
import type { ApiResponse, ListResponse, DataSource, TableInfo, FieldInfo } from '@/types'

export const getDataSourceList = (params: any) => {
  return httpClient.get<ApiResponse<ListResponse<DataSource>>>('/datasource/list', { params })
}

export const getDataSourceDetail = (id: number) => {
  return httpClient.get<ApiResponse<DataSource>>(`/datasource/${id}`)
}

export const createDataSource = (data: DataSource) => {
  return httpClient.post<ApiResponse>('/datasource', data)
}

export const updateDataSource = (id: number, data: DataSource) => {
  return httpClient.put<ApiResponse>(`/datasource/${id}`, data)
}

export const deleteDataSource = (id: number) => {
  return httpClient.delete<ApiResponse>(`/datasource/${id}`)
}

export const testDataSourceConnection = (id: number) => {
  return httpClient.post<ApiResponse<{ success: boolean; message: string }>>(`/datasource/${id}/test`)
}

export const getTableList = (dbSource: string) => {
  return httpClient.get<ApiResponse<TableInfo[]>>('/datasource/tables', { params: { dbSource } })
}

export const getFieldList = (dbSource: string, tableName: string) => {
  return httpClient.get<ApiResponse<FieldInfo[]>>('/datasource/fields', { params: { dbSource, tableName } })
}
