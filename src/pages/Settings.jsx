// pages/Settings.jsx - FIXED
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import { settingsAPI } from '../api/settingsAPI';
import { Save, AlertCircle, MapPin, Plus, Edit2, Trash2, Star, X } from 'lucide-react';

// Keep your DEFAULT_SETTINGS as is
const DEFAULT_SETTINGS = {
  
};

// LOCATION MANAGER COMPONENT
const LocationManager = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [locationName, setLocationName] = useState('');

  // Define fetchLocations BEFORE using it in useEffect
  const fetchLocations = async () => {
    try {
      const res = await settingsAPI.getLocations();
      setLocations(res.data.data || []);
    } catch {
      setError('Failed to load locations');
    } finally {
      setLoading(false);
    }
  };

  // Fetching locations from the server on mount is a genuine sync with an
  // external system (the API), which is exactly what an effect is for. We
  // intentionally suppress set-state-in-effect here rather than restructure
  // a real data fetch away from its purpose.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLocations();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!locationName.trim()) {
      setError('Location name is required');
      return;
    }
    
    try {
      if (editingLocation) {
        await settingsAPI.updateLocation(editingLocation._id, { name: locationName });
      } else {
        await settingsAPI.addLocation({ name: locationName });
      }
      await fetchLocations();
      setShowModal(false);
      setLocationName('');
      setEditingLocation(null);
      setError('');
    } catch {
      setError('Failed to save location');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this location?')) return;
    try {
      await settingsAPI.deleteLocation(id);
      await fetchLocations();
    } catch {
      setError('Failed to delete location');
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await settingsAPI.setDefaultLocation(id);
      await fetchLocations();
    } catch {
      setError('Failed to set default location');
    }
  };

  const openEditModal = (location) => {
    setEditingLocation(location);
    setLocationName(location.name);
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f96b06]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-700">Manage Locations</h3>
          <p className="text-sm text-gray-500">Add and manage service locations</p>
        </div>
        <button
          onClick={() => { setEditingLocation(null); setLocationName(''); setShowModal(true); }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#f96b06] to-[#bf4040] text-white rounded-lg hover:from-[#bf4040] hover:to-[#a03535] text-sm font-medium"
        >
          <Plus size={16} />
          Add Location
        </button>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 border-l-4 border-red-400 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {locations.map((location) => (
          <div
            key={location._id}
            className={`bg-white rounded-lg border p-4 hover:shadow-md transition ${
              !location.isActive ? 'opacity-60' : ''
            } ${location.isDefault ? 'border-[#f96b06] border-2' : 'border-gray-200'}`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-gray-800">{location.name}</h4>
                  {location.isDefault && (
                    <span className="text-xs bg-[#f96b06] text-white px-2 py-0.5 rounded-full">Default</span>
                  )}
                  {!location.isActive && (
                    <span className="text-xs bg-gray-300 text-gray-700 px-2 py-0.5 rounded-full">Inactive</span>
                  )}
                </div>
                <div className="mt-1">
                  <span className="text-xs text-gray-400">URL: /services/{location.slug}/</span>
                </div>
              </div>
              <div className="flex gap-1 ml-2">
                {!location.isDefault && (
                  <button
                    onClick={() => handleSetDefault(location._id)}
                    className="p-1.5 text-yellow-500 hover:bg-yellow-50 rounded-lg"
                    title="Set as default"
                  >
                    <Star size={16} />
                  </button>
                )}
                <button
                  onClick={() => openEditModal(location)}
                  className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(location._id)}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                  disabled={locations.length === 1}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">
                {editingLocation ? 'Edit Location' : 'Add New Location'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location Name *</label>
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f96b06]"
                  placeholder="e.g. Hosur, Bangalore, Chennai"
                  autoFocus
                />
                {locationName && (
                  <p className="text-xs text-gray-400 mt-1">
                    URL: /services/{locationName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}/
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 mt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm text-white bg-gradient-to-r from-[#f96b06] to-[#bf4040] rounded-lg hover:from-[#bf4040] hover:to-[#a03535]"
                >
                  {editingLocation ? 'Update' : 'Add'} Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// MAIN SETTINGS COMPONENT
const SettingsPage = () => {
  const { logout } = useAuth();
  const [form, setForm] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('contact');

  // Define fetchSettings BEFORE using it in useEffect
  const fetchSettings = async () => {
    try {
      const res = await settingsAPI.getAll();
      const data = res.data.data;
      setForm(prev => ({ ...prev, ...data }));
    } catch {
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  // Fetching settings from the server on mount is a genuine sync with an
  // external system (the API), which is exactly what an effect is for. We
  // intentionally suppress set-state-in-effect here rather than restructure
  // a real data fetch away from its purpose.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await settingsAPI.update(form);
      setSuccess('Settings saved successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f96b06]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 w-full">
        <header className="bg-white shadow">
          <div className="flex items-center justify-between px-4 py-3">
            <h1 className="text-xl font-bold text-gray-800">Settings</h1>
            <button
              onClick={logout}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
            >
              <span className="hidden sm:inline">Logout</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </header>

        <main className="p-4 sm:p-6">
          {/* Tab Navigation */}
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('contact')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                activeTab === 'contact'
                  ? 'border-[#f96b06] text-[#f96b06]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Contact Settings
            </button>
            <button
              onClick={() => setActiveTab('locations')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition flex items-center gap-1 ${
                activeTab === 'locations'
                  ? 'border-[#f96b06] text-[#f96b06]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <MapPin size={16} />
              Locations
            </button>
          </div>

          {activeTab === 'contact' ? (
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
              {/* Messages */}
              {error && (
                <div className="mx-6 mt-6 px-4 py-3 bg-red-50 border-l-4 border-red-400 text-red-700 rounded-lg flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span className="text-sm">{error}</span>
                </div>
              )}
              {success && (
                <div className="mx-6 mt-6 px-4 py-3 bg-green-50 border-l-4 border-green-400 text-green-700 rounded-lg">
                  <span className="text-sm">{success}</span>
                </div>
              )}

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Address - Full width */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
                    <textarea
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      rows="3"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f96b06]"
                      placeholder="Enter full address"
                    />
                  </div>

                  {/* Phone Primary */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Phone (Primary)</label>
                    <input
                      type="text"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f96b06]"
                      placeholder="e.g. 8248329031"
                    />
                  </div>

                  {/* Phone Secondary */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Phone (Secondary)</label>
                    <input
                      type="text"
                      name="phoneSecondary"
                      value={form.phoneSecondary}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f96b06]"
                      placeholder="e.g. 82705-83705"
                    />
                  </div>

                  {/* WhatsApp */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">WhatsApp Number (without +)</label>
                    <input
                      type="text"
                      name="whatsapp"
                      value={form.whatsapp}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f96b06]"
                      placeholder="e.g. 919944665375"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f96b06]"
                      placeholder="info@example.com"
                    />
                  </div>

                  {/* Map Embed URL - Full width */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Google Maps Embed URL</label>
                    <input
                      type="text"
                      name="mapEmbedUrl"
                      value={form.mapEmbedUrl}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#f96b06]"
                      placeholder="https://www.google.com/maps/embed?pb=..."
                    />
                    <p className="text-xs text-gray-400 mt-1">Paste the full embed URL from Google Maps.</p>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-[#f96b06] to-[#bf4040] rounded-lg hover:from-[#bf4040] hover:to-[#a03535] disabled:opacity-50"
                  >
                    <Save size={15} />
                    {saving ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <LocationManager />
          )}
        </main>
      </div>
    </div>
  );
};

export default SettingsPage;