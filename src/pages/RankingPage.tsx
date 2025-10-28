import React, { useState, useEffect } from 'react';
import { Trophy, TrendingUp, Book, FileText, BookCheck, Loader2, Calendar, BarChart3 } from 'lucide-react';
import axios from 'axios';
import { formatDate } from '../utils/dates';

interface RankingBook {
  id?: string;
  month?: string;
  book_id: string;
  borrow_count: number;
  title: string;
  author: string;
  type: string;
}

interface BookAvailability {
  [key: string]: boolean;
}

type RankingType = 'monthly' | 'all-time';

const RankingPage: React.FC = () => {
  const [rankingType, setRankingType] = useState<RankingType>('monthly');
  const [rankings, setRankings] = useState<RankingBook[]>([]);
  const [availability, setAvailability] = useState<BookAvailability>({});
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [borrowingId, setBorrowingId] = useState<string | null>(null);
  const [borrowError, setBorrowError] = useState<string | null>(null);
  const [borrowSuccess, setBorrowSuccess] = useState<string | null>(null);

  const fetchRankings = async () => {
    try {
      setLoading(true);
      let response;
      
      if (rankingType === 'monthly') {
        response = await axios.get('/api/admin/rankings', {
          params: { month: selectedMonth },
        });
      } else {
        response = await axios.get('/api/admin/rankings/all-time');
      }
      
      const rankingData = response.data || [];
      setRankings(rankingData);

      // 各書籍の貸出可否を取得
      const availabilityData: BookAvailability = {};
      for (const item of rankingData) {
        try {
          const bookResponse = await axios.get(`/api/books/${item.book_id}`);
          availabilityData[item.book_id] = bookResponse.data.book.available;
        } catch {
          availabilityData[item.book_id] = false;
        }
      }
      setAvailability(availabilityData);
    } catch (error) {
      console.error('ランキングの取得に失敗しました:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRankings();
  }, [selectedMonth, rankingType]);

  const handleQuickBorrow = async (bookId: string) => {
    setBorrowingId(bookId);
    setBorrowError(null);
    setBorrowSuccess(null);

    try {
      const response = await axios.post('/api/books/quick-borrow', {
        book_id: bookId,
      });

      setBorrowSuccess(`貸出成功！返却期限: ${formatDate(response.data.due_date)}`);

      // 3秒後にリロード
      setTimeout(() => {
        setBorrowSuccess(null);
        fetchRankings();
      }, 3000);
    } catch (err: any) {
      setBorrowError(err.response?.data?.error || '貸出に失敗しました');
      setTimeout(() => setBorrowError(null), 3000);
    } finally {
      setBorrowingId(null);
    }
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-6 w-6 text-yellow-500" />;
    if (index === 1) return <Trophy className="h-6 w-6 text-gray-400" />;
    if (index === 2) return <Trophy className="h-6 w-6 text-orange-600" />;
    return null;
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center mb-4">
          <TrendingUp className="h-8 w-8 mr-3 text-indigo-600 dark:text-indigo-400" />
          貸出ランキング
        </h1>
        
        {/* タブ切り替え */}
        <div className="flex items-center space-x-4 mb-4">
          <button
            onClick={() => setRankingType('monthly')}
            className={`flex items-center px-4 py-2 rounded-md transition-colors ${
              rankingType === 'monthly'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            <Calendar className="h-4 w-4 mr-2" />
            月間ランキング
          </button>
          <button
            onClick={() => setRankingType('all-time')}
            className={`flex items-center px-4 py-2 rounded-md transition-colors ${
              rankingType === 'all-time'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            全期間ランキング
          </button>
        </div>

        {/* 月選択（月間ランキングの場合のみ表示） */}
        {rankingType === 'monthly' && (
          <div className="flex items-center space-x-4">
            <label htmlFor="month" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              対象月:
            </label>
            <input
              type="month"
              id="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
            />
          </div>
        )}
      </div>

      {/* エラー・成功メッセージ */}
      {borrowError && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-md">
          {borrowError}
        </div>
      )}
      {borrowSuccess && (
        <div className="mb-4 p-3 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 rounded-md">
          {borrowSuccess}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : rankings.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            {rankingType === 'monthly' 
              ? '選択された月のランキングデータがありません' 
              : 'ランキングデータがありません'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    順位
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    タイトル
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    著者
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    種別
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    貸出回数
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {rankings.map((item, index) => (
                  <tr key={item.id || item.book_id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getRankIcon(index)}
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {index + 1}位
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.title}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {item.author}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {item.type === 'book' ? (
                          <Book className="h-4 w-4 text-indigo-600 dark:text-indigo-400 mr-1" />
                        ) : (
                          <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mr-1" />
                        )}
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          item.type === 'book'
                            ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200'
                            : 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200'
                        }`}>
                          {item.type === 'book' ? '図書' : '論文'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {item.borrow_count}回
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {availability[item.book_id] ? (
                        <button
                          onClick={() => handleQuickBorrow(item.book_id)}
                          disabled={borrowingId === item.book_id}
                          className="inline-flex items-center px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-sm"
                        >
                          {borrowingId === item.book_id ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              処理中...
                            </>
                          ) : (
                            <>
                              <BookCheck className="h-4 w-4 mr-1" />
                              貸出
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="text-sm text-gray-500 dark:text-gray-400 px-3 py-1.5">
                          貸出中
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default RankingPage;