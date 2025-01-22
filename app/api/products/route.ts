import { NextRequest, NextResponse } from 'next/server';
import { ProductService } from '@/lib/services/product-service';
import { ProductSchema, ExcelRow } from '@/lib/validations/product';

const UPLOAD_DIR = '/tmp/product-excel-uploads';

export async function GET() {
  try {
    const service = new ProductService();
    const buffer = await service.exportToExcel();
    await service.close();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename=products.xlsx'
      }
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'エクスポート処理に失敗しました' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'ファイルが選択されていません' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = new Uint8Array(bytes);

    const service = new ProductService();
    const products = await service.importFromExcel(buffer);
    await service.close();

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'インポート処理に失敗しました' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const products = data.products as ExcelRow[];

    const service = new ProductService();
    const updatedProducts = await service.bulkUpdateProducts(products);
    await service.close();

    return NextResponse.json({ products: updatedProducts });
  } catch (error) {
    console.error('Update error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '更新処理に失敗しました' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const service = new ProductService();
    const buffer = await service.generateExcelTemplate();
    await service.close();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename=template.xlsx'
      }
    });
  } catch (error) {
    console.error('Template generation error:', error);
    return NextResponse.json(
      { error: 'テンプレート生成に失敗しました' },
      { status: 500 }
    );
  }
}
