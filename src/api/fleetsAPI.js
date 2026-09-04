// admin/src/api/fleetsAPI.js - With AI functions
import api from './axiosConfig';

export const fleetsAPI = {
  // CRUD operations
  getAll: (params = {}) => api.get('/fleets', { params }),
  getById: (id) => api.get(`/fleets/${id}`),
  getBySlug: (slug) => api.get(`/fleets/slug/${slug}`),
  create: (formData) => api.post('/fleets', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id, formData) => api.put(`/fleets/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  delete: (id) => api.delete(`/fleets/${id}`),

  // ============ AI FUNCTIONS ============
  
  // Generate fleet from chat description
  generateFromChat: (description) => {
    return api.post('/fleets/ai/generate-from-chat', { description });
  },

  // Improve existing fleet content
  improveFleet: (currentContent, instruction) => {
    return api.post('/fleets/ai/improve', { currentContent, instruction });
  },

  // Generate fleet image
  generateImage: (type, description, model = 'flux') => {
    return api.post('/fleets/ai/generate-image', { type, description, model });
  }
};

export default fleetsAPI;