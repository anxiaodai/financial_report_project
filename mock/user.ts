import {MockMethod} from 'vite-plugin-mock'
import Mock from 'mockjs'

export default [
  {
    url: '/api/template/list',
    method: 'get',
    response: ({ query }) => {
      console.log('Mock 被调用，query:', query)
        // 可以接收前端传来的参数，比如分页
      // const { page = 1, pageSize = 10 } = query
      const { page = 1, pageSize = 10, keyword = '', reportType = '' } = query || {}
      const data = Mock.mock({
        // 生成 10~20 条数据
        [`list|${pageSize}`]: [{
          'id|+1': 1,
          'templateCode': '@cname',
          'templateName': '@cname',
          'reportType': '@cname',
          'orgRange': '@cname',
          'content': '@cname',
          'indicatorCount': '@cname',
          'version': '1.0.1',
          'status': 1,
          'createTime': '@datetime',
        }],
        total: 50, // 模拟总数
      })
      return {
        code: 200,
        data: data,
        total: data.total,
        message: '成功',
      }
    }
  }
]as MockMethod[]