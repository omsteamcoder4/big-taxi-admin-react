import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import { fleetsAPI } from '../api/fleetsAPI';
import AddFleetModal from '../components/AddFleetModal';
import EditFleetModal from '../components/EditFleetModal';
import {
  FaPlus, FaEdit, FaTrash, FaSyncAlt, FaSearch,
  FaSignOutAlt, FaSortAmountDown, FaImage
} from 'react-icons/fa';

const FleetsAdmin = () => {
  const { logout } = useAuth();
  const [fleets, setFleets] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingFleet, setEditingFleet] = useState(null);

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

  const fetchFleets = async (showRefreshing = false) => {
    try {
      showRefreshing ? setRefreshing(true) : setLoading(true);
      setError('');
      const res = await fleetsAPI.getAll({ includeInactive: true });
      setFleets(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load fleets');
      setFleets([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchFleets(); }, []);

  // Filter + sort
  useEffect(() => {
    let result = [...fleets];
    if (statusFilter !== 'all') {
      result = result.filter(f => (statusFilter === 'active' ? f.active : !f.active));
    }
    if (search.trim()) {
      const s = search.toLowerCase();
      result = result.filter(f =>
        f.type?.toLowerCase().includes(s) ||
        f.capacity?.toLowerCase().includes(s) ||
        f.features?.some(feat => feat.toLowerCase().includes(s))
      );
    }
    result.sort((a, b) => {
      if (sortOption === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortOption === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortOption === 'name-asc') return a.type?.localeCompare(b.type);
      if (sortOption === 'name-desc') return b.type?.localeCompare(a.type);
      if (sortOption === 'order-asc') return (a.displayOrder || 0) - (b.displayOrder || 0);
      return 0;
    });
    setFiltered(result);
  }, [fleets, statusFilter, search, sortOption]);

  const handleAdd = async (formData) => {
    try {
      const res = await fleetsAPI.create(formData);
      setFleets(prev => [res.data.data, ...prev]);
      setError('✅ Vehicle added successfully!');
      setTimeout(() => setError(''), 3000);
      return true;
    } catch (err) {
      setError(`❌ ${err.response?.data?.message || 'Failed to add vehicle'}`);
      throw err;
    }
  };

  const handleEdit = async (id, formData) => {
    try {
      const res = await fleetsAPI.update(id, formData);
      setFleets(prev => prev.map(f => f._id === id ? res.data.data : f));
      setError('✅ Vehicle updated successfully!');
      setTimeout(() => setError(''), 3000);
      return true;
    } catch (err) {
      setError(`❌ ${err.response?.data?.message || 'Failed to update vehicle'}`);
      throw err;
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this vehicle? This cannot be undone.')) return;
    try {
      await fleetsAPI.delete(id);
      setFleets(prev => prev.filter(f => f._id !== id));
      setError('✅ Vehicle deleted successfully!');
      setTimeout(() => setError(''), 3000);
    } catch (err) {
      setError(`❌ ${err.response?.data?.message || 'Failed to delete vehicle'}`);
    }
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setSearch('');
    setSortOption('newest');
  };

  const hasFilters = statusFilter !== 'all' || search || sortOption !== 'newest';

  // Mobile Card Component
  const FleetCard = ({ fleet }) => (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-4 mb-4">
      <div className="flex gap-3 mb-3">
        {fleet.image ? (
          <img 
            src={getImageUrl(fleet.image)} 
            alt={fleet.type}
            className="w-20 h-16 object-cover rounded-lg border border-gray-200 flex-shrink-0"
            onError={(e) => { e.target.src = 'https://via.placeholder.com/80x64?text=No+Image'; }} 
          />
        ) : (
          <div className="w-20 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <FaImage className="text-gray-400" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 truncate">{fleet.type}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{fleet.capacity} • {fleet.luggage}</p>
          <p className="text-xs text-gray-400 mt-0.5 truncate">{fleet.features?.slice(0, 2).join(' • ')}</p>
        </div>
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <span className={`text-xs px-2 py-0.5 rounded-full ${fleet.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {fleet.active ? 'Active' : 'Inactive'}
        </span>
        <div className="flex gap-2">
          <button 
            onClick={() => { setEditingFleet(fleet); setIsEditOpen(true); }}
            className="bg-gradient-to-r from-[#f96b06] to-[#bf4040] text-white px-3 py-1.5 rounded text-xs flex items-center gap-1"
          >
            <FaEdit size={11} /> Edit
          </button>
          <button 
            onClick={() => handleDelete(fleet._id)}
            className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1.5 rounded text-xs flex items-center gap-1"
          >
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
              <h1 className="text-xl font-bold text-gray-800">Fleet Management</h1>
            </div>
            <button 
              onClick={logout}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
            >
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
                All Vehicles ({filtered.length})
              </h2>
              <div className="flex gap-2 w-full sm:w-auto">
                <button 
                  onClick={() => fetchFleets(true)} 
                  disabled={loading || refreshing}
                  className="flex-1 sm:flex-none bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                >
                  <FaSyncAlt className={refreshing ? 'animate-spin' : ''} />
                  <span className="hidden sm:inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
                </button>
                <button 
                  onClick={() => setIsAddOpen(true)}
                  className="flex-1 sm:flex-none bg-gradient-to-r from-[#f96b06] to-[#bf4040] hover:from-[#bf4040] hover:to-[#a03535] text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm"
                >
                  <FaPlus />
                  <span className="hidden sm:inline">Add Vehicle</span>
                  <span className="sm:hidden">Add</span>
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
              <div className="flex flex-col sm:flex-row gap-2">
                <input 
                  type="text" 
                  placeholder="Search by type, capacity, or features..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f96b06]" 
                />

                {/* Active/Inactive Filter */}
                <div className="relative flex-1">
                  <button 
                    onClick={() => { setStatusOpen(!statusOpen); setSortOpen(false); }}
                    className="w-full flex items-center justify-between px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-sm"
                  >
                    <span>{statusFilter === 'all' ? '📋 All Status' : statusFilter === 'active' ? '✅ Active' : '⛔ Inactive'}</span>
                    <svg className={`w-4 h-4 transition-transform ${statusOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {statusOpen && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
                      {['all', 'active', 'inactive'].map(s => (
                        <button 
                          key={s} 
                          onClick={() => { setStatusFilter(s); setStatusOpen(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${statusFilter === s ? 'bg-[#f96b06]/10 text-[#f96b06]' : ''}`}
                        >
                          {s === 'all' ? '📋 All Status' : s === 'active' ? '✅ Active' : '⛔ Inactive'}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sort */}
                <div className="relative flex-1">
                  <button 
                    onClick={() => { setSortOpen(!sortOpen); setStatusOpen(false); }}
                    className="w-full flex items-center justify-between px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <FaSortAmountDown className="text-gray-400" />
                      <span>
                        {sortOption === 'newest' && 'Newest First'}
                        {sortOption === 'oldest' && 'Oldest First'}
                        {sortOption === 'name-asc' && 'Name A→Z'}
                        {sortOption === 'name-desc' && 'Name Z→A'}
                        {sortOption === 'order-asc' && 'Display Order'}
                      </span>
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
                        ['name-asc', '🔤 Name (A → Z)'],
                        ['name-desc', '🔤 Name (Z → A)'],
                        ['order-asc', '🔢 Display Order']
                      ].map(([v, l]) => (
                        <button 
                          key={v} 
                          onClick={() => { setSortOption(v); setSortOpen(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${sortOption === v ? 'bg-[#f96b06]/10 text-[#f96b06]' : ''}`}
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {hasFilters && (
                  <button 
                    onClick={clearFilters} 
                    className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
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
                <p className="mt-3 text-gray-500 text-sm">Loading vehicles...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12">
                <FaSearch className="mx-auto h-10 w-10 text-gray-400 mb-3" />
                <h3 className="text-sm font-medium text-gray-900">{hasFilters ? 'No vehicles match your filters' : 'No vehicles yet'}</h3>
                <p className="text-sm text-gray-500 mt-1">{hasFilters ? 'Try adjusting your filters' : 'Add your first vehicle to get started'}</p>
                {hasFilters && (
                  <button 
                    onClick={clearFilters} 
                    className="mt-4 px-4 py-2 bg-gradient-to-r from-[#f96b06] to-[#bf4040] text-white rounded-lg text-sm"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : isMobile ? (
              <div className="p-4">
                {filtered.map(fleet => <FleetCard key={fleet._id} fleet={fleet} />)}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {['#', 'Image', 'Type', 'Capacity', 'Luggage', 'Features', 'Ideal For', 'Status', 'Actions'].map(h => (
                        <th key={h} className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filtered.map((fleet, index) => (
                      <tr key={fleet._id} className="hover:bg-gray-50">
                        <td className="px-3 py-3 text-sm text-gray-500">{index + 1}</td>
                        <td className="px-3 py-3">
                          {fleet.image ? (
                            <img 
                              src={getImageUrl(fleet.image)} 
                              alt={fleet.type}
                              className="w-14 h-10 object-cover rounded-lg border border-gray-200"
                              onError={(e) => { e.target.src = 'https://via.placeholder.com/56x40?text=N/A'; }} 
                            />
                          ) : (
                            <div className="w-14 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                              <FaImage className="text-gray-400 text-xs" />
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <div className="text-sm font-medium text-gray-900 max-w-[180px] truncate">{fleet.type}</div>
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-600">{fleet.capacity}</td>
                        <td className="px-3 py-3 text-sm text-gray-600">{fleet.luggage}</td>
                        <td className="px-3 py-3">
                          <div className="flex flex-wrap gap-1">
                            {fleet.features?.slice(0, 2).map((feature, idx) => (
                              <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                {feature}
                              </span>
                            ))}
                            {fleet.features?.length > 2 && (
                              <span className="text-xs text-gray-400">+{fleet.features.length - 2}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-600 max-w-[120px] truncate">{fleet.ideal || '—'}</td>
                        <td className="px-3 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full ${fleet.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {fleet.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex gap-2">
                            <button 
                              onClick={() => { setEditingFleet(fleet); setIsEditOpen(true); }}
                              className="bg-gradient-to-r from-[#f96b06] to-[#bf4040] text-white px-2.5 py-1.5 rounded text-xs flex items-center gap-1"
                            >
                              <FaEdit size={11} /> Edit
                            </button>
                            <button 
                              onClick={() => handleDelete(fleet._id)}
                              className="bg-gradient-to-r from-red-500 to-red-600 text-white px-2.5 py-1.5 rounded text-xs flex items-center gap-1"
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

        {/* Modals */}
        <AddFleetModal 
          isOpen={isAddOpen} 
          onClose={() => setIsAddOpen(false)} 
          onAdd={handleAdd} 
        />
        <EditFleetModal 
          isOpen={isEditOpen} 
          onClose={() => { setIsEditOpen(false); setEditingFleet(null); }} 
          onEdit={handleEdit} 
          fleetData={editingFleet} 
        />
      </div>
    </div>
  );
};

export default FleetsAdmin;