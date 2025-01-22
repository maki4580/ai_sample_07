import ExcelJS from 'exceljs';

export async function createExcelTemplate(): Promise<Uint8Array> {
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

  // ヘッダー行のセルをロック
  worksheet.getRow(1).eachCell((cell) => {
    cell.protection = { locked: true };
  });

  // データ入力行のセル保護設定
  for (let row = 2; row <= 100; row++) {
    // バージョン列はロック
    worksheet.getCell(`A${row}`).value = 1;
    worksheet.getCell(`A${row}`).protection = { locked: true };
    worksheet.getCell(`A${row}`).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF0F0F0' }
    };

    // 他の列はロック解除
    worksheet.getCell(`B${row}`).protection = { locked: false };
    worksheet.getCell(`C${row}`).protection = { locked: false };
    worksheet.getCell(`D${row}`).protection = { locked: false };
  }

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
