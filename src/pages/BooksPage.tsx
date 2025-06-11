import React, { useState } from 'react';
import BookList from '../components/books/BookList';
import { getItemsByType, searchItems } from '../utils/mockData';
import { LibraryItem } from '../types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import SearchBar from '../components/books/SearchBar';

const BooksPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [items, setItems] = useState<LibraryItem[]>(getItemsByType('all'));
  const [searchQuery, setSearchQuery] = useState('');
  
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    
    if (tab === 'all') {
      setItems(getItemsByType('all'));
    } else if (tab === 'books') {
      setItems(getItemsByType('book'));
    } else if (tab === 'thesis') {
      setItems(getItemsByType('thesis'));
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const results = searchItems(query);
    setItems(results);
  };
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        蔵書一覧
      </h1>

      <div className="mb-6">
        <SearchBar onSearch={handleSearch} />
      </div>
      
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">すべて</TabsTrigger>
          <TabsTrigger value="books">図書</TabsTrigger>
          <TabsTrigger value="thesis">論文</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          <BookList items={items} />
        </TabsContent>
        
        <TabsContent value="books">
          <BookList items={items} showType={false} />
        </TabsContent>
        
        <TabsContent value="thesis">
          <BookList items={items} showType={false} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BooksPage;