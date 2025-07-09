import React, { useState } from 'react';
import { BookPlus, Save, Trash, Search, Loader2 } from 'lucide-react';
import BarcodeScanner from '../books/BarcodeScanner';
import { BookPlus, Save, Trash } from 'lucide-react';
import axios from 'axios';

interface FormData {
  title: string;
  author: string;
  type: 'book' | 'thesis';
  barcode: string;
  isbn: string;
  location: string;
  copies: number;
}

const BookRegistration: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    author: '',
    type: 'book',
    barcode: '',
    isbn: '',
    location: '',
    copies: 1
  });
  
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: name === 'copies' ? parseInt(value) || 1 : value
    }));
  };
  
  const handleBarcodeScanned = (barcode: string) => {
    // For demo purposes, we'll assume all barcodes starting with 9 are ISBNs
    if (barcode.startsWith('9') && barcode.length >= 10) {
      setFormData(prev => ({
        ...prev,
        barcode,
        isbn: barcode,
        type: 'book'
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        barcode,
        type: 'thesis'
      }));
    }
  };
  
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // Validation
  if (!formData.title.trim()) {
    setError('タイトルを入力してください');
    return;
  }
  if (!formData.author.trim()) {
    setError('著者を入力してください');
    return;
  }
  if (!formData.barcode.trim()) {
    setError('バーコードを入力してください');
    return;
  }
  if (!formData.location.trim()) {
    setError('保管場所を入力してください');
    return;
  }

  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      '/api/admin/books',
      {
        title: formData.title,
        author: formData.author,
        type: formData.type,
        barcode: formData.barcode,
        isbn: formData.isbn,
        location: formData.location,
        total_copies: formData.copies,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setSuccess('アイテムが正常に登録されました');
    setError(null);

    // Reset form after a delay
    setTimeout(() => {
      setFormData({
        title: '',
        author: '',
        type: 'book',
        barcode: '',
        isbn: '',
        location: '',
        copies: 1,
      });
      setSuccess(null);
    }, 3000);
  } catch (err: any) {
    if (err.response?.data?.error) {
      setError(err.response.data.error);
    } else {
      setError('登録に失敗しました');
    }
  }
};

  
  const handleReset = () => {
    setFormData({
      title: '',
      author: '',
      type: 'book',
      barcode: '',
      isbn: '',
      location: '',
      copies: 1
    });
    setError(null);
    setSuccess(null);
  };

    const handleAutoSearch = async () => {
    if (!formData.isbn && !formData.barcode) {
      setError('ISBNまたはバーコードを入力してください');
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const isbn = formData.isbn || formData.barcode;
      const response = await axios.get(`/api/books/fetch-info?isbn=${isbn}`);
      
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
  
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        新規アイテム登録
      </h2>
      
      <div className="mb-6">
        <BarcodeScanner onScan={handleBarcodeScanned} buttonText="バーコードをスキャン" />
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              種別
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="book">図書</option>
              <option value="thesis">論文</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="barcode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              バーコード
            </label>
            <input
              id="barcode"
              name="barcode"
              type="text"
              value={formData.barcode}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              placeholder="バーコード"
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            タイトル
          </label>
          <input
            id="title"
            name="title"
            type="text"
            value={formData.title}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            placeholder="タイトル"
          />
        </div>
        
        <div>
          <label htmlFor="author" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            著者
          </label>
          <input
            id="author"
            name="author"
            type="text"
            value={formData.author}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            placeholder="著者"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {formData.type === 'book' && (
          <div>
            <label htmlFor="isbn" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              ISBN
            </label>
            <div className="flex gap-2">
              <input
                id="isbn"
                name="isbn"
                type="text"
                value={formData.isbn}
                onChange={handleInputChange}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="ISBN"
              />
              <button
                type="button"
                onClick={handleAutoSearch}
                disabled={isSearching || (!formData.isbn && !formData.barcode)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                <span className="ml-2">自動検索</span>
              </button>
            </div>
          </div>
        )}
          
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              保管場所
            </label>
            <input
              id="location"
              name="location"
              type="text"
              value={formData.location}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              placeholder="保管場所（例：本棚A-1）"
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="copies" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            複製数
          </label>
          <input
            id="copies"
            name="copies"
            type="number"
            min="1"
            value={formData.copies}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Trash className="mr-2 h-4 w-4" />
            リセット
          </button>
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Save className="mr-2 h-4 w-4" />
            登録
          </button>
        </div>
      </form>
      
      <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          バーコード生成
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          論文や独自資料には自動生成されたバーコードを使用できます。
        </p>
        
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
        >
          <BookPlus className="mr-2 h-4 w-4" />
          バーコード生成
        </button>
      </div>
    </div>
  );
};

export default BookRegistration;