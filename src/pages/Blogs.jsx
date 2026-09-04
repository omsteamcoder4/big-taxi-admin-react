// src/pages/Blogs.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { blogAPI } from '../api/blog';
import Sidebar from '../components/Sidebar';
import AddBlog from '../components/AddBlog';
import EditBlog from '../components/EditBlog';
import ConfirmationModal from '../components/ConfirmationModal';
import { FaSignOutAlt, FaSearch, FaFilter, FaSyncAlt, FaPlus, FaArrowLeft, FaEdit, FaTrash } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

const Blogs = () => {
  const { logout } = useAuth();
  const [blogs, setBlogs] = useState([]);
  const [filteredBlogs, setFilteredBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isMobile, setIsMobile] = useState(false);
  const [deleteModal, setDeleteModal] = useState({
    show: false,
    id: null,
    title: ''
  });
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBlogId, setEditingBlogId] = useState(null);

  // Check mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch ALL blogs
  const fetchBlogs = async (showRefreshingState = false) => {
    try {
      if (showRefreshingState) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');
      
      const response = await blogAPI.getAllBlogs({});
      
      console.log('Blogs from API:', response.data.data);
      
      const blogsData = response.data.data || [];
      setBlogs(blogsData);
      setFilteredBlogs(blogsData);
    } catch (err) {
      console.error('Error fetching blogs:', err);
      setError('Failed to fetch blogs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  // Search and filter logic
  useEffect(() => {
    let results = blogs;

    if (searchTerm) {
      results = results.filter(blog =>
        blog.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        blog.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (blog.tags && blog.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
      );
    }

    if (selectedStatus !== 'all') {
      if (selectedStatus === 'published') {
        results = results.filter(blog => blog.status === 'published');
      } else if (selectedStatus === 'draft') {
        results = results.filter(blog => blog.status === 'draft');
      } else if (selectedStatus === 'scheduled') {
        results = results.filter(blog => blog.status === 'scheduled');
      }
    }

    setFilteredBlogs(results);
  }, [searchTerm, selectedStatus, blogs]);

  // Delete blog function
  const handleDelete = async (blogId, _blogTitle) => {
    if (!blogId) return;
    
    try {
      console.log('Deleting blog with ID:', blogId);
      await blogAPI.deleteBlog(blogId);
      
      const updatedBlogs = blogs.filter(blog => blog._id !== blogId);
      setBlogs(updatedBlogs);
      setFilteredBlogs(updatedBlogs);
      
      setDeleteModal({ show: false, id: null, title: '' });
      
      setError('✅ Blog deleted successfully!');
      setTimeout(() => setError(''), 3000);
      
    } catch (err) {
      console.error('Delete error:', err);
      setError(err.response?.data?.message || 'Failed to delete blog');
      setDeleteModal({ show: false, id: null, title: '' });
    }
  };

  // Handle manual refresh
  const handleRefresh = () => {
    fetchBlogs(true);
  };

  // Handle create new blog - open modal
  const handleCreateNew = () => {
    setIsAddModalOpen(true);
  };

  // Handle edit blog - open modal
  const handleEditBlog = (blogId) => {
    setEditingBlogId(blogId);
    setIsEditModalOpen(true);
  };

  // Handle close modals and refresh
  const handleModalSuccess = () => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setEditingBlogId(null);
    fetchBlogs(); // Refresh the list
  };

  const handleCloseModals = () => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setEditingBlogId(null);
  };

  // Helper function to truncate text
  const truncateText = (text, maxLength = 60) => {
    if (!text) return 'Not set';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Get status badge
  const getStatusBadge = (blog) => {
    const isPublished = blog.status === 'published';
    const isScheduled = blog.status === 'scheduled';
    
    if (isPublished) {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
          Published
        </span>
      );
    }
    
    if (isScheduled) {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
          Scheduled
        </span>
      );
    }
    
    return (
      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
        Draft
      </span>
    );
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Mobile Card View Component - Same style as Categories
  const BlogCard = ({ blog, index }) => {
    return (
      <div className="bg-white rounded-lg shadow border border-gray-200 p-4 mb-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center space-x-3">
            <div className="text-sm font-medium text-gray-500">#{index + 1}</div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 truncate max-w-[200px]">
                {blog.title || 'No Title'}
              </h3>
            </div>
          </div>
          
          {/* Status Badge */}
          {getStatusBadge(blog)}
        </div>
        
        {/* Blog Image - Now uses R2 URL directly */}
        {blog.image && (
          <div className="mb-3">
            <img
              className="w-full h-32 rounded-lg object-cover"
              src={blog.image}
              alt={blog.imageAlt || blog.title}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://via.placeholder.com/400x200?text=No+Image';
              }}
            />
          </div>
        )}
        
        <div className="mb-3">
          <p className="text-xs text-gray-500">Description</p>
          <p className="text-sm text-gray-600">
            {truncateText(blog.description, 100) || 'No description set'}
          </p>
        </div>
        
        {/* Tags */}
        {blog.tags && blog.tags.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-gray-500">Tags</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {blog.tags.slice(0, 3).map((tag, idx) => (
                <span key={idx} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                  {tag}
                </span>
              ))}
              {blog.tags.length > 3 && (
                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                  +{blog.tags.length - 3}
                </span>
              )}
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <p className="text-xs text-gray-500">Created</p>
            <p className="text-sm text-gray-900">
              {formatDate(blog.createdAt)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Last Updated</p>
            <p className="text-sm text-gray-900">
              {formatDate(blog.updatedAt)}
            </p>
          </div>
        </div>
        
        {/* Actions - EXACT same style as Categories */}
        <div className="flex space-x-2 pt-3 border-t border-gray-100">
          <button
            onClick={() => handleEditBlog(blog._id)}
            className="flex-1 bg-gradient-to-r from-[#f96b06] to-[#bf4040] hover:from-[#bf4040] hover:to-[#a03535] text-white px-3 py-2 rounded text-sm font-medium transition duration-200"
          >
            Edit
          </button>
          <button
            onClick={() => {
              setDeleteModal({
                show: true,
                id: blog._id,
                title: blog.title || 'Untitled Blog'
              });
            }}
            className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-3 py-2 rounded text-sm font-medium transition duration-200"
          >
            Delete
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 w-full">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center">
              <FaSearch className="text-[#f96b06] mr-2" />
              <h1 className="text-xl font-bold text-gray-800">Blogs Management</h1>
            </div>

            <div className="flex items-center">
              <button
                onClick={logout}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-lg transition duration-200 flex items-center"
                title="Logout"
              >
                <span className="hidden sm:inline mr-2">Logout</span>
                <FaSignOutAlt />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-4 sm:p-6">
          {/* Title and Buttons Row - EXACT same as Categories */}
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-700 flex items-center">
              All Blog Posts ({filteredBlogs.length})
            </h2>
            <div className="flex space-x-2 sm:space-x-3 w-full sm:w-auto">
              <button
                onClick={handleRefresh}
                disabled={loading || refreshing}
                className="flex-1 sm:flex-none bg-gray-500 hover:bg-gray-600 text-white px-4 py-3 sm:py-2 rounded-lg flex items-center justify-center transition duration-200 text-sm min-h-[42px] disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh blogs"
              >
                <FaSyncAlt className={`sm:mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </span>
              </button>
              <button
                onClick={handleCreateNew}
                className="flex-1 sm:flex-none bg-gradient-to-r from-[#f96b06] to-[#bf4040] hover:from-[#bf4040] hover:to-[#a03535] text-white px-4 py-3 sm:py-2 rounded-lg flex items-center justify-center transition duration-200 text-sm min-h-[42px]"
              >
                <FaPlus className="sm:mr-2" />
                <span className="hidden sm:inline">Create New Post</span>
                <span className="sm:hidden">Create</span>
              </button>
            </div>
          </div>

          {/* Filter and Sort Section - EXACTLY LIKE CATEGORIES PAGE */}
          <div className="mb-6 bg-white p-4 rounded-lg shadow border border-gray-200">
            <div className="flex flex-col space-y-3">
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                {/* Search Input */}
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search by title, description, or tags..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f96b06] focus:border-transparent text-sm"
                  />
                </div>

                {/* Status Filter Dropdown */}
                <div className="relative flex-1">
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f96b06] focus:border-transparent text-sm bg-white"
                  >
                    <option value="all">📋 All Status</option>
                    <option value="published">✅ Published</option>
                    <option value="scheduled">⏰ Scheduled</option>
                    <option value="draft">📝 Draft</option>
                  </select>
                </div>

                {/* Clear Filters Button */}
                {(selectedStatus !== 'all' || searchTerm) && (
                  <button
                    onClick={() => {
                      setSelectedStatus('all');
                      setSearchTerm('');
                    }}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition duration-200 sm:w-auto"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className={`px-4 py-3 rounded mb-4 text-sm ${
              error.includes('✅') 
                ? 'bg-green-50 border border-green-200 text-green-700' 
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {error}
            </div>
          )}

          {/* Blogs Table/Cards */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-[#f96b06] mx-auto"></div>
                <p className="mt-2 text-gray-600 text-sm sm:text-base">Loading blogs...</p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                {!isMobile ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            S.No
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Blog Post
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Created
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredBlogs.length > 0 ? (
                          filteredBlogs.map((blog, index) => (
                            <tr key={blog._id} className="hover:bg-gray-50">
                              <td className="px-3 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900 text-center">
                                  {index + 1}
                                </div>
                              </td>
                              <td className="px-3 py-4">
                                <div className="flex items-center">
                                  {blog.image && (
                                    <div className="flex-shrink-0 h-12 w-12 mr-3">
                                      <img
                                        className="h-12 w-12 rounded-lg object-cover"
                                        src={blog.image}
                                        alt={blog.imageAlt || blog.title}
                                        onError={(e) => {
                                          e.target.onerror = null;
                                          e.target.src = 'https://via.placeholder.com/150';
                                        }}
                                      />
                                    </div>
                                  )}
                                  <div>
                                    <div className="text-sm font-medium text-gray-900 break-words max-w-xs">
                                      {truncateText(blog.title, 40) || <span className="text-gray-400 italic">No title</span>}
                                    </div>
                                    <div className="text-sm text-gray-500 break-words max-w-md">
                                      {truncateText(blog.description, 60) || <span className="text-gray-400 italic">No description</span>}
                                    </div>
                                    {blog.tags && blog.tags.length > 0 && (
                                      <div className="text-xs text-gray-500 mt-1">
                                        Tags: {blog.tags.slice(0, 2).join(', ')}
                                        {blog.tags.length > 2 && '...'}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-4 whitespace-nowrap">
                                {getStatusBadge(blog)}
                              </td>
                              <td className="px-3 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">
                                  {formatDate(blog.createdAt)}
                                </div>
                              </td>
                              <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleEditBlog(blog._id)}
                                    className="bg-gradient-to-r from-[#f96b06] to-[#bf4040] hover:from-[#bf4040] hover:to-[#a03535] text-white px-3 py-2 rounded text-xs font-medium transition duration-200"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => {
                                      setDeleteModal({
                                        show: true,
                                        id: blog._id,
                                        title: blog.title || 'Untitled Blog'
                                      });
                                    }}
                                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-3 py-2 rounded text-xs font-medium transition duration-200"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="px-6 py-8 text-center">
                              <div className="text-gray-500">
                                <FaSearch className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">
                                  {selectedStatus !== 'all' || searchTerm
                                    ? 'No blogs match your filters'
                                    : 'No blogs found'}
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                  {selectedStatus !== 'all' || searchTerm
                                    ? 'Try adjusting your filter criteria'
                                    : 'Get started by creating a new blog post.'}
                                </p>
                                {(selectedStatus !== 'all' || searchTerm) && (
                                  <button
                                    onClick={() => {
                                      setSelectedStatus('all');
                                      setSearchTerm('');
                                    }}
                                    className="mt-4 px-4 py-2 bg-gradient-to-r from-[#f96b06] to-[#bf4040] text-white rounded-lg hover:from-[#bf4040] hover:to-[#a03535] text-sm"
                                  >
                                    Clear Filters
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  /* Mobile Card View - EXACT same style as Categories */
                  <div className="p-4">
                    {filteredBlogs.length > 0 ? (
                      filteredBlogs.map((blog, index) => (
                        <BlogCard 
                          key={blog._id} 
                          blog={blog} 
                          index={index} 
                        />
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <FaSearch className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">
                          {selectedStatus !== 'all' || searchTerm
                            ? 'No blogs match your filters'
                            : 'No blogs found'}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {selectedStatus !== 'all' || searchTerm
                            ? 'Try adjusting your filter criteria'
                            : 'Get started by creating a new blog post.'}
                        </p>
                        {(selectedStatus !== 'all' || searchTerm) && (
                          <button
                            onClick={() => {
                              setSelectedStatus('all');
                              setSearchTerm('');
                            }}
                            className="mt-4 px-4 py-2 bg-gradient-to-r from-[#f96b06] to-[#bf4040] text-white rounded-lg hover:from-[#bf4040] hover:to-[#a03535] text-sm"
                          >
                            Clear Filters
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </main>

        {/* Add Blog Modal */}
        <AddBlog 
          isOpen={isAddModalOpen}
          onClose={handleCloseModals}
          onSuccess={handleModalSuccess}
        />

        {/* Edit Blog Modal */}
        {editingBlogId && (
          <EditBlog 
            isOpen={isEditModalOpen}
            blogId={editingBlogId}
            onClose={handleCloseModals}
            onSuccess={handleModalSuccess}
          />
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmationModal
          isOpen={deleteModal.show}
          onClose={() => setDeleteModal({ show: false, id: null, title: '' })}
          onConfirm={() => handleDelete(deleteModal.id, deleteModal.title)}
          title="Delete Blog Post"
          message={`Are you sure you want to delete "${deleteModal.title}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          type="danger"
        />
      </div>
    </div>
  );
};

export default Blogs;