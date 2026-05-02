import httpClient from '@/utils/http'
import type { ApiResponse, ListResponse, Template, TemplateVersion } from '@/types'

export const getTemplateList = (params: any) => {
  return httpClient.get<ApiResponse<ListResponse<Template>>>('/template/list', { params })
}

export const getTemplateDetail = (id: number) => {
  return httpClient.get<ApiResponse<Template>>(`/template/${id}`)
}

export const createTemplate = (data: Template) => {
  return httpClient.post<ApiResponse>('/template', data)
}

export const updateTemplate = (id: number, data: Template) => {
  return httpClient.put<ApiResponse>(`/template/${id}`, data)
}

export const deleteTemplate = (id: number) => {
  return httpClient.delete<ApiResponse>(`/template/${id}`)
}

export const batchDeleteTemplate = (ids: number[]) => {
  return httpClient.post<ApiResponse>('/template/batch-delete', { ids })
}

export const copyTemplate = (id: number) => {
  return httpClient.post<ApiResponse<Template>>(`/template/${id}/copy`)
}

export const saveVersion = (id: number, data: { remark?: string }) => {
  return httpClient.post<ApiResponse>(`/template/${id}/version`, data)
}

export const getVersionList = (id: number) => {
  return httpClient.get<ApiResponse<TemplateVersion[]>>(`/template/${id}/versions`)
}

export const rollbackVersion = (id: number, versionId: number) => {
  return httpClient.post<ApiResponse>(`/template/${id}/rollback`, { versionId })
}

export const getTemplateByType = (reportType: string) => {
  return httpClient.get<ApiResponse<Template[]>>('/template/by-type', { params: { reportType } })
}
