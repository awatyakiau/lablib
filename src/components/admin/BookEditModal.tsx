import React, { useState } from 'react';
import { LibraryItem } from '../../types';
import { X, Save, Loader2, Trash2 } from 'lucide-react';
import axios from 'axios';

interface BookEditModalProps {
  book: LibraryItem;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const BookEditModal: React.FC<BookEditModalProps> = ({ book, isOpen, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    title: book.title,
    author: book.author,
    isbn: book.isbn || '',
    location: book.location || '',
    barcode: book.barcode || '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageUpload = async (file: File) => {
    setIsUploadingImage(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const imageFormData = new FormData();
      imageFormData.append('image', file);

      await axios.post(`/api/admin/books/${book.id}/image`, imageFormData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess('画像をアップロードしました');
      setTimeout(() => {
        onUpdate();
        setSuccess(null);
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || '画像のアップロードに失敗しました');
    } finally {
      setIsUploadingImage(false);
      setSelectedImage(null);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('ファイルサイズが大きすぎます（最大5MB）');
        return;
      }
      
      if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
        setError('サポートされていない画像形式です（JPEG, PNG, WebP のみ）');
        return;
      }

      setSelectedImage(file);
      handleImageUpload(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/admin/books/${book.id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setSuccess('書籍情報を更新しました');
      setTimeout(() => {
        onUpdate();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || '更新に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/admin/books/${book.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setSuccess('書籍を削除しました');
      setTimeout(() => {
        onUpdate();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || '削除に失敗しました');
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              書籍情報編集
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-md">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 rounded-md">
              {success}
            </div>
          )}

          {/* 削除確認ダイアログ */}
          {showDeleteConfirm && (
            <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-md">
              <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-3">
                本当にこの書籍を削除しますか？この操作は取り消せません。
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      削除中...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      削除を実行
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500"
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                タイトル <span className="text-red-500">*</span>
              </label>
              <input
                name="title"
                type="text"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                著者 <span className="text-red-500">*</span>
              </label>
              <input
                name="author"
                type="text"
                value={formData.author}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                ISBN <span className="text-gray-500 text-xs">(任意)</span>
              </label>
              <input
                name="isbn"
                type="text"
                value={formData.isbn}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                保管場所 <span className="text-gray-500 text-xs">(任意)</span>
              </label>
              <input
                name="location"
                type="text"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                表紙画像 <span className="text-gray-500 text-xs">(任意)</span>
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                disabled={isUploadingImage}
                className="w-full text-sm file:mr-4 file:py-2 file:px-4
                           file:rounded-md file:border-0
                           file:text-sm file:font-semibold
                           file:bg-indigo-50 file:text-indigo-700
                           hover:file:bg-indigo-100
                           dark:file:bg-indigo-900 dark:file:text-indigo-200"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                JPEG, PNG, WebP形式、最大5MB
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                バーコード <span className="text-gray-500 text-xs">(任意)</span>
              </label>
              <input
                name="barcode"
                type="text"
                value={formData.barcode}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                disabled={isLoading || isDeleting}
                className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    更新中...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5 mr-2" />
                    更新
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isLoading || isDeleting || showDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
              >
                <Trash2 className="h-5 w-5 mr-2" />
                削除
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookEditModal;