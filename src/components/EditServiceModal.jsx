// admin/src/components/EditServiceModal.jsx - With AI Improve
import React, { useState, useEffect, useRef } from 'react';
import { X, Save, AlertCircle, Upload, Trash2, Sparkles, Loader2, Wand2, Bot } from 'lucide-react';
import { settingsAPI } from '../api/settingsAPI';
import { servicesAPI } from '../api/servicesAPI';

const EditServiceModal = ({ isOpen, onClose, onEdit, serviceData }) => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    features: '',
    bulletPoints: '',
    isFeatured: false,
    active: 'true',
    displayOrder: '0',
    location: '',
    metaTitle: '',
    metaDescription: '',
    metaKeywords: ''
  });
  const [mainImage, setMainImage] = useState(null);
  const [mainImagePreview, setMainImagePreview] = useState('');
  const [existingMainImage, setExistingMainImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [locations, setLocations] = useState([]);
  const [isFetchingLocations, setIsFetchingLocations] = useState(false);
  const mainImageRef = useRef();

  // AI States
  const [aiLoading, setAiLoading] = useState({ improve: false, image: false });
  const [improveInstruction, setImproveInstruction] = useState('');
  const [showImprove, setShowImprove] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL;
  
  const getImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${API_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  useEffect(() => {
    if (isOpen) {
      fetchLocations();
    }
  }, [isOpen]);

  const fetchLocations = async () => {
    try {
      setIsFetchingLocations(true);
      const res = await settingsAPI.getLocations();
      setLocations(res.data.data || []);
    } catch (err) {
      console.error('Failed to load locations:', err);
    } finally {
      setIsFetchingLocations(false);
    }
  };

  useEffect(() => {
    if (isOpen && serviceData) {
      setForm({
        title: serviceData.title || '',
        description: serviceData.description || '',
        features: (serviceData.features || []).join(', '),
        bulletPoints: (serviceData.bulletPoints || []).join('\n'),
        isFeatured: serviceData.isFeatured || false,
        active: String(serviceData.active ?? true),
        displayOrder: String(serviceData.displayOrder ?? 0),
        location: serviceData.location || '',
        metaTitle: serviceData.metaTitle || '',
        metaDescription: serviceData.metaDescription || '',
        metaKeywords: (serviceData.metaKeywords || []).join(', ')
      });
      setExistingMainImage(serviceData.image || '');
      setMainImagePreview('');
      setMainImage(null);
      setError('');
      setImproveInstruction('');
      setShowImprove(false);
    }
  }, [isOpen, serviceData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (error) setError('');
  };

  const handleMainImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) {
      setError('Please select a valid image (JPEG, PNG, WEBP, GIF)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB');
      return;
    }
    setMainImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setMainImagePreview(reader.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const removeImage = () => {
    setMainImage(null);
    setMainImagePreview('');
    if (mainImageRef.current) {
      mainImageRef.current.value = '';
    }
  };

  // ============ AI FUNCTIONS ============

  const handleImproveContent = async () => {
    if (!improveInstruction.trim() || improveInstruction.trim().length < 2) {
      setError('Please describe how you want to improve the content');
      return;
    }

    setAiLoading(prev => ({ ...prev, improve: true }));
    setError('');

    try {
      const currentContent = {
        title: form.title,
        description: form.description,
        features: form.features ? form.features.split(',').map(f => f.trim()).filter(f => f) : [],
        bulletPoints: form.bulletPoints ? form.bulletPoints.split('\n').map(b => b.trim()).filter(b => b) : [],
        metaTitle: form.metaTitle,
        metaDescription: form.metaDescription,
        metaKeywords: form.metaKeywords ? form.metaKeywords.split(',').map(k => k.trim()).filter(k => k) : []
      };

      const response = await servicesAPI.improveService(currentContent, improveInstruction);
      
      if (response.data.success) {
        const data = response.data.data;
        setForm(prev => ({
          ...prev,
          title: data.title || prev.title,
          description: data.description || prev.description,
          features: Array.isArray(data.features) ? data.features.join(', ') : prev.features,
          bulletPoints: Array.isArray(data.bulletPoints) ? data.bulletPoints.join('\n') : prev.bulletPoints,
          metaTitle: data.metaTitle || prev.metaTitle,
          metaDescription: data.metaDescription || prev.metaDescription,
          metaKeywords: Array.isArray(data.metaKeywords) ? data.metaKeywords.join(', ') : prev.metaKeywords
        }));

        setError('✅ Content improved successfully!');
        setTimeout(() => setError(''), 3000);
        setShowImprove(false);
        setImproveInstruction('');
      }
    } catch (err) {
      console.error('AI improvement error:', err);
      setError(err.response?.data?.message || 'Failed to improve content');
    } finally {
      setAiLoading(prev => ({ ...prev, improve: false }));
    }
  };

  // Image generation for edit
  const handleGenerateImage = async () => {
    if (!form.title) {
      setError('Service title is required to generate an image');
      return;
    }

    setAiLoading(prev => ({ ...prev, image: true }));
    setError('');

    try {
      const response = await servicesAPI.generateImage(form.title, form.description);
      
      if (response.data.success) {
        const { data, mimeType } = response.data.data;
        const byteCharacters = atob(data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mimeType || 'image/jpeg' });
        const file = new File([blob], `service-image-${Date.now()}.jpg`, { type: mimeType || 'image/jpeg' });

        setMainImage(file);
        const reader = new FileReader();
        reader.onloadend = () => setMainImagePreview(reader.result);
        reader.readAsDataURL(file);

        setError('✅ Service image generated successfully!');
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      console.error('Image generation error:', err);
      setError(err.response?.data?.message || 'Failed to generate image');
    } finally {
      setAiLoading(prev => ({ ...prev, image: false }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!form.title.trim()) { 
      setError('Service title is required'); 
      return; 
    }
    if (!form.description.trim()) { 
      setError('Description is required'); 
      return; 
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('description', form.description);
      fd.append('features', form.features);
      fd.append('bulletPoints', form.bulletPoints);
      fd.append('isFeatured', form.isFeatured);
      fd.append('active', form.active === 'true');
      fd.append('displayOrder', form.displayOrder);
      fd.append('location', form.location);
      fd.append('metaTitle', form.metaTitle);
      fd.append('metaDescription', form.metaDescription);
      fd.append('metaKeywords', form.metaKeywords);
      
      if (mainImage) {
        fd.append('image', mainImage);
      }
      
      await onEdit(serviceData._id, fd);
      handleClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update service');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setMainImage(null);
    setMainImagePreview('');
    setError('');
    setImproveInstruction('');
    setShowImprove(false);
    onClose();
  };

  const generateSlug = (title) => {
    if (!title) return '';
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  };

  if (!isOpen || !serviceData) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[95vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10 rounded-t-xl">
          <h2 className="text-xl font-semibold text-gray-900">Edit Service</h2>
          <button 
            onClick={handleClose} 
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className={`px-4 py-3 rounded-lg text-sm flex items-start gap-2 ${
              error.includes('✅') 
                ? 'bg-green-50 border border-green-200 text-green-700' 
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* AI Improvement Section */}
          <div className="border-2 border-purple-200 rounded-xl p-4 bg-purple-50/30">
            <button
              type="button"
              onClick={() => setShowImprove(!showImprove)}
              className="flex items-center gap-2 text-sm font-medium text-purple-700 hover:text-purple-800"
            >
              <Bot size={16} />
              <span>{showImprove ? '✕ Hide AI Improver' : '🤖 Improve Content with AI'}</span>
            </button>

            {showImprove && (
              <div className="mt-3 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    How would you like to improve this service?
                  </label>
                  <textarea
                    value={improveInstruction}
                    onChange={(e) => setImproveInstruction(e.target.value)}
                    placeholder="e.g., Make it more persuasive, focus on benefits, add more features, improve SEO, make it more professional..."
                    rows={2}
                    className="w-full px-3 py-2 border border-purple-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    disabled={aiLoading.improve}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleImproveContent}
                    disabled={aiLoading.improve || !improveInstruction.trim()}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg hover:from-purple-600 hover:to-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    {aiLoading.improve ? (
                      <Loader2 size={16} className="animate-spin mr-2" />
                    ) : (
                      <Wand2 size={16} className="mr-2" />
                    )}
                    Improve Content
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowImprove(false);
                      setImproveInstruction('');
                    }}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Basic Information */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Service Title *
            </label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f96b06] transition-colors"
              placeholder="e.g. One-Way Drop Taxi Services"
            />
            {form.title && (
              <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                <span className="font-medium">Slug:</span>
                <span>/services/{generateSlug(form.title)}/</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description *</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows="4"
              required
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f96b06] transition-colors"
              placeholder="Detailed description of the service..."
            />
          </div>

          {/* Features */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Features (comma separated)
            </label>
            <textarea
              name="features"
              value={form.features}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f96b06] transition-colors"
              placeholder="e.g. No return charges, Transparent pricing, Inter-city travel, Affordable rates"
            />
            <p className="text-xs text-gray-400 mt-1">Separate each feature with a comma</p>
          </div>

          {/* Bullet Points */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Bullet Points (one per line)
            </label>
            <textarea
              name="bulletPoints"
              value={form.bulletPoints}
              onChange={handleChange}
              rows="5"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f96b06] transition-colors"
              placeholder="24/7 availability&#10;Professional drivers&#10;GPS-tracked vehicles&#10;Competitive pricing&#10;Free cancellation"
            />
            <p className="text-xs text-gray-400 mt-1">Each bullet point on a new line</p>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
            <select
              name="location"
              value={form.location}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f96b06] transition-colors bg-white"
              disabled={isFetchingLocations}
            >
              <option value="">All Locations</option>
              {locations.map((loc) => (
                <option key={loc._id} value={loc.slug}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                name="isFeatured"
                checked={form.isFeatured}
                onChange={handleChange}
                id="featured"
                className="w-4 h-4 text-[#f96b06] rounded focus:ring-[#f96b06] border-gray-300"
              />
              <label htmlFor="featured" className="text-sm font-medium text-gray-700 cursor-pointer">
                Mark as Featured
              </label>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Visibility</label>
              <select
                name="active"
                value={form.active}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f96b06] bg-white"
              >
                <option value="true">Active (Visible on website)</option>
                <option value="false">Inactive (Hidden)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Display Order</label>
              <input
                type="number"
                name="displayOrder"
                value={form.displayOrder}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f96b06]"
                min="0"
              />
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Service Image</label>
            
            {existingMainImage && !mainImagePreview && (
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-1">Current image:</p>
                <div className="relative inline-block">
                  <img
                    src={getImageUrl(existingMainImage)}
                    alt="Current service image"
                    className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                    onError={(e) => { 
                      e.target.src = 'https://via.placeholder.com/128x128?text=No+Image'; 
                    }}
                  />
                </div>
              </div>
            )}
            
            <div className={`border-2 border-dashed rounded-lg p-4 transition-colors ${
              mainImagePreview 
                ? 'border-[#f96b06] bg-[#f96b06]/5' 
                : 'border-gray-300 hover:border-[#f96b06]'
            }`}>
              <input
                ref={mainImageRef}
                type="file"
                accept="image/*"
                onChange={handleMainImage}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-[#f96b06] file:text-white hover:file:bg-[#bf4040] cursor-pointer"
              />
            </div>
            
            <p className="text-xs text-gray-400 mt-1">
              Leave empty to keep current image. Image will be optimized to WebP under 40KB.
              {!mainImagePreview && form.title && (
                <button
                  type="button"
                  onClick={handleGenerateImage}
                  disabled={aiLoading.image}
                  className="ml-3 text-purple-600 hover:text-purple-700 underline text-xs disabled:opacity-50"
                >
                  {aiLoading.image ? 'Generating...' : 'Or generate AI image'}
                </button>
              )}
            </p>
            
            {mainImagePreview && (
              <div className="mt-3 relative inline-block">
                <img 
                  src={mainImagePreview} 
                  alt="New preview" 
                  className="w-32 h-32 object-cover rounded-lg border border-gray-200" 
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 transition-colors shadow-md"
                >
                  ×
                </button>
              </div>
            )}
          </div>

          {/* SEO Section */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">SEO Settings</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Meta Title</label>
                <input
                  name="metaTitle"
                  value={form.metaTitle}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f96b06] transition-colors"
                  placeholder="SEO title (leave empty to use service title)"
                />
                <p className="text-xs text-gray-400 mt-1">Recommended: 50-60 characters</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Meta Description</label>
                <textarea
                  name="metaDescription"
                  value={form.metaDescription}
                  onChange={handleChange}
                  rows="2"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f96b06] transition-colors"
                  placeholder="SEO description for search engines"
                />
                <p className="text-xs text-gray-400 mt-1">Recommended: 150-160 characters</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Meta Keywords</label>
                <input
                  name="metaKeywords"
                  value={form.metaKeywords}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f96b06] transition-colors"
                  placeholder="taxi, service, travel (comma separated)"
                />
                <p className="text-xs text-gray-400 mt-1">Separate each keyword with a comma</p>
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-[#f96b06] to-[#bf4040] rounded-lg hover:from-[#bf4040] hover:to-[#a03535] disabled:opacity-50 transition-all"
            >
              <Save size={15} />
              {loading ? 'Saving...' : 'Update Service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditServiceModal;