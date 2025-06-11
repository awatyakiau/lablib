import React from 'react';
import { Link } from 'react-router-dom';
import { LibraryItem } from '../../types';
import { Book, FileText, CheckCircle, XCircle } from 'lucide-react';
import { formatDate, isOverdue } from '../../utils/dates';

interface BookListProps {
  items: LibraryItem[];
  showType?: boolean;
}

const BookList: React.FC<BookListProps> = ({ items, showType = true }) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500 dark:text-gray-400">アイテムが見つかりませんでした</p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item) => (
        <Link
          to={`/items/${item.id}`}
          key={item.id}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
        >
          <div className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                {item.type === 'book' ? (
                  <Book className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                ) : (
                  <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                )}
                {showType && (
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    item.type === 'book' 
                      ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200'
                      : 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200'
                  }`}>
                    {item.type === 'book' ? '図書' : '論文'}
                  </span>
                )}
              </div>
              <div className="flex items-center">
                {item.available ? (
                  <span className="flex items-center text-emerald-600 dark:text-emerald-400 text-sm">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    貸出可
                  </span>
                ) : (
                  <span className={`flex items-center text-sm ${
                    item.dueDate && isOverdue(item.dueDate)
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}>
                    <XCircle className="h-4 w-4 mr-1" />
                    貸出中
                  </span>
                )}
              </div>
            </div>
            
            <h3 className="mt-3 text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
              {item.title}
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              {item.author}
            </p>
            
            <div className="mt-3 flex flex-col space-y-1 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex justify-between">
                <span>場所:</span>
                <span className="font-medium">{item.location}</span>
              </div>
              {item.isbn && (
                <div className="flex justify-between">
                  <span>ISBN:</span>
                  <span className="font-medium">{item.isbn}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>バーコード:</span>
                <span className="font-medium">{item.barcode}</span>
              </div>
            </div>
            
            {!item.available && item.dueDate && (
              <div className={`mt-3 text-xs ${
                isOverdue(item.dueDate)
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-gray-600 dark:text-gray-300'
              }`}>
                <p>返却期限: {formatDate(item.dueDate)}</p>
              </div>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
};

export default BookList;