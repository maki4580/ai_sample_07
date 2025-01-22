import { ProductService } from '@/lib/services/product-service';
import { ValidationError } from '@/lib/validations/product';
import { Product } from '@prisma/client';
import { Row } from 'exceljs';

// モックデータ
const mockProduct: Product = {
  productCode: 'TEST001',
  productName: 'テスト商品',
  demand: 100,
  version: 1,
  createdAt: new Date(),
  updatedAt: new Date()
};

describe('ProductService', () => {
  let service: ProductService;

  beforeEach(() => {
    service = new ProductService();
  });

  describe('generateExcelTemplate', () => {
    it('テンプレートファイルを生成できる', async () => {
      const buffer = await service.generateExcelTemplate();
      expect(Buffer.isBuffer(buffer)).toBeTruthy();
    });

    it('Excel passwordが未設定の場合はエラーをスローする', async () => {
      const originalPassword = process.env.EXCEL_PASSWORD;
      process.env.EXCEL_PASSWORD = '';

      await expect(service.generateExcelTemplate()).rejects.toThrow();

      process.env.EXCEL_PASSWORD = originalPassword;
    });
  });

  describe('exportToExcel', () => {
    it('データベースの商品をExcelファイルにエクスポートできる', async () => {
      // セットアップで定義したPrismaClientのモックを使用
      const { PrismaClient } = require('@prisma/client');
      const prismaClient = new PrismaClient();
      prismaClient.product.findMany.mockResolvedValue([mockProduct]);

      const buffer = await service.exportToExcel();
      expect(Buffer.isBuffer(buffer)).toBeTruthy();
    });

    it('データベースエラーの場合は例外をスローする', async () => {
      const { PrismaClient } = require('@prisma/client');
      const prismaClient = new PrismaClient();
      prismaClient.product.findMany.mockRejectedValue(new Error('DB Error'));

      await expect(service.exportToExcel()).rejects.toThrow('DB Error');
    });
  });

  describe('importFromExcel', () => {
    it('有効なExcelファイルをインポートできる', async () => {
      const mockBuffer = Buffer.from('test');
      const products = await service.importFromExcel(mockBuffer);
      expect(Array.isArray(products)).toBeTruthy();
    });

    it('シート保護がない場合はエラーをスローする', async () => {
      const mockBuffer = Buffer.from('test');
      // ExcelJSのモックで保護なしの状態を設定
      const { Workbook } = require('exceljs');
      const workbook = new Workbook();
      const worksheet = workbook.addWorksheet('test');
      (worksheet as any)._worksheet.sheetProtection = undefined;

      await expect(service.importFromExcel(mockBuffer))
        .rejects
        .toThrow(ValidationError);
    });

    it('無効なデータ形式の場合はエラーをスローする', async () => {
      const mockBuffer = Buffer.from('test');
      // ExcelJSのモックで無効なデータを設定
      const { Workbook } = require('exceljs');
      const workbook = new Workbook();
      workbook.addWorksheet('test').eachRow.mockImplementation((callback: (arg0: Row, arg1: number) => void) => {
        const mockRow: Partial<Row> = {
          values: ['invalid', 'data']
        };
        callback(mockRow as Row, 2);
      });

      await expect(service.importFromExcel(mockBuffer))
        .rejects
        .toThrow(ValidationError);
    });
  });

  describe('bulkUpdateProducts', () => {
    const mockProducts = [{
      version: 1,
      productCode: 'TEST001',
      productName: 'テスト商品',
      demand: 100
    }];

    it('複数の商品を一括で更新できる', async () => {
      const { PrismaClient } = require('@prisma/client');
      const prismaClient = new PrismaClient();
      prismaClient.product.findUnique.mockResolvedValue(mockProduct);
      prismaClient.product.update.mockResolvedValue({
        ...mockProduct,
        version: 2
      });

      const result = await service.bulkUpdateProducts(mockProducts);
      expect(result).toHaveLength(1);
      expect(result[0].version).toBe(2);
    });

    it('バージョン不一致の場合はエラーをスローする', async () => {
      const { PrismaClient } = require('@prisma/client');
      const prismaClient = new PrismaClient();
      prismaClient.product.findUnique.mockResolvedValue({
        ...mockProduct,
        version: 2
      });

      await expect(service.bulkUpdateProducts(mockProducts))
        .rejects
        .toThrow('バージョンが一致しません');
    });
  });

  afterEach(async () => {
    await service.close();
    jest.clearAllMocks();
  });
});
