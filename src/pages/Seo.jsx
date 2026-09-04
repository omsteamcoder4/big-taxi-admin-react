// src/pages/Seo.jsx - FIXED
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import AddSeoModal from '../components/AddSeoModal';
import EditSeoModal from '../components/EditSeoModal';
import { seoAPI } from '../api/seo';
import { FaSignOutAlt, FaSortAmountDown, FaSortAmountUp, FaSyncAlt, FaSearch, FaTag, FaRobot, FaCode, FaMapMarkerAlt } from 'react-icons/fa';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-lg font-semibold text-red-800">Something went wrong</h2>
          <p className="text-red-600">{this.state.error?.message}</p>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded hover:from-red-600 hover:to-red-700"
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const Seo = () => {
  const { isAdmin, logout } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSeo, setEditingSeo] = useState(null);
  const [seoEntries, setSeoEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const [sortOption, setSortOption] = useState('newest');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [selectedPageType, setSelectedPageType] = useState('all');
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const pageTypeOptions = [
    { value: 'homepage', label: 'Homepage', icon: '🏠' },
    { value: 'about', label: 'About Page', icon: '👥' },
    { value: 'services', label: 'Services Page', icon: '⚙️' },
    { value: 'fleet', label: 'Fleet Page', icon: '🚗' },
    { value: 'contact', label: 'Contact Page', icon: '📄' },
    { value: 'booking', label: 'Booking Page', icon: '📅' }
  ];

  const getRobotsDisplay = (robots) => {
    if (!robots) return 'index, follow';
    const options = {
      'index, follow': '✅ Index, Follow',
      'index, nofollow': '📝 Index, No Follow',
      'noindex, follow': '🔍 No Index, Follow',
      'noindex, nofollow': '🚫 No Index, No Follow'
    };
    return options[robots] || robots;
  };

  const getSchemaTypeDisplay = (schemaType) => {
    if (!schemaType) return '🏪 Local Business';
    const options = {
      'LocalBusiness': '🏪 Local Business',
      'Organization': '🏢 Organization',
      'Product': '📦 Product',
      'Article': '📄 Article',
      'None': '❌ None'
    };
    return options[schemaType] || schemaType;
  };

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Define fetchSeoEntries BEFORE using it in useEffect
  const fetchSeoEntries = async (showRefreshingState = false) => {
    try {
      if (showRefreshingState) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');
      
      const response = await seoAPI.getAll();
      let seoArray = [];
      
      if (response.data && response.data.success) {
        if (Array.isArray(response.data.data)) {
          seoArray = response.data.data;
        } else if (Array.isArray(response.data.seo)) {
          seoArray = response.data.seo;
        } else if (Array.isArray(response.data)) {
          seoArray = response.data;
        }
      }
      
      setSeoEntries(seoArray);
    } catch {
      console.error('Error fetching SEO entries:');
      setError('Failed to load SEO entries');
      setSeoEntries([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchSeoEntries(true);
  };

  // Fetching SEO entries from the server on mount is a genuine sync with an
  // external system (the API), which is exactly what an effect is for. We
  // intentionally suppress set-state-in-effect here rather than restructure
  // a real data fetch away from its purpose.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSeoEntries();
  }, []);

  // Filter + sort. This is a pure derivation of seoEntries/sortOption/
  // selectedPageType/searchTerm, so it's computed with useMemo instead of
  // useState + useEffect — no extra render pass, and it satisfies
  // react-hooks/set-state-in-effect since there's no setState involved.
  const filteredSeo = useMemo(() => {
    if (!seoEntries.length) return [];

    let result = [...seoEntries];

    if (selectedPageType !== 'all') {
      result = result.filter(seo => seo.pageType === selectedPageType);
    }

    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(seo => 
        (seo.metaTitle && seo.metaTitle.toLowerCase().includes(term)) ||
        (seo.metaDescription && seo.metaDescription.toLowerCase().includes(term)) ||
        (seo.pageType && seo.pageType.toLowerCase().includes(term)) ||
        (seo.businessName && seo.businessName.toLowerCase().includes(term))
      );
    }

    result.sort((a, b) => {
      switch (sortOption) {
        case 'newest':
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        case 'oldest':
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        case 'pageType-asc':
          return (a.pageType || '').localeCompare(b.pageType || '');
        case 'pageType-desc':
          return (b.pageType || '').localeCompare(a.pageType || '');
        case 'title-asc':
          return (a.metaTitle || '').localeCompare(b.metaTitle || '');
        case 'title-desc':
          return (b.metaTitle || '').localeCompare(a.metaTitle || '');
        default:
          return 0;
      }
    });

    return result;
  }, [seoEntries, sortOption, selectedPageType, searchTerm]);

  const getPageTypeDisplay = (pageType) => {
    const found = pageTypeOptions.find(opt => opt.value === pageType);
    return found ? `${found.icon} ${found.label}` : pageType || 'N/A';
  };

  const getPageTypeColor = (pageType) => {
    const colors = {
      homepage: 'bg-purple-100 text-purple-800',
      about: 'bg-indigo-100 text-indigo-800',
      services: 'bg-orange-100 text-orange-800',
      fleet: 'bg-blue-100 text-blue-800',
      contact: 'bg-gray-100 text-gray-800',
      booking: 'bg-green-100 text-green-800'
    };
    return colors[pageType] || 'bg-gray-100 text-gray-800';
  };

  const getRobotsColor = (robots) => {
    if (!robots || robots === 'index, follow') return 'bg-green-100 text-green-800';
    if (robots === 'index, nofollow') return 'bg-yellow-100 text-yellow-800';
    if (robots === 'noindex, follow') return 'bg-orange-100 text-orange-800';
    if (robots === 'noindex, nofollow') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const truncateText = (text, maxLength = 60) => {
    if (!text) return 'Not set';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const handleAddSeo = async (seoData) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found');
        return;
      }
      if (!isAdmin) {
        setError('Admin privileges required');
        return;
      }

      const response = await seoAPI.createOrUpdate(seoData);
      let newSeo;
      
      if (response.data && response.data.data) {
        newSeo = response.data.data;
      } else if (response.data) {
        newSeo = response.data;
      }
      
      if (newSeo && newSeo._id) {
        setSeoEntries(prevEntries => [newSeo, ...prevEntries]);
        setIsModalOpen(false);
        setError('✅ SEO entry added successfully!');
        setTimeout(() => setError(''), 3000);
      } else {
        fetchSeoEntries();
      }
    } catch {
      console.error('Error adding SEO:');
      setError('❌ Failed to add SEO entry');
    }
  };

  const handleEditSeo = async (seoId, seoData) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found');
        return;
      }
      if (!isAdmin) {
        setError('Admin privileges required');
        return;
      }

      const response = await seoAPI.createOrUpdate(seoData);
      let updatedSeo;
      
      if (response.data && response.data.data) {
        updatedSeo = response.data.data;
      } else if (response.data) {
        updatedSeo = response.data;
      }
      
      if (updatedSeo && updatedSeo._id) {
        setSeoEntries(prevEntries => 
          prevEntries.map(seo => seo._id === seoId ? { ...seo, ...updatedSeo } : seo)
        );
        setIsEditModalOpen(false);
        setEditingSeo(null);
        setError('✅ SEO entry updated successfully!');
        setTimeout(() => setError(''), 3000);
      } else {
        fetchSeoEntries();
      }
    } catch {
      console.error('Error updating SEO:');
      setError('❌ Failed to update SEO entry');
    }
  };

  const handleDeleteSeo = async (id) => {
    if (!window.confirm('Are you sure you want to delete this SEO entry? This action cannot be undone.')) {
      return;
    }
    try {
      await seoAPI.delete(id);
      setSeoEntries(prevEntries => prevEntries.filter(seo => seo._id !== id));
      setError('✅ SEO entry deleted successfully!');
      setTimeout(() => setError(''), 3000);
    } catch {
      console.error('Error deleting SEO entry:');
      setError('❌ Failed to delete SEO entry');
    }
  };

  const openEditModal = (seo) => {
    setEditingSeo(seo);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditingSeo(null);
    setIsEditModalOpen(false);
  };

  const getSortLabel = () => {
    switch (sortOption) {
      case 'newest': return 'Newest First';
      case 'oldest': return 'Oldest First';
      case 'pageType-asc': return 'Page Type (A to Z)';
      case 'pageType-desc': return 'Page Type (Z to A)';
      case 'title-asc': return 'Meta Title (A to Z)';
      case 'title-desc': return 'Meta Title (Z to A)';
      default: return 'Sort';
    }
  };

  const clearFilters = () => {
    setSelectedPageType('all');
    setSortOption('newest');
    setSearchTerm('');
  };

  const seoToRender = Array.isArray(filteredSeo) ? filteredSeo : [];

  const SeoCard = ({ seo, index }) => {
    const pageTypeColor = getPageTypeColor(seo.pageType);
    const robotsColor = getRobotsColor(seo.robots);
    
    return (
      <div className="bg-white rounded-lg shadow border border-gray-200 p-4 mb-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center space-x-3">
            <div className="text-sm font-medium text-gray-500">#{index + 1}</div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 truncate max-w-[200px]">
                {truncateText(seo.metaTitle, 40) || 'No Meta Title'}
              </h3>
              <p className="text-xs text-gray-500 mt-1">{truncateText(seo.metaDescription, 60) || 'No meta description set'}</p>
            </div>
          </div>
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${pageTypeColor}`}>
            {getPageTypeDisplay(seo.pageType)}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <p className="text-xs text-gray-500">Page Identifier</p>
            <p className="text-sm text-gray-900 truncate">{seo.pageIdentifier || 'default'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 flex items-center"><FaRobot className="mr-1" size={10} />Robots</p>
            <p className={`text-xs font-medium truncate ${robotsColor} inline-block px-2 py-0.5 rounded-full`}>
              {getRobotsDisplay(seo.robots)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 flex items-center"><FaCode className="mr-1" size={10} />Schema</p>
            <p className="text-xs text-gray-700">{getSchemaTypeDisplay(seo.schemaType)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 flex items-center"><FaMapMarkerAlt className="mr-1" size={10} />Local SEO</p>
            <p className="text-xs text-gray-700">{seo.businessName ? '✓ Has business info' : 'Not set'}</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-gray-500">Meta Title</p>
            <p className="text-sm text-gray-900 font-medium">{truncateText(seo.metaTitle, 50) || 'Not set'}</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-gray-500">Meta Description</p>
            <p className="text-sm text-gray-600">{truncateText(seo.metaDescription, 80) || 'Not set'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Created</p>
            <p className="text-sm text-gray-900">{seo.createdAt ? new Date(seo.createdAt).toLocaleDateString() : 'N/A'}</p>
          </div>
        </div>
        
        {isAdmin && (
          <div className="flex space-x-2 pt-3 border-t border-gray-100">
            <button onClick={() => openEditModal(seo)} className="flex-1 bg-gradient-to-r from-[#f96b06] to-[#bf4040] text-white px-3 py-2 rounded text-sm font-medium hover:from-[#bf4040] hover:to-[#a03535]">Edit</button>
            <button onClick={() => handleDeleteSeo(seo._id)} className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-2 rounded text-sm font-medium hover:from-red-600 hover:to-red-700">Delete</button>
          </div>
        )}
      </div>
    );
  };

  return (
    <ErrorBoundary>
      <div className="flex min-h-screen bg-gray-50 overflow-hidden">
        <Sidebar />
        <div className="flex-1 w-full overflow-hidden">
          <header className="bg-white shadow">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-gray-800">SEO Management</h1>
              </div>
              <button onClick={logout} className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-lg transition duration-200 flex items-center">
                <span className="hidden sm:inline mr-2">Logout</span>
                <FaSignOutAlt />
              </button>
            </div>
          </header>

          <main className="p-4 sm:p-6 overflow-auto h-[calc(100vh-73px)]">
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-700">All SEO Entries ({seoToRender.length})</h2>
              <div className="flex space-x-2 sm:space-x-3 w-full sm:w-auto">
                <button onClick={handleRefresh} disabled={loading || refreshing} className="flex-1 sm:flex-none bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center justify-center text-sm disabled:opacity-50">
                  <FaSyncAlt className={`sm:mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
                </button>
                {isAdmin && (
                  <button onClick={() => setIsModalOpen(true)} className="flex-1 sm:flex-none bg-gradient-to-r from-[#f96b06] to-[#bf4040] hover:from-[#bf4040] hover:to-[#a03535] text-white px-4 py-2 rounded-lg flex items-center justify-center text-sm">
                    <span className="hidden sm:inline mr-2">+</span>
                    <span className="hidden sm:inline">Add SEO Entry</span>
                    <span className="sm:hidden">Add</span>
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow border border-gray-200 mb-4">
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <div className="flex-1">
                  <input type="text" placeholder="Search by title, description, page type, or business name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f96b06] text-sm" />
                </div>
                <div className="relative flex-1">
                  <button onClick={() => setFilterDropdownOpen(!filterDropdownOpen)} className="w-full flex items-center justify-between px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-sm">
                    <span><FaTag className="inline mr-2 text-gray-400" />{selectedPageType === 'all' ? 'All Page Types' : getPageTypeDisplay(selectedPageType)}</span>
                    <svg className={`w-4 h-4 ml-2 transition-transform ${filterDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {filterDropdownOpen && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      <button onClick={() => { setSelectedPageType('all'); setFilterDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100">All Page Types</button>
                      {pageTypeOptions.map(option => (
                        <button key={option.value} onClick={() => { setSelectedPageType(option.value); setFilterDropdownOpen(false); }} className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${selectedPageType === option.value ? 'bg-[#f96b06]/10 text-[#f96b06]' : ''}`}>
                          {option.icon} {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="relative flex-1">
                  <button onClick={() => setSortDropdownOpen(!sortDropdownOpen)} className="w-full flex items-center justify-between px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-sm">
                    <div className="flex items-center"><FaSortAmountDown className="mr-2 text-gray-400" /><span>{getSortLabel()}</span></div>
                    <svg className={`w-4 h-4 ml-2 transition-transform ${sortDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {sortDropdownOpen && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      <button onClick={() => { setSortOption('newest'); setSortDropdownOpen(false); }} className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center ${sortOption === 'newest' ? 'bg-[#f96b06]/10 text-[#f96b06]' : ''}`}><FaSortAmountDown className="mr-2" />Newest First</button>
                      <button onClick={() => { setSortOption('oldest'); setSortDropdownOpen(false); }} className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center ${sortOption === 'oldest' ? 'bg-[#f96b06]/10 text-[#f96b06]' : ''}`}><FaSortAmountUp className="mr-2" />Oldest First</button>
                      <div className="border-t border-gray-100 my-1"></div>
                      <button onClick={() => { setSortOption('pageType-asc'); setSortDropdownOpen(false); }} className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${sortOption === 'pageType-asc' ? 'bg-[#f96b06]/10 text-[#f96b06]' : ''}`}>Page Type (A to Z)</button>
                      <button onClick={() => { setSortOption('pageType-desc'); setSortDropdownOpen(false); }} className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${sortOption === 'pageType-desc' ? 'bg-[#f96b06]/10 text-[#f96b06]' : ''}`}>Page Type (Z to A)</button>
                      <div className="border-t border-gray-100 my-1"></div>
                      <button onClick={() => { setSortOption('title-asc'); setSortDropdownOpen(false); }} className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${sortOption === 'title-asc' ? 'bg-[#f96b06]/10 text-[#f96b06]' : ''}`}>Meta Title (A to Z)</button>
                      <button onClick={() => { setSortOption('title-desc'); setSortDropdownOpen(false); }} className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${sortOption === 'title-desc' ? 'bg-[#f96b06]/10 text-[#f96b06]' : ''}`}>Meta Title (Z to A)</button>
                    </div>
                  )}
                </div>
                {(selectedPageType !== 'all' || sortOption !== 'newest' || searchTerm) && (
                  <button onClick={clearFilters} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Clear</button>
                )}
              </div>
            </div>

            {error && (
              <div className={`px-4 py-3 rounded mb-4 text-sm ${error.includes('✅') ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                {error}
              </div>
            )}

            <div className="bg-white shadow rounded-lg overflow-hidden">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-[#f96b06] mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading SEO entries...</p>
                </div>
              ) : (
                <>
                  {!isMobile ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Page Type</th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Meta Title</th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Meta Description</th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Business Name</th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Robots</th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                            {isAdmin && <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {seoToRender.length > 0 ? (
                            seoToRender.map((seo, index) => {
                              const pageTypeColor = getPageTypeColor(seo.pageType);
                              const robotsColor = getRobotsColor(seo.robots);
                              return (
                                <tr key={seo._id} className="hover:bg-gray-50">
                                  <td className="px-3 py-3 text-sm text-gray-500 text-center">{index + 1}</td>
                                  <td className="px-3 py-3"><span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${pageTypeColor}`}>{getPageTypeDisplay(seo.pageType)}</span></td>
                                  <td className="px-3 py-3"><div className="text-sm font-medium text-gray-900 max-w-xs truncate">{truncateText(seo.metaTitle, 40) || <span className="text-gray-400 italic">Not set</span>}</div></td>
                                  <td className="px-3 py-3"><div className="text-sm text-gray-600 max-w-md truncate">{truncateText(seo.metaDescription, 60) || <span className="text-gray-400 italic">Not set</span>}</div></td>
                                  <td className="px-3 py-3"><div className="text-sm text-gray-700">{seo.businessName || <span className="text-gray-400 italic">Not set</span>}</div></td>
                                  <td className="px-3 py-3"><span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${robotsColor}`}>{getRobotsDisplay(seo.robots)}</span></td>
                                  <td className="px-3 py-3 text-sm text-gray-500">{seo.createdAt ? new Date(seo.createdAt).toLocaleDateString() : 'N/A'}</td>
                                  {isAdmin && (
                                    <td className="px-3 py-3">
                                      <div className="flex space-x-2">
                                        <button onClick={() => openEditModal(seo)} className="bg-gradient-to-r from-[#f96b06] to-[#bf4040] text-white px-3 py-1.5 rounded text-xs font-medium hover:from-[#bf4040] hover:to-[#a03535]">Edit</button>
                                        <button onClick={() => handleDeleteSeo(seo._id)} className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1.5 rounded text-xs font-medium hover:from-red-600 hover:to-red-700">Delete</button>
                                      </div>
                                    </td>
                                  )}
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={isAdmin ? "8" : "7"} className="px-6 py-8 text-center">
                                <FaSearch className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No SEO entries found</h3>
                                <p className="mt-1 text-sm text-gray-500">Get started by creating a new SEO entry.</p>
                                {isAdmin && <button onClick={() => setIsModalOpen(true)} className="mt-4 px-4 py-2 bg-gradient-to-r from-[#f96b06] to-[#bf4040] text-white rounded-lg text-sm">Add SEO Entry</button>}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-4">
                      {seoToRender.length > 0 ? (
                        seoToRender.map((seo, index) => <SeoCard key={seo._id} seo={seo} index={index} />)
                      ) : (
                        <div className="text-center py-8">
                          <FaSearch className="mx-auto h-12 w-12 text-gray-400" />
                          <h3 className="mt-2 text-sm font-medium text-gray-900">No SEO entries found</h3>
                          <p className="mt-1 text-sm text-gray-500">Get started by creating a new SEO entry.</p>
                          {isAdmin && <button onClick={() => setIsModalOpen(true)} className="mt-4 px-4 py-2 bg-gradient-to-r from-[#f96b06] to-[#bf4040] text-white rounded-lg text-sm">Add SEO Entry</button>}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </main>

          <AddSeoModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAddSeo={handleAddSeo} />
          <EditSeoModal isOpen={isEditModalOpen} onClose={closeEditModal} onEditSeo={handleEditSeo} seoData={editingSeo} />
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default Seo;