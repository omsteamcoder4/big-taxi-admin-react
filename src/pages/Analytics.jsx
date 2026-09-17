// admin/src/pages/Analytics.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import { analyticsAPI } from '../api/analytics';
import {
  LogOut,
  RefreshCw,
  BarChart3,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Server,
  Globe,
  Info,
} from 'lucide-react';

const Analytics = () => {
  const { logout } = useAuth();
  const [config, setConfig] = useState(null);
  const [robotsStatus, setRobotsStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);
      setError('');

      const [configRes, robotsRes] = await Promise.allSettled([
        analyticsAPI.getConfig(),
        analyticsAPI.getRobotsStatus(),
      ]);

      if (configRes.status === 'fulfilled') {
        setConfig(configRes.value.data?.data || { enabled: false });
      } else {
        setConfig({ enabled: false });
      }

      if (robotsRes.status === 'fulfilled') {
        setRobotsStatus(robotsRes.value.data);
      } else {
        setRobotsStatus(null);
      }
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError('Failed to load analytics configuration');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => fetchData(true);

  const isEnabled = config?.enabled === true;
  const dashboardUrl = config?.host || null;

  return (
    <div className="flex min-h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 w-full overflow-hidden">
        <header className="bg-white shadow">
          <div className="flex items-center justify-between px-4 py-3">
            <h1 className="text-xl font-bold text-gray-800">Analytics</h1>
            <button
              onClick={logout}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-lg transition duration-200 flex items-center"
            >
              <span className="hidden sm:inline mr-2">Logout</span>
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <main className="p-4 sm:p-6 overflow-auto h-[calc(100vh-73px)]">
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-700">
              Analytics Configuration
            </h2>
            <button
              onClick={handleRefresh}
              disabled={loading || refreshing}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center text-sm disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={`mr-2 ${refreshing ? 'animate-spin' : ''}`}
              />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {error && (
            <div className="px-4 py-3 rounded mb-4 text-sm bg-red-50 border border-red-200 text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f96b06] mx-auto"></div>
              <p className="mt-3 text-gray-600">Loading analytics config...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Status Card */}
              <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-gray-800 flex items-center">
                    <BarChart3 size={18} className="mr-2 text-[#f96b06]" />
                    Umami Analytics
                  </h3>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                      isEnabled
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {isEnabled ? (
                      <>
                        <CheckCircle2 size={12} className="mr-1" /> Enabled
                      </>
                    ) : (
                      <>
                        <XCircle size={12} className="mr-1" /> Disabled
                      </>
                    )}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start">
                    <Server size={16} className="mt-1 mr-3 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Umami Host</p>
                      <p className="text-sm font-medium text-gray-900 break-all">
                        {config?.host || (
                          <span className="text-gray-400 italic">Not configured</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Globe size={16} className="mt-1 mr-3 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Website ID</p>
                      <p className="text-sm font-medium text-gray-900 break-all">
                        {config?.websiteId || (
                          <span className="text-gray-400 italic">Not configured</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {dashboardUrl && (
                    <div className="pt-3 border-t border-gray-100">
                      <a
                        href={dashboardUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm font-medium text-[#f96b06] hover:text-[#bf4040]"
                      >
                        Open Umami Dashboard
                        <ExternalLink size={12} className="ml-2" />
                      </a>
                    </div>
                  )}
                </div>

                {!isEnabled && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start">
                    <Info size={16} className="text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
                    <div className="text-xs text-amber-800">
                      <p className="font-medium">Analytics is currently disabled</p>
                      <p className="mt-1">
                        Set{' '}
                        <code className="bg-amber-100 px-1 rounded">
                          UMAMI_ENABLED=true
                        </code>{' '}
                        in the server{' '}
                        <code className="bg-amber-100 px-1 rounded">.env</code> file
                        and restart the server.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Robots.txt Card */}
              <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                <h3 className="text-base font-semibold text-gray-800 flex items-center mb-4">
                  <Globe size={18} className="mr-2 text-[#f96b06]" />
                  SEO Crawl Status
                </h3>

                {robotsStatus ? (
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500">Environment</p>
                      <p className="text-sm font-medium text-gray-900">
                        {robotsStatus.environment || 'unknown'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Robots.txt URL</p>
                      <a
                        href={robotsStatus.robotsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-[#f96b06] hover:underline break-all"
                      >
                        {robotsStatus.robotsUrl}
                      </a>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Sitemap URL</p>
                      <a
                        href={robotsStatus.sitemapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-[#f96b06] hover:underline break-all"
                      >
                        {robotsStatus.sitemapUrl}
                      </a>
                    </div>
                    <div className="pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500">Status</p>
                      <p className="text-sm text-gray-700 mt-1">
                        {robotsStatus.message}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">
                    Could not load robots status. Make sure the server is running.
                  </p>
                )}
              </div>

              {/* Help Card */}
              <div className="bg-white rounded-lg shadow border border-gray-200 p-6 lg:col-span-2">
                <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center">
                  <Info size={18} className="mr-2 text-[#f96b06]" />
                  How to Manage Analytics
                </h3>
                <div className="text-sm text-gray-600 space-y-2">
                  <p>
                    <strong>Enable / disable analytics:</strong> Edit{' '}
                    <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">
                      server/.env
                    </code>{' '}
                    and set{' '}
                    <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">
                      UMAMI_ENABLED
                    </code>{' '}
                    to{' '}
                    <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">true</code>{' '}
                    or{' '}
                    <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">false</code>,
                    then restart the server.
                  </p>
                  <p>
                    <strong>Change Umami host:</strong> Update{' '}
                    <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">
                      UMAMI_HOST
                    </code>{' '}
                    in{' '}
                    <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">
                      server/.env
                    </code>
                    .
                  </p>
                  <p>
                    <strong>Change website ID:</strong> Update{' '}
                    <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">
                      UMAMI_WEBSITE_ID
                    </code>{' '}
                    in{' '}
                    <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">
                      server/.env
                    </code>{' '}
                    with the UUID from your Umami dashboard.
                  </p>
                  <p className="pt-2 text-xs text-gray-500">
                    The frontend automatically fetches this config from{' '}
                    <code className="bg-gray-100 px-1.5 py-0.5 rounded">
                      /api/analytics/config
                    </code>{' '}
                    on page load — no client-side env variables needed.
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Analytics;