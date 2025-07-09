import React, { useState } from 'react'; // ← useStateを追加
import { Link } from 'react-router-dom';
import { LibraryItem } from '../../types';
import { Book, FileText, CheckCircle, XCircle, Edit, MapPin } from 'lucide-react'; // ← Edit, MapPinを追加
import { formatDate, isOverdue } from '../../utils/dates';
import { useAuth } from '../../contexts/AuthContext'; // ← この行を追加
import BookEditModal from '../admin/BookEditModal'; // ← この行を追加

interface BookListProps {
  items: LibraryItem[];
  showType?: boolean;
}

const BookList: React.FC<BookListProps> = ({ items, showType = true }) => {
const { user } = useAuth();
  const [editingBook, setEditingBook] = useState<LibraryItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleEditBook = (book: LibraryItem) => {
    setEditingBook(book);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingBook(null);
  };

  const handleBookUpdated = () => {
    window.location.reload(); // 簡単な実装
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500 dark:text-gray-400">アイテムが見つかりませんでした</p>
      </div>
    );
  }
  
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <div key={item.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <Link to={`/books/${item.id}`}>
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
            
            {/* ← 管理者用編集ボタンを追加 */}
            {user?.role === 'admin' && (
              <div className="px-5 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleEditBook(item);
                  }}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900 hover:bg-indigo-200 dark:hover:bg-indigo-800"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  編集
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ← 編集モーダルを追加 */}
      {editingBook && (
        <BookEditModal
          book={editingBook}
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          onUpdate={handleBookUpdated}
        />
      )}
    </>
  );
};

export default BookList;