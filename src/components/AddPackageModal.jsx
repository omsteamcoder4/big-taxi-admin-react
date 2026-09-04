import React, { useState, useRef } from 'react';
import { X, Save, Upload, AlertCircle, Image, Trash2 } from 'lucide-react';

const AddPackageModal = ({ isOpen, onClose, onAdd }) => {
  const [form, setForm] = useState({
    title: '',
    destination: '',
    features: '',
    shortDescription: '',
    detailedDescription: '',
    isFeatured: false,
    active: 'true',
    displayOrder: '0'
  });
  const [mainImage, setMainImage] = useState(null);
  const [mainImagePreview, setMainImagePreview] = useState('');
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryPreviews, setGalleryPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const mainImageRef = useRef();
  const galleryRef = useRef();

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

    if (validFiles.length > 10) {
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

  // AddPackageModal.jsx - AFTER
const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  if (!form.title.trim()) { setError('Package title is required'); return; }
  if (!form.destination.trim()) { setError('Destination is required'); return; }

  setLoading(true);
  try {
    const fd = new FormData();
    fd.append('title', form.title);
    fd.append('destination', form.destination);
    fd.append('features', form.features.split(',').map(f => f.trim()));
    fd.append('shortDescription', form.shortDescription);
    fd.append('detailedDescription', form.detailedDescription);
    fd.append('isFeatured', form.isFeatured);
    fd.append('active', form.active === 'true');
    fd.append('displayOrder', form.displayOrder);
    
    // ✅ FIX: Main image
    if (mainImage) fd.append('image', mainImage);
    
    // ✅ FIX: Gallery images
    galleryImages.forEach(img => fd.append('images', img));
    
    // ✅ FIX: Call onAdd without any headers - let browser set Content-Type
    await onAdd(fd);
    handleClose();
  } catch (err) {
    setError(err.response?.data?.message || err.message || 'Failed to add package');
  } finally {
    setLoading(false);
  }
};

  const handleClose = () => {
    setForm({
      title: '',
      destination: '',
      features: '',
      shortDescription: '',
      detailedDescription: '',
      isFeatured: false,
      active: 'true',
      displayOrder: '0'
    });
    setMainImage(null);
    setMainImagePreview('');
    setGalleryImages([]);
    setGalleryPreviews([]);
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Add New Package</h2>
          <button onClick={handleClose} className="p-1.5 hover:bg-gray-100 rounded-full">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Title + Destination */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Package Title *</label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                required
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f96b06]"
                placeholder="e.g. Yercaud Hill Station"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Destination *</label>
              <input
                name="destination"
                value={form.destination}
                onChange={handleChange}
                required
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f96b06]"
                placeholder="e.g. Salem to Yercaud"
              />
            </div>
          </div>

          {/* Short Description */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Short Description</label>
            <textarea
              name="shortDescription"
              value={form.shortDescription}
              onChange={handleChange}
              rows="2"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f96b06]"
              placeholder="Brief description for package cards"
            />
          </div>

          {/* Detailed Description */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Detailed Description</label>
            <textarea
              name="detailedDescription"
              value={form.detailedDescription}
              onChange={handleChange}
              rows="4"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f96b06]"
              placeholder="Comprehensive description of the package and destination..."
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
              placeholder="e.g. Pickup from your location, Comfortable vehicle, Experienced driver"
            />
          </div>

          {/* Featured + Active + Display Order */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                name="isFeatured"
                checked={form.isFeatured}
                onChange={handleChange}
                id="featured"
                className="w-4 h-4 text-[#f96b06]"
              />
              <label htmlFor="featured" className="text-sm font-medium text-gray-700">Mark as Featured</label>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Visibility</label>
              <select
                name="active"
                value={form.active}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white"
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
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                min="0"
              />
            </div>
          </div>

          {/* Main Image Upload */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Main Package Image</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-[#f96b06] transition-colors">
              <input
                ref={mainImageRef}
                type="file"
                accept="image/*"
                onChange={handleMainImage}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-[#f96b06] file:text-white hover:file:bg-[#bf4040]"
              />
            </div>
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
              <p className="text-xs text-gray-400 mt-2">You can select up to 10 images</p>
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

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t">
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
              {loading ? 'Adding...' : 'Add Package'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPackageModal;