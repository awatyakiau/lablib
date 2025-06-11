import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  BookMarked, 
  History, 
  Book,
  QrCode,
  BarChart4
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  return (
    <aside className="w-64 bg-gray-50 dark:bg-gray-900 h-full shadow-sm">
      <nav className="mt-4 px-2">
        <div className="mb-8">
          <h3 className="px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            蔵書
          </h3>
          <div className="mt-2 space-y-1">
            <NavLink 
              to="/books"
              className={({ isActive }) => 
                `group flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors duration-200 ${
                  isActive 
                    ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200 shadow-sm' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`
              }
            >
              <Book className="mr-3 h-5 w-5" />
              蔵書一覧
            </NavLink>
          </div>
        </div>
        
        <div className="mb-8">
          <h3 className="px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            貸出
          </h3>
          <div className="mt-2 space-y-1">
            <NavLink 
              to="/borrow"
              className={({ isActive }) => 
                `group flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors duration-200 ${
                  isActive 
                    ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200 shadow-sm' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`
              }
            >
              <BookMarked className="mr-3 h-5 w-5" />
              貸出・返却
            </NavLink>
            <NavLink 
              to="/history"
              className={({ isActive }) => 
                `group flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors duration-200 ${
                  isActive 
                    ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200 shadow-sm' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`
              }
            >
              <History className="mr-3 h-5 w-5" />
              貸出履歴
            </NavLink>
            <NavLink 
              to="/ranking"
              className={({ isActive }) => 
                `group flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors duration-200 ${
                  isActive 
                    ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200 shadow-sm' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`
              }
            >
              <BarChart4 className="mr-3 h-5 w-5" />
              人気ランキング
            </NavLink>
          </div>
        </div>
        
        {isAdmin && (
          <div className="mb-8">
            <h3 className="px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              管理
            </h3>
            <div className="mt-2 space-y-1">
              <NavLink 
                to="/admin"
                className={({ isActive }) => 
                  `group flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors duration-200 ${
                    isActive 
                      ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200 shadow-sm' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`
                }
              >
                <QrCode className="mr-3 h-5 w-5" />
                管理者パネル
              </NavLink>
            </div>
          </div>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;