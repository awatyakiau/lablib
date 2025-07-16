import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Book, FileText, User, Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { formatDate, isOverdue } from '../../utils/dates';
import axios from 'axios';

interface BorrowingRecordDetailsProps {}

const BorrowingRecordDetails: React.FC<BorrowingRecordDetailsProps> = () => {
  const { id } = useParams<{ id: string }>();
  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecord = async () => {
      if (!id) return;
      
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`/api/books/borrow-record/${id}`);
        setRecord(response.data);
      } catch (err: any) {
        setError(err.response?.data?.error || '貸出記録の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchRecord();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 p-4 rounded-md">
        {error || '貸出記録が見つかりません'}
      </div>
    );
  }

  const isReturned = !!record.returned_at;
  const overdue = !isReturned && isOverdue(record.due_date);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          to="/history"
          className="inline-flex items-center text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          貸出履歴に戻る
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            貸出記録詳細
          </h1>
        </div>

        <div className="p-6 space-y-6">
          {/* ステータス */}
          <div className="flex items-center">
            {isReturned ? (
              <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
            ) : overdue ? (
              <AlertCircle className="h-6 w-6 text-red-500 mr-2" />
            ) : (
              <Clock className="h-6 w-6 text-yellow-500 mr-2" />
            )}
            <span className={`text-lg font-semibold ${
              isReturned 
                ? 'text-green-600 dark:text-green-400'
                : overdue 
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-yellow-600 dark:text-yellow-400'
            }`}>
              {isReturned ? '返却済み' : overdue ? '返却期限超過' : '貸出中'}
            </span>
          </div>

          {/* 書籍情報 */}
          <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              {record.book_type === 'book' ? (
                <Book className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
              ) : (
                <FileText className="h-5 w-5 mr-2 text-emerald-600 dark:text-emerald-400" />
              )}
              書籍情報
            </h2>
            <div className="space-y-2">
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">タイトル: </span>
                <Link 
                  to={`/books/${record.book_id}`}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  {record.book_title}
                </Link>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">著者: </span>
                <span className="text-gray-900 dark:text-white">{record.book_author}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">シリアル番号: </span>
                <span className="text-gray-900 dark:text-white">{record.serial_number}</span>
              </div>
            </div>
          </div>

          {/* 利用者情報 */}
          <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <User className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
              利用者情報
            </h2>
            <div className="space-y-2">
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">氏名: </span>
                <span className="text-gray-900 dark:text-white">{record.user_name}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">ユーザーID: </span>
                <span className="text-gray-900 dark:text-white">{record.user_id}</span>
              </div>
            </div>
          </div>

          {/* 貸出情報 */}
          <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
              貸出情報
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">貸出日: </span>
                <span className="text-gray-900 dark:text-white">{formatDate(record.borrowed_at)}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">返却期限: </span>
                <span className={`${
                  overdue ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'
                }`}>
                  {formatDate(record.due_date)}
                  {overdue && ' (期限超過)'}
                </span>
              </div>
              {isReturned && (
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">返却日: </span>
                  <span className="text-gray-900 dark:text-white">{formatDate(record.returned_at)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BorrowingRecordDetails;