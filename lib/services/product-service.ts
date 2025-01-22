import ExcelJS from 'exceljs';
import { ProductRepository } from '../repositories/product-repository';
import { ProductInput, ExcelRow, validateExcelData } from '../validations/product';
import { ValidationError } from '../validations/product';
import { createExcelTemplate } from './excel-template';
import { Product } from '@prisma/client';

export class ProductService {
  private repository: ProductRepository;

  constructor() {
    this.repository = new ProductRepository();
  }

  async generateExcelTemplate(): Promise<Buffer> {
    return createExcelTemplate();
  }

  async exportToExcel(): Promise<Buffer> {
    const products = await this.repository.findAll();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('商品一覧');

    // ヘッダー設定
    worksheet.columns = [
      { header: 'バージョン', key: 'version', width: 10 },
      { header: '商品コード', key: 'productCode', width: 15 },
      { header: '商品名', key: 'productName', width: 30 },
      { header: '需要数', key: 'demand', width: 10 }
    ];

    // データ設定
    worksheet.addRows(products.map(product => ({
      version: product.version,
      productCode: product.productCode,
      productName: product.productName,
      demand: product.demand
    })));

    // スタイル設定
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // シート保護
    const password = process.env.EXCEL_PASSWORD;
    if (!password) {
      throw new Error('Excel password is not set in environment variables');
    }

    worksheet.protect(password, {
      selectLockedCells: true,
      selectUnlockedCells: true,
      formatCells: false,
      formatColumns: false,
      formatRows: false,
      insertColumns: false,
      insertRows: false,
      insertHyperlinks: false,
      deleteColumns: false,
      deleteRows: false,
      sort: false,
      autoFilter: false,
      pivotTables: false
    });

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }

  async importFromExcel(buffer: Buffer): Promise<ExcelRow[]> {
    const workbook = new ExcelJS.Workbook();
    const arrayBuffer = new Uint8Array(buffer).buffer;
    await workbook.xlsx.load(arrayBuffer);

    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      throw new ValidationError('Excelファイルにシートが存在しません');
    }

    // シート保護の確認
    const password = process.env.EXCEL_PASSWORD;
    if (!password) {
      throw new Error('Excel password is not set in environment variables');
    }

    // シートが保護されているかを確認
    const worksheetProtection = (worksheet as any)._worksheet?.sheetProtection;
    if (!worksheetProtection?.sheet) {
      throw new ValidationError('Excelファイルが保護されていません');
    }

    const rows: Array<{
      version: unknown;
      productCode: unknown;
      productName: unknown;
      demand: unknown;
    }> = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) { // ヘッダー行をスキップ
        const values = row.values as any[];
        rows.push({
          version: values[1],
          productCode: values[2],
          productName: values[3],
          demand: values[4]
        });
      }
    });

    return validateExcelData(rows);
  }

  async bulkUpdateProducts(products: ExcelRow[]): Promise<Product[]> {
    return this.repository.bulkUpdate(products);
  }

  async close(): Promise<void> {
    await this.repository.close();
  }
}
