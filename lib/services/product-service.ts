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

  async generateExcelTemplate(): Promise<Uint8Array> {
    return createExcelTemplate();
  }

  async exportToExcel(): Promise<Uint8Array> {
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

    // シートの保護設定
    const password = process.env.EXCEL_PASSWORD;
    if (!password) {
      throw new Error('Excel password is not set in environment variables');
    }

    // セルのロック設定
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.protection = {
          locked: true
        };
      });
    });

    const protectionOptions = {
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
    };

    worksheet.protect(password, protectionOptions);

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return new Uint8Array(arrayBuffer);
  }

  async importFromExcel(buffer: Buffer | Uint8Array): Promise<ExcelRow[]> {
    const workbook = new ExcelJS.Workbook();
    const arrayBuffer = buffer instanceof Buffer ? buffer.buffer : buffer;
    await workbook.xlsx.load(arrayBuffer);

    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      throw new ValidationError('Excelファイルにシートが存在しません');
    }

    // シートが保護されているかどうかの確認
    const wsModel = (worksheet as any).model;
    const isProtected = !!(wsModel?.sheetProtection?.sheet);

    if (!isProtected) {
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
        if (values.length >= 5) {
          rows.push({
            version: values[1],
            productCode: values[2],
            productName: values[3],
            demand: values[4]
          });
        }
      }
    });

    if (rows.length === 0) {
      throw new ValidationError('有効なデータが存在しません');
    }

    return validateExcelData(rows);
  }

  async bulkUpdateProducts(products: ExcelRow[]): Promise<Product[]> {
    return this.repository.bulkUpdate(products);
  }

  async close(): Promise<void> {
    await this.repository.close();
  }
}
