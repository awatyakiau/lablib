import React, { useState } from 'react';
import { BookPlus, Save, Trash, Search, Loader2, Download, QrCode } from 'lucide-react';
import BarcodeScanner from '../books/BarcodeScanner';
import axios from 'axios';
import { Save, Search, Loader2, X } from 'lucide-react';

interface FormData {
  title: string;
  author: string;
  type: 'book' | 'thesis';
  barcode: string;
  isbn: string;
  location: string;
  copies: number;
}

const BookRegistration: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    author: '',
    type: 'book',
    barcode: '',
    isbn: '',
    location: '',
    copies: 1,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'copies' ? parseInt(value) || 1 : value,
    }));
  };

  const handleAutoSearch = async () => {
    if (!formData.isbn) return;

    setIsSearching(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/books/fetch-info', {
        params: { isbn: formData.isbn },
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data) {
        setFormData(prev => ({
          ...prev,
          title: response.data.title || prev.title,
          author: response.data.author || prev.author,
        }));
        setSuccess('書籍情報を取得しました');
        setTimeout(() => setSuccess(null), 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || '書籍情報の取得に失敗しました');
    } finally {
      setIsSearching(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedImage(null);
      setImagePreview(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('ファイルサイズが大きすぎます（最大5MB）');
      return;
    }

    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
      setError('サポートされていない画像形式です（JPEG, PNG, WebP のみ）');
      return;
    }

    setSelectedImage(file);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.author.trim()) {
      setError('タイトルと著者は必須です');
      return;
    }

    if (formData.copies < 1) {
      setError('複製数は1以上である必要があります');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.post('/api/admin/books', {
        ...formData,
        total_copies: formData.copies,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (selectedImage && response.data.id) {
        try {
          const imageFormData = new FormData();
          imageFormData.append('image', selectedImage);

          await axios.post(`/api/admin/books/${response.data.id}/image`, imageFormData, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          });
        } catch (imgErr) {
          console.error('画像のアップロードに失敗しました:', imgErr);
        }
      }

      setSuccess('書籍を登録しました');
      
      setFormData({
        title: '',
        author: '',
        type: 'book',
        barcode: '',
        isbn: '',
        location: '',
        copies: 1,
      });
      setSelectedImage(null);
      setImagePreview(null);

      setTimeout(() => {
        setSuccess(null);
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || '登録に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        書籍登録
      </h2>

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
            placeholder="書籍のタイトル"
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
            placeholder="著者名"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            種類 <span className="text-red-500">*</span>
          </label>
          <select
            name="type"
            value={formData.type}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            required
          >
            <option value="book">書籍</option>
            <option value="thesis">論文</option>
          </select>
        </div>

        {formData.type === 'book' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              ISBN <span className="text-red-500">*</span>
            </label>
            <div className="flex space-x-2">
              <input
                name="isbn"
                type="text"
                value={formData.isbn}
                onChange={handleInputChange}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="13桁のISBN"
              />
              <button
                type="button"
                onClick={handleAutoSearch}
                disabled={!formData.isbn || isSearching}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            保管場所 <span className="text-red-500">*</span>
          </label>
          <input
            name="location"
            type="text"
            value={formData.location}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            placeholder="例: 書庫A-1"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            表紙画像 <span className="text-gray-500 text-xs">(任意)</span>
          </label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <label className="flex-1 cursor-pointer">
                <div className="flex items-center justify-center w-full px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md hover:border-indigo-500 transition-colors">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedImage ? selectedImage.name : '📷 画像を選択'}
                  </span>
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  disabled={isLoading}
                  className="hidden"
                />
              </label>
              {selectedImage && (
                <button
                  type="button"
                  onClick={clearImage}
                  className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                  title="画像を削除"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              JPEG, PNG, WebP形式、最大5MB
            </p>
    
            {imagePreview && (
              <div className="mt-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">プレビュー:</p>
                <img
                  src={imagePreview}
                  alt="プレビュー"
                  className="max-w-xs max-h-48 object-cover rounded-lg shadow-md"
                />
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            バーコード <span className="text-red-500">*</span>
          </label>
          <input
            name="barcode"
            type="text"
            value={formData.barcode}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            placeholder="13桁のバーコード"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            複製数 <span className="text-red-500">*</span>
          </label>
          <input
            name="copies"
            type="number"
            min="1"
            value={formData.copies}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              登録中...
            </>
          ) : (
            <>
              <Save className="h-5 w-5 mr-2" />
              登録
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default BookRegistration;