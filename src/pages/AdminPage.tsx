import React from 'react';
import AdminPanel from '../components/admin/AdminPanel';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AdminPage: React.FC = () => {
  const { user } = useAuth();
  
  // Redirect non-admin users
  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  
  return <AdminPanel />;
};

export default AdminPage;