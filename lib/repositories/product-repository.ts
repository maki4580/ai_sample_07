import { PrismaClient, Product } from '@prisma/client';
import { ProductInput } from '../validations/product';

export class ProductRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async findAll(): Promise<Product[]> {
    return this.prisma.product.findMany();
  }

  async findByCode(productCode: string): Promise<Product | null> {
    return this.prisma.product.findUnique({
      where: { productCode }
    });
  }

  async create(data: ProductInput): Promise<Product> {
    return this.prisma.product.create({
      data: {
        productCode: data.productCode,
        productName: data.productName,
        demand: data.demand,
        version: 1
      }
    });
  }

  async update(productCode: string, data: ProductInput): Promise<Product> {
    return this.prisma.product.update({
      where: { productCode },
      data: {
        productName: data.productName,
        demand: data.demand,
        version: data.version + 1
      }
    });
  }

  async bulkUpdate(products: ProductInput[]): Promise<Product[]> {
    const updatedProducts: Product[] = [];

    // トランザクション内で一括更新
    await this.prisma.$transaction(async (prisma) => {
      for (const product of products) {
        const existingProduct = await prisma.product.findUnique({
          where: { productCode: product.productCode }
        });

        if (existingProduct) {
          // バージョンチェック
          if (existingProduct.version !== product.version) {
            throw new Error(`商品コード ${product.productCode} のバージョンが一致しません`);
          }

          // 更新
          const updatedProduct = await prisma.product.update({
            where: { productCode: product.productCode },
            data: {
              productName: product.productName,
              demand: product.demand,
              version: product.version + 1
            }
          });
          updatedProducts.push(updatedProduct);
        } else {
          // 新規作成
          const newProduct = await prisma.product.create({
            data: {
              productCode: product.productCode,
              productName: product.productName,
              demand: product.demand,
              version: 1
            }
          });
          updatedProducts.push(newProduct);
        }
      }
    });

    return updatedProducts;
  }

  async close(): Promise<void> {
    await this.prisma.$disconnect();
  }
}
