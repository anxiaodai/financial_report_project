import httpClient from '@/utils/http'
import type { ApiResponse, ListResponse, Report, ReportParams, ReportData, Template } from '@/types'

export const getReportList = (params: any) => {
  return httpClient.get<ApiResponse<ListResponse<Report>>>('/report/list', { params })
}

export const getReportDetail = (id: number) => {
  return httpClient.get<ApiResponse<Report>>(`/report/${id}`)
}

export const createReport = (data: Report) => {
  return httpClient.post<ApiResponse>('/report', data)
}

export const updateReport = (id: number, data: Report) => {
  return httpClient.put<ApiResponse>(`/report/${id}`, data)
}

export const deleteReport = (id: number) => {
  return httpClient.delete<ApiResponse>(`/report/${id}`)
}

export const batchDeleteReport = (ids: number[]) => {
  return httpClient.post<ApiResponse>('/report/batch-delete', { ids })
}

export const generateReport = (params: ReportParams) => {
  return httpClient.post<ApiResponse<{ id: number; taskId?: string }>>('/report/generate', params)
}

export const getReportData = (id: number) => {
  return httpClient.get<ApiResponse<ReportData>>(`/report/preview/${id}`)
}

export const getHistoryList = (params: any) => {
  return httpClient.get<ApiResponse<ListResponse<Report>>>('/report/history', { params })
}

export const exportExcel = (id: number) => {
  return httpClient.post<ApiResponse<{ url: string }>>(`/report/${id}/export/excel`)
}

export const exportPdf = (id: number) => {
  return httpClient.post<ApiResponse<{ url: string }>>(`/report/${id}/export/pdf`)
}

export const saveReport = (id: number) => {
  return httpClient.post<ApiResponse>(`/report/${id}/save`)
}
