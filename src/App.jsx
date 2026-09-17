// App.jsx - Updated with SEO and Gallery routes
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CustomerPage from './pages/CustomerPage';
import Settings from './pages/Settings';
import Seo from './pages/Seo'; // Import SEO page
import PackagesAdmin from './pages/Packages';
// Import Blog components
import Blogs from './pages/Blogs';           
import CreateBlog from './components/AddBlog';  
import EditBlog from './components/EditBlog';      
import ServicesAdmin from './pages/Services';
import SEOAdmin from './pages/SEOAdmin';
import FleetsAdmin from './pages/Fleets';
import GeoSeo from './pages/GeoSeo';
import AeoSeo from './pages/AeoSeo';
import Analytics from './pages/Analytics';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            
            {/* Dashboard */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute adminOnly={true}>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Blog Routes */}
            <Route 
              path="/blogs" 
              element={
                <ProtectedRoute adminOnly={true}>
                  <Blogs />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/blogs/create" 
              element={
                <ProtectedRoute adminOnly={true}>
                  <CreateBlog />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/blogs/edit/:id" 
              element={
                <ProtectedRoute adminOnly={true}>
                  <EditBlog />
                </ProtectedRoute>
              } 
            />

            <Route path="/packages" element={<ProtectedRoute adminOnly><PackagesAdmin /></ProtectedRoute>} />
        
            {/* SEO Route */}
            <Route 
              path="/seo" 
              element={
                <ProtectedRoute adminOnly={true}>
                  <Seo />
                </ProtectedRoute>
              } 
            />
            <Route 
  path="/seo-admin" 
  element={
    <ProtectedRoute adminOnly={true}>
      <SEOAdmin />
    </ProtectedRoute>
  } 
/>
<Route path="/fleets" element={
  <ProtectedRoute adminOnly={true}>
    <FleetsAdmin />
  </ProtectedRoute>
} />
        
<Route path="/services" element={
  <ProtectedRoute adminOnly={true}>
    <ServicesAdmin />
  </ProtectedRoute>
} />   
            {/* Customers */}
            <Route 
              path="/customers" 
              element={
                <ProtectedRoute adminOnly={true}>
                  <CustomerPage />
                </ProtectedRoute>
              } 
            />
          <Route path="/geo-seo" element={
    <ProtectedRoute adminOnly={true}>
        <GeoSeo />
    </ProtectedRoute>
} />
<Route path="/aeo-seo" element={
    <ProtectedRoute adminOnly={true}>
        <AeoSeo />
    </ProtectedRoute>
} />
            
            {/* Settings */}
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute adminOnly={true}>
                  <Settings />
                </ProtectedRoute>
              } 
            />

            <Route
  path="/analytics"
  element={
    <ProtectedRoute adminOnly={true}>
      <Analytics />
    </ProtectedRoute>
  }
/>
            
            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;