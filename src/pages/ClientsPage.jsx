// src/pages/ClientsPage.jsx
import React, { useState, useMemo, useCallback } from 'react';
import { Plus, Search, Users } from 'lucide-react'; // Removed unused icons (Phone, Mail, Calendar, MoreVertical, Edit, Trash2)
import { 
  useClients, 
  useCreateClient, 
  useUpdateClient, 
  useDeleteClient,
  useUpdateClientStatus // Assuming this is needed for status updates
} from '../hooks/useClients.js'; // Explicit .js extension
// ClientCard, ClientFormModal, DeleteConfirmModal are now imported from their own files
import ClientCard from '../components/ClientCard.jsx';
import ClientFormModal from '../components/ClientFormModal.jsx';
import DeleteConfirmModal from '../components/DeleteConfirmModal.jsx';
import { LoadingCard } from '../components/Common/LoadingScreen.jsx'; // Explicit .jsx extension
import { format } from 'date-fns'; // For date formatting
import toast from 'react-hot-toast'; // For toast messages
import { useDebounce } from '../hooks/useDebounce.js'; // Use the useDebounce hook

// Main Clients Page Component
const ClientsPage = React.memo(() => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12); // Clients per page
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  // Debounce the search query for API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Build query parameters for useClients hook
  const queryParams = useMemo(() => {
    const params = {
      page: currentPage,
      limit: pageSize,
    };
    if (debouncedSearchQuery) { // Use debounced search query
      params.search = debouncedSearchQuery;
    }
    if (statusFilter !== 'all') {
      params.status = statusFilter;
    }
    return params;
  }, [currentPage, pageSize, debouncedSearchQuery, statusFilter]);

  // API hooks
  const { data: clientsData, isLoading, error, refetch } = useClients(queryParams);
  const createClientMutation = useCreateClient();
  const updateClientMutation = useUpdateClient();
  const deleteClientMutation = useDeleteClient();

  // Event handlers for client CRUD operations
  const handleCreateClient = async (formData) => {
    try {
      await createClientMutation.mutateAsync(formData);
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create client:', error);
      // toast messages handled by useCreateClient hook
    }
  };

  const handleUpdateClient = async (formData) => {
    try {
      await updateClientMutation.mutateAsync({ 
        id: selectedClient.id, 
        data: formData 
      });
      setShowEditModal(false);
      setSelectedClient(null);
    } catch (error) {
      console.error('Failed to update client:', error);
      // toast messages handled by useUpdateClient hook
    }
  };

  const handleDeleteClient = async () => {
    try {
      await deleteClientMutation.mutateAsync(selectedClient.id);
      setShowDeleteModal(false);
      setSelectedClient(null);
    } catch (error) {
      console.error('Failed to delete client:', error);
      // toast messages handled by useDeleteClient hook
    }
  };

  const handleViewClient = useCallback((client) => {
    // Implement client detail view (e.g., open a modal, navigate to /clients/:id)
    if (import.meta.env.MODE !== 'production') {
      console.log('Viewing client:', client);
    }
    toast.info(`View Client: ${client.firstName} ${client.lastName}`);
  }, []);

  const handleEditClient = useCallback((client) => {
    setSelectedClient(client);
    setShowEditModal(true);
  }, []);

  const handleDeleteClick = useCallback((client) => {
    setSelectedClient(client);
    setShowDeleteModal(true);
  }, []);

  // Extract clients and pagination data from API response
  const clients = clientsData?.data?.clients || [];
  const pagination = clientsData?.data?.pagination || {};

  // Error state display
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Connection Error</h2>
          <p className="text-gray-600 mb-4">Unable to load clients. Please check your connection.</p>
          <p className="text-sm text-gray-500 mb-4">{error.message}</p>
          <button
            onClick={() => refetch()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Client Management</h1>
            <p className="text-gray-600 mt-1">Manage your spa's client relationships</p>
          </div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5 mr-2 inline" />
            Add New Client
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-8 shadow-lg border border-blue-100/50">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search clients by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-300 focus:ring-4 focus:ring-blue-500/20"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1); // Reset to first page when filter changes
              }}
              className="px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-300 focus:ring-4 focus:ring-blue-500/20"
            >
              <option value="all">All Clients</option>
              <option value="ACTIVE">Active</option>
              <option value="VIP">VIP</option>
              <option value="PROSPECT">Prospects</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>

        {/* Results Summary and Pagination */}
        <div className="mb-6 flex justify-between items-center">
          <p className="text-gray-600">
            Showing {clients.length} of {pagination.total || 0} clients
            {searchQuery && ` for "${searchQuery}"`}
          </p>
          
          {pagination.totalPages > 1 && (
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded border disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-1">
                Page {currentPage} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                disabled={currentPage === pagination.totalPages}
                className="px-3 py-1 rounded border disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Clients Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: pageSize }).map((_, i) => (
              <LoadingCard key={i} />
            ))}
          </div>
        ) : clients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.map((client) => (
              <ClientCard 
                key={client.id} 
                client={client} 
                onView={handleViewClient}
                onEdit={handleEditClient}
                onDelete={handleDeleteClick}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No clients found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'Get started by adding your first client'
              }
            </p>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold"
            >
              <Plus className="w-5 h-5 mr-2 inline" />
              Add First Client
            </button>
          </div>
        )}

        {/* Modals */}
        <ClientFormModal
          client={null} // For creating new client
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateClient}
          isLoading={createClientMutation.isLoading}
        />

        <ClientFormModal
          client={selectedClient} // For editing existing client
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedClient(null); // Clear selected client on close
          }}
          onSubmit={handleUpdateClient}
          isLoading={updateClientMutation.isLoading}
        />

        <DeleteConfirmModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedClient(null); // Clear selected client on close
          }}
          onConfirm={handleDeleteClient}
          isLoading={deleteClientMutation.isLoading}
          title="Delete Client"
          message={selectedClient ? (
            <>Are you sure you want to delete <strong>{selectedClient.firstName} {selectedClient.lastName}</strong>? This action cannot be undone and will remove all associated appointment history.</>
          ) : (
            'Are you sure you want to delete this client? This action cannot be undone and will remove all associated appointment history.'
          )}
        />
      </div>
    </div>
  );
};

export default ClientsPage;