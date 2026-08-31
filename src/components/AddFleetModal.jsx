// admin/src/components/AddFleetModal.jsx - Chat-based AI with R2
import React, { useState, useRef, useEffect } from 'react';
import { X, Save, AlertCircle, Sparkles, Loader2, Wand2, Bot, Image } from 'lucide-react';
import { fleetsAPI } from '../api/fleetsAPI';

const AddFleetModal = ({ isOpen, onClose, onAdd }) => {
  const [form, setForm] = useState({
    type: '',
    slug: '',
    description: '',
    shortDescription: '',
    capacity: '',
    luggage: '',
    features: '',
    ideal: '',
    displayOrder: '0',
    active: 'true',
    metaTitle: '',
    metaDescription: ''
  });
  const [mainImage, setMainImage] = useState(null);
  const [mainImagePreview, setMainImagePreview] = useState('');
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryPreviews, setGalleryPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const mainImageRef = useRef();
  const galleryRef = useRef();

  // AI States
  const [chatInput, setChatInput] = useState('');
  const [aiLoading, setAiLoading] = useState({
    chat: false,
    improve: false,
    image: false
  });
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [showChatView, setShowChatView] = useState(true);

  // Auto-generate slug from type
  const generateSlug = (text) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  useEffect(() => {
    if (isOpen) {
      setShowChatView(true);
      setAiSuggestion(null);
      setChatInput('');
      setError('');
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => {
      const newForm = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      };
      if (name === 'type') {
        newForm.slug = generateSlug(value);
      }
      return newForm;
    });
    if (error) setError('');
  };

  const handleMainImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) {
      setError('Please select a valid image (JPEG, PNG, WEBP)');
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

  const handleGalleryImages = (e) => {
    const files = Array.from(e.target.files);
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const validFiles = files.filter(file => {
      if (!allowed.includes(file.type)) {
        setError(`Invalid image type: ${file.name}`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError(`Image ${file.name} must be under 5MB`);
        return false;
      }
      return true;
    });

    if (galleryImages.length + validFiles.length > 10) {
      setError('Maximum 10 gallery images allowed');
      return;
    }

    setGalleryImages(prev => [...prev, ...validFiles]);
    
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setGalleryPreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeGalleryImage = (index) => {
    setGalleryImages(prev => prev.filter((_, i) => i !== index));
    setGalleryPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // ============ AI FUNCTIONS ============

  const handleGenerateFromChat = async () => {
    if (!chatInput.trim() || chatInput.trim().length < 3) {
      setError('Please describe the vehicle you want to create (minimum 3 characters)');
      return;
    }

    setAiLoading(prev => ({ ...prev, chat: true }));
    setError('');

    try {
      const response = await fleetsAPI.generateFromChat(chatInput);
      
      if (response.data.success) {
        const data = response.data.data;
        setAiSuggestion(data);
        
        setForm(prev => ({
          ...prev,
          type: data.type || prev.type,
          description: data.description || prev.description,
          shortDescription: data.shortDescription || prev.shortDescription,
          capacity: data.capacity || prev.capacity,
          luggage: data.luggage || prev.luggage,
          features: Array.isArray(data.features) ? data.features.join(', ') : prev.features,
          ideal: data.ideal || prev.ideal,
          metaTitle: data.metaTitle || prev.metaTitle,
          metaDescription: data.metaDescription || prev.metaDescription,
          slug: data.type ? generateSlug(data.type) : prev.slug
        }));

        setError('✅ AI generated vehicle content successfully! Review and edit as needed.');
        setTimeout(() => setError(''), 4000);
        setShowChatView(false);
      }
    } catch (err) {
      console.error('AI generation error:', err);
      setError(err.response?.data?.message || 'Failed to generate fleet content');
    } finally {
      setAiLoading(prev => ({ ...prev, chat: false }));
    }
  };

  const handleGenerateImage = async () => {
    if (!form.type) {
      setError('Please generate or enter a vehicle type first');
      return;
    }

    setAiLoading(prev => ({ ...prev, image: true }));
    setError('');

    try {
      const response = await fleetsAPI.generateImage(form.type, form.description);
      
      if (response.data.success) {
        const { data, mimeType } = response.data.data;
        const byteCharacters = atob(data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mimeType || 'image/jpeg' });
        const file = new File([blob], `fleet-image-${Date.now()}.jpg`, { type: mimeType || 'image/jpeg' });

        setMainImage(file);
        const reader = new FileReader();
        reader.onloadend = () => setMainImagePreview(reader.result);
        reader.readAsDataURL(file);

        setError('✅ Vehicle image generated successfully!');
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
    
    if (!form.type.trim()) {
      setError('Vehicle type is required');
      return;
    }
    if (!form.slug.trim()) {
      setError('Slug is required');
      return;
    }
    if (!form.description.trim()) {
      setError('Description is required');
      return;
    }
    if (!form.capacity.trim()) {
      setError('Capacity is required');
      return;
    }
    if (!form.luggage.trim()) {
      setError('Luggage info is required');
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('type', form.type);
      fd.append('slug', form.slug);
      fd.append('description', form.description);
      fd.append('shortDescription', form.shortDescription);
      fd.append('capacity', form.capacity);
      fd.append('luggage', form.luggage);
      fd.append('features', form.features);
      fd.append('ideal', form.ideal);
      fd.append('displayOrder', form.displayOrder);
      fd.append('active', form.active === 'true');
      fd.append('metaTitle', form.metaTitle);
      fd.append('metaDescription', form.metaDescription);
      
      if (mainImage) fd.append('image', mainImage);
      galleryImages.forEach(img => fd.append('images', img));
      
      await onAdd(fd);
      handleClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to add fleet');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setForm({
      type: '',
      slug: '',
      description: '',
      shortDescription: '',
      capacity: '',
      luggage: '',
      features: '',
      ideal: '',
      displayOrder: '0',
      active: 'true',
      metaTitle: '',
      metaDescription: ''
    });
    setMainImage(null);
    setMainImagePreview('');
    setGalleryImages([]);
    setGalleryPreviews([]);
    setError('');
    setChatInput('');
    setAiSuggestion(null);
    setShowChatView(true);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10 rounded-t-xl">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-900">Add New Vehicle</h2>
            <button
              type="button"
              onClick={() => setShowChatView(!showChatView)}
              className={`text-xs px-3 py-1 rounded-full transition-colors ${
                showChatView 
                  ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {showChatView ? '✕ Hide AI Chat' : '💬 Show AI Chat'}
            </button>
          </div>
          <button onClick={handleClose} className="p-1.5 hover:bg-gray-100 rounded-full">
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

          {/* AI Chat Section */}
          {showChatView && (
            <div className="border-2 border-purple-200 rounded-xl p-4 bg-purple-50/30">
              <div className="flex items-center gap-2 mb-3">
                <Bot size={18} className="text-purple-600" />
                <h3 className="text-sm font-semibold text-purple-700">AI Vehicle Generator</h3>
                <span className="text-xs text-purple-400 ml-2">Describe what you want</span>
              </div>
              
              <div className="flex gap-2">
                <textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Describe the vehicle you want to create. Be specific about the type, capacity, features, and what it's ideal for..."
                  rows={3}
                  className="flex-1 px-3 py-2 border border-purple-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  disabled={aiLoading.chat}
                />
              </div>
              
              <div className="flex flex-wrap gap-2 mt-3">
                <button
                  type="button"
                  onClick={handleGenerateFromChat}
                  disabled={aiLoading.chat}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg hover:from-purple-600 hover:to-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {aiLoading.chat ? (
                    <Loader2 size={16} className="animate-spin mr-2" />
                  ) : (
                    <Sparkles size={16} className="mr-2" />
                  )}
                  Generate Vehicle
                </button>
                
                <button
                  type="button"
                  onClick={handleGenerateImage}
                  disabled={aiLoading.image || !form.type}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-pink-500 to-rose-600 rounded-lg hover:from-pink-600 hover:to-rose-700 disabled:opacity-50 transition-colors"
                >
                  {aiLoading.image ? (
                    <Loader2 size={16} className="animate-spin mr-2" />
                  ) : (
                    <Image size={16} className="mr-2" />
                  )}
                  Generate Image
                </button>

                {aiSuggestion && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowChatView(false);
                      setError('💡 AI content applied! Review and edit as needed.');
                      setTimeout(() => setError(''), 3000);
                    }}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <Wand2 size={16} className="mr-2" />
                    Use AI Content
                  </button>
                )}
              </div>

              {aiLoading.chat && (
                <p className="text-xs text-purple-600 mt-2 flex items-center gap-1">
                  <Loader2 size={12} className="animate-spin" />
                  AI is generating your vehicle content...
                </p>
              )}
            </div>
          )}

          {/* Type + Slug */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Vehicle Type *</label>
              <input
                name="type"
                value={form.type}
                onChange={handleChange}
                required
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f96b06]"
                placeholder="e.g. Sedan, SUV, Hatchback"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Slug * (auto-generated)</label>
              <input
                name="slug"
                value={form.slug}
                onChange={handleChange}
                required
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#f96b06]"
                placeholder="auto-generated from type"
              />
              <p className="text-xs text-gray-400 mt-1">URL-friendly name (e.g., sedan, suv, hatchback)</p>
            </div>
          </div>

          {/* Capacity + Luggage */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Capacity *</label>
              <input
                name="capacity"
                value={form.capacity}
                onChange={handleChange}
                required
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f96b06]"
                placeholder="e.g. 4 Passengers"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Luggage *</label>
              <input
                name="luggage"
                value={form.luggage}
                onChange={handleChange}
                required
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f96b06]"
                placeholder="e.g. 2 Bags"
              />
            </div>
          </div>

          {/* Short Description */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Short Description</label>
            <input
              name="shortDescription"
              value={form.shortDescription}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f96b06]"
              placeholder="Brief description for cards"
            />
          </div>

          {/* Full Description */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Full Description *</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              required
              rows="4"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f96b06]"
              placeholder="Detailed description of the vehicle..."
            />
          </div>

          {/* Features */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Features (comma separated)</label>
            <textarea
              name="features"
              value={form.features}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f96b06]"
              placeholder="e.g. AC, Music System, GPS, Comfortable Seats"
            />
          </div>

          {/* Ideal + Display Order + Active */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Ideal For</label>
              <input
                name="ideal"
                value={form.ideal}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                placeholder="e.g. Family Trips, Business Travel"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Display Order</label>
              <input
                type="number"
                name="displayOrder"
                value={form.displayOrder}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                min="0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select
                name="active"
                value={form.active}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white"
              >
                <option value="true">Active (Visible)</option>
                <option value="false">Inactive (Hidden)</option>
              </select>
            </div>
          </div>

          {/* Main Image Upload */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Main Vehicle Image</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-[#f96b06] transition-colors">
              <input
                ref={mainImageRef}
                type="file"
                accept="image/*"
                onChange={handleMainImage}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-[#f96b06] file:text-white hover:file:bg-[#bf4040]"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Image will be uploaded to Cloudflare R2
              {!mainImagePreview && form.type && (
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
                <img src={mainImagePreview} alt="Main preview" className="w-40 h-28 object-cover rounded-lg border border-gray-200" />
                <button
                  type="button"
                  onClick={() => { setMainImage(null); setMainImagePreview(''); }}
                  className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            )}
          </div>

          {/* Gallery Images Upload */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Gallery Images (Max 10)</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-[#f96b06] transition-colors">
              <input
                ref={galleryRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleGalleryImages}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-[#f96b06] file:text-white hover:file:bg-[#bf4040]"
              />
              <p className="text-xs text-gray-400 mt-2">Images will be uploaded to Cloudflare R2 gallery folder</p>
            </div>
            {galleryPreviews.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {galleryPreviews.map((preview, idx) => (
                  <div key={idx} className="relative inline-block">
                    <img src={preview} alt={`Gallery ${idx + 1}`} className="w-20 h-16 object-cover rounded-lg border border-gray-200" />
                    <button
                      type="button"
                      onClick={() => removeGalleryImage(idx)}
                      className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
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
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f96b06]"
                  placeholder="SEO title (leave empty to use vehicle type)"
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
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f96b06]"
                  placeholder="SEO description for search engines"
                />
                <p className="text-xs text-gray-400 mt-1">Recommended: 150-160 characters</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-[#f96b06] to-[#bf4040] rounded-lg hover:from-[#bf4040] hover:to-[#a03535] disabled:opacity-50"
            >
              <Save size={15} />
              {loading ? 'Adding...' : 'Add Vehicle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddFleetModal;