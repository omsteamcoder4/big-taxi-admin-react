// api/seo.js
import api from './axiosConfig';

export const seoAPI = {
  getByPage: (pageType, identifier = 'default') => 
    api.get(`/seo/page/${pageType}/${identifier}`),
  
  getAll: (params) => 
    api.get('/seo', { params }),
  
  createOrUpdate: (seoData) => {
    return api.post('/seo', seoData);
  },
  
  delete: (id) => 
    api.delete(`/seo/${id}`),
  
  bulkUpdate: (seoEntries) => 
    api.post('/seo/bulk', { seoEntries }),

  // ============ AI ROUTES ============
  aiGenerateSEOMeta: (pageType, pageIdentifier, businessName, businessAddress) => {
    return api.post('/seo/ai/generate-seo', { 
      pageType, 
      pageIdentifier, 
      businessName, 
      businessAddress 
    });
  },

  aiGenerateLocalSEO: (businessName, businessAddress, businessPhone, businessEmail) => {
    return api.post('/seo/ai/generate-local-seo', {
      businessName,
      businessAddress,
      businessPhone,
      businessEmail
    });
  },

  aiGenerateScripts: (pageType, businessName, businessAddress) => {
    return api.post('/seo/ai/generate-scripts', {
      pageType,
      businessName,
      businessAddress
    });
  },

  aiGenerateImage: (pageType, businessName, prompt) => {
    return api.post('/seo/ai/generate-image', {
      pageType,
      businessName,
      prompt
    });
  },

  aiGenerateAll: (pageType, pageIdentifier, businessName, businessAddress, businessPhone, businessEmail) => {
    return api.post('/seo/ai/generate-all', {
      pageType,
      pageIdentifier,
      businessName,
      businessAddress,
      businessPhone,
      businessEmail
    });
  }
};