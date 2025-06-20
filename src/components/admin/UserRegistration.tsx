import React, { useState } from 'react';
import { User, UserPlus, UserX, Check, X } from 'lucide-react';
import axios from 'axios';

interface UserFormData {
  studentId: string;
  name: string;
  password: string;
  confirmPassword: string;
}

interface User {
  id: string;
  studentId: string;
  name: string;
  role: string;
}

const UserRegistration: React.FC = () => {
  const [formData, setFormData] = useState<UserFormData>({
    studentId: '',
    name: '',
    password: '',
    confirmPassword: ''
  });
  
  const [users, setUsers] = useState<User[]>([]);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  
  // ユーザー一覧の取得
  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/admin/users');
      const data = response.data;
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('ユーザー一覧の取得に失敗しました');
    }
  };

  // コンポーネントマウント時にユーザー一覧を取得
  React.useEffect(() => {
    fetchUsers();
  }, []);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const validateStudentId = (id: string): boolean => {
    return /^\d{8}$/.test(id);
  };
  
  const validatePassword = (pwd: string): boolean => {
    const hasUppercase = /[A-Z]/.test(pwd);
    const hasLowercase = /[a-z]/.test(pwd);
    const hasNumber = /\d/.test(pwd);
    const isLongEnough = pwd.length >= 6;
    
    return hasUppercase && hasLowercase && hasNumber && isLongEnough;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!validateStudentId(formData.studentId)) {
      setError('学籍番号は8桁の数字を入力してください');
      return;
    }
    
    if (!formData.name.trim()) {
      setError('名前を入力してください');
      return;
    }
    
    if (!validatePassword(formData.password)) {
      setError('パスワードは6文字以上で、大文字・小文字・数字を含める必要があります');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('パスワードが一致しません');
      return;
    }
    
    try {
      // バックエンドにユーザー登録リクエストを送信
      const token = localStorage.getItem('token');
      const response = await axios.post(
        '/api/admin/users',
        {
          student_id: formData.studentId,
          name: formData.name,
          password: formData.password
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      // ユーザー一覧を更新
      const newUser = response.data as User;
      setUsers(prev => [...prev, newUser]);
      
      // 成功メッセージを表示
      setSuccess('ユーザーが正常に登録されました');
      setError(null);
      
      // フォームをリセット
      setFormData({
        studentId: '',
        name: '',
        password: '',
        confirmPassword: ''
      });

      // 3秒後に成功メッセージを消去
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('ユーザー登録に失敗しました');
      }
    }
  };
  
  const handleDeleteClick = (userId: string) => {
    setSelectedUser(userId);
  };
  
  const confirmDelete = async () => {
    if (selectedUser) {
      try {
        await axios.delete(`/api/admin/users/${selectedUser}`);
        
        // ユーザー一覧を更新
        setUsers(prev => prev.filter(user => user.id !== selectedUser));
        setSelectedUser(null);
        setSuccess('ユーザーが削除されました');
        
        // 3秒後に成功メッセージを消去
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      } catch (err: any) {
        if (err.response?.data?.error) {
          setError(err.response.data.error);
        } else {
          setError('ユーザーの削除に失敗しました');
        }
      }
    }
  };
  
  const cancelDelete = () => {
    setSelectedUser(null);
  };
  
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        ユーザー管理
      </h2>
      
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          新規ユーザー登録
        </h3>
        
        {success && (
          <div className="mb-4 p-3 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 rounded-md text-sm">
            {success}
          </div>
        )}
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-md text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="studentId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                学籍番号
              </label>
              <input
                id="studentId"
                name="studentId"
                type="text"
                value={formData.studentId}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="8桁の数字"
                maxLength={8}
              />
            </div>
            
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                名前
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="名前"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                パスワード
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="6文字以上、大文字・小文字・数字を含む"
              />
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                パスワード（確認）
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="パスワードを再入力"
              />
            </div>
          </div>
          
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              ユーザー登録
            </button>
          </div>
        </form>
      </div>
      
      <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          ユーザー一覧
        </h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  学籍番号
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  名前
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  権限
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">削除</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {user.studentId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <div className="ml-4 text-sm font-medium text-gray-900 dark:text-white">
                        {user.name}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.role === 'admin'
                        ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
                        : 'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200'
                    }`}>
                      {user.role === 'admin' ? '管理者' : '一般'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {selectedUser === user.id ? (
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={confirmDelete}
                          className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300"
                        >
                          <Check className="h-5 w-5" />
                        </button>
                        <button
                          onClick={cancelDelete}
                          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleDeleteClick(user.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                        disabled={user.role === 'admin'} // Prevent deleting admin users
                      >
                        <UserX className={`h-5 w-5 ${user.role === 'admin' ? 'opacity-50 cursor-not-allowed' : ''}`} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserRegistration;