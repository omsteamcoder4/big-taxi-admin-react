// components/ViewServiceModal.jsx - FIXED
import React from 'react';
import { X, MapPin, Star, CheckCircle, Link as LinkIcon } from 'lucide-react';

const ViewServiceModal = ({ isOpen, onClose, serviceData }) => {
  if (!isOpen || !serviceData) return null;

  const API_URL = import.meta.env.VITE_API_URL;

  const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    return `${API_URL}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10 rounded-t-xl">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-900">Service Details</h2>
            {serviceData.isFeatured && (
              <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <Star size={14} /> Featured
              </span>
            )}
            <span className={`text-xs px-2 py-1 rounded-full ${serviceData.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {serviceData.active ? 'Active' : 'Inactive'}
            </span>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Image */}
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Image</label>
                {serviceData.image ? (
                  <img
                    src={getImageUrl(serviceData.image)}
                    alt={serviceData.title}
                    className="w-full max-h-64 object-cover rounded-lg border border-gray-200"
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/400x300?text=No+Image'; }}
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                    <span className="text-gray-400">No Image</span>
                  </div>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Title</label>
                <p className="text-lg font-semibold text-gray-900">{serviceData.title}</p>
              </div>

              {/* Slug */}
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Slug</label>
                <div className="flex items-center gap-2">
                  <LinkIcon size={14} className="text-gray-400" />
                  <span className="text-sm text-gray-600">{serviceData.slug}</span>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Description</label>
                <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-lg">
                  {serviceData.description}
                </p>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Location</label>
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-[rgb(255,128,0)]" />
                  <span className="text-sm font-medium text-gray-700">
                    {serviceData.location || 'All Locations'}
                  </span>
                </div>
              </div>

              {/* Display Order */}
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Display Order</label>
                <span className="text-sm text-gray-700">{serviceData.displayOrder || 0}</span>
              </div>

              {/* Created/Updated Dates */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Created</label>
                  <p className="text-sm text-gray-700">
                    {new Date(serviceData.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Updated</label>
                  <p className="text-sm text-gray-700">
                    {new Date(serviceData.updatedAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Features */}
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Features</label>
                {serviceData.features && serviceData.features.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {serviceData.features.map((feature, index) => (
                      <span key={index} className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full">
                        {feature}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No features</p>
                )}
              </div>

              {/* Bullet Points */}
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Bullet Points</label>
                {serviceData.bulletPoints && serviceData.bulletPoints.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                    {serviceData.bulletPoints.map((point, index) => (
                      <div key={index} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
                        <CheckCircle size={14} className="text-[rgb(255,128,0)] flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">{point}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No bullet points</p>
                )}
              </div>

              {/* SEO Section */}
              <div className="border-t pt-4 mt-4">
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">SEO Settings</label>
                <div className="space-y-2">
                  <div>
                    <span className="text-xs text-gray-400">Meta Title:</span>
                    <p className="text-sm text-gray-700">{serviceData.metaTitle || '—'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400">Meta Description:</span>
                    <p className="text-sm text-gray-700">{serviceData.metaDescription || '—'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400">Meta Keywords:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {serviceData.metaKeywords && serviceData.metaKeywords.length > 0 ? (
                        serviceData.metaKeywords.map((keyword, index) => (
                          <span key={index} className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded">
                            {keyword}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Only Close button */}
        <div className="flex justify-end px-6 py-4 border-t sticky bottom-0 bg-white rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewServiceModal;