import api from './api'

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
}

export const resumeApi = {
  upload: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/resume/upload', formData, {
      timeout: 60000,
    })
  },
  parse: (resumeId) => api.post(`/resume/${resumeId}/parse`, null, { timeout: 120000 }),
}

export const interviewApi = {
  start: (data) => api.post('/interview/start', data, { timeout: 120000 }),
  getReport: (sessionId) => api.get(`/interview/${sessionId}/report`),
  getHistory: () => api.get('/interview/history'),
  getProgress: () => api.get('/interview/progress'),
}

export const positionApi = {
  getAll: () => api.get('/positions'),
}

export const speechApi = {
  transcribe: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/speech/transcribe', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    })
  },
}

export const aiModelApi = {
  getAll: () => api.get('/ai-models'),
  getActive: () => api.get('/ai-models/active'),
  getById: (id) => api.get(`/ai-models/${id}`),
  create: (data) => api.post('/ai-models', data),
  update: (id, data) => api.put(`/ai-models/${id}`, data),
  delete: (id) => api.delete(`/ai-models/${id}`),
  activate: (id) => api.post(`/ai-models/${id}/activate`),
  testConnection: (data) => api.post('/ai-models/test-connection', data, { timeout: 30000 }),
}

export const knowledgeApi = {
  upload: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/knowledge/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    })
  },
  getFiles: () => api.get('/knowledge/files'),
  getItems: (params) => api.get('/knowledge/items', { params }),
  getSources: () => api.get('/knowledge/sources'),
  getContent: (fileName) => api.get(`/knowledge/content/${encodeURIComponent(fileName)}`),
  checkRelevance: (fileName, position) =>
    api.post('/knowledge/check-relevance', null, {
      params: { fileName, position },
      timeout: 120000,
    }),
  checkPositionName: (positionName) =>
    api.post('/knowledge/check-position-name', null, {
      params: { positionName },
      timeout: 30000,
    }),
  deleteFile: (fileName) => api.delete(`/knowledge/file/${encodeURIComponent(fileName)}`),
  deleteItem: (id) => api.delete(`/knowledge/item/${id}`),
}
