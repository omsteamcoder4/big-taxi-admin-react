// admin/src/components/EditFleetModal.jsx - With AI Improve and R2
import React, { useState, useRef } from 'react';
import { X, Save, AlertCircle, Bot, Wand2, Loader2 } from 'lucide-react';
import { fleetsAPI } from '../api/fleetsAPI';

const EditFleetModal = ({ isOpen, onClose, onEdit, fleetData }) => {
  const API_URL = import.meta.env.VITE_API_URL;

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
  const [existingMainImage, setExistingMainImage] = useState('');
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryPreviews, setGalleryPreviews] = useState([]);
  const [existingGalleryImages, setExistingGalleryImages] = useState([]);
  const [imagesToRemove, setImagesToRemove] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const mainImageRef = useRef();
  const galleryRef = useRef();

  // AI States
  const [aiLoading, setAiLoading] = useState({ improve: false, image: false });
  const [improveInstruction, setImproveInstruction] = useState('');
  const [showImprove, setShowImprove] = useState(false);

  // Tracks which "open session" the form was last populated for. Keying on
  // fleetData._id means opening the modal again for the same vehicle (after
  // closing) still triggers a fresh reset, just like the old effect did
  // with `isOpen` in its dependency array.
  const [loadedKey, setLoadedKey] = useState(null);
  const currentKey = isOpen && fleetData ? fleetData._id : null;

  // Adjust form state during render when the modal opens (or opens for a
  // different vehicle) instead of resetting it from a useEffect. This is
  // React's recommended pattern for "adjusting state when a prop changes"
  // and avoids the extra render pass a useEffect-based reset causes.
  if (isOpen && fleetData && currentKey !== loadedKey) {
    setLoadedKey(currentKey);
    setForm({
      type: fleetData.type || '',
      slug: fleetData.slug || '',
      description: fleetData.description || '',
      shortDescription: fleetData.shortDescription || '',
      capacity: fleetData.capacity || '',
      luggage: fleetData.luggage || '',
      features: (fleetData.features || []).join(', '),
      ideal: fleetData.ideal || '',
      displayOrder: String(fleetData.displayOrder ?? 0),
      active: String(fleetData.active ?? true),
      metaTitle: fleetData.metaTitle || '',
      metaDescription: fleetData.metaDescription || ''
    });
    setExistingMainImage(fleetData.image || '');
    setExistingGalleryImages(fleetData.images || []);
    setMainImagePreview('');
    setMainImage(null);
    setGalleryImages([]);
    setGalleryPreviews([]);
    setImagesToRemove([]);
    setError('');
    setImproveInstruction('');
    setShowImprove(false);
  } else if (!isOpen && loadedKey !== null) {
    // Modal closed — clear the tracked key so reopening (even for the same
    // vehicle) re-populates the form from fresh fleetData.
    setLoadedKey(null);
  }

  const getImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${API_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  const generateSlug = (text) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

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

    const totalImages = existingGalleryImages.length + galleryImages.length + validFiles.length - imagesToRemove.length;
    if (totalImages > 10) {
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

  const removeExistingGalleryImage = (index) => {
    const imgToRemove = existingGalleryImages[index];
    setImagesToRemove(prev => [...prev, imgToRemove]);
    setExistingGalleryImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewGalleryImage = (index) => {
    setGalleryImages(prev => prev.filter((_, i) => i !== index));
    setGalleryPreviews(prev => prev.filter((_, i) => i !== index));
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
        type: form.type,
        description: form.description,
        shortDescription: form.shortDescription,
        capacity: form.capacity,
        luggage: form.luggage,
        features: form.features ? form.features.split(',').map(f => f.trim()).filter(f => f) : [],
        ideal: form.ideal,
        metaTitle: form.metaTitle,
        metaDescription: form.metaDescription
      };

      const response = await fleetsAPI.improveFleet(currentContent, improveInstruction);
      
      if (response.data.success) {
        const data = response.data.data;
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

  const handleGenerateImage = async () => {
    if (!form.type) {
      setError('Vehicle type is required to generate an image');
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
    
    if (!form.type.trim()) { setError('Vehicle type is required'); return; }
    if (!form.slug.trim()) { setError('Slug is required'); return; }
    if (!form.description.trim()) { setError('Description is required'); return; }
    if (!form.capacity.trim()) { setError('Capacity is required'); return; }
    if (!form.luggage.trim()) { setError('Luggage info is required'); return; }

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
      imagesToRemove.forEach(img => fd.append('removeImages', img));
      
      await onEdit(fleetData._id, fd);
      handleClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update fleet');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setMainImage(null);
    setMainImagePreview('');
    setGalleryImages([]);
    setGalleryPreviews([]);
    setImagesToRemove([]);
    setError('');
    setImproveInstruction('');
    setShowImprove(false);
    onClose();
  };

  if (!isOpen || !fleetData) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10 rounded-t-xl">
          <h2 className="text-xl font-semibold text-gray-900">Edit Vehicle</h2>
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
                    How would you like to improve this vehicle?
                  </label>
                  <textarea
                    value={improveInstruction}
                    onChange={(e) => setImproveInstruction(e.target.value)}
                    placeholder="e.g., Make it more persuasive, focus on comfort features, add more details about capacity, improve SEO..."
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
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Slug * (URL)</label>
              <input
                name="slug"
                value={form.slug}
                onChange={handleChange}
                required
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#f96b06]"
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
            
            {existingMainImage && !mainImagePreview && (
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-1">Current image:</p>
                <img
                  src={getImageUrl(existingMainImage)}
                  alt="Current"
                  className="w-40 h-28 object-cover rounded-lg border border-gray-200"
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/160x112?text=No+Image'; }}
                />
              </div>
            )}
            
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
              Leave empty to keep current image. Images are stored on Cloudflare R2.
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
                <img src={mainImagePreview} alt="New preview" className="w-40 h-28 object-cover rounded-lg border border-gray-200" />
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
            
            {existingGalleryImages.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-1">Current gallery images:</p>
                <div className="flex flex-wrap gap-2">
                  {existingGalleryImages.map((img, idx) => (
                    <div key={idx} className="relative inline-block">
                      <img
                        src={getImageUrl(img)}
                        alt={`Gallery ${idx + 1}`}
                        className="w-20 h-16 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingGalleryImage(idx)}
                        className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-[#f96b06] transition-colors">
              <input
                ref={galleryRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleGalleryImages}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-[#f96b06] file:text-white hover:file:bg-[#bf4040]"
              />
            </div>
            
            {galleryPreviews.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-1">New images to add:</p>
                <div className="flex flex-wrap gap-2">
                  {galleryPreviews.map((preview, idx) => (
                    <div key={idx} className="relative inline-block">
                      <img src={preview} alt={`New gallery ${idx + 1}`} className="w-20 h-16 object-cover rounded-lg border border-gray-200" />
                      <button
                        type="button"
                        onClick={() => removeNewGalleryImage(idx)}
                        className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
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
              {loading ? 'Saving...' : 'Update Vehicle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditFleetModal;