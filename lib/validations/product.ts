import { z } from 'zod';

export const ProductSchema = z.object({
  productCode: z.string()
    .min(1, '商品コードは必須です')
    .max(15, '商品コードは15文字以内で入力してください'),
  productName: z.string()
    .min(1, '商品名は必須です')
    .max(30, '商品名は30文字以内で入力してください'),
  demand: z.number()
    .int('需要数は整数で入力してください')
    .min(0, '需要数は0以上で入力してください'),
  version: z.number().int().min(1)
});

export type ProductInput = z.infer<typeof ProductSchema>;

export const ExcelRowSchema = z.object({
  version: z.number().int().min(1),
  productCode: z.string().min(1).max(15),
  productName: z.string().min(1).max(30),
  demand: z.number().int().min(0)
});

export type ExcelRow = z.infer<typeof ExcelRowSchema>;

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

interface RawExcelRow {
  version: unknown;
  productCode: unknown;
  productName: unknown;
  demand: unknown;
}

export function validateExcelData(data: RawExcelRow[]): ExcelRow[] {
  return data.map((row, index) => {
    try {
      return ExcelRowSchema.parse({
        version: Number(row.version),
        productCode: String(row.productCode),
        productName: String(row.productName),
        demand: Number(row.demand)
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(`行 ${index + 1} のデータが不正です: ${error.errors.map(e => e.message).join(', ')}`);
      }
      throw error;
    }
  });
}
