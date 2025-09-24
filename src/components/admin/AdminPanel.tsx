import React, { useState } from 'react';
import BookRegistration from './BookRegistration';
import UserRegistration from './UserRegistration';
import BarcodeGenerator from './BarcodeGenerator'; // 追加

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'register' | 'users' | 'barcode'>('register');

  const tabs = [
    { id: 'register', label: '📚 アイテム登録', component: BookRegistration },
    { id: 'users', label: '👥 ユーザー管理', component: UserRegistration },
    { id: 'barcode', label: '🏷️ バーコード生成', component: BarcodeGenerator }, // 追加
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || BookRegistration;

  return (
    <div className="space-y-6">
      {/* タブナビゲーション */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* タブコンテンツ */}
      <div>
        <ActiveComponent />
      </div>
    </div>
  );
};

export default AdminPanel;