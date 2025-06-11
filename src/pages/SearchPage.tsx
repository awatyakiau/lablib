import React, { useState } from 'react';
import SearchBar from '../components/books/SearchBar';
import BookList from '../components/books/BookList';
import { searchItems } from '../utils/mockData';
import { LibraryItem } from '../types';

const SearchPage: React.FC = () => {
  const [searchResults, setSearchResults] = useState<LibraryItem[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  
  const handleSearch = (query: string) => {
    const results = searchItems(query);
    setSearchResults(results);
    setHasSearched(true);
  };
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          図書・論文を検索
        </h1>
        <div className="flex justify-center mb-8">
          <SearchBar onSearch={handleSearch} />
        </div>
      </div>
      
      {hasSearched && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            検索結果: {searchResults.length}件
          </h2>
          <BookList items={searchResults} />
        </div>
      )}
      
      {!hasSearched && (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">
            タイトル、著者、ISBNまたはバーコードで検索してください
          </p>
        </div>
      )}
    </div>
  );
};

export default SearchPage;