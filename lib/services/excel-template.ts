import ExcelJS from 'exceljs';

export async function createExcelTemplate(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('商品一覧');

  // ヘッダー行の設定
  worksheet.columns = [
    { header: 'バージョン', key: 'version', width: 10 },
    { header: '商品コード', key: 'productCode', width: 15 },
    { header: '商品名', key: 'productName', width: 30 },
    { header: '需要数', key: 'demand', width: 10 }
  ];

  // ヘッダー行のスタイル設定
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  // シートの保護
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

  // データ入力用のセルのロック解除
  for (let row = 2; row <= 100; row++) {
    worksheet.getRow(row).getCell('B').protection = { locked: false };
    worksheet.getRow(row).getCell('C').protection = { locked: false };
    worksheet.getRow(row).getCell('D').protection = { locked: false };
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
