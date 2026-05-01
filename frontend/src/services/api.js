import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL + '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Public
export const getProfile = () => api.get('/profile')
export const getSkills = () => api.get('/skills')
export const getProjects = () => api.get('/projects')
export const getExperiences = () => api.get('/experiences')
export const getEducation = () => api.get('/education')
export const getCertificates = () => api.get('/certificates')
export const postContact = (data) => api.post('/contact', data)

// Auth
export const login = (data) => api.post('/auth/login', data)
export const logout = () => api.post('/admin/auth/logout')

// Admin — profile
export const adminGetProfile = () => api.get('/admin/profile')
export const adminUpdateProfile = (data) => api.put('/admin/profile', data)
export const adminUploadCv = (file) => {
  const form = new FormData()
  form.append('cv', file)
  return api.post('/admin/cv', form, { headers: { 'Content-Type': 'multipart/form-data' } })
}

// Admin — skills
export const adminGetSkills = () => api.get('/admin/skills')
export const adminCreateSkill = (data) => api.post('/admin/skills', data)
export const adminUpdateSkill = (id, data) => api.put(`/admin/skills/${id}`, data)
export const adminDeleteSkill = (id) => api.delete(`/admin/skills/${id}`)

// Admin — projects
export const adminGetProjects = () => api.get('/admin/projects')
export const adminCreateProject = (form) =>
  api.post('/admin/projects', form, { headers: { 'Content-Type': 'multipart/form-data' } })
export const adminUpdateProject = (id, form) =>
  api.put(`/admin/projects/${id}`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
export const adminDeleteProject = (id) => api.delete(`/admin/projects/${id}`)

// Admin — experiences
export const adminGetExperiences = () => api.get('/admin/experiences')
export const adminCreateExperience = (data) => api.post('/admin/experiences', data)
export const adminUpdateExperience = (id, data) => api.put(`/admin/experiences/${id}`, data)
export const adminDeleteExperience = (id) => api.delete(`/admin/experiences/${id}`)

// Admin — education
export const adminGetEducation = () => api.get('/admin/education')
export const adminCreateEducation = (data) => api.post('/admin/education', data)
export const adminUpdateEducation = (id, data) => api.put(`/admin/education/${id}`, data)
export const adminDeleteEducation = (id) => api.delete(`/admin/education/${id}`)

// Admin — certificates
export const adminGetCertificates = () => api.get('/admin/certificates')
export const adminCreateCertificate = (form) =>
  api.post('/admin/certificates', form, { headers: { 'Content-Type': 'multipart/form-data' } })
export const adminUpdateCertificate = (id, form) =>
  api.put(`/admin/certificates/${id}`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
export const adminDeleteCertificate = (id) => api.delete(`/admin/certificates/${id}`)

// Admin — messages
export const adminGetMessages = () => api.get('/admin/messages')
export const adminMarkRead = (id) => api.patch(`/admin/messages/${id}/read`)

// Admin — chat
export const adminGetConversations = () => api.get('/admin/chat')
export const adminGetConversation = (sessionId) => api.get(`/admin/chat/${sessionId}`)
export const adminReply = (sessionId, message) => api.post(`/admin/chat/${sessionId}/reply`, { message })
export const adminDeleteConversation = (sessionId) => api.delete(`/admin/chat/${sessionId}`)

// Public chat
export const chatSend = (data) => api.post('/chat', data)
export const chatPoll = (sessionId) => api.get(`/chat/${sessionId}`)

export default api
