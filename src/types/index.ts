export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  name: string;
  role: UserRole;
}

export type LoginCredentials = {
  studentId: string;
  password: string;
};

export type AuthResponse = {
  token: string;
  user: User;
};

export type ItemType = 'book' | 'thesis';

export interface LibraryItem {
  id: string;
  title: string;
  author: string;
  type: ItemType;
  barcode: string;
  available: boolean;
  location?: string;
  isbn?: string;
  copies?: number;
  borrowedBy?: string;
  borrowedAt?: string;
  dueDate?: string;
}

export interface BorrowingRecord {
  id: string;
  itemId: string;
  itemTitle: string;
  userId: string;
  userName: string;
  borrowedAt: string;
  returnedAt?: string;
  dueDate: string;
}

export interface RankingItem {
  id: string;
  title: string;
  author: string;
  type: ItemType;
  borrowCount: number;
}