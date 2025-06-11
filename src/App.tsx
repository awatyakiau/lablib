import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Pages
import LoginPage from './pages/LoginPage';
import SearchPage from './pages/SearchPage';
import BooksPage from './pages/BooksPage';
import BookDetailsPage from './pages/BookDetailsPage';
import BorrowReturnPage from './pages/BorrowReturnPage';
import HistoryPage from './pages/HistoryPage';
import RankingPage from './pages/RankingPage';
import AdminPage from './pages/AdminPage';

// Layout
import Layout from './components/layout/Layout';

// ProtectedRoute component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<SearchPage />} />
              <Route path="books" element={<BooksPage />} />
              <Route path="thesis" element={<BooksPage />} />
              <Route path="items/:id" element={<BookDetailsPage />} />
              <Route path="borrow" element={<BorrowReturnPage />} />
              <Route path="history" element={<HistoryPage />} />
              <Route path="ranking" element={<RankingPage />} />
              <Route path="admin/*" element={<AdminPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;