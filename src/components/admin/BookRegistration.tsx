import React, { useState } from 'react';
import BarcodeScanner from '../books/BarcodeScanner';
import { BookPlus, Save, Trash } from 'lucide-react';

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
  
  const handleSubmit = (e: React.FormEvent) => {
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
    
    // In a real app, we would save this to the backend
    // For now, just simulate a successful registration
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
        copies: 1
      });
      setSuccess(null);
    }, 3000);
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
              <input
                id="isbn"
                name="isbn"
                type="text"
                value={formData.isbn}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="ISBN"
              />
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