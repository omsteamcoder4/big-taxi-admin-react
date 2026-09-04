// admin/src/components/AddServiceModal.jsx - Chat-based AI - FIXED
import React, { useState, useRef, useEffect } from 'react';
import { X, Save, AlertCircle, Image, Sparkles, Loader2, Wand2, MessageSquare, Bot, Send } from 'lucide-react';
import { settingsAPI } from '../api/settingsAPI';
import { servicesAPI } from '../api/servicesAPI';

const AddServiceModal = ({ isOpen, onClose, onAdd }) => {
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [locations, setLocations] = useState([]);
  const mainImageRef = useRef();

  // AI States
  const [chatInput, setChatInput] = useState('');
  const [aiLoading, setAiLoading] = useState({
    chat: false,
    improve: false,
    image: false
  });
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [showChatView, setShowChatView] = useState(true);

  // Define fetchLocations BEFORE using it in useEffect
  const fetchLocations = async () => {
    try {
      const res = await settingsAPI.getLocations();
      setLocations(res.data.data || []);
    } catch {
      console.error('Failed to load locations:');
    }
  };

  // Now useEffect can safely call fetchLocations
  useEffect(() => {
    if (isOpen) {
      const initializeModal = async () => {
        await fetchLocations();
        setShowChatView(true);
        setAiSuggestion(null);
        setChatInput('');
      };
      initializeModal();
    }
  }, [isOpen]);

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

  // ============ AI FUNCTIONS ============

  // Generate service from chat description
  const handleGenerateFromChat = async () => {
    if (!chatInput.trim() || chatInput.trim().length < 3) {
      setError('Please describe the service you want to create (minimum 3 characters)');
      return;
    }

    setAiLoading(prev => ({ ...prev, chat: true }));
    setError('');

    try {
      const response = await servicesAPI.generateFromChat(chatInput, form.location);
      
      if (response.data.success) {
        const data = response.data.data;
        setAiSuggestion(data);
        
        // Auto-fill the form with AI-generated content
        setForm(prev => ({
          ...prev,
          title: data.title || prev.title,
          description: data.description || prev.description,
          features: Array.isArray(data.features) ? data.features.join(', ') : prev.features,
          bulletPoints: Array.isArray(data.bulletPoints) ? data.bulletPoints.join('\n') : prev.bulletPoints,
          metaTitle: data.metaTitle || prev.metaTitle,
          metaDescription: data.metaDescription || prev.metaDescription,
          metaKeywords: Array.isArray(data.metaKeywords) ? data.metaKeywords.join(', ') : prev.metaKeywords,
          ...(data.suggestedCategory && !prev.category ? { category: data.suggestedCategory } : {})
        }));

        setError('✅ AI generated service content successfully! Review and edit as needed.');
        setTimeout(() => setError(''), 4000);
        
        // Auto-switch to edit view after generation
        setShowChatView(false);
      }
    } catch {
      console.error('AI generation error:');
      setError('Failed to generate service content');
    } finally {
      setAiLoading(prev => ({ ...prev, chat: false }));
    }
  };

  // Generate service image
  const handleGenerateImage = async () => {
    if (!form.title) {
      setError('Please generate or enter a service title first');
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
    } catch {
      console.error('Image generation error:');
      setError('Failed to generate image');
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
      
      if (mainImage) fd.append('image', mainImage);
      
      await onAdd(fd);
      handleClose();
    } catch {
      console.error('Error adding service:');
      setError('Failed to add service');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setForm({
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
    setMainImage(null);
    setMainImagePreview('');
    setError('');
    setChatInput('');
    setAiSuggestion(null);
    setShowChatView(true);
    onClose();
  };

  if (!isOpen) return null;

  const generateSlug = (title) => {
    if (!title) return '';
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[95vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10 rounded-t-xl">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-900">Add New Service</h2>
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

          {/* AI Chat Section */}
          {showChatView && (
            <div className="border-2 border-purple-200 rounded-xl p-4 bg-purple-50/30">
              <div className="flex items-center gap-2 mb-3">
                <Bot size={18} className="text-purple-600" />
                <h3 className="text-sm font-semibold text-purple-700">AI Service Generator</h3>
                <span className="text-xs text-purple-400 ml-2">Describe what you want</span>
              </div>
              
              <div className="flex gap-2">
                <textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Describe the service you want to create. Be specific about what you offer, who it's for, and what makes it special..."
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
                  Generate Service
                </button>
                
                <button
                  type="button"
                  onClick={handleGenerateImage}
                  disabled={aiLoading.image || !form.title}
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
                  AI is generating your service content...
                </p>
              )}
            </div>
          )}

          {/* Basic Information */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Service Title *
              <span className="text-gray-400 ml-2 text-[10px]">(Slug auto-generated from title)</span>
            </label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f96b06] transition-all"
              placeholder="e.g. One-Way Drop Taxi Services"
            />
            {form.title && (
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xs text-gray-400">URL preview:</span>
                <span className="text-xs text-[#f96b06] font-medium">
                  /services/{generateSlug(form.title)}/
                </span>
              </div>
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
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f96b06] transition-all"
              placeholder="Detailed description of the service..."
            />
          </div>

          {/* Features - Comma separated */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Features (comma separated)
            </label>
            <textarea
              name="features"
              value={form.features}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f96b06] transition-all"
              placeholder="e.g. No return charges, Transparent pricing, Inter-city travel, Affordable rates"
            />
            <p className="text-xs text-gray-400 mt-1">Separate each feature with a comma</p>
          </div>

          {/* Bullet Points - One per line */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Bullet Points (one per line)
            </label>
            <textarea
              name="bulletPoints"
              value={form.bulletPoints}
              onChange={handleChange}
              rows="5"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f96b06] transition-all"
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
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f96b06] bg-white transition-all"
            >
              <option value="">All Locations</option>
              {locations.map((loc) => (
                <option key={loc._id} value={loc.slug}>
                  {loc.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">Select a location for this service</p>
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
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#f96b06] transition-all"
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
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f96b06] transition-all"
                min="0"
                placeholder="0"
              />
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Service Image</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-[#f96b06] transition-colors">
              <input
                ref={mainImageRef}
                type="file"
                accept="image/*"
                onChange={handleMainImage}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-[#f96b06] file:text-white hover:file:bg-[#bf4040] cursor-pointer transition-all"
              />
            </div>
            {mainImagePreview && (
              <div className="mt-3 relative inline-block">
                <img 
                  src={mainImagePreview} 
                  alt="Preview" 
                  className="w-32 h-32 object-cover rounded-lg border border-gray-200" 
                />
                <button
                  type="button"
                  onClick={() => { setMainImage(null); setMainImagePreview(''); }}
                  className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                >
                  ×
                </button>
              </div>
            )}
            <p className="text-xs text-gray-400 mt-1">
              Image will be optimized to WebP under 40KB
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
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f96b06] transition-all"
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
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f96b06] transition-all"
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
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f96b06] transition-all"
                  placeholder="taxi, service, travel (comma separated)"
                />
                <p className="text-xs text-gray-400 mt-1">Separate each keyword with a comma</p>
              </div>
            </div>
          </div>

          {/* Footer */}
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
              {loading ? 'Adding...' : 'Add Service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddServiceModal;