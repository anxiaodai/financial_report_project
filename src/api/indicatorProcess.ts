import httpClient from '@/utils/http'
import type { ApiResponse, ListResponse, IndicatorProcess } from '@/types'

export const getProcessList = (params: any) => {
  return httpClient.get<ApiResponse<ListResponse<IndicatorProcess>>>('/indicatorProcess/list', { params })
}

export const getProcessDetail = (id: number) => {
  return httpClient.get<ApiResponse<IndicatorProcess>>(`/indicatorProcess/${id}`)
}

export const createProcess = (data: IndicatorProcess) => {
  return httpClient.post<ApiResponse>('/indicatorProcess', data)
}

export const updateProcess = (id: number, data: IndicatorProcess) => {
  return httpClient.put<ApiResponse>(`/indicatorProcess/${id}`, data)
}

export const deleteProcess = (id: number) => {
  return httpClient.delete<ApiResponse>(`/indicatorProcess/${id}`)
}

export const batchDeleteProcess = (ids: number[]) => {
  return httpClient.post<ApiResponse>('/indicatorProcess/batch-delete', { ids })
}

export const validateFormula = (data: { formula: string; aliases: string[] }) => {
  return httpClient.post<ApiResponse<{ valid: boolean; message: string }>>('/indicatorProcess/validate', data)
}

export const testProcess = (data: IndicatorProcess & { period: string }) => {
  return httpClient.post<ApiResponse<any>>('/indicatorProcess/test', data)
}

export const getValidProcessList = () => {
  return httpClient.get<ApiResponse<IndicatorProcess[]>>('/indicatorProcess/valid-list')
}
