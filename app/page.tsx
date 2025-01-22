'use client';

import { useState } from 'react';
import type { ExcelRow } from '@/lib/validations/product';

interface ImportedData extends ExcelRow { }

export default function Home() {
  const [error, setError] = useState<string | null>(null);
  const [importedData, setImportedData] = useState<ImportedData[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const downloadTemplate = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/products', { method: 'PATCH' });
      if (!response.ok) throw new Error('テンプレートのダウンロードに失敗しました');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'template.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : '予期せぬエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadProducts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('商品データのダウンロードに失敗しました');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'products.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : '予期せぬエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.[0]) return;

    try {
      setIsLoading(true);
      setError(null);
      setImportedData(null);

      const formData = new FormData();
      formData.append('file', event.target.files[0]);

      const response = await fetch('/api/products', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '予期せぬエラーが発生しました');
      }

      setImportedData(data.products);
    } catch (err) {
      setError(err instanceof Error ? err.message : '予期せぬエラーが発生しました');
    } finally {
      setIsLoading(false);
      event.target.value = '';
    }
  };

  const handleRegister = async () => {
    if (!importedData) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/products', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ products: importedData }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '予期せぬエラーが発生しました');
      }

      setImportedData(null);
      alert('商品情報の登録が完了しました');
    } catch (err) {
      setError(err instanceof Error ? err.message : '予期せぬエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">商品情報管理</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="space-y-4 mb-8">
        <div className="flex space-x-4">
          <button
            onClick={downloadTemplate}
            disabled={isLoading}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
          >
            テンプレートダウンロード
          </button>
          <button
            onClick={downloadProducts}
            disabled={isLoading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            商品データダウンロード
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <label className="block">
            <span className="sr-only">ファイルを選択</span>
            <input
              type="file"
              accept=".xlsx"
              onChange={handleFileUpload}
              disabled={isLoading}
              className="file-input block w-full text-sm text-gray-500"
            />
          </label>
        </div>
      </div>

      {importedData && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">取り込みデータ確認</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 border">バージョン</th>
                  <th className="px-4 py-2 border">商品コード</th>
                  <th className="px-4 py-2 border">商品名</th>
                  <th className="px-4 py-2 border">需要数</th>
                </tr>
              </thead>
              <tbody>
                {importedData.map((product, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2 border">{product.version}</td>
                    <td className="px-4 py-2 border">{product.productCode}</td>
                    <td className="px-4 py-2 border">{product.productName}</td>
                    <td className="px-4 py-2 border text-right">{product.demand}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4">
            <button
              onClick={handleRegister}
              disabled={isLoading}
              className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600 disabled:opacity-50"
            >
              登録
            </button>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded">
            処理中...
          </div>
        </div>
      )}
    </main>
  );
}
