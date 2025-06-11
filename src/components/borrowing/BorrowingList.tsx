import React from 'react';
import { BorrowingRecord } from '../../types';
import { Book, FileText, ArrowUpRight } from 'lucide-react';
import { formatDate, daysRemaining, isOverdue } from '../../utils/dates';
import { Link } from 'react-router-dom';

interface BorrowingListProps {
  borrowings: BorrowingRecord[];
  showUser?: boolean;
  title?: string;
}

const BorrowingList: React.FC<BorrowingListProps> = ({ 
  borrowings, 
  showUser = false,
  title = '現在の貸出'
}) => {
  // Separate active borrowings from returned ones
  const activeBorrowings = borrowings.filter(b => !b.returnedAt);
  
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
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">
          {title}
        </h2>
      </div>
      
      {activeBorrowings.length > 0 ? (
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {activeBorrowings.map((borrowing) => {
            const days = daysRemaining(borrowing.dueDate);
            const overdue = isOverdue(borrowing.dueDate);
            
            return (
              <li key={borrowing.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-750">
                <div className="flex justify-between">
                  <div className="flex items-start space-x-3">
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
                    <div>
                      <h3 className="text-base font-medium text-gray-900 dark:text-white">
                        {borrowing.itemTitle}
                      </h3>
                      
                      <div className="mt-1 flex flex-col space-y-1 text-sm text-gray-500 dark:text-gray-400">
                        {showUser && (
                          <div className="flex items-center">
                            <span>借出者: {borrowing.userName}</span>
                          </div>
                        )}
                        <div className="flex items-center">
                          <span>貸出日: {formatDate(borrowing.borrowedAt)}</span>
                        </div>
                        <div className="flex items-center">
                          <span>返却期限: {formatDate(borrowing.dueDate)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end space-y-2">
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      overdue
                        ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                        : days <= 3
                          ? 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200'
                          : 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200'
                    }`}>
                      {overdue
                        ? `${Math.abs(days)}日超過`
                        : `あと${days}日`
                      }
                    </div>
                    
                    <Link 
                      to={`/items/${borrowing.itemId}`}
                      className="inline-flex items-center text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                    >
                      詳細を見る
                      <ArrowUpRight className="ml-1 h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">現在の貸出はありません</p>
        </div>
      )}
    </div>
  );
};

export default BorrowingList;