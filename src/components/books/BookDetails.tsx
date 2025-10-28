import React, { useState } from 'react';
import { LibraryItem, BorrowingRecord } from '../../types';
import { Book, FileText, User, Calendar, ArrowLeft, BookCheck } from 'lucide-react';
import { formatDate, isOverdue } from '../../utils/dates';
import { Link } from 'react-router-dom';
import axios from 'axios';

interface BookDetailsProps {
  item: LibraryItem;
  borrowingHistory: BorrowingRecord[];
  onBorrowSuccess?: () => void;
}

const BookDetails: React.FC<BookDetailsProps> = ({ item, borrowingHistory, onBorrowSuccess }) => {
  const [isBorrowing, setIsBorrowing] = useState(false);
  const [borrowError, setBorrowError] = useState<string | null>(null);
  const [borrowSuccess, setBorrowSuccess] = useState<string | null>(null);

  const handleQuickBorrow = async () => {
    setIsBorrowing(true);
    setBorrowError(null);
    setBorrowSuccess(null);

    try {
      const response = await axios.post('/api/books/quick-borrow', {
        book_id: item.id,
      });

      setBorrowSuccess(`貸出成功！返却期限: ${formatDate(response.data.due_date)}`);
      
      // 3秒後にリロードまたはコールバック実行
      setTimeout(() => {
        if (onBorrowSuccess) {
          onBorrowSuccess();
        } else {
          window.location.reload();
        }
      }, 3000);
    } catch (err: any) {
      setBorrowError(err.response?.data?.error || '貸出に失敗しました');
    } finally {
      setIsBorrowing(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <Link to="/books" className="inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" />
          戻る
        </Link>
        
        <div className="flex items-center space-x-2 mb-4">
          {item.type === 'book' ? (
            <Book className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          ) : (
            <FileText className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          )}
          <span className={`text-sm px-2 py-1 rounded-full ${
            item.type === 'book' 
              ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200'
              : 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200'
          }`}>
            {item.type === 'book' ? '図書' : '論文'}
          </span>
          
          <div className="ml-auto flex items-center space-x-2">
            {item.available ? (
              <>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                  貸出可
                </span>
                <button
                  onClick={handleQuickBorrow}
                  disabled={isBorrowing}
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  <BookCheck className="h-4 w-4 mr-2" />
                  {isBorrowing ? '貸出中...' : '貸出する'}
                </button>
              </>
            ) : (
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                item.dueDate && isOverdue(item.dueDate)
                  ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                  : 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200'
              }`}>
                貸出中
              </span>
            )}
          </div>
        </div>

        {/* エラー・成功メッセージ */}
        {borrowError && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-md flex items-center">
            <span className="text-sm">{borrowError}</span>
          </div>
        )}
        {borrowSuccess && (
          <div className="mb-4 p-3 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 rounded-md flex items-center">
            <span className="text-sm">{borrowSuccess}</span>
          </div>
        )}
        
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {item.title}
        </h1>
        <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
          {item.author}
        </p>
        
        {/* 書籍画像表示 */}
        {item.image_path && (
          <div className="mb-6">
            <img
              src={`/api/books/${item.id}/image`}
              alt={`${item.title}の表紙`}
              className="max-w-xs max-h-64 object-cover rounded-lg shadow-md mx-auto block"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              詳細情報
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">バーコード:</span>
                <span className="font-medium text-gray-900 dark:text-white">{item.barcode}</span>
              </div>
              
              {item.isbn && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">ISBN:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{item.isbn}</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">保管場所:</span>
                <span className="font-medium text-gray-900 dark:text-white">{item.location}</span>
              </div>
              
              {item.copies && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">複製数:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{item.copies}冊</span>
                </div>
              )}
            </div>
          </div>
          
          {!item.available && item.borrowedBy && item.borrowedAt && item.dueDate && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                現在の貸出情報
              </h2>
              <div className="space-y-2">
                <div className="flex items-center">
                  <User className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2" />
                  <span className="text-gray-600 dark:text-gray-400">借出者:</span>
                  <span className="font-medium text-gray-900 dark:text-white ml-2">
                    ID: {item.borrowedBy}
                  </span>
                </div>
                
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2" />
                  <span className="text-gray-600 dark:text-gray-400">貸出日:</span>
                  <span className="font-medium text-gray-900 dark:text-white ml-2">
                    {formatDate(item.borrowedAt)}
                  </span>
                </div>
                
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2" />
                  <span className="text-gray-600 dark:text-gray-400">返却期限:</span>
                  <span className={`font-medium ml-2 ${
                    isOverdue(item.dueDate)
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-gray-900 dark:text-white'
                  }`}>
                    {formatDate(item.dueDate)}
                    {isOverdue(item.dueDate) && ' (期限超過)'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            貸出履歴
          </h2>
          
          {borrowingHistory.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">貸出履歴はありません</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      借出者
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      貸出日
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      返却日
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      ステータス
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {borrowingHistory.map((record) => (
                    <tr key={record.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {record.userName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(record.borrowedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {record.returnedAt ? formatDate(record.returnedAt) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {record.returnedAt ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                            返却済み
                          </span>
                        ) : (
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            isOverdue(record.dueDate)
                              ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                              : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                          }`}>
                            貸出中
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookDetails;