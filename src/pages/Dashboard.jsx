// src/pages/Dashboard.jsx - Focused on Fleets, Services & SEO
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import { LogOut, Truck, Server, PlusCircle, Search, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fleetsAPI } from '../api/fleetsAPI';
import { servicesAPI } from '../api/servicesAPI';

// Helper functions (moved outside component)
const truncate = (text, maxLength = 50) => {
  if (!text) return 'Not set';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  const baseUrl = import.meta.env.VITE_API_URL || '';
  return `${baseUrl}${imagePath}`;
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// Stat Card Component (moved outside render)
const StatCard = ({ title, count, icon: Icon, color, link }) => (
  <Link to={link} className="block group">
    <div className="bg-white rounded-xl shadow-md border border-slate-200 hover:shadow-xl transition-all duration-300 hover:border-[#f96b06]/50 hover:scale-[1.02]">
      <div className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
            <p className="text-2xl font-bold text-slate-900">{count.toLocaleString()}</p>
          </div>
          <div className={`p-3 rounded-xl bg-${color}-100 group-hover:bg-[#f96b06]/10 transition-colors`}>
            <Icon className={`h-6 w-6 text-${color}-600 group-hover:text-[#f96b06]`} />
          </div>
        </div>
      </div>
    </div>
  </Link>
);

// Recent Items List Component (moved outside render)
const RecentList = ({ title, items, type, link, emptyMessage }) => {
  const getItemDisplay = () => {
    if (type === 'fleets') {
      return items.map(item => ({
        id: item._id,
        title: item.type || 'Untitled',
        subtitle: `${item.capacity} • ${item.luggage}`,
        image: getImageUrl(item.image),
        date: item.createdAt,
        status: item.active,
        features: item.features
      }));
    } else if (type === 'services') {
      return items.map(item => ({
        id: item._id,
        title: item.title || 'Untitled',
        subtitle: item.description || 'No description',
        image: getImageUrl(item.image),
        date: item.createdAt,
        status: item.active,
        isFeatured: item.isFeatured
      }));
    }
    return [];
  };

  const displayItems = getItemDisplay();

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
        <h3 className="font-semibold text-slate-800">{title}</h3>
        <Link to={link} className="text-xs text-[#f96b06] hover:text-[#bf4040] font-medium">
          View All →
        </Link>
      </div>
      <div className="divide-y divide-slate-100">
        {displayItems.length === 0 ? (
          <div className="p-5 text-center text-slate-500 text-sm">{emptyMessage}</div>
        ) : (
          displayItems.map(item => (
            <div key={item.id} className="p-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-start space-x-3">
                {item.image && (
                  <div className="flex-shrink-0">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {truncate(item.title, 40)}
                    </p>
                    <div className="flex items-center gap-1">
                      {type === 'services' && item.isFeatured && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-800">⭐</span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full ${item.status ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {item.status ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{item.subtitle}</p>
                  <p className="text-xs text-slate-400 mt-1">{formatDate(item.date)}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="px-5 py-3 bg-slate-50 border-t border-slate-100">
        <Link to={link} className="text-xs text-slate-500 hover:text-[#f96b06] flex items-center justify-center gap-1">
          <PlusCircle size={12} />
          Add New
        </Link>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    fleets: { total: 0, recent: [] },
    services: { total: 0, recent: [] }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleLogout = () => logout();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch fleets and services in parallel
        const [fleetsRes, servicesRes] = await Promise.allSettled([
          fleetsAPI.getAll({ includeInactive: true }),
          servicesAPI.getAll({ includeInactive: true })
        ]);

        // Process Fleets
        let fleetsList = [];
        if (fleetsRes.status === 'fulfilled' && fleetsRes.value?.data?.success) {
          fleetsList = fleetsRes.value.data.data || [];
        }
        const recentFleets = [...fleetsList]
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5);

        // Process Services
        let servicesList = [];
        if (servicesRes.status === 'fulfilled' && servicesRes.value?.data?.success) {
          servicesList = servicesRes.value.data.data || [];
        }
        const recentServices = [...servicesList]
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5);

        setDashboardData({
          fleets: { total: fleetsList.length, recent: recentFleets },
          services: { total: servicesList.length, recent: recentServices }
        });
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data from server');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-[#f96b06] mx-auto"></div>
            <p className="mt-4 text-slate-600 text-sm sm:text-base">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 w-full">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-800">Admin Dashboard</h1>
            </div>
            <div className="flex items-center gap-3">
              <Link 
                to="/seo-admin"
                className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white px-3 py-2 rounded-lg transition duration-200 flex items-center gap-2 text-sm"
                title="SEO Tools"
              >
                <Globe size={16} />
                <span className="hidden sm:inline">SEO Tools</span>
              </Link>
              <button
                onClick={handleLogout}
                className="bg-gradient-to-r from-[#f96b06] to-[#bf4040] hover:from-[#bf4040] hover:to-[#a03535] text-white px-4 py-2 rounded-lg transition duration-200 flex items-center"
                title="Logout"
              >
                <span className="hidden sm:inline mr-2">Logout</span>
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-4 sm:p-6">
          {/* Welcome Message */}
          <div className="mb-6">
            <p className="text-gray-600 text-sm sm:text-base">Welcome back, {user?.name} 👋</p>
          </div>

          {error && (
            <div className="mb-4 sm:mb-6 bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
              <p className="text-red-800 text-sm sm:text-base">{error}</p>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <StatCard
              title="Total Fleets"
              count={dashboardData.fleets.total}
              icon={Truck}
              color="orange"
              link="/fleets"
            />
            <StatCard
              title="Total Services"
              count={dashboardData.services.total}
              icon={Server}
              color="purple"
              link="/services"
            />
          </div>

          {/* Recent Items Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RecentList
              title="Recent Fleets"
              items={dashboardData.fleets.recent}
              type="fleets"
              link="/fleets"
              emptyMessage="No fleets yet. Add your first vehicle!"
            />
            <RecentList
              title="Recent Services"
              items={dashboardData.services.recent}
              type="services"
              link="/services"
              emptyMessage="No services yet. Add your first service!"
            />
          </div>

          {/* SEO Quick Links */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">SEO Management</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link to="/seo" className="bg-white rounded-lg shadow p-4 text-center hover:shadow-md transition-all hover:border-[#f96b06] border border-transparent">
                <div className="inline-flex p-2 bg-blue-100 rounded-lg mb-2">
                  <Search className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-sm font-medium text-gray-700">SEO Settings</p>
                <p className="text-xs text-gray-500 mt-1">Meta tags, Open Graph</p>
              </Link>
              <Link to="/seo-admin" className="bg-white rounded-lg shadow p-4 text-center hover:shadow-md transition-all hover:border-[#f96b06] border border-transparent">
                <div className="inline-flex p-2 bg-green-100 rounded-lg mb-2">
                  <Globe className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-sm font-medium text-gray-700">SEO Tools</p>
                <p className="text-xs text-gray-500 mt-1">Sitemap, robots.txt</p>
              </Link>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link to="/fleets" className="bg-white rounded-lg shadow p-4 text-center hover:shadow-md transition-all hover:border-[#f96b06] border border-transparent">
                <div className="inline-flex p-2 bg-orange-100 rounded-lg mb-2">
                  <PlusCircle className="h-5 w-5 text-orange-600" />
                </div>
                <p className="text-sm font-medium text-gray-700">Add New Fleet</p>
              </Link>
              <Link to="/services" className="bg-white rounded-lg shadow p-4 text-center hover:shadow-md transition-all hover:border-[#f96b06] border border-transparent">
                <div className="inline-flex p-2 bg-purple-100 rounded-lg mb-2">
                  <PlusCircle className="h-5 w-5 text-purple-600" />
                </div>
                <p className="text-sm font-medium text-gray-700">Add New Service</p>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;