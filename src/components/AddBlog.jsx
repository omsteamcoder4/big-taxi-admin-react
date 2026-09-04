// src/components/AddBlog.jsx - Updated with OG image generation
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { blogAPI } from '../api/blog';
import { 
  X, Upload, Plus, Trash2, Tag, FileText, Settings, 
  Image, ChevronDown, ChevronUp, Save, AlertCircle, Info, Hash, Eye,
  Sparkles, Wand2, Loader2
} from 'lucide-react';
import { TinyMCE } from 'oms-custom-tinymce/react';

const AddBlog = ({ onSuccess, onCancel, isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [imageCredit, setImageCredit] = useState(null);
  const [ogImagePreview, setOgImagePreview] = useState('');
  const [ogImageCredit, setOgImageCredit] = useState(null);
  
  // AI Loading States
  const [aiLoading, setAiLoading] = useState({
    seo: false,
    excerpt: false,
    tags: false,
    improve: false,
    outline: false,
    image: false,
    ogImage: false,
    allImages: false
  });
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    imageAlt: '',
    excerpt: '',
    category: '',
    tags: '',
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    canonicalUrl: '',
    ogTitle: '',
    ogDescription: '',
    scheduledPublishDate: ''
  });
  
  const [imageFile, setImageFile] = useState(null);
  const [ogImageFile, setOgImageFile] = useState(null);
  const [charCount, setCharCount] = useState({
    title: 0,
    metaTitle: 0,
    metaDescription: 0
  });
  
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    content: true,
    media: true,
    seo: false
  });

  const modalContentRef = useRef(null);
  const previewUrls = useRef(new Set());
  const outlineGeneratedRef = useRef(false);
  const autoGenerateTimeoutRef = useRef(null);
  const isAutoGeneratingRef = useRef(false); // Add ref to track auto-generation state

  const addPreviewUrl = useCallback((url) => {
    if (url) previewUrls.current.add(url);
  }, []);

  const cleanupPreviews = useCallback(() => {
    previewUrls.current.forEach(url => URL.revokeObjectURL(url));
    previewUrls.current.clear();
  }, []);

  const scrollToElement = (elementId) => {
    setTimeout(() => {
      const element = document.getElementById(elementId);
      if (element && modalContentRef.current) {
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + modalContentRef.current.scrollTop - 100;
        
        modalContentRef.current.scrollTo({ top: offsetPosition, behavior: 'smooth' });
        
        element.classList.add('ring-2', 'ring-[#f96b06]', 'border-[#f96b06]');
        setTimeout(() => {
          element.classList.remove('ring-2', 'ring-[#f96b06]', 'border-[#f96b06]');
        }, 3000);
      }
    }, 100);
  };

  useEffect(() => {
    if (error && error.includes('fieldId:')) {
      const fieldId = error.split('fieldId:')[1].split('|')[0];
      scrollToElement(fieldId);
    }
  }, [error]);

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
    return cleanupPreviews;
  }, [isOpen, cleanupPreviews]);

  // ============ AUTO-GENERATE OUTLINE ON TITLE CHANGE ============
  useEffect(() => {
    // Clear any existing timeout
    if (autoGenerateTimeoutRef.current) {
      clearTimeout(autoGenerateTimeoutRef.current);
    }

    // Only auto-generate if title is long enough, no content exists, and it hasn't been generated yet
    if (
      formData.title && 
      formData.title.length > 3 && 
      !formData.content &&
      !aiLoading.outline &&
      !outlineGeneratedRef.current &&
      !isAutoGeneratingRef.current // Check ref flag to prevent focus issues
    ) {
      // Set flag to prevent focus issues
      isAutoGeneratingRef.current = true;
      
      autoGenerateTimeoutRef.current = setTimeout(() => {
        handleGenerateOutline();
        // Reset flag after generation
        setTimeout(() => {
          isAutoGeneratingRef.current = false;
        }, 500);
      }, 2000); // Increased delay to 2 seconds
    }
    
    // Reset flag when content is added manually
    if (formData.content && outlineGeneratedRef.current) {
      outlineGeneratedRef.current = false;
      isAutoGeneratingRef.current = false;
    }

    return () => {
      if (autoGenerateTimeoutRef.current) {
        clearTimeout(autoGenerateTimeoutRef.current);
      }
      // Clean up flag on unmount
      isAutoGeneratingRef.current = false;
    };
  }, [formData.title, formData.content, aiLoading.outline]);

  // ============ AI FUNCTIONS ============

  const handleGenerateSEO = async () => {
    if (!formData.title || !formData.description || !formData.content) {
      setError('Please fill in title, description, and content first');
      return;
    }

    setAiLoading(prev => ({ ...prev, seo: true }));
    try {
      const response = await blogAPI.aiGenerateSEOMeta(
        formData.title,
        formData.description,
        formData.content
      );
      
      if (response.data.success) {
        const { metaTitle, metaDescription } = response.data.data;
        setFormData(prev => ({
          ...prev,
          metaTitle: metaTitle || prev.metaTitle,
          metaDescription: metaDescription || prev.metaDescription,
          ogTitle: metaTitle || prev.ogTitle,
          ogDescription: metaDescription || prev.ogDescription
        }));
        setCharCount(prev => ({
          ...prev,
          metaTitle: metaTitle?.length || prev.metaTitle,
          metaDescription: metaDescription?.length || prev.metaDescription
        }));
        setError('✅ SEO meta generated successfully!');
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      console.error('SEO generation error:', err);
      setError(err.response?.data?.message || 'Failed to generate SEO meta');
    } finally {
      setAiLoading(prev => ({ ...prev, seo: false }));
    }
  };

  const handleGenerateTags = async () => {
    if (!formData.content) {
      setError('Please add content first');
      return;
    }

    setAiLoading(prev => ({ ...prev, tags: true }));
    try {
      const response = await blogAPI.aiGenerateTags(
        formData.title,
        formData.description,
        formData.content
      );
      
      if (response.data.success) {
        const tags = response.data.data.tags;
        setFormData(prev => ({
          ...prev,
          tags: tags.join(', ')
        }));
        setError('✅ Tags generated successfully!');
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      console.error('Tag generation error:', err);
      setError(err.response?.data?.message || 'Failed to generate tags');
    } finally {
      setAiLoading(prev => ({ ...prev, tags: false }));
    }
  };

  const handleGenerateExcerpt = async () => {
    if (!formData.content) {
      setError('Please add content first');
      return;
    }

    setAiLoading(prev => ({ ...prev, excerpt: true }));
    try {
      const response = await blogAPI.aiGenerateExcerpt(formData.content, 250);
      
      if (response.data.success) {
        setFormData(prev => ({
          ...prev,
          excerpt: response.data.data.excerpt
        }));
        setError('✅ Excerpt generated successfully!');
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      console.error('Excerpt generation error:', err);
      setError(err.response?.data?.message || 'Failed to generate excerpt');
    } finally {
      setAiLoading(prev => ({ ...prev, excerpt: false }));
    }
  };

  const handleImproveContent = async () => {
    if (!formData.content) {
      setError('Please add content first');
      return;
    }

    setAiLoading(prev => ({ ...prev, improve: true }));
    try {
      const response = await blogAPI.aiImproveContent(formData.content);
      
      if (response.data.success) {
        setFormData(prev => ({
          ...prev,
          content: response.data.data.content
        }));
        setError('✅ Content improved successfully!');
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      console.error('Content improvement error:', err);
      setError(err.response?.data?.message || 'Failed to improve content');
    } finally {
      setAiLoading(prev => ({ ...prev, improve: false }));
    }
  };

  // Self-contained placeholder image (inline SVG as a data URL) — used only if the AI-generated
  // in-content image failed to generate. No external request, so it always renders regardless
  // of network restrictions or CSP img-src rules.
  const buildInlinePlaceholder = (text) => {
    const label = (text || 'Image').slice(0, 60).replace(/[&<>"]/g, (c) => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]
    ));
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <text x="50%" y="50%" font-family="sans-serif" font-size="28" fill="#9ca3af" text-anchor="middle" dominant-baseline="middle">${label}</text>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  };

  // Turns the AI outline JSON (sections with type: paragraph/bullets/table + optional image)
  // into rich HTML for the TinyMCE editor: headings, short summaries, bullet lists,
  // comparison tables and placeholder images the author can swap out via the editor toolbar.
  const buildOutlineHtml = (outline) => {
    const esc = (s) => (s == null ? '' : String(s));

    const renderImage = (image) => {
      if (!image) return '';
      // Prefer the actual AI-generated image (embedded as a base64 data URL by the backend).
      // Fall back to a self-contained inline SVG placeholder — no external domain involved,
      // so it can never be blocked by network restrictions, ad-blockers, or CSP img-src rules.
      const src = image.dataUrl || buildInlinePlaceholder(image.suggestion || 'Suggested image');
      return `
        <figure class="blog-image-suggestion">
          <img src="${src}" alt="${esc(image.alt) || esc(image.suggestion)}" />
          <figcaption>${esc(image.caption) || esc(image.suggestion) || 'Replace this placeholder with a real image'}</figcaption>
        </figure>
      `;
    };

    const renderTable = (table) => {
      if (!table?.headers?.length) return '';
      const thead = `<thead><tr>${table.headers.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead>`;
      const tbody = `<tbody>${(table.rows || [])
        .map(row => `<tr>${row.map(cell => `<td>${esc(cell)}</td>`).join('')}</tr>`)
        .join('')}</tbody>`;
      return `<table>${thead}${tbody}</table>`;
    };

    let html = `<p>${esc(outline.introduction)}</p>`;

    (outline.sections || []).forEach(section => {
      html += `<h2>${esc(section.heading)}</h2>`;
      if (section.summary) {
        html += `<p><em>${esc(section.summary)}</em></p>`;
      }
      if (section.image) {
        html += renderImage(section.image);
      }

      if (section.type === 'table' && section.table) {
        html += renderTable(section.table);
      } else if (section.type === 'bullets' && section.bullets?.length) {
        html += `<ul>${section.bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul>`;
      } else if (section.body) {
        html += `<p>${esc(section.body)}</p>`;
      } else if (section.points?.length) {
        // Backward compatibility with the older "points" shape
        html += `<ul>${section.points.map(p => `<li>${esc(p)}</li>`).join('')}</ul>`;
      }
    });

    html += `<h2>Conclusion</h2><p>${esc(outline.conclusion)}</p>`;
    return html;
  };

  const handleGenerateOutline = async () => {
    if (!formData.title) {
      setError('Please enter a topic/title first');
      return;
    }

    // Prevent multiple simultaneous generations
    if (aiLoading.outline) return;

    setAiLoading(prev => ({ ...prev, outline: true }));
    try {
      const response = await blogAPI.aiGenerateOutline(
        formData.title,
        formData.category
      );
      
      if (response.data.success) {
        const outline = response.data.data;
        const content = buildOutlineHtml(outline);
        
        setFormData(prev => ({
          ...prev,
          title: outline.title || prev.title,
          category: prev.category || outline.suggestedCategory || prev.category,
          description: prev.description || outline.shortDescription || prev.description,
          content: content,
          excerpt: prev.excerpt || (outline.introduction ? outline.introduction.substring(0, 250) + '...' : prev.excerpt),
          imageAlt: prev.imageAlt || outline.imageAltText || prev.imageAlt,
          metaKeywords: prev.metaKeywords || (Array.isArray(outline.metaKeywords) ? outline.metaKeywords.join(', ') : prev.metaKeywords),
          metaTitle: prev.metaTitle || (outline.title ? outline.title.substring(0, 65) : prev.metaTitle),
          metaDescription: prev.metaDescription || (outline.introduction ? outline.introduction.substring(0, 155) : prev.metaDescription),
          ogTitle: prev.ogTitle || (outline.title ? outline.title : prev.ogTitle),
          ogDescription: prev.ogDescription || (outline.introduction ? outline.introduction.substring(0, 155) : prev.ogDescription)
        }));
        
        if (outline.title) {
          setCharCount(prev => ({
            ...prev,
            title: outline.title.length,
            metaTitle: outline.title.substring(0, 65).length
          }));
        }
        
        setError('✅ Outline generated successfully!');
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      console.error('Outline generation error:', err);
      setError(err.response?.data?.message || 'Failed to generate outline');
    } finally {
      setAiLoading(prev => ({ ...prev, outline: false }));
      // Reset auto-generate flag
      isAutoGeneratingRef.current = false;
    }
  };

  const base64ToFile = (base64Data, mimeType, filename) => {
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    return new File([blob], filename, { type: mimeType });
  };

  // Generate Featured Image
  const handleGenerateImage = async (isAuto = false) => {
    if (!formData.title) {
      if (!isAuto) setError('Please enter a blog title first');
      return;
    }

    setAiLoading(prev => ({ ...prev, image: true }));
    try {
      const response = await blogAPI.aiGenerateImage(formData.title, formData.description);

      if (response.data.success) {
        const { data, mimeType, source, model } = response.data.data;
        const extension = (mimeType || 'image/jpeg').split('/')[1] || 'jpg';
        const file = base64ToFile(data, mimeType || 'image/jpeg', `blog-image-${Date.now()}.${extension}`);

        if (imagePreview) {
          URL.revokeObjectURL(imagePreview);
          previewUrls.current.delete(imagePreview);
        }

        setImageFile(file);
        const preview = URL.createObjectURL(file);
        addPreviewUrl(preview);
        setImagePreview(preview);
        setImageCredit(source === 'pollinations.ai' ? { source: 'AI Generated', model } : null);

        if (!isAuto) {
          setError('✅ Featured image generated successfully!');
          setTimeout(() => setError(''), 3000);
        }
      }
    } catch (err) {
      console.error('Image generation error:', err);
      if (!isAuto) {
        setError(err.response?.data?.message || 'Failed to generate image');
      }
    } finally {
      setAiLoading(prev => ({ ...prev, image: false }));
    }
  };

  // NEW: Generate Open Graph Image
  const handleGenerateOGImage = async () => {
    if (!formData.title) {
      setError('Please enter a blog title first');
      return;
    }

    setAiLoading(prev => ({ ...prev, ogImage: true }));
    try {
      const response = await blogAPI.aiGenerateOGImage(formData.title, formData.description);

      if (response.data.success) {
        const { data, mimeType, source, model } = response.data.data;
        const extension = (mimeType || 'image/jpeg').split('/')[1] || 'jpg';
        const file = base64ToFile(data, mimeType || 'image/jpeg', `og-image-${Date.now()}.${extension}`);

        if (ogImagePreview) {
          URL.revokeObjectURL(ogImagePreview);
          previewUrls.current.delete(ogImagePreview);
        }

        setOgImageFile(file);
        const preview = URL.createObjectURL(file);
        addPreviewUrl(preview);
        setOgImagePreview(preview);
        setOgImageCredit(source === 'pollinations.ai' ? { source: 'AI Generated', model } : null);

        setError('✅ Open Graph image generated successfully!');
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      console.error('OG Image generation error:', err);
      setError(err.response?.data?.message || 'Failed to generate OG image');
    } finally {
      setAiLoading(prev => ({ ...prev, ogImage: false }));
    }
  };

  // NEW: Generate Both Images
  const handleGenerateAllImages = async () => {
    if (!formData.title) {
      setError('Please enter a blog title first');
      return;
    }

    setAiLoading(prev => ({ ...prev, allImages: true }));
    try {
      const response = await blogAPI.aiGenerateAllImages(formData.title, formData.description);

      if (response.data.success) {
        const { featured, og } = response.data.data;

        // Set Featured Image
        if (featured) {
          const { data, mimeType, source, model } = featured;
          const extension = (mimeType || 'image/jpeg').split('/')[1] || 'jpg';
          const file = base64ToFile(data, mimeType || 'image/jpeg', `blog-image-${Date.now()}.${extension}`);

          if (imagePreview) {
            URL.revokeObjectURL(imagePreview);
            previewUrls.current.delete(imagePreview);
          }

          setImageFile(file);
          const preview = URL.createObjectURL(file);
          addPreviewUrl(preview);
          setImagePreview(preview);
          setImageCredit(source === 'pollinations.ai' ? { source: 'AI Generated', model } : null);
        }

        // Set OG Image
        if (og) {
          const { data, mimeType, source, model } = og;
          const extension = (mimeType || 'image/jpeg').split('/')[1] || 'jpg';
          const file = base64ToFile(data, mimeType || 'image/jpeg', `og-image-${Date.now()}.${extension}`);

          if (ogImagePreview) {
            URL.revokeObjectURL(ogImagePreview);
            previewUrls.current.delete(ogImagePreview);
          }

          setOgImageFile(file);
          const preview = URL.createObjectURL(file);
          addPreviewUrl(preview);
          setOgImagePreview(preview);
          setOgImageCredit(source === 'pollinations.ai' ? { source: 'AI Generated', model } : null);
        }

        setError('✅ Both images generated successfully!');
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      console.error('All images generation error:', err);
      setError(err.response?.data?.message || 'Failed to generate images');
    } finally {
      setAiLoading(prev => ({ ...prev, allImages: false }));
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    if (['title', 'metaTitle', 'metaDescription'].includes(name)) {
      setCharCount(prev => ({ ...prev, [name]: value.length }));
    }
  };

  // TinyMCE fires onEditorChange(content, editor) with the HTML content
  const handleEditorChange = (content) => {
    setFormData(prev => ({ ...prev, content }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const preview = URL.createObjectURL(file);
      addPreviewUrl(preview);
      setImagePreview(preview);
      setImageCredit(null);
    }
    e.target.value = '';
  };

  const handleOgImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setOgImageFile(file);
      const preview = URL.createObjectURL(file);
      addPreviewUrl(preview);
      setOgImagePreview(preview);
      setOgImageCredit(null);
    }
    e.target.value = '';
  };

  const removeImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      previewUrls.current.delete(imagePreview);
    }
    setImagePreview('');
    setImageFile(null);
    setImageCredit(null);
  };

  const removeOgImage = () => {
    if (ogImagePreview) {
      URL.revokeObjectURL(ogImagePreview);
      previewUrls.current.delete(ogImagePreview);
    }
    setOgImagePreview('');
    setOgImageFile(null);
    setOgImageCredit(null);
  };

  const generateExcerpt = () => {
    if (formData.description) {
      const excerpt = formData.description.substring(0, 250) + '...';
      setFormData({ ...formData, excerpt });
    }
  };

  const generateSEOFIelds = () => {
    const updates = {};
    
    if (formData.title) {
      if (!formData.metaTitle) {
        updates.metaTitle = formData.title.substring(0, 65);
      }
      if (!formData.ogTitle) {
        updates.ogTitle = formData.title;
      }
    }
    
    if (formData.description) {
      if (!formData.metaDescription) {
        updates.metaDescription = formData.description.substring(0, 155);
      }
      if (!formData.ogDescription) {
        updates.ogDescription = formData.description.substring(0, 155);
      }
    }
    
    if (Object.keys(updates).length > 0) {
      setFormData({ ...formData, ...updates });
      
      if (updates.metaTitle) {
        setCharCount(prev => ({ ...prev, metaTitle: updates.metaTitle.length }));
      }
      if (updates.metaDescription) {
        setCharCount(prev => ({ ...prev, metaDescription: updates.metaDescription.length }));
      }
    }
  };

  const resetForm = () => {
    removeImage();
    removeOgImage();
    outlineGeneratedRef.current = false;
    isAutoGeneratingRef.current = false; // Reset the ref
    
    if (autoGenerateTimeoutRef.current) {
      clearTimeout(autoGenerateTimeoutRef.current);
    }
    
    setFormData({
      title: '',
      description: '',
      content: '',
      imageAlt: '',
      excerpt: '',
      category: '',
      tags: '',
      metaTitle: '',
      metaDescription: '',
      metaKeywords: '',
      canonicalUrl: '',
      ogTitle: '',
      ogDescription: '',
      scheduledPublishDate: ''
    });
    setError('');
    setCharCount({
      title: 0,
      metaTitle: 0,
      metaDescription: 0
    });
  };

  const handleClose = () => {
    cleanupPreviews();
    resetForm();
    if (onClose) onClose();
    if (onCancel) onCancel();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.title.trim()) {
      setError('fieldId:blog-title|Please enter a blog title');
      scrollToElement('blog-title');
      return;
    }

    if (!formData.description.trim()) {
      setError('fieldId:blog-description|Please enter a blog description');
      scrollToElement('blog-description');
      return;
    }

    if (!formData.content.trim()) {
      setError('fieldId:blog-content|Please enter blog content');
      scrollToElement('blog-content');
      return;
    }

    if (!imageFile) {
      setError('fieldId:blog-image|Please upload a featured image');
      scrollToElement('blog-image');
      return;
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();
      
      Object.keys(formData).forEach(key => {
        if (formData[key] && typeof formData[key] === 'string' && formData[key].trim() !== '') {
          formDataToSend.append(key, formData[key]);
        }
      });

      if (imageFile) {
        formDataToSend.append('image', imageFile);
      }
      
      if (ogImageFile) {
        formDataToSend.append('ogImage', ogImageFile);
      }

      // This form has no draft/publish toggle — the button says "Publish Blog",
      // so explicitly send status: 'published'. Without this the backend
      // (createBlog) silently defaults every new post to 'draft'.
      formDataToSend.append('status', 'published');

      await blogAPI.createBlog(formDataToSend);
      
      if (onSuccess) {
        onSuccess();
      }
      handleClose();
    } catch (err) {
      console.error('❌ Error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to save blog');
      if (modalContentRef.current) modalContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] m-0 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <FileText size={20} className="mr-2 text-[#f96b06]" />
              Add New Blog
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Create a new blog post with AI assistance</p>
          </div>
          <button 
            onClick={handleClose} 
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1" ref={modalContentRef}>
          {error && !error.includes('fieldId:') && (
            <div className={`px-4 py-3 rounded-lg text-sm ${error.includes('✅') ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
              <div className="flex items-center">
                <AlertCircle size={18} className="mr-2 text-red-500 flex-shrink-0" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* Basic Information */}
            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
              <div 
                className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer border-b border-gray-200"
                onClick={() => toggleSection('basic')}
              >
                <h3 className="text-sm font-medium text-gray-700 flex items-center">
                  <Info size={16} className="mr-2 text-gray-500" />
                  Basic Information
                </h3>
                {expandedSections.basic ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
              </div>
              
              {expandedSections.basic && (
                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Blog Title <span className="text-red-500">*</span>
                      <span className="ml-2 text-gray-400 text-[10px]">
                        {charCount.title}/200
                      </span>
                    </label>
                    <input
                      id="blog-title"
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                      maxLength="200"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#f96b06] focus:border-[#f96b06] text-sm"
                      placeholder="Enter blog title"
                      onBlur={generateSEOFIelds}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      {formData.title && !formData.content && !aiLoading.outline ? '⏳ AI will generate outline automatically...' : ''}
                      {aiLoading.outline ? '⏳ Generating outline...' : ''}
                    </p>
                    <button
                      type="button"
                      onClick={handleGenerateOutline}
                      disabled={aiLoading.outline}
                      className="mt-2 inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-purple-500 rounded-lg hover:bg-purple-600 disabled:opacity-50 transition-colors"
                    >
                      {aiLoading.outline ? (
                        <Loader2 size={14} className="animate-spin mr-1" />
                      ) : (
                        <Sparkles size={14} className="mr-1" />
                      )}
                      Generate Outline with AI
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Category <span className="text-gray-400">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#f96b06] focus:border-[#f96b06] text-sm"
                      placeholder="e.g., Travel Tips, Destinations"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Schedule Publish Date <span className="text-gray-400">(Optional)</span>
                    </label>
                    <input
                      type="datetime-local"
                      name="scheduledPublishDate"
                      value={formData.scheduledPublishDate}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#f96b06] focus:border-[#f96b06] text-sm"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Set a future date to publish automatically
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Description & Content */}
            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
              <div 
                className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer border-b border-gray-200"
                onClick={() => toggleSection('content')}
              >
                <h3 className="text-sm font-medium text-gray-700 flex items-center">
                  <FileText size={16} className="mr-2 text-gray-500" />
                  Description & Content <span className="text-red-500 ml-1">*</span>
                </h3>
                {expandedSections.content ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
              </div>
              
              {expandedSections.content && (
                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Short Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="blog-description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      required
                      rows="3"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#f96b06] focus:border-[#f96b06] text-sm"
                      placeholder="Brief description of the blog"
                      onBlur={generateExcerpt}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Full Content <span className="text-red-500">*</span>
                    </label>
                    <div id="blog-content" className="rounded-lg overflow-hidden border border-gray-300 focus-within:ring-2 focus-within:ring-[#f96b06] focus-within:border-[#f96b06]">
                      <TinyMCE
                        value={formData.content}
                        onEditorChange={handleEditorChange}
                        themeSwitch
                        init={{
                          baseUrl: "/assets/tinymce",
                          height: 420,
                          placeholder: "Write your blog content here...",
                        }}
                      />
                    </div>
                    {!formData.content && (
                      <p className="text-xs text-gray-400 mt-1">Full content is required.</p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      <button
                        type="button"
                        onClick={handleGenerateExcerpt}
                        disabled={aiLoading.excerpt}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
                      >
                        {aiLoading.excerpt ? (
                          <Loader2 size={14} className="animate-spin mr-1" />
                        ) : (
                          <Wand2 size={14} className="mr-1" />
                        )}
                        Generate Excerpt
                      </button>
                      
                      <button
                        type="button"
                        onClick={handleGenerateTags}
                        disabled={aiLoading.tags}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
                      >
                        {aiLoading.tags ? (
                          <Loader2 size={14} className="animate-spin mr-1" />
                        ) : (
                          <Sparkles size={14} className="mr-1" />
                        )}
                        Generate Tags
                      </button>
                      
                      <button
                        type="button"
                        onClick={handleImproveContent}
                        disabled={aiLoading.improve}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-indigo-500 rounded-lg hover:bg-indigo-600 disabled:opacity-50 transition-colors"
                      >
                        {aiLoading.improve ? (
                          <Loader2 size={14} className="animate-spin mr-1" />
                        ) : (
                          <Wand2 size={14} className="mr-1" />
                        )}
                        Improve Content
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Media Section - Updated with OG Image Generation */}
            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
              <div 
                className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer border-b border-gray-200"
                onClick={() => toggleSection('media')}
              >
                <h3 className="text-sm font-medium text-gray-700 flex items-center">
                  <Image size={16} className="mr-2 text-gray-500" />
                  Media <span className="text-red-500 ml-1">*</span>
                </h3>
                {expandedSections.media ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
              </div>
              
              {expandedSections.media && (
                <div className="p-4 space-y-6">
                  {/* Featured Image Section */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Featured Image <span className="text-red-500">*</span>
                    </label>
                    
                    {/* AI Image Generation Buttons */}
                    <div className="flex flex-wrap gap-2 mb-2">
                      <button
                        type="button"
                        onClick={() => handleGenerateImage(false)}
                        disabled={aiLoading.image}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-pink-500 rounded-lg hover:bg-pink-600 disabled:opacity-50 transition-colors"
                      >
                        {aiLoading.image ? (
                          <Loader2 size={14} className="animate-spin mr-1" />
                        ) : (
                          <Sparkles size={14} className="mr-1" />
                        )}
                        Generate Featured Image
                      </button>
                      
                      <button
                        type="button"
                        onClick={handleGenerateOGImage}
                        disabled={aiLoading.ogImage}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-purple-500 rounded-lg hover:bg-purple-600 disabled:opacity-50 transition-colors"
                      >
                        {aiLoading.ogImage ? (
                          <Loader2 size={14} className="animate-spin mr-1" />
                        ) : (
                          <Sparkles size={14} className="mr-1" />
                        )}
                        Generate OG Image
                      </button>
                      
                      <button
                        type="button"
                        onClick={handleGenerateAllImages}
                        disabled={aiLoading.allImages}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 transition-colors"
                      >
                        {aiLoading.allImages ? (
                          <Loader2 size={14} className="animate-spin mr-1" />
                        ) : (
                          <Sparkles size={14} className="mr-1" />
                        )}
                        Generate Both Images
                      </button>
                    </div>
                    
                    {aiLoading.image && (
                      <p className="text-xs text-gray-400 mb-2">⏳ Generating featured image...</p>
                    )}
                    {aiLoading.ogImage && (
                      <p className="text-xs text-gray-400 mb-2">⏳ Generating OG image...</p>
                    )}
                    {aiLoading.allImages && (
                      <p className="text-xs text-gray-400 mb-2">⏳ Generating both images...</p>
                    )}
                    
                    <div id="blog-image" className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-[#f96b06] transition-colors">
                      <input
                        type="file"
                        onChange={handleImageChange}
                        accept="image/*"
                        required={!imageFile}
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-[#f96b06] file:text-white hover:file:bg-[#bf4040]"
                      />
                    </div>
                    <p className="text-xs text-amber-600 mt-2">⚠️ Featured image required for blog posts</p>
                    
                    {imagePreview && (
                      <div className="mt-4">
                        <p className="text-xs font-medium text-gray-600 mb-2">Featured Image Preview</p>
                        <div className="relative group w-48">
                          <div className="w-full aspect-video bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={removeImage}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs shadow-lg hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                        {imageCredit && (
                          <p className="text-xs text-gray-400 mt-1">
                            Generated by AI ({imageCredit.model || 'Pollinations'})
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Image Alt Text */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Image Alt Text <span className="text-gray-400">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      name="imageAlt"
                      value={formData.imageAlt}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#f96b06] focus:border-[#f96b06] text-sm"
                      placeholder="Description for accessibility"
                    />
                  </div>

                  {/* Open Graph Image Section - NEW */}
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Open Graph Image <span className="text-gray-400">(Optional - for social sharing)</span>
                    </label>
                    
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-[#f96b06] transition-colors">
                      <input
                        type="file"
                        onChange={handleOgImageChange}
                        accept="image/*"
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-medium file:bg-[#f96b06] file:text-white hover:file:bg-[#bf4040]"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Recommended size: 1200 x 630 pixels (1.91:1 ratio)</p>
                    
                    {ogImagePreview && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-gray-600 mb-2">OG Image Preview</p>
                        <div className="relative group w-64">
                          <div className="w-full aspect-[1.91/1] bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                            <img
                              src={ogImagePreview}
                              alt="OG Preview"
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={removeOgImage}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs shadow-lg hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                        {ogImageCredit && (
                          <p className="text-xs text-gray-400 mt-1">
                            Generated by AI ({ogImageCredit.model || 'Pollinations'})
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* SEO Settings */}
            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
              <div 
                className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer border-b border-gray-200"
                onClick={() => toggleSection('seo')}
              >
                <h3 className="text-sm font-medium text-gray-700 flex items-center">
                  <Settings size={16} className="mr-2 text-gray-500" />
                  SEO Settings (Optional)
                </h3>
                {expandedSections.seo ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
              </div>
              
              {expandedSections.seo && (
                <div className="p-4">
                  <div className="mb-4">
                    <button
                      type="button"
                      onClick={handleGenerateSEO}
                      disabled={aiLoading.seo}
                      className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-amber-500 rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-colors"
                    >
                      {aiLoading.seo ? (
                        <Loader2 size={14} className="animate-spin mr-1" />
                      ) : (
                        <Sparkles size={14} className="mr-1" />
                      )}
                      Generate SEO Meta with AI
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Meta Title
                        <span className="ml-2 text-gray-400 text-[10px]">
                          {charCount.metaTitle}/70
                        </span>
                      </label>
                      <input
                        type="text"
                        name="metaTitle"
                        value={formData.metaTitle}
                        onChange={handleChange}
                        maxLength="70"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f96b06]"
                        placeholder="Title for search engines"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Meta Description
                        <span className="ml-2 text-gray-400 text-[10px]">
                          {charCount.metaDescription}/160
                        </span>
                      </label>
                      <textarea
                        name="metaDescription"
                        value={formData.metaDescription}
                        onChange={handleChange}
                        maxLength="160"
                        rows="2"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f96b06]"
                        placeholder="Description for search engines"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Meta Keywords
                      </label>
                      <input
                        type="text"
                        name="metaKeywords"
                        value={formData.metaKeywords}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f96b06]"
                        placeholder="keyword1, keyword2, keyword3"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Canonical URL
                      </label>
                      <input
                        type="text"
                        name="canonicalUrl"
                        value={formData.canonicalUrl}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f96b06]"
                        placeholder="https://example.com/blog-post"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        OG:Title (Social Media)
                      </label>
                      <input
                        type="text"
                        name="ogTitle"
                        value={formData.ogTitle}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f96b06]"
                        placeholder="Title for social sharing"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        OG:Description (Social Media)
                      </label>
                      <textarea
                        name="ogDescription"
                        value={formData.ogDescription}
                        onChange={handleChange}
                        rows="2"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f96b06]"
                        placeholder="Description for social sharing"
                      />
                    </div>
                  </div>
                  
                  {formData.metaTitle && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-xs font-medium text-gray-700 mb-2">Search Result Preview:</p>
                      <div className="border border-gray-200 rounded-lg p-3 bg-white">
                        <div className="text-blue-700 text-base font-medium truncate">
                          {formData.metaTitle || 'Blog Title'}
                        </div>
                        <div className="text-green-700 text-xs truncate">
                          https://yourblog.com/posts/{formData.title?.toLowerCase().replace(/\s+/g, '-') || 'blog-slug'}
                        </div>
                        <div className="text-gray-600 text-xs mt-1 line-clamp-2">
                          {formData.metaDescription || 'Blog description will appear here...'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-6 mt-6 border-t">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors order-2 sm:order-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-[#f96b06] to-[#bf4040] border border-transparent rounded-lg hover:from-[#bf4040] hover:to-[#a03535] disabled:opacity-50 disabled:cursor-not-allowed transition-colors order-1 sm:order-2"
            >
              <Save size={16} className="mr-2" />
              {loading ? 'Publishing...' : 'Publish Blog'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBlog;