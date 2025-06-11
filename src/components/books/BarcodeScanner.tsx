import React, { useState, useRef } from 'react';
import { ScanLine, Upload } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  buttonText: string;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, buttonText }) => {
  const [barcode, setBarcode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // In a real application, this would use a barcode scanning library
  // For now, we'll simulate by allowing manual entry and file upload
  
  const handleScan = () => {
    if (!barcode) {
      setError('バーコードを入力してください');
      return;
    }
    
    setError(null);
    onScan(barcode);
    setBarcode('');
  };
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // In a real app, we would process the image to scan for barcodes
    // For this demo, we'll simulate completion after a delay
    setIsScanning(true);
    setError(null);
    
    setTimeout(() => {
      // Simulate finding a barcode in the image
      // In reality, you'd use a library like quagga.js
      const simulatedBarcode = Math.random().toString().substring(2, 15);
      setBarcode(simulatedBarcode);
      setIsScanning(false);
      
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }, 1500);
  };
  
  return (
    <div className="w-full max-w-md">
      <div className="mb-4">
        <label htmlFor="barcode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          バーコード
        </label>
        <div className="flex items-center">
          <input
            id="barcode"
            type="text"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            placeholder="バーコードを入力"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-gray-200 dark:bg-gray-600 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-r-md hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none"
            disabled={isScanning}
          >
            <Upload className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>
      
      {isScanning && (
        <div className="flex items-center justify-center mb-4 p-3 bg-indigo-50 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200 rounded-md">
          <ScanLine className="animate-pulse h-5 w-5 mr-2" />
          <span>スキャン中...</span>
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-md text-sm">
          {error}
        </div>
      )}
      
      <button
        onClick={handleScan}
        disabled={isScanning}
        className={`w-full py-2 px-4 rounded-md text-white font-medium ${
          isScanning
          ? "bg-indigo-400 cursor-not-allowed"
          : "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        } transition-colors duration-200`}
      >
        {buttonText}
      </button>
    </div>
  );
};

export default BarcodeScanner;