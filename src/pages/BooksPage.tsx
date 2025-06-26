import React, { useState, useEffect } from 'react';
import BookList from '../components/books/BookList';
import { LibraryItem } from '../types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import SearchBar from '../components/books/SearchBar';
import axios from 'axios';

const BooksPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 書籍一覧取得
  const fetchBooks = async (type: string = 'all', query: string = '') => {
  setLoading(true);
  setError(null);
  try {
    let url = '/api/books';
    const params: any = {};
    if (query) params.query = query;
    if (type === 'book' || type === 'thesis') params.type = type;
    const response = await axios.get(url, { params });
    // レスポンスが配列かどうかをチェック
    let books: LibraryItem[] = Array.isArray(response.data)
      ? response.data
      : (response.data.books ?? []);
    if (type === 'book' || type === 'thesis') {
      books = books.filter(item => item.type === type);
    }
    setItems(books);
  } catch (e: any) {
    setItems([]); // ← エラー時も空配列をセット
    setError('書籍一覧の取得に失敗しました');
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchBooks(activeTab, searchQuery);
    // eslint-disable-next-line
  }, [activeTab]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    fetchBooks(tab, searchQuery);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    fetchBooks(activeTab, query);
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
          {loading ? (
            <div>読み込み中...</div>
          ) : error ? (
            <div className="text-red-500">{error}</div>
          ) : items.length === 0 ? (
            <div>書籍が登録されていません</div>
          ) : (
            <BookList items={items} />
          )}
        </TabsContent>

        <TabsContent value="books">
          {loading ? (
            <div>読み込み中...</div>
          ) : error ? (
            <div className="text-red-500">{error}</div>
          ) : items.length === 0 ? (
            <div>書籍が登録されていません</div>
          ) : (
            <BookList items={items} showType={false} />
          )}
        </TabsContent>


        <TabsContent value="thesis">
          {loading ? (
            <div>読み込み中...</div>
          ) : error ? (
            <div className="text-red-500">{error}</div>
          ) : items.length === 0 ? (
            <div>書籍が登録されていません</div>
          ) : (
            <BookList items={items} showType={false} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BooksPage;