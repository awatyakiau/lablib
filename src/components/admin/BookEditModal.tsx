import React, { useState, useEffect } from 'react';
import { X, Save, Search, Loader2 } from 'lucide-react';
import { LibraryItem } from '../../types';
import axios from 'axios';

interface BookEditModalProps {
  book: LibraryItem;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const BookEditModal: React.FC<BookEditModalProps> = ({ book, isOpen, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    location: '',
    total_copies: 1,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (book) {
      setFormData({
        title: book.title || '',
        author: book.author || '',
        isbn: book.isbn || '',
        location: book.location || '',
        total_copies: book.copies || 1,
      });
    }
  }, [book]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'total_copies' ? parseInt(value) || 1 : value }));
  };

  const handleAutoSearch = async () => {
    if (!formData.isbn) {
      setError('ISBNを入力してください');
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const response = await axios.get(`/api/books/fetch-info?isbn=${formData.isbn}`);
      
      setFormData(prev => ({
        ...prev,
        title: response.data.title || prev.title,
        author: response.data.author || prev.author,
      }));

      setSuccess('書籍情報を自動取得しました');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('書籍情報が見つかりませんでした');
      } else {
        setError('書籍情報の取得に失敗しました');
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
  if (!formData.title.trim() || !formData.author.trim()) {
    setError('タイトルと著者は必須です');
    return;
  }

  if (formData.total_copies < 1) {
    setError('複製数は1以上である必要があります');
    return;
  }

    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/admin/books/${book.id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setSuccess('書籍情報が更新されました');
      setTimeout(() => {
        onUpdate();
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.error || '更新に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            書籍情報編集
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {success && (
          <div className="mb-4 p-3 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 rounded-md text-sm">
            {success}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              タイトル
            </label>
            <input
              name="title"
              type="text"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              著者
            </label>
            <input
              name="author"
              type="text"
              value={formData.author}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          {book.type === 'book' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                ISBN
              </label>
              <div className="flex gap-2">
                <input
                  name="isbn"
                  type="text"
                  value={formData.isbn}
                  onChange={handleInputChange}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                />
                <button
                  type="button"
                  onClick={handleAutoSearch}
                  disabled={isSearching || !formData.isbn}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          )}

                   <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              保管場所
            </label>
            <input
              name="location"
              type="text"
              value={formData.location}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              複製数
            </label>
            <input
              name="total_copies"
              type="number"
              min="1"
              value={formData.total_copies}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              ※複製数を減らす場合、貸出中でないコピーのみ削除されます
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              更新
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookEditModal;