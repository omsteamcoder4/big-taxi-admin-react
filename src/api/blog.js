// api/blog.js
import api from './axiosConfig';

export const blogAPI = {
  // =============== PUBLIC ROUTES (exact backend match) ===============
  
  getAllBlogs: (params = {}) => {
    return api.get('/blogs', { 
      params: {
        ...params,
        status: ''
      }
    });
  },
  
  getBlogCategories: () => api.get('/blogs/categories'),
  getBlogTags: () => api.get('/blogs/tags'),
  getBlogBySlug: (slug) => api.get(`/blogs/${slug}`),
  getRelatedBlogs: (id) => api.get(`/blogs/${id}/related`),
  getBlogById: (id) => api.get(`/blogs/id/${id}`),

  // =============== PROTECTED ROUTES ===============
  toggleLike: (id) => api.post(`/blogs/${id}/like`),
  
  // =============== ADMIN/AUTHOR ROUTES ===============
  createBlog: (formData) => {
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    };
    return api.post('/blogs', formData, config);
  },
  
  updateBlog: (id, formData) => {
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    };
    return api.put(`/blogs/${id}`, formData, config);
  },
  
  deleteBlog: (id) => api.delete(`/blogs/${id}`),

  // =============== AI ROUTES (Admin Only) ===============
  aiGenerateSEOMeta: (title, description, content) => {
    return api.post('/blogs/ai/generate-seo', { title, description, content });
  },

  aiGenerateTags: (title, description, content) => {
    return api.post('/blogs/ai/generate-tags', { title, description, content });
  },

  aiGenerateExcerpt: (content, maxLength) => {
    return api.post('/blogs/ai/generate-excerpt', { content, maxLength });
  },

  aiImproveContent: (content) => {
    return api.post('/blogs/ai/improve-content', { content });
  },

  aiGenerateOutline: (topic, category) => {
    return api.post('/blogs/ai/generate-outline', { topic, category });
  },

  // Updated: Generate featured image
  aiGenerateImage: (title, description) => {
    return api.post('/blogs/ai/generate-image', { title, description });
  },

  // NEW: Generate Open Graph image
  aiGenerateOGImage: (title, description) => {
    return api.post('/blogs/ai/generate-og-image', { title, description });
  },

  // NEW: Generate both images at once
  aiGenerateAllImages: (title, description) => {
    return api.post('/blogs/ai/generate-all-images', { title, description });
  }
};