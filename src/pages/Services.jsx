// pages/Services.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import { servicesAPI } from '../api/servicesAPI';
import AddServiceModal from '../components/AddServiceModal';
import EditServiceModal from '../components/EditServiceModal';
import ViewServiceModal from '../components/ViewServiceModal';
import {
  FaPlus, FaEdit, FaTrash, FaSyncAlt, FaSearch,
  FaSignOutAlt, FaSortAmountDown, FaImage, FaMapMarkerAlt, FaList, FaLink, FaEye
} from 'react-icons/fa';

const ServicesAdmin = () => {
  const { logout } = useAuth();
  const [services, setServices] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [viewingService, setViewingService] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOption, setSortOption] = useState('newest');
  const [sortOpen, setSortOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL;
  const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || 'http://localhost:3000';

  const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    return `${API_URL}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
  };

  const handleViewService = (service) => {
    setViewingService(service);
    setIsViewOpen(true);
  };

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchServices = async (showRefreshing = false) => {
    try {
      showRefreshing ? setRefreshing(true) : setLoading(true);
      setError('');
      const res = await servicesAPI.getAll({ includeInactive: true });
      setServices(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load services');
      setServices([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchServices(); }, []);

  // Filter + sort
  useEffect(() => {
    let result = [...services];
    if (statusFilter !== 'all') {
      result = result.filter(s => (statusFilter === 'active' ? s.active : !s.active));
    }
    if (search.trim()) {
      const s = search.toLowerCase();
      result = result.filter(svc =>
        svc.title?.toLowerCase().includes(s) ||
        svc.description?.toLowerCase().includes(s) ||
        svc.slug?.toLowerCase().includes(s)
      );
    }
    result.sort((a, b) => {
      if (sortOption === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortOption === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortOption === 'name-asc') return a.title.localeCompare(b.title);
      if (sortOption === 'name-desc') return b.title.localeCompare(a.title);
      return 0;
    });
    setFiltered(result);
  }, [services, statusFilter, search, sortOption]);

  const handleAdd = async (formData) => {
    try {
      const res = await servicesAPI.create(formData);
      setServices(prev => [res.data.data, ...prev]);
      setError('✅ Service added successfully!');
      setTimeout(() => setError(''), 3000);
    } catch (err) {
      setError(`❌ ${err.response?.data?.message || 'Failed to add service'}`);
      throw err;
    }
  };

  const handleEdit = async (id, formData) => {
    try {
      const res = await servicesAPI.update(id, formData);
      setServices(prev => prev.map(s => s._id === id ? res.data.data : s));
      setError('✅ Service updated successfully!');
      setTimeout(() => setError(''), 3000);
    } catch (err) {
      setError(`❌ ${err.response?.data?.message || 'Failed to update service'}`);
      throw err;
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this service? This cannot be undone.')) return;
    try {
      await servicesAPI.delete(id);
      setServices(prev => prev.filter(s => s._id !== id));
      setError('✅ Service deleted successfully!');
      setTimeout(() => setError(''), 3000);
    } catch (err) {
      setError(`❌ ${err.response?.data?.message || 'Failed to delete service'}`);
    }
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setSearch('');
    setSortOption('newest');
  };

  const hasFilters = statusFilter !== 'all' || search || sortOption !== 'newest';

  // Mobile Card Component
  const ServiceCard = ({ svc }) => (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-4 mb-4">
      <div className="flex gap-3 mb-3">
        {svc.image ? (
          <img src={getImageUrl(svc.image)} alt={svc.title}
            className="w-20 h-20 object-cover rounded-lg border border-gray-200 flex-shrink-0"
            onError={(e) => { e.target.src = 'https://via.placeholder.com/80x80?text=No+Image'; }} />
        ) : (
          <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <FaImage className="text-gray-400 text-2xl" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold text-gray-900 truncate">{svc.title}</h3>
            {svc.isFeatured && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 whitespace-nowrap">⭐ Featured</span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{svc.description}</p>
          <div className="flex flex-wrap items-center gap-1 mt-2">
            {svc.location && (
              <span className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded-full flex items-center gap-0.5">
                <FaMapMarkerAlt size={10} /> {svc.location}
              </span>
            )}
            {svc.features?.slice(0, 2).map((f, i) => (
              <span key={i} className="text-xs px-1.5 py-0.5 bg-gray-100 rounded text-gray-600 truncate max-w-[100px]">
                {f.length > 15 ? f.substring(0, 15) + '...' : f}
              </span>
            ))}
            {svc.features?.length > 2 && (
              <span className="text-xs text-gray-400">+{svc.features.length - 2}</span>
            )}
          </div>
          {svc.slug && (
            <div className="flex items-center gap-1 mt-1">
              <FaLink size={10} className="text-gray-400" />
              <span className="text-xs text-gray-400 truncate">
                /services/{svc.slug}
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <span className={`text-xs px-2 py-0.5 rounded-full ${svc.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {svc.active ? 'Active' : 'Inactive'}
        </span>
        <div className="flex gap-2">
          <button 
            onClick={() => handleViewService(svc)}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-3 py-1.5 rounded text-xs flex items-center gap-1"
          >
            <FaEye size={11} /> View
          </button>
          <button onClick={() => { setEditingService(svc); setIsEditOpen(true); }}
            className="bg-gradient-to-r from-[#f96b06] to-[#bf4040] text-white px-3 py-1.5 rounded text-xs flex items-center gap-1">
            <FaEdit size={11} /> Edit
          </button>
          <button onClick={() => handleDelete(svc._id)}
            className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1.5 rounded text-xs flex items-center gap-1">
            <FaTrash size={11} /> Delete
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 w-full">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <FaSearch className="text-[#f96b06]" />
              <h1 className="text-xl font-bold text-gray-800">Services Management</h1>
            </div>
            <button onClick={logout}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm">
              <span className="hidden sm:inline">Logout</span>
              <FaSignOutAlt />
            </button>
          </div>
        </header>

        <main className="p-4 sm:p-6">
          <div className="mb-6 flex flex-col space-y-4">
            {/* Title + Buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-700">
                All Services ({filtered.length})
              </h2>
              <div className="flex gap-2 w-full sm:w-auto">
                <button onClick={() => fetchServices(true)} disabled={loading || refreshing}
                  className="flex-1 sm:flex-none bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm disabled:opacity-50">
                  <FaSyncAlt className={refreshing ? 'animate-spin' : ''} />
                  <span className="hidden sm:inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
                </button>
                <button onClick={() => setIsAddOpen(true)}
                  className="flex-1 sm:flex-none bg-gradient-to-r from-[#f96b06] to-[#bf4040] hover:from-[#bf4040] hover:to-[#a03535] text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm">
                  <FaPlus />
                  <span className="hidden sm:inline">Add Service</span>
                  <span className="sm:hidden">Add</span>
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
              <div className="flex flex-col sm:flex-row gap-2">
                <input type="text" placeholder="Search by title, description or slug..." value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f96b06]" />

                {/* Active/Inactive Filter */}
                <div className="relative flex-1">
                  <button onClick={() => { setStatusOpen(!statusOpen); setSortOpen(false); }}
                    className="w-full flex items-center justify-between px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-sm">
                    <span>{statusFilter === 'all' ? '📋 All Status' : statusFilter === 'active' ? '✅ Active' : '❌ Inactive'}</span>
                    <svg className={`w-4 h-4 transition-transform ${statusOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {statusOpen && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
                      {['all', 'active', 'inactive'].map(s => (
                        <button key={s} onClick={() => { setStatusFilter(s); setStatusOpen(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${statusFilter === s ? 'bg-[#f96b06]/10 text-[#f96b06]' : ''}`}>
                          {s === 'all' ? '📋 All Status' : s === 'active' ? '✅ Active' : '❌ Inactive'}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sort */}
                <div className="relative flex-1">
                  <button onClick={() => { setSortOpen(!sortOpen); setStatusOpen(false); }}
                    className="w-full flex items-center justify-between px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-sm">
                    <div className="flex items-center gap-2">
                      <FaSortAmountDown className="text-gray-400" />
                      <span>{{ newest: 'Newest First', oldest: 'Oldest First', 'name-asc': 'Title (A → Z)', 'name-desc': 'Title (Z → A)' }[sortOption]}</span>
                    </div>
                    <svg className={`w-4 h-4 transition-transform ${sortOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {sortOpen && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
                      {[
                        ['newest', '🆕 Newest First'],
                        ['oldest', '📅 Oldest First'],
                        ['name-asc', '🔤 Title (A → Z)'],
                        ['name-desc', '🔤 Title (Z → A)']
                      ].map(([v, l]) => (
                        <button key={v} onClick={() => { setSortOption(v); setSortOpen(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${sortOption === v ? 'bg-[#f96b06]/10 text-[#f96b06]' : ''}`}>
                          {l}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {hasFilters && (
                  <button onClick={clearFilters} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                    Clear All
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Message */}
          {error && (
            <div className={`px-4 py-3 rounded mb-4 text-sm ${error.includes('✅') ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
              {error}
            </div>
          )}

          {/* Content */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#f96b06] mx-auto" />
                <p className="mt-3 text-gray-500 text-sm">Loading services...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12">
                <FaSearch className="mx-auto h-10 w-10 text-gray-400 mb-3" />
                <h3 className="text-sm font-medium text-gray-900">{hasFilters ? 'No services match your filters' : 'No services yet'}</h3>
                <p className="text-sm text-gray-500 mt-1">{hasFilters ? 'Try adjusting your filters' : 'Add your first service to get started'}</p>
                {hasFilters && (
                  <button onClick={clearFilters} className="mt-4 px-4 py-2 bg-gradient-to-r from-[#f96b06] to-[#bf4040] text-white rounded-lg text-sm">
                    Clear Filters
                  </button>
                )}
                {!hasFilters && (
                  <button onClick={() => setIsAddOpen(true)} className="mt-4 px-4 py-2 bg-gradient-to-r from-[#f96b06] to-[#bf4040] text-white rounded-lg text-sm">
                    <FaPlus className="inline mr-1" size={12} /> Add Your First Service
                  </button>
                )}
              </div>
            ) : isMobile ? (
              <div className="p-4">
                {filtered.map(svc => <ServiceCard key={svc._id} svc={svc} />)}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slug</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Featured</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Display Order</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filtered.map((svc, index) => (
                      <tr key={svc._id} className="hover:bg-gray-50">
                        <td className="px-3 py-3 text-sm text-gray-500">{index + 1}</td>
                        <td className="px-3 py-3">
                          {svc.image ? (
                            <img 
                              src={getImageUrl(svc.image)} 
                              alt={svc.title}
                              className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                              onError={(e) => { e.target.src = 'https://via.placeholder.com/48x48?text=N/A'; }} 
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                              <FaImage className="text-gray-400" />
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <div className="text-sm font-medium text-gray-900 max-w-[200px] truncate" title={svc.title}>
                            {svc.title}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1">
                            <FaLink size={12} className="text-gray-400 flex-shrink-0" />
                            <span className="text-xs text-gray-500 truncate max-w-[150px]" title={svc.slug}>
                              {svc.slug || '—'}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          {svc.location ? (
                            <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full flex items-center gap-0.5 whitespace-nowrap">
                              <FaMapMarkerAlt size={10} /> {svc.location}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-sm text-center">
                          {svc.isFeatured ? <span className="text-yellow-500 text-lg">⭐</span> : '—'}
                        </td>
                        <td className="px-3 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full ${svc.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {svc.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-600 text-center">
                          {svc.displayOrder || 0}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex gap-1.5">
                            <button 
                              onClick={() => handleViewService(svc)}
                              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-2.5 py-1.5 rounded text-xs flex items-center gap-1 transition-all"
                              title="View service details"
                            >
                              <FaEye size={11} /> View
                            </button>
                            <button 
                              onClick={() => { setEditingService(svc); setIsEditOpen(true); }}
                              className="bg-gradient-to-r from-[#f96b06] to-[#bf4040] text-white px-2.5 py-1.5 rounded text-xs flex items-center gap-1 hover:from-[#bf4040] hover:to-[#a03535] transition-all"
                              title="Edit service"
                            >
                              <FaEdit size={11} /> Edit
                            </button>
                            <button 
                              onClick={() => handleDelete(svc._id)}
                              className="bg-gradient-to-r from-red-500 to-red-600 text-white px-2.5 py-1.5 rounded text-xs flex items-center gap-1 hover:from-red-600 hover:to-red-700 transition-all"
                              title="Delete service"
                            >
                              <FaTrash size={11} /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>

        <AddServiceModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} onAdd={handleAdd} />
        <EditServiceModal isOpen={isEditOpen} onClose={() => { setIsEditOpen(false); setEditingService(null); }} onEdit={handleEdit} serviceData={editingService} />
        <ViewServiceModal isOpen={isViewOpen} onClose={() => { setIsViewOpen(false); setViewingService(null); }} serviceData={viewingService} />
      </div>
    </div>
  );
};

export default ServicesAdmin;