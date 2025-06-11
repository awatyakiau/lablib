import React, { useState } from 'react';
import { BorrowingRecord } from '../../types';
import { Book, FileText, ArrowUpRight, Search } from 'lucide-react';
import { formatDate, isOverdue } from '../../utils/dates';
import { Link } from 'react-router-dom';

interface BorrowingHistoryProps {
  borrowings: BorrowingRecord[];
  showUser?: boolean;
}

const BorrowingHistory: React.FC<BorrowingHistoryProps> = ({ 
  borrowings, 
  showUser = false 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredBorrowings = borrowings.filter(borrowing => 
    borrowing.itemTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (showUser && borrowing.userName.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  if (borrowings.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">貸出履歴はありません</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          貸出履歴
        </h2>
        
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder={showUser ? "タイトルまたはユーザー名で検索..." : "タイトルで検索..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
          />
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                アイテム
              </th>
              {showUser && (
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  借出者
                </th>
              )}
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                貸出日
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                返却日
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                ステータス
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">詳細</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredBorrowings.map((borrowing) => (
              <tr key={borrowing.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className={`flex-shrink-0 p-1 rounded-md ${
                      borrowing.itemTitle.includes('論文')
                        ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400'
                        : 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400'
                    }`}>
                      {borrowing.itemTitle.includes('論文') ? (
                        <FileText className="h-5 w-5" />
                      ) : (
                        <Book className="h-5 w-5" />
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {borrowing.itemTitle}
                      </div>
                    </div>
                  </div>
                </td>
                
                {showUser && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">{borrowing.userName}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">ID: {borrowing.userId}</div>
                  </td>
                )}
                
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(borrowing.borrowedAt)}
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {borrowing.returnedAt ? formatDate(borrowing.returnedAt) : '-'}
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  {borrowing.returnedAt ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                      返却済み
                    </span>
                  ) : (
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      isOverdue(borrowing.dueDate)
                        ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                        : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                    }`}>
                      貸出中
                    </span>
                  )}
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link
                    to={`/items/${borrowing.itemId}`}
                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 inline-flex items-center"
                  >
                    詳細
                    <ArrowUpRight className="ml-1 h-3 w-3" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BorrowingHistory;