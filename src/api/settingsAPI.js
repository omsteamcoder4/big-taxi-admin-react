// api/settingsAPI.js - ADD location functions
import api from './axiosConfig';

export const settingsAPI = {
  // Keep existing
  getPublic: () => api.get('/settings/public'),
  getAll: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
  
  // ADD LOCATION FUNCTIONS
  getLocations: () => api.get('/settings/locations'),
  addLocation: (data) => api.post('/settings/locations', data),
  updateLocation: (id, data) => api.put(`/settings/locations/${id}`, data),
  deleteLocation: (id) => api.delete(`/settings/locations/${id}`),
  setDefaultLocation: (id) => api.patch(`/settings/locations/${id}/default`)
};