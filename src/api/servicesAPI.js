// api/servicesAPI.js - Updated with AI functions
import api from './axiosConfig';

export const servicesAPI = {
  // CRUD operations
  getAll: (params = {}) => api.get('/services', { params }),
  getById: (id) => api.get(`/services/${id}`),
  getBySlug: (slug) => api.get(`/services/slug/${slug}`),
  create: (formData) => api.post('/services', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id, formData) => api.put(`/services/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  delete: (id) => api.delete(`/services/${id}`),

  // ============ AI FUNCTIONS ============
  
  // Generate service from chat description
  generateFromChat: (description, location) => {
    return api.post('/services/ai/generate-from-chat', { description, location });
  },

  // Improve existing service content
  improveService: (currentContent, instruction) => {
    return api.post('/services/ai/improve', { currentContent, instruction });
  },

  // Generate service image
  generateImage: (title, description, model = 'flux') => {
    return api.post('/services/ai/generate-image', { title, description, model });
  }
};