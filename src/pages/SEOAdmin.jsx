import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { FaDownload, FaCopy, FaCheck, FaSearch, FaFileAlt, FaRobot, FaEye, FaTruck, FaServer } from 'react-icons/fa';
import api from '../api/axiosConfig';

const SEOAdmin = () => {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('sitemap');
  const [sitemapData, setSitemapData] = useState(null);
  const [robotsData, setRobotsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedUrl, setSelectedUrl] = useState(null);

  useEffect(() => {
    if (activeTab === 'sitemap') {
      fetchSitemapPreview();
    } else {
      fetchRobotsContent();
    }
  }, [activeTab]);

  const fetchSitemapPreview = async () => {
    setLoading(true);
    try {
      const res = await api.get('/seo-admin/sitemap-preview');
      setSitemapData(res.data.data);
    } catch (err) {
      console.error('Error fetching sitemap:', err);
      alert('Failed to fetch sitemap data');
    } finally {
      setLoading(false);
    }
  };

  const fetchRobotsContent = async () => {
    setLoading(true);
    try {
      const res = await api.get('/seo-admin/robots-content');
      setRobotsData(res.data.data);
    } catch (err) {
      console.error('Error fetching robots:', err);
      alert('Failed to fetch robots.txt content');
    } finally {
      setLoading(false);
    }
  };

  const downloadSitemap = async () => {
    try {
      const response = await api.get('/seo-admin/sitemap-download', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'sitemap.xml');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading sitemap:', err);
      alert('Failed to download sitemap');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const truncateUrl = (url, maxLength = 50) => {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + '...';
  };

  // Mobile Card Component for Sitemap URLs
  const UrlCard = ({ url, index }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
          #{index + 1}
        </span>
        <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
          Priority: {url.priority}
        </span>
      </div>
      
      <div className="mb-3">
        <div className="flex items-start gap-2 mb-2">
          <div className="flex-shrink-0 mt-0.5">
            <FaEye className="text-gray-400 text-xs" />
          </div>
          <a 
            href={url.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-[#f96b06] hover:underline break-all flex-1"
          >
            {url.url}
          </a>
        </div>
        
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span>📅 {new Date(url.lastmod).toLocaleDateString()}</span>
          <span>🔄 {url.changefreq}</span>
        </div>
      </div>
      
      {url.image && (
        <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
          <img 
            src={url.image} 
            alt="" 
            className="w-10 h-10 object-cover rounded-lg border border-gray-200"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <span className="text-xs text-gray-500 truncate flex-1">
            Image: {url.image.split('/').pop()}
          </span>
        </div>
      )}
      
      {url.type && (
        <div className="mt-2 flex items-center gap-2">
          {url.type === 'fleet' ? (
            <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 flex items-center gap-1">
              <FaTruck size={10} /> Fleet
            </span>
          ) : url.type === 'service' ? (
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 flex items-center gap-1">
              <FaServer size={10} /> Service
            </span>
          ) : (
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
              {url.type || 'Page'}
            </span>
          )}
        </div>
      )}
    </div>
  );

  const SitemapPreview = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
      const handleResize = () => setIsMobile(window.innerWidth < 768);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (loading) {
      return (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f96b06]"></div>
          <span className="ml-3 text-gray-600">Loading sitemap data...</span>
        </div>
      );
    }

    if (!sitemapData) return null;

    return (
      <div className="space-y-6">
       {/* Summary Cards */}
<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
  <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-3 sm:p-4">
    <p className="text-xs sm:text-sm text-blue-600 mb-1">Total URLs</p>
    <p className="text-xl sm:text-2xl font-bold text-blue-700">{sitemapData.totalUrls}</p>
  </div>
  <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-3 sm:p-4">
    <p className="text-xs sm:text-sm text-green-600 mb-1">Static Pages</p>
    <p className="text-xl sm:text-2xl font-bold text-green-700">{sitemapData.summary?.staticPages || 0}</p>
  </div>
  <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-3 sm:p-4">
    <p className="text-xs sm:text-sm text-orange-600 mb-1">Fleets</p>
    <p className="text-xl sm:text-2xl font-bold text-orange-700">{sitemapData.summary?.fleets || 0}</p>
  </div>
  <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-3 sm:p-4">
    <p className="text-xs sm:text-sm text-purple-600 mb-1">Service Images</p>
    <p className="text-xl sm:text-2xl font-bold text-purple-700">{sitemapData.summary?.serviceImages || 0}</p>
  </div>
</div>

        {/* Download Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800">
            URL List 
            <span className="text-xs text-gray-500 ml-2">(Preview - First 100)</span>
          </h3>
          <button
            onClick={downloadSitemap}
            className="w-full sm:w-auto bg-gradient-to-r from-[#f96b06] to-[#bf4040] text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm hover:from-[#bf4040] hover:to-[#a03535] transition"
          >
            <FaDownload /> Download sitemap.xml
          </button>
        </div>

        {/* Mobile Card View */}
        {isMobile ? (
          <div className="space-y-3">
            {sitemapData.urls?.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No URLs found in sitemap</div>
            ) : (
              sitemapData.urls.map((url, index) => (
                <UrlCard key={index} url={url} index={index} />
              ))
            )}
          </div>
        ) : (
          /* Desktop Table View */
          <div className="bg-white rounded-lg shadow border border-gray-200 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">URL</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Modified</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Image</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sitemapData.urls?.map((url, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm text-gray-500">{index + 1}</td>
                    <td className="px-4 py-2">
                      <a 
                        href={url.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-sm text-[#f96b06] hover:underline break-all"
                      >
                        {truncateUrl(url.url, 60)}
                      </a>
                    </td>
                    <td className="px-4 py-2">
                      {url.type === 'fleet' ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700">
                          <FaTruck size={10} /> Fleet
                        </span>
                      ) : url.type === 'service' ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                          <FaServer size={10} /> Service
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                          {url.type || 'Page'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600 whitespace-nowrap">
                      {new Date(url.lastmod).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">{url.priority}</td>
                    <td className="px-4 py-2">
                      {url.image && (
                        <img 
                          src={url.image} 
                          alt="" 
                          className="w-8 h-8 object-cover rounded border border-gray-200"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {sitemapData.urls?.length === 0 && (
          <div className="text-center py-12 text-gray-500">No URLs found in sitemap</div>
        )}
      </div>
    );
  };

  const RobotsPreview = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
      const handleResize = () => setIsMobile(window.innerWidth < 768);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (loading) {
      return (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f96b06]"></div>
          <span className="ml-3 text-gray-600">Loading robots.txt...</span>
        </div>
      );
    }

    if (!robotsData) return null;

    return (
      <div className="space-y-6">
        {/* Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-green-600 mb-1">Environment</p>
            <p className="text-base sm:text-xl font-bold text-green-700">
              {robotsData.isProduction ? '🚀 Production' : '💻 Development'}
            </p>
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-blue-600 mb-1">Robots.txt URL</p>
            <a 
              href={robotsData.robotsUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline break-all text-xs sm:text-sm"
            >
              {truncateUrl(robotsData.robotsUrl, isMobile ? 40 : 80)}
            </a>
          </div>
        </div>

        {/* Robots.txt Content */}
        <div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800">robots.txt Content</h3>
            <button
              onClick={() => copyToClipboard(robotsData.content)}
              className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg flex items-center justify-center gap-2 text-sm transition"
            >
              {copied ? <FaCheck className="text-green-500" /> : <FaCopy />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          
          <div className="bg-gray-900 rounded-lg overflow-hidden">
            <pre className={`${isMobile ? 'text-xs p-3' : 'text-sm p-4'} text-green-400 overflow-x-auto font-mono whitespace-pre-wrap break-words`}>
              {robotsData.content}
            </pre>
          </div>
        </div>

        {/* Live Preview Link */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-yellow-800 mb-2 flex items-center gap-2">
            <span>📌</span> Live Preview
          </p>
          <a 
            href={robotsData.robotsUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[#f96b06] hover:underline text-xs sm:text-sm break-all block"
          >
            {robotsData.robotsUrl}
          </a>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 w-full overflow-x-hidden">
        {/* Header */}
        <header className="bg-white shadow sticky top-0 z-10">
          <div className="flex items-center justify-between px-3 sm:px-4 py-3">
            <div className="flex items-center gap-2">
              <FaRobot className="text-[#f96b06] text-lg sm:text-xl" />
              <h1 className="text-base sm:text-xl font-bold text-gray-800">SEO Management</h1>
            </div>
            <button
              onClick={logout}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm"
            >
              Logout
            </button>
          </div>
        </header>

        <main className="p-3 sm:p-4 md:p-6">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-4 sm:mb-6 overflow-x-auto">
            <button
              onClick={() => setActiveTab('sitemap')}
              className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'sitemap'
                  ? 'border-b-2 border-[#f96b06] text-[#f96b06]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FaSearch size={14} />
              Sitemap Preview
            </button>
            <button
              onClick={() => setActiveTab('robots')}
              className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'robots'
                  ? 'border-b-2 border-[#f96b06] text-[#f96b06]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FaFileAlt size={14} />
              robots.txt
            </button>
          </div>

          {/* Content */}
          {activeTab === 'sitemap' ? <SitemapPreview /> : <RobotsPreview />}
        </main>
      </div>
    </div>
  );
};

export default SEOAdmin;