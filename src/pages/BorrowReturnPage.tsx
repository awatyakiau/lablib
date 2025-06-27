import React, { useState } from 'react';
import BarcodeScanner from '../components/books/BarcodeScanner';
import { borrowItem, returnItem } from '../utils/mockData';
import { useAuth } from '../contexts/AuthContext';
import { Book, BookMarked } from 'lucide-react';
import { formatDate } from '../utils/dates';
import axios from 'axios';

const BorrowReturnPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'borrow' | 'return'>('borrow');
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [dueDate, setDueDate] = useState<string | null>(null);
  
  const handleBorrow = async (barcode: string) => {
    if (!user) return;
    try {
      const response = await axios.post('/api/books/borrow', { barcode, user_id: user.id,});
      setResult({
        success: true,
        message: response.data.message
      });
      setDueDate(response.data.due_date);
    } catch (error: any) {
      setResult({
        success: false,
        message: error.response?.data?.error || '貸出に失敗しました'
      });
      setDueDate(null);
    }
  };

  const handleReturn = async (barcode: string) => {
    if (!user) return;
    try {
      const response = await axios.post('/api/books/return', { barcode, user_id: user.id,});
      setResult({
        success: true,
        message: response.data.message
      });
      setDueDate(null);
    } catch (error: any) {
      setResult({
        success: false,
        message: error.response?.data?.error || '返却に失敗しました'
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        貸出・返却
      </h1>
      
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
          <button
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'borrow'
                ? 'border-b-2 border-indigo-500 dark:border-indigo-400 text-indigo-600 dark:text-indigo-300'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('borrow')}
          >
            <div className="flex items-center">
              <Book className="mr-2 h-5 w-5" />
              貸出
            </div>
          </button>
          
          <button
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'return'
                ? 'border-b-2 border-indigo-500 dark:border-indigo-400 text-indigo-600 dark:text-indigo-300'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('return')}
          >
            <div className="flex items-center">
              <BookMarked className="mr-2 h-5 w-5" />
              返却
            </div>
          </button>
        </div>
        
        <div className="flex flex-col items-center">
          {activeTab === 'borrow' ? (
            <div className="w-full max-w-md">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                貸し出すアイテムのバーコードをスキャンするか、バーコード番号を入力してください。
              </p>
              <BarcodeScanner onScan={handleBorrow} buttonText="貸出処理" />
            </div>
          ) : (
            <div className="w-full max-w-md">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                返却するアイテムのバーコードをスキャンするか、バーコード番号を入力してください。
              </p>
              <BarcodeScanner onScan={handleReturn} buttonText="返却処理" />
            </div>
          )}
          
          {result && (
            <div className={`mt-8 p-4 rounded-md w-full max-w-md ${
              result.success 
                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
            }`}>
              <p>{result.message}</p>
              {result.success && dueDate && (
                <p className="mt-2 font-medium">
                  返却期限: {formatDate(dueDate)}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BorrowReturnPage;