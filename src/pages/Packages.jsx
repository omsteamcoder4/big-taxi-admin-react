import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import { packagesAPI } from '../api/packagesAPI';
import AddPackageModal from '../components/AddPackageModal';
import EditPackageModal from '../components/EditPackageModal';
import {
  FaPlus, FaEdit, FaTrash, FaSyncAlt, FaSearch,
  FaSignOutAlt, FaSortAmountDown, FaImage
} from 'react-icons/fa';

const PackagesAdmin = () => {
  const { logout } = useAuth();
  const [packages, setPackages] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOption, setSortOption] = useState('newest');
  const [sortOpen, setSortOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL;

  const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    return `${API_URL}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
  };

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchPackages = async (showRefreshing = false) => {
    try {
      showRefreshing ? setRefreshing(true) : setLoading(true);
      setError('');
      const res = await packagesAPI.getAll({ includeInactive: true });
      setPackages(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load packages');
      setPackages([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchPackages(); }, []);

  // Filter + sort
  useEffect(() => {
    let result = [...packages];
    if (statusFilter !== 'all') {
      result = result.filter(p => (statusFilter === 'active' ? p.active : !p.active));
    }
    if (search.trim()) {
      const s = search.toLowerCase();
      result = result.filter(p =>
        p.title?.toLowerCase().includes(s) ||
        p.destination?.toLowerCase().includes(s)
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
  }, [packages, statusFilter, search, sortOption]);

  const handleAdd = async (formData) => {
    try {
      const res = await packagesAPI.create(formData);
      setPackages(prev => [res.data.data, ...prev]);
      setError('✅ Package added successfully!');
      setTimeout(() => setError(''), 3000);
    } catch (err) {
      setError(`❌ ${err.response?.data?.message || 'Failed to add package'}`);
    }
  };

  const handleEdit = async (id, formData) => {
    try {
      const res = await packagesAPI.update(id, formData);
      setPackages(prev => prev.map(p => p._id === id ? res.data.data : p));
      setError('✅ Package updated successfully!');
      setTimeout(() => setError(''), 3000);
    } catch (err) {
      setError(`❌ ${err.response?.data?.message || 'Failed to update package'}`);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this package? This cannot be undone.')) return;
    try {
      await packagesAPI.delete(id);
      setPackages(prev => prev.filter(p => p._id !== id));
      setError('✅ Package deleted successfully!');
      setTimeout(() => setError(''), 3000);
    } catch (err) {
      setError(`❌ ${err.response?.data?.message || 'Failed to delete package'}`);
    }
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setSearch('');
    setSortOption('newest');
  };

  const hasFilters = statusFilter !== 'all' || search || sortOption !== 'newest';

  // Mobile Card Component
  const PackageCard = ({ pkg }) => (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-4 mb-4">
      <div className="flex gap-3 mb-3">
        {pkg.image ? (
          <img src={getImageUrl(pkg.image)} alt={pkg.title}
            className="w-20 h-16 object-cover rounded-lg border border-gray-200 flex-shrink-0"
            onError={(e) => { e.target.src = 'https://via.placeholder.com/80x64?text=No+Image'; }} />
        ) : (
          <div className="w-20 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <FaImage className="text-gray-400" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold text-gray-900 truncate">{pkg.title}</h3>
            {pkg.isFeatured && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800">⭐ Featured</span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{pkg.destination}</p>
          <p className="text-xs text-gray-400 mt-0.5 truncate">{pkg.features?.slice(0, 2).join(' • ')}</p>
        </div>
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <span className={`text-xs px-2 py-0.5 rounded-full ${pkg.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {pkg.active ? 'Active' : 'Inactive'}
        </span>
        <div className="flex gap-2">
          <button onClick={() => { setEditingPackage(pkg); setIsEditOpen(true); }}
            className="bg-gradient-to-r from-[#f96b06] to-[#bf4040] text-white px-3 py-1.5 rounded text-xs flex items-center gap-1">
            <FaEdit size={11} /> Edit
          </button>
          <button onClick={() => handleDelete(pkg._id)}
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
              <h1 className="text-xl font-bold text-gray-800">Packages Management</h1>
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
                All Packages ({filtered.length})
              </h2>
              <div className="flex gap-2 w-full sm:w-auto">
                <button onClick={() => fetchPackages(true)} disabled={loading || refreshing}
                  className="flex-1 sm:flex-none bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm disabled:opacity-50">
                  <FaSyncAlt className={refreshing ? 'animate-spin' : ''} />
                  <span className="hidden sm:inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
                </button>
                <button onClick={() => setIsAddOpen(true)}
                  className="flex-1 sm:flex-none bg-gradient-to-r from-[#f96b06] to-[#bf4040] hover:from-[#bf4040] hover:to-[#a03535] text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm">
                  <FaPlus />
                  <span className="hidden sm:inline">Add Package</span>
                  <span className="sm:hidden">Add</span>
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
              <div className="flex flex-col sm:flex-row gap-2">
                <input type="text" placeholder="Search by title or destination..." value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f96b06]" />

                {/* Active/Inactive Filter */}
                <div className="relative flex-1">
                  <button onClick={() => { setStatusOpen(!statusOpen); setSortOpen(false); }}
                    className="w-full flex items-center justify-between px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-sm">
                    <span>{statusFilter === 'all' ? '📋 All Status' : statusFilter === 'active' ? 'Active' : 'Inactive'}</span>
                    <svg className={`w-4 h-4 transition-transform ${statusOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {statusOpen && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
                      {['all', 'active', 'inactive'].map(s => (
                        <button key={s} onClick={() => { setStatusFilter(s); setStatusOpen(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${statusFilter === s ? 'bg-[#f96b06]/10 text-[#f96b06]' : ''}`}>
                          {s === 'all' ? '📋 All Status' : s === 'active' ? 'Active' : 'Inactive'}
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
                      <span>{{ newest: 'Newest', oldest: 'Oldest', 'name-asc': 'Title A→Z', 'name-desc': 'Title Z→A' }[sortOption]}</span>
                    </div>
                    <svg className={`w-4 h-4 transition-transform ${sortOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {sortOpen && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
                      {[['newest', 'Newest First'], ['oldest', 'Oldest First'], ['name-asc', 'Title (A → Z)'], ['name-desc', 'Title (Z → A)']].map(([v, l]) => (
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
                    Clear
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
                <p className="mt-3 text-gray-500 text-sm">Loading packages...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12">
                <FaSearch className="mx-auto h-10 w-10 text-gray-400 mb-3" />
                <h3 className="text-sm font-medium text-gray-900">{hasFilters ? 'No packages match your filters' : 'No packages yet'}</h3>
                <p className="text-sm text-gray-500 mt-1">{hasFilters ? 'Try adjusting your filters' : 'Add your first package to get started'}</p>
                {hasFilters && <button onClick={clearFilters} className="mt-4 px-4 py-2 bg-gradient-to-r from-[#f96b06] to-[#bf4040] text-white rounded-lg text-sm">Clear Filters</button>}
              </div>
            ) : isMobile ? (
              <div className="p-4">
                {filtered.map(pkg => <PackageCard key={pkg._id} pkg={pkg} />)}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {['#', 'Image', 'Title', 'Destination', 'Featured', 'Active', 'Actions'].map(h => (
                        <th key={h} className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filtered.map((pkg, index) => (
                      <tr key={pkg._id} className="hover:bg-gray-50">
                        <td className="px-3 py-3 text-sm text-gray-500">{index + 1}</td>
                        <td className="px-3 py-3">
                          {pkg.image ? (
                            <img src={getImageUrl(pkg.image)} alt={pkg.title}
                              className="w-14 h-10 object-cover rounded-lg border border-gray-200"
                              onError={(e) => { e.target.src = 'https://via.placeholder.com/56x40?text=N/A'; }} />
                          ) : (
                            <div className="w-14 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                              <FaImage className="text-gray-400 text-xs" />
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <div className="text-sm font-medium text-gray-900 max-w-[180px] truncate">{pkg.title}</div>
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-600 max-w-[140px] truncate">{pkg.destination}</td>
                        <td className="px-3 py-3 text-sm text-yellow-600">{pkg.isFeatured ? '⭐ Yes' : '—'}</td>
                        <td className="px-3 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full ${pkg.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {pkg.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex gap-2">
                            <button onClick={() => { setEditingPackage(pkg); setIsEditOpen(true); }}
                              className="bg-gradient-to-r from-[#f96b06] to-[#bf4040] text-white px-2.5 py-1.5 rounded text-xs flex items-center gap-1">
                              <FaEdit size={11} /> Edit
                            </button>
                            <button onClick={() => handleDelete(pkg._id)}
                              className="bg-gradient-to-r from-red-500 to-red-600 text-white px-2.5 py-1.5 rounded text-xs flex items-center gap-1">
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

        <AddPackageModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} onAdd={handleAdd} />
        <EditPackageModal isOpen={isEditOpen} onClose={() => { setIsEditOpen(false); setEditingPackage(null); }} onEdit={handleEdit} packageData={editingPackage} />
      </div>
    </div>
  );
};

export default PackagesAdmin;