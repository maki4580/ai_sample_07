import { PrismaClient, Product } from '@prisma/client';
import { ProductRepository } from '@/lib/repositories/product-repository';
import { ProductInput } from '@/lib/validations/product';

// モックデータ
const mockProduct: Product = {
  productCode: 'TEST001',
  productName: 'テスト商品',
  demand: 100,
  version: 1,
  createdAt: new Date(),
  updatedAt: new Date()
};

const mockProductInput: ProductInput = {
  productCode: 'TEST001',
  productName: 'テスト商品',
  demand: 100,
  version: 1
};

describe('ProductRepository', () => {
  let repository: ProductRepository;
  let prisma: PrismaClient;

  beforeEach(() => {
    repository = new ProductRepository();
    prisma = new PrismaClient();
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('全ての商品を取得できる', async () => {
      prisma.product.findMany = jest.fn().mockResolvedValue([mockProduct]);

      const result = await repository.findAll();
      expect(result).toEqual([mockProduct]);
      expect(prisma.product.findMany).toHaveBeenCalled();
    });

    it('エラー時には例外をスローする', async () => {
      prisma.product.findMany = jest.fn().mockRejectedValue(new Error('DB Error'));

      await expect(repository.findAll()).rejects.toThrow('DB Error');
    });
  });

  describe('findByCode', () => {
    it('商品コードで商品を取得できる', async () => {
      prisma.product.findUnique = jest.fn().mockResolvedValue(mockProduct);

      const result = await repository.findByCode('TEST001');
      expect(result).toEqual(mockProduct);
      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { productCode: 'TEST001' }
      });
    });

    it('存在しない商品コードの場合はnullを返す', async () => {
      prisma.product.findUnique = jest.fn().mockResolvedValue(null);

      const result = await repository.findByCode('NOTEXIST');
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('新規商品を作成できる', async () => {
      prisma.product.create = jest.fn().mockResolvedValue(mockProduct);

      const result = await repository.create(mockProductInput);
      expect(result).toEqual(mockProduct);
      expect(prisma.product.create).toHaveBeenCalledWith({
        data: {
          productCode: 'TEST001',
          productName: 'テスト商品',
          demand: 100,
          version: 1
        }
      });
    });

    it('エラー時には例外をスローする', async () => {
      prisma.product.create = jest.fn().mockRejectedValue(new Error('DB Error'));

      await expect(repository.create(mockProductInput)).rejects.toThrow('DB Error');
    });
  });

  describe('update', () => {
    it('商品を更新できる', async () => {
      prisma.product.update = jest.fn().mockResolvedValue({
        ...mockProduct,
        version: 2
      });

      const result = await repository.update('TEST001', mockProductInput);
      expect(result.version).toBe(2);
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { productCode: 'TEST001' },
        data: {
          productName: 'テスト商品',
          demand: 100,
          version: 2
        }
      });
    });

    it('存在しない商品の更新時は例外をスローする', async () => {
      prisma.product.update = jest.fn().mockRejectedValue(new Error('Record not found'));

      await expect(repository.update('NOTEXIST', mockProductInput)).rejects.toThrow('Record not found');
    });
  });

  describe('bulkUpdate', () => {
    it('複数の商品を一括更新できる', async () => {
      prisma.product.findUnique = jest.fn().mockResolvedValue(mockProduct);
      prisma.product.update = jest.fn().mockResolvedValue({
        ...mockProduct,
        version: 2
      });

      const result = await repository.bulkUpdate([mockProductInput]);
      expect(result[0].version).toBe(2);
    });

    it('バージョン不一致時は例外をスローする', async () => {
      prisma.product.findUnique = jest.fn().mockResolvedValue({
        ...mockProduct,
        version: 2
      });

      await expect(repository.bulkUpdate([mockProductInput])).rejects.toThrow('バージョンが一致しません');
    });

    it('新規商品は作成される', async () => {
      prisma.product.findUnique = jest.fn().mockResolvedValue(null);
      prisma.product.create = jest.fn().mockResolvedValue(mockProduct);

      const result = await repository.bulkUpdate([mockProductInput]);
      expect(result[0]).toEqual(mockProduct);
      expect(prisma.product.create).toHaveBeenCalled();
    });
  });

  describe('close', () => {
    it('データベース接続を切断できる', async () => {
      await repository.close();
      expect(prisma.$disconnect).toHaveBeenCalled();
    });
  });
});
