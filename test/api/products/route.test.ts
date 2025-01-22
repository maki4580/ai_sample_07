import { NextRequest } from 'next/server';
import { GET, POST, PUT, PATCH } from '@/app/api/products/route';
import { PrismaClient } from '@prisma/client';

const mockProduct = {
  productCode: 'TEST001',
  productName: 'テスト商品',
  demand: 100,
  version: 1,
  createdAt: new Date(),
  updatedAt: new Date()
};

describe('Products API', () => {
  let prisma: PrismaClient;

  beforeEach(() => {
    prisma = new PrismaClient();
    jest.clearAllMocks();
  });

  describe('GET /api/products', () => {
    it('商品データのエクスポートが成功する', async () => {
      const mockFindMany = prisma.product.findMany as jest.Mock;
      mockFindMany.mockResolvedValue([mockProduct]);

      const response = await GET();
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
    });

    it('エラー発生時に500を返す', async () => {
      const mockFindMany = prisma.product.findMany as jest.Mock;
      mockFindMany.mockRejectedValue(new Error('DB Error'));

      const response = await GET();
      const data = await response.json();
      expect(response.status).toBe(500);
      expect(data.error).toBe('エクスポート処理に失敗しました');
    });
  });

  describe('POST /api/products', () => {
    it('Excelファイルのインポートが成功する', async () => {
      const formData = new FormData();
      const file = new File(['test data'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      formData.append('file', file);

      const request = new NextRequest('http://localhost/api/products', {
        method: 'POST',
        body: formData
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
    });

    it('ファイルがない場合は400を返す', async () => {
      const formData = new FormData();
      const request = new NextRequest('http://localhost/api/products', {
        method: 'POST',
        body: formData
      });

      const response = await POST(request);
      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data.error).toBe('ファイルが選択されていません');
    });
  });

  describe('PUT /api/products', () => {
    const mockProducts = [{
      productCode: 'TEST001',
      productName: 'テスト商品1',
      demand: 100,
      version: 1
    }];

    it('商品データの一括更新が成功する', async () => {
      const mockFindUnique = prisma.product.findUnique as jest.Mock;
      mockFindUnique.mockResolvedValue(mockProduct);

      const mockUpdate = prisma.product.update as jest.Mock;
      mockUpdate.mockResolvedValue({ ...mockProduct, version: 2 });

      const request = new NextRequest('http://localhost/api/products', {
        method: 'PUT',
        body: JSON.stringify({ products: mockProducts })
      });

      const response = await PUT(request);
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.products).toBeDefined();
    });

    it('バージョン不一致の場合はエラーを返す', async () => {
      const mockFindUnique = prisma.product.findUnique as jest.Mock;
      mockFindUnique.mockResolvedValue({ ...mockProduct, version: 2 });

      const request = new NextRequest('http://localhost/api/products', {
        method: 'PUT',
        body: JSON.stringify({ products: mockProducts })
      });

      const response = await PUT(request);
      const data = await response.json();
      expect(response.status).toBe(500);
      expect(data.error).toContain('バージョンが一致しません');
    });
  });

  describe('PATCH /api/products', () => {
    it('テンプレートのダウンロードが成功する', async () => {
      const response = await PATCH(new NextRequest('http://localhost/api/products'));
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
    });

    it('エラー発生時に500を返す', async () => {
      const originalPassword = process.env.EXCEL_PASSWORD;
      process.env.EXCEL_PASSWORD = '';

      const response = await PATCH(new NextRequest('http://localhost/api/products'));
      const data = await response.json();
      expect(response.status).toBe(500);
      expect(data.error).toBe('テンプレート生成に失敗しました');

      process.env.EXCEL_PASSWORD = originalPassword;
    });
  });
});
