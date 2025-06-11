import { LibraryItem, BorrowingRecord, RankingItem } from '../types';
import { addDays, format } from './dates';

// Mock library items
export const mockLibraryItems: LibraryItem[] = [
  {
    id: '1',
    title: 'リーダブルコード',
    author: 'Dustin Boswell, Trevor Foucher',
    type: 'book',
    barcode: '9784873115658',
    isbn: '9784873115658',
    available: true,
    location: '本棚A-1',
    copies: 3
  },
  {
    id: '2',
    title: '達人プログラマー',
    author: 'David Thomas, Andrew Hunt',
    type: 'book',
    barcode: '9784274226298',
    isbn: '9784274226298',
    available: true,
    location: '本棚A-2',
    copies: 2
  },
  {
    id: '3',
    title: 'SQLアンチパターン',
    author: 'Bill Karwin',
    type: 'book',
    barcode: '9784873115894',
    isbn: '9784873115894',
    available: false,
    location: '本棚B-1',
    copies: 1,
    borrowedBy: '00061204',
    borrowedAt: '2025-04-01T10:30:00Z',
    dueDate: '2025-04-15T10:30:00Z'
  },
  {
    id: '4',
    title: 'プログラミング言語Go',
    author: 'Alan A. A. Donovan, Brian W. Kernighan',
    type: 'book',
    barcode: '9784621300374',
    isbn: '9784621300374',
    available: true,
    location: '本棚B-2',
    copies: 1
  },
  {
    id: '5',
    title: 'コンピュータネットワークにおける新しいルーティングアルゴリズムの提案',
    author: '研究 太郎',
    type: 'thesis',
    barcode: 'T2024001',
    available: true,
    location: '論文棚C-1',
    copies: 1
  },
  {
    id: '6',
    title: '機械学習を用いた画像認識の精度向上に関する研究',
    author: '技術 花子',
    type: 'thesis',
    barcode: 'T2024002',
    available: true,
    location: '論文棚C-2',
    copies: 1
  },
  {
    id: '7',
    title: 'AIを活用したソフトウェアテスト自動化の可能性',
    author: '情報 次郎',
    type: 'thesis',
    barcode: 'T2023001',
    available: false,
    location: '論文棚C-3',
    copies: 1,
    borrowedBy: '00999999',
    borrowedAt: '2025-03-20T14:15:00Z',
    dueDate: '2025-04-03T14:15:00Z'
  }
];

// Mock borrowing records
export const mockBorrowingRecords: BorrowingRecord[] = [
  {
    id: 'b1',
    itemId: '3',
    itemTitle: 'SQLアンチパターン',
    userId: '00061204',
    userName: '一般さん',
    borrowedAt: '2025-04-01T10:30:00Z',
    dueDate: '2025-04-15T10:30:00Z'
  },
  {
    id: 'b2',
    itemId: '7',
    itemTitle: 'AIを活用したソフトウェアテスト自動化の可能性',
    userId: '00999999',
    userName: '管理者さん',
    borrowedAt: '2025-03-20T14:15:00Z',
    dueDate: '2025-04-03T14:15:00Z'
  },
  {
    id: 'b3',
    itemId: '2',
    itemTitle: '達人プログラマー',
    userId: '00061204',
    userName: '一般さん',
    borrowedAt: '2025-03-10T09:45:00Z',
    returnedAt: '2025-03-20T11:30:00Z',
    dueDate: '2025-03-24T09:45:00Z'
  },
  {
    id: 'b4',
    itemId: '1',
    itemTitle: 'リーダブルコード',
    userId: '00999999',
    userName: '管理者さん',
    borrowedAt: '2025-02-15T13:10:00Z',
    returnedAt: '2025-02-28T16:20:00Z',
    dueDate: '2025-03-01T13:10:00Z'
  }
];

// Mock ranking data
export const mockRankingItems: RankingItem[] = [
  {
    id: '1',
    title: 'リーダブルコード',
    author: 'Dustin Boswell, Trevor Foucher',
    type: 'book',
    borrowCount: 8
  },
  {
    id: '2',
    title: '達人プログラマー',
    author: 'David Thomas, Andrew Hunt',
    type: 'book',
    borrowCount: 6
  },
  {
    id: '5',
    title: 'コンピュータネットワークにおける新しいルーティングアルゴリズムの提案',
    author: '研究 太郎',
    type: 'thesis',
    borrowCount: 4
  },
  {
    id: '3',
    title: 'SQLアンチパターン',
    author: 'Bill Karwin',
    type: 'book',
    borrowCount: 3
  },
  {
    id: '7',
    title: 'AIを活用したソフトウェアテスト自動化の可能性',
    author: '情報 次郎',
    type: 'thesis',
    borrowCount: 2
  }
];

// Helper function to get items of a specific type
export const getItemsByType = (type: 'book' | 'thesis' | 'all'): LibraryItem[] => {
  if (type === 'all') return mockLibraryItems;
  return mockLibraryItems.filter(item => item.type === type);
};

// Helper function to get borrowing records for a user
export const getUserBorrowingRecords = (userId: string): BorrowingRecord[] => {
  return mockBorrowingRecords.filter(record => record.userId === userId);
};

// Helper function to search items
export const searchItems = (query: string): LibraryItem[] => {
  const lowerQuery = query.toLowerCase();
  return mockLibraryItems.filter(item => 
    item.title.toLowerCase().includes(lowerQuery) || 
    item.author.toLowerCase().includes(lowerQuery) || 
    (item.isbn && item.isbn.includes(query)) ||
    item.barcode.includes(query)
  );
};

// Helper function to borrow an item
export const borrowItem = (barcode: string, userId: string, userName: string): BorrowingRecord => {
  const item = mockLibraryItems.find(item => item.barcode === barcode);
  
  if (!item) {
    throw new Error('アイテムが見つかりません');
  }
  
  if (!item.available) {
    throw new Error('このアイテムは現在貸出中です');
  }
  
  const now = new Date().toISOString();
  const dueDate = addDays(new Date(), 14).toISOString();
  
  // Update item status
  item.available = false;
  item.borrowedBy = userId;
  item.borrowedAt = now;
  item.dueDate = dueDate;
  
  // Create borrowing record
  const newRecord: BorrowingRecord = {
    id: `b${mockBorrowingRecords.length + 1}`,
    itemId: item.id,
    itemTitle: item.title,
    userId,
    userName,
    borrowedAt: now,
    dueDate
  };
  
  mockBorrowingRecords.push(newRecord);
  
  return newRecord;
};

// Helper function to return an item
export const returnItem = (barcode: string): BorrowingRecord => {
  const item = mockLibraryItems.find(item => item.barcode === barcode);
  
  if (!item) {
    throw new Error('アイテムが見つかりません');
  }
  
  if (item.available) {
    throw new Error('このアイテムは貸出中ではありません');
  }
  
  const record = mockBorrowingRecords.find(
    record => record.itemId === item.id && !record.returnedAt
  );
  
  if (!record) {
    throw new Error('貸出記録が見つかりません');
  }
  
  // Update item status
  item.available = true;
  item.borrowedBy = undefined;
  item.borrowedAt = undefined;
  item.dueDate = undefined;
  
  // Update borrowing record
  record.returnedAt = new Date().toISOString();
  
  return record;
};