import React from 'react';
import BorrowingHistory from '../components/borrowing/BorrowingHistory';
import { useAuth } from '../contexts/AuthContext';
import { getUserBorrowingRecords, mockBorrowingRecords } from '../utils/mockData';

const HistoryPage: React.FC = () => {
  const { user } = useAuth();
  
  // Get user's borrowing records or all records for admin
  const borrowingRecords = user?.role === 'admin' 
    ? mockBorrowingRecords 
    : getUserBorrowingRecords(user?.id || '');
  
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        {user?.role === 'admin' ? '全体の貸出履歴' : '貸出履歴'}
      </h1>
      
      <BorrowingHistory 
        borrowings={borrowingRecords} 
        showUser={user?.role === 'admin'} 
      />
    </div>
  );
};

export default HistoryPage;