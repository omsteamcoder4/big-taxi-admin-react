// admin/src/api/analytics.js
import api from './axiosConfig';

export const analyticsAPI = {
  /**
   * Get current analytics config (host, domain, enabled).
   * Public endpoint — no auth needed.
   */
  getConfig: () => api.get('/analytics/config'),

  /**
   * Get robots.txt status (public).
   * Uses the same backend route already mounted at /api/robots-status
   */
  getRobotsStatus: () => api.get('/robots-status'),
};