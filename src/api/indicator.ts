import httpClient from '@/utils/http'
import type { ApiResponse, ListResponse, Indicator } from '@/types'

export const getIndicatorList = (params: any) => {
  return httpClient.get<ApiResponse<ListResponse<Indicator>>>('/indicator/list', { params })
}

export const getIndicatorDetail = (id: number) => {
  return httpClient.get<ApiResponse<Indicator>>(`/indicator/${id}`)
}

export const createIndicator = (data: Indicator) => {
  return httpClient.post<ApiResponse>('/indicator', data)
}

export const updateIndicator = (id: number, data: Indicator) => {
  return httpClient.put<ApiResponse>(`/indicator/${id}`, data)
}

export const deleteIndicator = (id: number) => {
  return httpClient.delete<ApiResponse>(`/indicator/${id}`)
}

export const batchDeleteIndicator = (ids: number[]) => {
  return httpClient.post<ApiResponse>('/indicator/batch-delete', { ids })
}

export const testIndicator = (data: Indicator) => {
  return httpClient.post<ApiResponse<any[]>>('/indicator/test', data)
}

export const getValidIndicatorList = () => {
  return httpClient.get<ApiResponse<Indicator[]>>('/indicator/valid-list')
}
