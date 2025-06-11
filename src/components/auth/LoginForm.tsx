import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Moon, Sun, Eye, EyeOff } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const LoginForm: React.FC = () => {
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ studentId: '', password: '' });
  
  const { login, isLoading, error } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const validateStudentId = (id: string): boolean => {
    const isValid = /^\d{8}$/.test(id);
    setErrors(prev => ({ ...prev, studentId: isValid ? '' : '学籍番号は8桁の数字を入力してください' }));
    return isValid;
  };
  
  const validatePassword = (pwd: string): boolean => {
    const hasUppercase = /[A-Z]/.test(pwd);
    const hasLowercase = /[a-z]/.test(pwd);
    const hasNumber = /\d/.test(pwd);
    const isLongEnough = pwd.length >= 6;
    
    const isValid = hasUppercase && hasLowercase && hasNumber && isLongEnough;
    
    setErrors(prev => ({ 
      ...prev, 
      password: isValid ? '' : 'パスワードは6文字以上で、大文字・小文字・数字を含める必要があります'
    }));
    
    return isValid;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isStudentIdValid = validateStudentId(studentId);
    const isPasswordValid = validatePassword(password);
    
    if (isStudentIdValid && isPasswordValid) {
      await login({ studentId, password });
    }
  };
  
  return (
    <div className="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">ログイン</h2>
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-200 transition-colors hover:bg-gray-200 dark:hover:bg-gray-600"
          aria-label={theme === 'light' ? 'ダークモードに切り替え' : 'ライトモードに切り替え'}
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="studentId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            学籍番号
          </label>
          <input
            id="studentId"
            type="text"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            onBlur={() => validateStudentId(studentId)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            placeholder="8桁の数字"
            maxLength={8}
            required
          />
          {errors.studentId && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.studentId}</p>
          )}
        </div>
        
        <div className="mb-6">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            パスワード
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => validatePassword(password)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              placeholder="6文字以上、大文字・小文字・数字を含む"
              required
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
          )}
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-2 px-4 rounded-md text-white font-medium ${
            isLoading
            ? "bg-indigo-400 cursor-not-allowed"
            : "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          } transition-colors duration-200`}
        >
          {isLoading ? "ログイン中..." : "ログイン"}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>一般ユーザー: 00061204 / Dependable61204</p>
        <p className="mt-1">管理者ユーザー: 00999999 / Dependable61204</p>
      </div>
    </div>
  );
};

export default LoginForm;