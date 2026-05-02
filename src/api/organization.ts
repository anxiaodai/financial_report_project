import httpClient from '@/utils/http'
import type { ApiResponse, Organization } from '@/types'

export const getOrganizationTree = () => {
  return httpClient.get<ApiResponse<Organization[]>>('/organization/tree')
}

export const getOrganizationList = (params: any) => {
  return httpClient.get<ApiResponse<any>>('/organization/list', { params })
}

export const getOrganizationDetail = (id: number) => {
  return httpClient.get<ApiResponse<Organization>>(`/organization/${id}`)
}
