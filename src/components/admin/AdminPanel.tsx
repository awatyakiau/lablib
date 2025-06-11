import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import BookRegistration from './BookRegistration';
import UserRegistration from './UserRegistration';

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState('book-registration');
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          管理者パネル
        </h1>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="book-registration">蔵書登録</TabsTrigger>
            <TabsTrigger value="user-registration">ユーザー管理</TabsTrigger>
          </TabsList>
          
          <TabsContent value="book-registration">
            <BookRegistration />
          </TabsContent>
          
          <TabsContent value="user-registration">
            <UserRegistration />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;