// src/components/Sidebar.jsx - Updated with SEO
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ClipboardList, 
  BarChart3, 
  Users, 
  Settings,
  Tag, 
  Rocket,Globe,MapPin,Mic,
  Menu,
  X,
  Eye,
  FileText,Zap,
  LogOut,
  Server,
  Image,
  Search, Truck
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const { logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    // { path: '/categories', label: 'Categories', icon: Tag }, 
    // { path: '/packages', label: 'Packages', icon: Package },
    { path: '/fleets', label: 'Fleets', icon: Truck },
        { path: '/seo', label: 'SEO', icon: Search }, 
        { path: '/seo-admin', label: 'SEO Tools', icon: Globe },
    //     { path: '/geo-seo', label: 'GEO (AI Optimization)', icon: Zap },
    // { path: '/aeo-seo', label: 'AEO SEO', icon: Mic },
    { path: '/blogs', label: 'Blogs', icon: FileText },
    { path: '/services', label: 'Services', icon: Server },
    // { path: '/customers', label: 'Customers', icon: Users },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const openWebsite = () => {
    const frontendUrl = import.meta.env.VITE_FRONTEND_URL;
    window.open(frontendUrl, '_blank');
    closeMobileMenu();
  };

  const handleLogout = () => {
    logout();
    closeMobileMenu();
  };

  return (
    <>
      {/* Mobile Header - Only show on mobile */}
      {isMobile && (
        <div className="lg:hidden fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-[#f96b06]/20 z-40">
          <div className="flex items-center justify-between p-4">
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-[#f96b06] to-[#bf4040] bg-clip-text text-transparent">
                Admin Panel
              </h2>
            </div>
            <button
              onClick={toggleMobileMenu}
              className="p-2 text-[#f96b06] hover:text-[#bf4040]"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      )}

      {/* Mobile Overlay */}
      {isMobileMenuOpen && isMobile && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <div className={`
        ${isMobile 
          ? 'fixed top-0 left-0 h-full z-40 transform transition-transform duration-300 ease-in-out' 
          : 'sticky top-0 h-screen'
        }
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        bg-white/95 backdrop-blur-xl text-slate-800 w-64 flex-shrink-0 border-r border-[#f96b06]/20
        flex flex-col overflow-hidden
      `}>
        <div className="p-6 flex flex-col h-full overflow-hidden">
          {/* Header - Fixed */}
          <div className="flex-shrink-0 mb-8 pt-4 pl-2">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-[#f96b06] to-[#bf4040] bg-clip-text text-transparent">
              Admin Panel
            </h2>
            <p className="text-slate-500 text-sm mt-2">Welcome back!</p>
            
            {/* View Website Button */}
            <button
              onClick={openWebsite}
              className="mt-4 w-full bg-gradient-to-r from-[#f96b06] to-[#bf4040] text-white px-4 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:from-[#bf4040] hover:to-[#a03535] transition-all duration-200 hover:shadow-md cursor-pointer"
            >
              <Eye size={18} />
              View Website
            </button>
          </div>
          
          {/* Navigation - Scrollable area without visible scrollbar */}
          <nav className="flex-1 overflow-y-auto scrollbar-hide [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path || 
                  (item.path === '/blogs' && location.pathname.startsWith('/blogs')) ||
                  (item.path === '/services' && location.pathname.startsWith('/services')) ||
                  (item.path === '/gallery' && location.pathname.startsWith('/gallery')) ||
                  (item.path === '/seo' && location.pathname.startsWith('/seo')); // Added SEO check
                const Icon = item.icon;
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={closeMobileMenu}
                      className={`group flex items-center px-4 py-3 rounded-xl transition-all duration-200 ease-out ${
                        isActive
                          ? 'bg-white text-[#f96b06] shadow-md border border-[#f96b06]/30'
                          : 'text-slate-600 hover:bg-white/80 hover:text-[#f96b06] hover:shadow-sm'
                      }`}
                    >
                      <span className={`mr-3 text-lg transition-transform duration-200 ${
                        isActive ? 'scale-105' : 'group-hover:scale-105'
                      }`}>
                        <Icon size={20} className={isActive ? 'text-[#f96b06]' : 'group-hover:text-[#f96b06]'} />
                      </span>
                      
                      <span className="font-medium tracking-wide transition-all duration-200">
                        {item.label}
                      </span>
                      
                      {isActive && (
                        <div className="ml-auto w-1.5 h-1.5 bg-[#f96b06] rounded-full" />
                      )}
                      
                      {!isActive && (
                        <div className="ml-auto w-1 h-5 bg-[#f96b06]/30 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer - Fixed */}
          <div className="flex-shrink-0 mt-auto pt-6 border-t border-[#f96b06]/20">
            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full bg-gradient-to-r from-[#f96b06] to-[#bf4040] text-white px-4 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:from-[#bf4040] hover:to-[#a03535] transition-all duration-200 hover:shadow-md cursor-pointer"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Spacer */}
      {isMobile && <div className="lg:hidden h-16" />}
    </>
  );
};

export default Sidebar;