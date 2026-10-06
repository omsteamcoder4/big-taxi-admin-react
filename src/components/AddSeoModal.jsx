// src/components/AddSeoModal.jsx
import React, { useState, useCallback } from 'react';
import { seoAPI } from '../api/seo';
import { 
  X, Search, Settings, Globe, 
  ChevronDown, ChevronUp, Save, AlertCircle, 
  Image, Tag, FileText, MapPin, Code,
  Sparkles, Loader2
} from 'lucide-react';

const AddSeoModal = ({ isOpen, onClose, onAddSeo }) => {
  const [formData, setFormData] = useState({
    pageType: '',
    pageIdentifier: 'default',
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    canonicalUrl: '',
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    robots: 'index, follow',
    schemaType: 'LocalBusiness',
    businessName: '',
    businessAddress: '',
    businessPhone: '',
    businessEmail: '',
    businessHours: '',
    businessLatitude: '',
    businessLongitude: '',
    serviceArea: '',
    headerScripts: '',
    footerScripts: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    meta: true,
    og: true,
    advanced: false,
    localSeo: false,
    scripts: false
  });
  const [ogImageFile, setOgImageFile] = useState(null);
  const [ogImagePreview, setOgImagePreview] = useState('');
  
  // AI Loading States
  const [aiLoading, setAiLoading] = useState({
    seo: false,
    local: false,
    all: false,
    scripts: false,
    image: false
  });

  const API_FILE_URL = import.meta.env.VITE_API_URL;

  const pageTypes = [
    { value: 'homepage', label: 'Homepage', description: 'Main landing page of your website', icon: '🏠' },
    { value: 'about', label: 'About Page', description: 'About us and company information', icon: '👥' },
    { value: 'services', label: 'Services Page', description: 'Services listing page', icon: '⚙️' },
    { value: 'fleet', label: 'Fleet Page', description: 'Vehicles and fleet listing page', icon: '🚗' },
    { value: 'contact', label: 'Contact Page', description: 'Contact and inquiry page', icon: '📄' },
    { value: 'booking', label: 'Booking Page', description: 'Online booking page', icon: '📅' }
  ];

  // Declared before it's used below. Wrapped in useCallback so it has a
  // stable identity (used elsewhere, e.g. handleClose).
  const resetForm = useCallback(() => {
    setOgImagePreview(prevPreview => {
      if (prevPreview && prevPreview.startsWith('blob:')) {
        URL.revokeObjectURL(prevPreview);
      }
      return '';
    });

    setFormData({
      pageType: '',
      pageIdentifier: 'default',
      metaTitle: '',
      metaDescription: '',
      metaKeywords: '',
      canonicalUrl: '',
      ogTitle: '',
      ogDescription: '',
      ogImage: '',
      robots: 'index, follow',
      schemaType: 'LocalBusiness',
      businessName: '',
      businessAddress: '',
      businessPhone: '',
      businessEmail: '',
      businessHours: '',
      businessLatitude: '',
      businessLongitude: '',
      serviceArea: '',
      headerScripts: '',
      footerScripts: ''
    });
    setOgImageFile(null);
    setError('');
    setAiLoading({
      seo: false,
      local: false,
      all: false,
      scripts: false,
      image: false
    });
    setExpandedSections({
      basic: true,
      meta: true,
      og: true,
      advanced: false,
      localSeo: false,
      scripts: false
    });
  }, []);

  // Reset the form when the modal transitions from closed -> open.
  // Doing this during render (instead of in a useEffect) avoids an extra
  // render pass and satisfies react-hooks/set-state-in-effect.
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      resetForm();
    }
  }

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOgImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image file (JPEG, PNG, or WEBP)');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Image size should be less than 2MB');
      return;
    }

    if (ogImagePreview && ogImagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(ogImagePreview);
    }

    const preview = URL.createObjectURL(file);
    setOgImagePreview(preview);
    setOgImageFile(file);
    setError('');
    e.target.value = '';
  };

  const removeOgImage = () => {
    if (ogImagePreview && ogImagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(ogImagePreview);
    }
    setOgImageFile(null);
    setOgImagePreview('');
    setFormData(prev => ({ ...prev, ogImage: '' }));
  };

  // Helper function to get full image URL for preview
  const getFullImageUrl = (imagePath) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    if (imagePath.startsWith('/uploads/')) {
      return `${API_FILE_URL}${imagePath}`;
    }
    return `${API_FILE_URL}/uploads/${imagePath}`;
  };

  // ============ AI FUNCTIONS ============

  const handleAIGenerateSEO = async () => {
    if (!formData.pageType) {
      setError('Please select a page type first');
      return;
    }

    setAiLoading(prev => ({ ...prev, seo: true }));
    try {
      const response = await seoAPI.aiGenerateSEOMeta(
        formData.pageType,
        formData.pageIdentifier || 'default',
        formData.businessName,
        formData.businessAddress
      );

      if (response.data.success) {
        const data = response.data.data;
        setFormData(prev => ({
          ...prev,
          metaTitle: data.metaTitle || prev.metaTitle,
          metaDescription: data.metaDescription || prev.metaDescription,
          metaKeywords: data.metaKeywords || prev.metaKeywords,
          ogTitle: data.ogTitle || data.metaTitle || prev.ogTitle,
          ogDescription: data.ogDescription || data.metaDescription || prev.ogDescription
        }));
        setError('✅ SEO meta generated successfully!');
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      console.error('AI SEO generation error:', err);
      setError(err.response?.data?.message || 'Failed to generate SEO meta');
    } finally {
      setAiLoading(prev => ({ ...prev, seo: false }));
    }
  };

  const handleAIGenerateLocal = async () => {
    setAiLoading(prev => ({ ...prev, local: true }));
    try {
      const response = await seoAPI.aiGenerateLocalSEO(
        formData.businessName,
        formData.businessAddress,
        formData.businessPhone,
        formData.businessEmail
      );

      if (response.data.success) {
        const data = response.data.data;
        setFormData(prev => ({
          ...prev,
          businessName: data.businessName || prev.businessName,
          businessAddress: data.businessAddress || prev.businessAddress,
          businessPhone: data.businessPhone || prev.businessPhone,
          businessEmail: data.businessEmail || prev.businessEmail,
          businessHours: data.businessHours || prev.businessHours,
          serviceArea: data.serviceArea || prev.serviceArea,
          businessLatitude: data.businessLatitude || prev.businessLatitude,
          businessLongitude: data.businessLongitude || prev.businessLongitude
        }));
        setError('✅ Local SEO data generated successfully!');
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      console.error('AI Local SEO generation error:', err);
      setError(err.response?.data?.message || 'Failed to generate local SEO data');
    } finally {
      setAiLoading(prev => ({ ...prev, local: false }));
    }
  };

  const handleAIGenerateScripts = async () => {
    if (!formData.pageType) {
      setError('Please select a page type first');
      return;
    }

    setAiLoading(prev => ({ ...prev, scripts: true }));
    try {
      const response = await seoAPI.aiGenerateScripts(
        formData.pageType,
        formData.businessName,
        formData.businessAddress
      );

      if (response.data.success) {
        const data = response.data.data;
        setFormData(prev => ({
          ...prev,
          headerScripts: data.headerScripts || prev.headerScripts,
          footerScripts: data.footerScripts || prev.footerScripts
        }));
        setError('✅ Scripts generated successfully!');
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      console.error('AI Scripts generation error:', err);
      setError(err.response?.data?.message || 'Failed to generate scripts');
    } finally {
      setAiLoading(prev => ({ ...prev, scripts: false }));
    }
  };

  const handleAIGenerateImage = async () => {
    if (!formData.pageType) {
      setError('Please select a page type first');
      return;
    }

    setAiLoading(prev => ({ ...prev, image: true }));
    try {
      const response = await seoAPI.aiGenerateImage(
        formData.pageType,
        formData.businessName || 'Big Taxi Tiruppur',
        `Professional ${formData.pageType} page image for taxi service`
      );

      if (response.data.success) {
        const data = response.data.data;
        const imageUrl = data.ogImage;
        
        if (imageUrl) {
          // Get the full URL for preview
          const fullImageUrl = getFullImageUrl(imageUrl);
          
          setOgImagePreview(fullImageUrl);
          setOgImageFile(null);
          setFormData(prev => ({
            ...prev,
            ogImage: imageUrl // Store the original path/URL
          }));
          setError('✅ Image generated successfully!');
          setTimeout(() => setError(''), 3000);
        } else {
          setError('Failed to generate image: No image URL returned');
        }
      }
    } catch (err) {
      console.error('AI Image generation error:', err);
      setError(err.response?.data?.message || 'Failed to generate image');
    } finally {
      setAiLoading(prev => ({ ...prev, image: false }));
    }
  };

  const handleAIGenerateAll = async () => {
    if (!formData.pageType) {
      setError('Please select a page type first');
      return;
    }

    setAiLoading(prev => ({ ...prev, all: true }));
    setError('');

    try {
      const response = await seoAPI.aiGenerateAll(
        formData.pageType,
        formData.pageIdentifier || 'default',
        formData.businessName,
        formData.businessAddress,
        formData.businessPhone,
        formData.businessEmail
      );

      if (response.data.success) {
        const data = response.data.data;
        
        // Update all form fields with generated data
        const updates = {};
        
        // SEO Meta
        if (data.metaTitle) updates.metaTitle = data.metaTitle;
        if (data.metaDescription) updates.metaDescription = data.metaDescription;
        if (data.metaKeywords) updates.metaKeywords = data.metaKeywords;
        if (data.ogTitle) updates.ogTitle = data.ogTitle;
        if (data.ogDescription) updates.ogDescription = data.ogDescription;
        
        // Local SEO
        if (data.businessName) updates.businessName = data.businessName;
        if (data.businessAddress) updates.businessAddress = data.businessAddress;
        if (data.businessPhone) updates.businessPhone = data.businessPhone;
        if (data.businessEmail) updates.businessEmail = data.businessEmail;
        if (data.businessHours) updates.businessHours = data.businessHours;
        if (data.serviceArea) updates.serviceArea = data.serviceArea;
        if (data.businessLatitude) updates.businessLatitude = data.businessLatitude;
        if (data.businessLongitude) updates.businessLongitude = data.businessLongitude;
        
        // Scripts
        if (data.headerScripts) updates.headerScripts = data.headerScripts;
        if (data.footerScripts) updates.footerScripts = data.footerScripts;
        
        // Image - handle preview properly
        if (data.ogImage) {
          updates.ogImage = data.ogImage;
          const fullImageUrl = getFullImageUrl(data.ogImage);
          setOgImagePreview(fullImageUrl);
          setOgImageFile(null);
        }
        
        setFormData(prev => ({ ...prev, ...updates }));
        
        setError('✅ All SEO data generated successfully!');
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      console.error('AI All SEO generation error:', err);
      setError(err.response?.data?.message || 'Failed to generate SEO data');
    } finally {
      setAiLoading(prev => ({ ...prev, all: false }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.pageType) {
      setError('Please select a page type');
      return;
    }

    setLoading(true);

    try {
      const submitData = new FormData();
      
      submitData.append('pageType', formData.pageType);
      submitData.append('pageIdentifier', formData.pageIdentifier || 'default');
      
      if (formData.metaTitle) submitData.append('metaTitle', formData.metaTitle.trim());
      if (formData.metaDescription) submitData.append('metaDescription', formData.metaDescription.trim());
      if (formData.canonicalUrl) submitData.append('canonicalUrl', formData.canonicalUrl.trim());
      if (formData.ogTitle) submitData.append('ogTitle', formData.ogTitle.trim());
      if (formData.ogDescription) submitData.append('ogDescription', formData.ogDescription.trim());
      if (formData.robots) submitData.append('robots', formData.robots);
      if (formData.schemaType) submitData.append('schemaType', formData.schemaType);
      
      // Local SEO fields
      if (formData.businessName) submitData.append('businessName', formData.businessName.trim());
      if (formData.businessAddress) submitData.append('businessAddress', formData.businessAddress.trim());
      if (formData.businessPhone) submitData.append('businessPhone', formData.businessPhone.trim());
      if (formData.businessEmail) submitData.append('businessEmail', formData.businessEmail.trim());
      if (formData.businessHours) submitData.append('businessHours', formData.businessHours.trim());
      if (formData.businessLatitude) submitData.append('businessLatitude', formData.businessLatitude.trim());
      if (formData.businessLongitude) submitData.append('businessLongitude', formData.businessLongitude.trim());
      if (formData.headerScripts) submitData.append('headerScripts', formData.headerScripts);
      if (formData.footerScripts) submitData.append('footerScripts', formData.footerScripts);
      
      if (formData.serviceArea) {
        const areas = formData.serviceArea.split(',').map(area => area.trim()).filter(area => area);
        submitData.append('serviceArea', JSON.stringify(areas));
      }

      if (formData.metaKeywords) {
        const keywords = formData.metaKeywords
          .split(',')
          .map(k => k.trim())
          .filter(k => k !== '');
        submitData.append('metaKeywords', JSON.stringify(keywords));
      }

      // Handle image - if it's a URL from AI generation, send it as existingOgImage
      if (ogImageFile) {
        submitData.append('ogImage', ogImageFile);
      } else if (formData.ogImage && formData.ogImage.startsWith('/uploads/')) {
        submitData.append('existingOgImage', formData.ogImage);
      } else if (formData.ogImage && formData.ogImage.startsWith('http')) {
        // If it's an external URL from Pollinations, send it as existingOgImage
        submitData.append('existingOgImage', formData.ogImage);
      }

      await onAddSeo(submitData);
      handleClose();
      
    } catch (err) {
      console.error('❌ Error creating SEO:', err);
      setError(err.response?.data?.message || 'Failed to create SEO entry');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  const getPlaceholderByPageType = (field) => {
    const placeholders = {
      homepage: {
        title: 'Big Taxi Tiruppur - Reliable Taxi Services Across Tamil Nadu',
        description: 'Big Taxi Tiruppur makes long-distance travel feel lighter. Safe, reliable, and affordable taxi services.',
        ogTitle: 'Big Taxi Tiruppur - Your Trusted Travel Partner',
        ogDescription: 'Book your ride with Big Taxi Tiruppur. Safe, reliable, and affordable taxi services.'
      },
      about: {
        title: 'About Us - Big Taxi Tiruppur | Our Story & Mission',
        description: 'Learn about Big Taxi Tiruppur - our journey, mission, and commitment to quality service.',
        ogTitle: 'About Big Taxi Tiruppur - Our Story',
        ogDescription: 'Discover the story behind Big Taxi Tiruppur and our commitment to quality service.'
      },
      services: {
        title: 'Taxi Services - Big Taxi Tiruppur | One-Way, Airport, Local Travel',
        description: 'Explore our comprehensive taxi services including one-way drops, round trips, airport transfers, local travel.',
        ogTitle: 'Our Taxi Services - Big Taxi Tiruppur',
        ogDescription: 'From local rides to long-distance outstation trips, we offer a full range of taxi services.'
      },
      fleet: {
        title: 'Our Fleet - Big Taxi Tiruppur | Well-Maintained Vehicles',
        description: 'Choose from our range of clean, comfortable, and regularly serviced vehicles.',
        ogTitle: 'Our Vehicle Fleet - Big Taxi Tiruppur',
        ogDescription: 'Explore our well-maintained fleet of vehicles for comfortable travel.'
      },
      contact: {
        title: 'Contact Us - Big Taxi Tiruppur | 24/7 Support',
        description: 'Get in touch with Big Taxi Tiruppur for bookings, queries, or assistance. 24/7 customer support.',
        ogTitle: 'Contact Big Taxi Tiruppur - We\'re Here to Help',
        ogDescription: 'Reach us by phone, WhatsApp, email, or visit our office.'
      },
      booking: {
        title: 'Book Your Ride - Big Taxi Tiruppur | Quick Online Booking',
        description: 'Book your taxi online with Big Taxi Tiruppur. Fill in your details and we\'ll get you on the road.',
        ogTitle: 'Book Your Ride - Big Taxi Tiruppur',
        ogDescription: 'Quick and easy online booking. Fill in your details and we\'ll get you on the road.'
      }
    };
    return placeholders[formData.pageType]?.[field] || '';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[95vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Search size={20} className="mr-2 text-[#f96b06]" />
              Add SEO Entry
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Configure SEO settings for different pages on your website
            </p>
          </div>
          <button onClick={handleClose} className="p-1.5 hover:bg-gray-100 rounded-full">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className={`px-4 py-3 rounded-lg text-sm ${error.includes('✅') ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
              <div className="flex items-center">
                <AlertCircle size={18} className={`mr-2 flex-shrink-0 ${error.includes('✅') ? 'text-green-500' : 'text-red-500'}`} />
                <span className="text-sm font-medium">{error}</span>
              </div>
            </div>
          )}

          {/* Basic Information */}
          <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
            <div 
              className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer border-b border-gray-200"
              onClick={() => toggleSection('basic')}
            >
              <h3 className="text-sm font-medium text-gray-700 flex items-center">
                <Globe size={16} className="mr-2 text-gray-500" />
                Basic Information
              </h3>
              {expandedSections.basic ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
            </div>
            
            {expandedSections.basic && (
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Page Type <span className="text-red-500">*</span></label>
                  <select
                    name="pageType"
                    value={formData.pageType}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#f96b06]"
                  >
                    <option value="">-- Select page type --</option>
                    {pageTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label} - {type.description}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* AI Generation Buttons */}
                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleAIGenerateAll}
                    disabled={aiLoading.all || !formData.pageType}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg hover:from-purple-600 hover:to-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    {aiLoading.all ? (
                      <Loader2 size={14} className="animate-spin mr-1" />
                    ) : (
                      <Sparkles size={14} className="mr-1" />
                    )}
                    AI Auto-Fill All
                  </button>
                  <button
                    type="button"
                    onClick={handleAIGenerateSEO}
                    disabled={aiLoading.seo || !formData.pageType}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-amber-500 rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-colors"
                  >
                    {aiLoading.seo ? (
                      <Loader2 size={14} className="animate-spin mr-1" />
                    ) : (
                      <Sparkles size={14} className="mr-1" />
                    )}
                    Generate SEO Meta
                  </button>
                  <button
                    type="button"
                    onClick={handleAIGenerateLocal}
                    disabled={aiLoading.local}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
                  >
                    {aiLoading.local ? (
                      <Loader2 size={14} className="animate-spin mr-1" />
                    ) : (
                      <Sparkles size={14} className="mr-1" />
                    )}
                    Generate Local SEO
                  </button>
                  <button
                    type="button"
                    onClick={handleAIGenerateScripts}
                    disabled={aiLoading.scripts || !formData.pageType}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
                  >
                    {aiLoading.scripts ? (
                      <Loader2 size={14} className="animate-spin mr-1" />
                    ) : (
                      <Sparkles size={14} className="mr-1" />
                    )}
                    Generate Scripts
                  </button>
                  <button
                    type="button"
                    onClick={handleAIGenerateImage}
                    disabled={aiLoading.image || !formData.pageType}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-pink-500 rounded-lg hover:bg-pink-600 disabled:opacity-50 transition-colors"
                  >
                    {aiLoading.image ? (
                      <Loader2 size={14} className="animate-spin mr-1" />
                    ) : (
                      <Sparkles size={14} className="mr-1" />
                    )}
                    Generate Image
                  </button>
                </div>
                <p className="text-xs text-gray-500">Click "AI Auto-Fill All" to generate all SEO data automatically (Meta, Local SEO, Scripts & Image)</p>
              </div>
            )}
          </div>

          {/* Meta Tags */}
          <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
            <div 
              className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer border-b border-gray-200"
              onClick={() => toggleSection('meta')}
            >
              <h3 className="text-sm font-medium text-gray-700 flex items-center">
                <Tag size={16} className="mr-2 text-gray-500" />
                Meta Tags
              </h3>
              {expandedSections.meta ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
            </div>
            
            {expandedSections.meta && (
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Meta Title <span className="text-gray-400 text-[10px]">({formData.metaTitle?.length || 0}/60)</span></label>
                  <input
                    type="text"
                    name="metaTitle"
                    value={formData.metaTitle}
                    onChange={handleInputChange}
                    maxLength="60"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#f96b06]"
                    placeholder={getPlaceholderByPageType('title')}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Meta Description <span className="text-gray-400 text-[10px]">({formData.metaDescription?.length || 0}/160)</span></label>
                  <textarea
                    name="metaDescription"
                    value={formData.metaDescription}
                    onChange={handleInputChange}
                    maxLength="160"
                    rows="2"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#f96b06]"
                    placeholder={getPlaceholderByPageType('description')}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Meta Keywords</label>
                  <input
                    type="text"
                    name="metaKeywords"
                    value={formData.metaKeywords}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#f96b06]"
                    placeholder="taxi, service, travel"
                  />
                  <p className="text-xs text-gray-500 mt-1">Separate keywords with commas</p>
                </div>
              </div>
            )}
          </div>

          {/* Open Graph Tags */}
          <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
            <div 
              className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer border-b border-gray-200"
              onClick={() => toggleSection('og')}
            >
              <h3 className="text-sm font-medium text-gray-700 flex items-center">
                <Image size={16} className="mr-2 text-gray-500" />
                Open Graph (Social Media)
              </h3>
              {expandedSections.og ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
            </div>
            
            {expandedSections.og && (
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">OG:Title</label>
                  <input
                    type="text"
                    name="ogTitle"
                    value={formData.ogTitle}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#f96b06]"
                    placeholder={getPlaceholderByPageType('ogTitle')}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">OG:Description</label>
                  <textarea
                    name="ogDescription"
                    value={formData.ogDescription}
                    onChange={handleInputChange}
                    rows="2"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#f96b06]"
                    placeholder={getPlaceholderByPageType('ogDescription')}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">OG:Image</label>
                  {ogImagePreview && (
                    <div className="mb-3 relative inline-block">
                      <img 
                        src={ogImagePreview} 
                        alt="Preview" 
                        className="w-32 h-32 object-cover rounded-lg border"
                        onError={(e) => {
                          // If image fails to load, show fallback
                          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTJlOGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSIjNjU3MzgwIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
                        }}
                      />
                      <button 
                        type="button" 
                        onClick={removeOgImage} 
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  )}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-[#f96b06]">
                    <input type="file" onChange={handleOgImageChange} accept="image/jpeg,image/jpg,image/png,image/webp" className="w-full text-sm" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Recommended: 1200x630px, Max 2MB</p>
                  {formData.ogImage && formData.ogImage.startsWith('http') && !ogImageFile && (
                    <p className="text-xs text-blue-600 mt-1">✓ AI-generated image will be saved</p>
                  )}
                  {formData.ogImage && formData.ogImage.startsWith('/uploads/') && !ogImageFile && (
                    <p className="text-xs text-blue-600 mt-1">✓ Image will be saved</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Advanced Settings */}
          <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
            <div 
              className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer border-b border-gray-200"
              onClick={() => toggleSection('advanced')}
            >
              <h3 className="text-sm font-medium text-gray-700 flex items-center">
                <Settings size={16} className="mr-2 text-gray-500" />
                Advanced Settings
              </h3>
              {expandedSections.advanced ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
            </div>
            
            {expandedSections.advanced && (
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Canonical URL</label>
                  <input type="url" name="canonicalUrl" value={formData.canonicalUrl} onChange={handleInputChange} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" placeholder="https://bigtaxitiruppur.com/page" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Robots Meta Tag</label>
                  <select name="robots" value={formData.robots} onChange={handleInputChange} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm">
                    <option value="index, follow">Index, Follow (Default)</option>
                    <option value="index, nofollow">Index, No Follow</option>
                    <option value="noindex, follow">No Index, Follow</option>
                    <option value="noindex, nofollow">No Index, No Follow</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Schema Type</label>
                  <select name="schemaType" value={formData.schemaType} onChange={handleInputChange} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm">
                    <option value="LocalBusiness">Local Business</option>
                    <option value="Organization">Organization</option>
                    <option value="Product">Product</option>
                    <option value="Article">Article</option>
                    <option value="None">None</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Local SEO Section */}
          <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
            <div 
              className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer border-b border-gray-200"
              onClick={() => toggleSection('localSeo')}
            >
              <h3 className="text-sm font-medium text-gray-700 flex items-center">
                <MapPin size={16} className="mr-2 text-gray-500" />
                Local SEO (Business Information)
              </h3>
              {expandedSections.localSeo ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
            </div>
            
            {expandedSections.localSeo && (
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Business Name</label>
                    <input type="text" name="businessName" value={formData.businessName} onChange={handleInputChange} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" placeholder="Big Taxi Tiruppur" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Business Phone</label>
                    <input type="text" name="businessPhone" value={formData.businessPhone} onChange={handleInputChange} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" placeholder="+91 6379828716" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Business Address</label>
                  <textarea name="businessAddress" value={formData.businessAddress} onChange={handleInputChange} rows="2" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" placeholder="Full business address" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Business Email</label>
                    <input type="email" name="businessEmail" value={formData.businessEmail} onChange={handleInputChange} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" placeholder="info@example.com" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Business Hours</label>
                    <input type="text" name="businessHours" value={formData.businessHours} onChange={handleInputChange} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" placeholder="Mon-Sun: 24/7" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Latitude</label>
                    <input type="text" name="businessLatitude" value={formData.businessLatitude} onChange={handleInputChange} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" placeholder="11.6789" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Longitude</label>
                    <input type="text" name="businessLongitude" value={formData.businessLongitude} onChange={handleInputChange} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" placeholder="78.1234" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Service Area (comma separated)</label>
                  <input type="text" name="serviceArea" value={formData.serviceArea} onChange={handleInputChange} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" placeholder="Salem, Coimbatore, Erode, Chennai, Bangalore" />
                </div>
              </div>
            )}
          </div>

          {/* Header/Footer Scripts */}
          <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
            <div 
              className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer border-b border-gray-200"
              onClick={() => toggleSection('scripts')}
            >
              <h3 className="text-sm font-medium text-gray-700 flex items-center">
                <Code size={16} className="mr-2 text-gray-500" />
                Header & Footer Scripts
              </h3>
              {expandedSections.scripts ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
            </div>
            
            {expandedSections.scripts && (
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Header Scripts</label>
                  <textarea name="headerScripts" value={formData.headerScripts} onChange={handleInputChange} rows="3" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-mono" placeholder="<!-- Google Analytics, Meta Pixel, etc. -->" />
                  <p className="text-xs text-gray-500 mt-1">Scripts will be added in the &lt;head&gt; section</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Footer Scripts</label>
                  <textarea name="footerScripts" value={formData.footerScripts} onChange={handleInputChange} rows="3" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-mono" placeholder="<!-- Chat widgets, remarketing, etc. -->" />
                  <p className="text-xs text-gray-500 mt-1">Scripts will be added before closing &lt;/body&gt; tag</p>
                </div>
              </div>
            )}
          </div>

          {/* Search Result Preview */}
          {formData.metaTitle && (
            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
              <div className="px-4 py-3 bg-gray-50 border-b">
                <h3 className="text-sm font-medium text-gray-700 flex items-center"><FileText size={16} className="mr-2" />Search Result Preview</h3>
              </div>
              <div className="p-4">
                <div className="border rounded-lg p-4">
                  <div className="text-blue-700 text-base font-medium">{formData.metaTitle}</div>
                  <div className="text-green-700 text-xs mt-1">{formData.canonicalUrl || `https://bigtaxitiruppur.com/${formData.pageType}`}</div>
                  <div className="text-gray-600 text-xs mt-2">{formData.metaDescription || 'Page description will appear here...'}</div>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={handleClose} className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading} className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-[#f96b06] to-[#bf4040] rounded-lg hover:from-[#bf4040] hover:to-[#a03535] disabled:opacity-50">
              <Save size={15} /> {loading ? 'Creating...' : 'Create SEO Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSeoModal;