import React, { useState, useEffect } from 'react';
import { QrCode, Download, Trash2, Printer, Save } from 'lucide-react';
import axios from 'axios';

interface GeneratedBarcode {
  barcode: string;
  year: string;
  student_id: string;
  author_name: string;
  title: string;
  filename: string;
  file_path: string;
  image_data: string;
  created_at: string;
  status: string;
}

interface SavedBarcode {
  filename: string;
  file_path: string;
  created_at: string;
  size: number;
  year?: string;
  student_id?: string;
}

const BarcodeGenerator: React.FC = () => {
  const [formData, setFormData] = useState({
    year: new Date().getFullYear().toString(),
    student_id: '',
    author_name: '',
    title: ''
  });
  
  const [generatedBarcode, setGeneratedBarcode] = useState<GeneratedBarcode | null>(null);
  const [savedBarcodes, setSavedBarcodes] = useState<SavedBarcode[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 保存されたバーコード一覧を取得
  const fetchSavedBarcodes = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/admin/barcode/saved');
      setSavedBarcodes(response.data.barcodes || []);
    } catch (err) {
      console.error('保存されたバーコード取得エラー:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedBarcodes();
  }, []);

  // フォーム送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.year || !formData.student_id || !formData.author_name || !formData.title) {
      setError('すべてのフィールドを入力してください');
      return;
    }

    // 学籍番号が6桁であることを確認
    if (formData.student_id.length !== 6) {
      setError('学籍番号は6桁で入力してください');
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);
      
      const response = await axios.post('/api/admin/barcode/generate-thesis', formData);
      setGeneratedBarcode(response.data);
      setSuccess('バーコードが生成され、ファイルに保存されました（番号付き画像）');
      
      // 保存済みリストを更新
      await fetchSavedBarcodes();
      
    } catch (err: any) {
      setError(err.response?.data?.error || 'バーコード生成に失敗しました');
    } finally {
      setIsGenerating(false);
    }
  };

  // バーコード画像ダウンロード
  const downloadBarcode = async (filename: string) => {
    try {
      const response = await axios.get(`/api/admin/barcode/download/${filename}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setSuccess(`${filename} をダウンロードしました`);
    } catch (err) {
      setError('ダウンロードに失敗しました');
    }
  };

  // バーコード画像削除
  const deleteBarcode = async (filename: string) => {
    if (!confirm(`${filename} を削除しますか？`)) return;
    
    try {
      await axios.delete(`/api/admin/barcode/${filename}`);
      setSuccess(`${filename} を削除しました`);
      await fetchSavedBarcodes();
    } catch (err) {
      setError('削除に失敗しました');
    }
  };

  // 印刷機能（ブラウザの印刷ダイアログを開く）
  const printBarcode = (imageData: string) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>バーコード印刷</title>
            <style>
              body { 
                margin: 0; 
                padding: 20px; 
                display: flex; 
                justify-content: center; 
                align-items: center; 
                min-height: 100vh; 
              }
              img { 
                max-width: 100%; 
                height: auto; 
              }
            </style>
          </head>
          <body>
            <img src="${imageData}" alt="Barcode" />
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          卒論バーコード生成システム
        </h2>

        {/* 成功・エラーメッセージ */}
        {success && (
          <div className="mb-4 p-3 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 rounded-md">
            {success}
          </div>
        )}
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-md">
            {error}
          </div>
        )}

        {/* バーコード生成フォーム */}
        <form onSubmit={handleSubmit} className="space-y-4 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                卒論作成時の年度 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="例: 2024"
                maxLength={4}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                学籍番号(6桁) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.student_id}
                onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="例: 123456"
                maxLength={6}
                pattern="[0-9]{6}"
                title="6桁の数字を入力してください"
                required
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                6桁の学籍番号を入力してください
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              作者名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.author_name}
              onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              placeholder="例: 山田太郎"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              登録する書籍名（卒業論文タイトル） <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              placeholder="例: 深層学習を用いた画像認識に関する研究"
              rows={3}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isGenerating}
            className="w-full flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                生成中...
              </>
            ) : (
              <>
                <QrCode className="mr-2 h-5 w-5" />
                バーコード生成・保存（番号付き画像）
              </>
            )}
          </button>
        </form>

        {/* 生成されたバーコード表示 */}
        {generatedBarcode && (
          <div className="border rounded-lg p-6 bg-gray-50 dark:bg-gray-700 mb-8">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              生成されたバーコード（番号付き画像）
            </h3>
            
            <div className="text-center mb-4">
              <div className="inline-block p-4 bg-white rounded-lg shadow">
                <img
                  src={generatedBarcode.image_data}
                  alt={`Barcode: ${generatedBarcode.barcode}`}
                  className="max-w-full h-auto"
                />
              </div>
            </div>
            
            <div className="text-center mb-4">
              <div className="font-mono text-xl text-gray-900 dark:text-white">
                {generatedBarcode.barcode}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                ※ 画像にはバーコード番号も含まれています
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
              <div>
                <span className="text-gray-500 dark:text-gray-400">年度:</span>
                <span className="ml-2 text-gray-900 dark:text-white">{generatedBarcode.year}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">学籍番号:</span>
                <span className="ml-2 text-gray-900 dark:text-white">{generatedBarcode.student_id}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">作者:</span>
                <span className="ml-2 text-gray-900 dark:text-white">{generatedBarcode.author_name}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">ファイル名:</span>
                <span className="ml-2 text-gray-900 dark:text-white">{generatedBarcode.filename}</span>
              </div>
            </div>
            
            <div className="flex justify-center space-x-3">
              <button
                onClick={() => downloadBarcode(generatedBarcode.filename)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Download className="mr-2 h-4 w-4" />
                ダウンロード（番号付き）
              </button>
              
              <button
                onClick={() => printBarcode(generatedBarcode.image_data)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <Printer className="mr-2 h-4 w-4" />
                印刷
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 保存されたバーコード一覧 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            保存されたバーコード一覧（番号付き画像）
          </h3>
          <button
            onClick={fetchSavedBarcodes}
            disabled={isLoading}
            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            更新
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    ファイル名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    年度/学籍番号
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    作成日時
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    サイズ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {savedBarcodes.map((barcode, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {barcode.filename}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {barcode.year && barcode.student_id ? 
                        `${barcode.year} / ${barcode.student_id}` : 
                        '-'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {barcode.created_at}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {(barcode.size / 1024).toFixed(1)} KB
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => downloadBarcode(barcode.filename)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          title="ダウンロード（番号付き）"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteBarcode(barcode.filename)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="削除"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {savedBarcodes.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                保存されたバーコードがありません
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BarcodeGenerator;