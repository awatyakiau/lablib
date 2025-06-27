import React, { useEffect, useState } from 'react';
import BorrowingHistory from '../components/borrowing/BorrowingHistory';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const HistoryPage: React.FC = () => {
  const { user } = useAuth();
  const [borrowings, setBorrowings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        // 必要なら認証トークンをヘッダーに付与
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/books/history', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        setBorrowings(response.data);
      } catch (err: any) {
        setBorrowings([]);
        setError('貸出履歴の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        {user?.role === 'admin' ? '全体の貸出履歴' : '貸出履歴'}
      </h1>
      {loading ? (
        <div>読み込み中...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <BorrowingHistory borrowings={borrowings || []} showUser={user?.role === 'admin'} />
      )}
    </div>
  );
};

export default HistoryPage;