import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import BookDetails from '../components/books/BookDetails';
import { LibraryItem, BorrowingRecord } from '../types';
import axios from 'axios';

const BookDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<LibraryItem | null>(null);
  const [borrowingHistory, setBorrowingHistory] = useState<BorrowingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 書籍詳細と貸出履歴をAPIから取得
      const response = await axios.get(`/api/books/${id}`);
      const { book, borrow_history } = response.data;

      setItem(book);
      setBorrowingHistory(borrow_history || []);
    } catch (err) {
      setError('データの取得中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 p-4 rounded-md">
        {error || 'アイテムが見つかりません'}
      </div>
    );
  }

  return <BookDetails item={item} borrowingHistory={borrowingHistory} onBorrowSuccess={fetchData} />;
};

export default BookDetailsPage;