import React from 'react';
import { mockRankingItems } from '../utils/mockData';
import { Book, FileText, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';

const RankingPage: React.FC = () => {
  const topItems = mockRankingItems.slice(0, 5);
  
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        月次貸出人気ランキング
      </h1>
      
      <div className="grid grid-cols-1 gap-6">
        {topItems.map((item, index) => (
          <Link
            to={`/items/${item.id}`}
            key={item.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
          >
            <div className="p-6 flex items-start">
              <div className={`flex-shrink-0 p-3 rounded-full mr-4 ${
                index === 0 
                  ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400'
                  : index === 1
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    : index === 2
                      ? 'bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-400'
                      : 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400'
              }`}>
                <Trophy className="h-8 w-8" />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white mr-4">
                    {index + 1}
                  </span>
                  
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {item.title}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {item.author}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center mt-3">
                  <div className="flex items-center mr-4">
                    {item.type === 'book' ? (
                      <Book className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mr-1" />
                    ) : (
                      <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mr-1" />
                    )}
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      item.type === 'book' 
                        ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200'
                        : 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200'
                    }`}>
                      {item.type === 'book' ? '図書' : '論文'}
                    </span>
                  </div>
                  
                  <div className="px-3 py-1 bg-purple-100 dark:bg-purple-900 rounded-full text-purple-800 dark:text-purple-200 text-sm">
                    {item.borrowCount}回貸出
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RankingPage;