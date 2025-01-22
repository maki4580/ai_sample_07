import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

process.env.EXCEL_PASSWORD = 'test-password';
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/product_db_test';

// Mock Next.js dynamic imports
jest.mock('next/dynamic', () => () => {
  const DynamicComponent = () => null;
  DynamicComponent.displayName = 'LoadableComponent';
  DynamicComponent.preload = jest.fn();
  return DynamicComponent;
});

// Mock window URL
global.URL.createObjectURL = jest.fn().mockReturnValue('mock-url') as unknown as typeof URL.createObjectURL;
global.URL.revokeObjectURL = jest.fn() as unknown as typeof URL.revokeObjectURL;

// Mock Blob
global.Blob = jest.fn(() => ({
  size: 0,
  type: '',
  arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
  slice: () => new Blob(),
  stream: () => new ReadableStream(),
  text: () => Promise.resolve(''),
})) as unknown as typeof Blob;

// Mock fetch
global.fetch = jest.fn().mockImplementation(() =>
  Promise.resolve(new Response())
) as unknown as typeof fetch;

// Mock Prisma
interface MockPrismaProduct {
  findMany: jest.Mock;
  findUnique: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
}

interface MockPrismaClient {
  product: MockPrismaProduct;
  $transaction: jest.Mock;
  $disconnect: jest.Mock;
}

const mockProduct: MockPrismaProduct = {
  findMany: jest.fn(),
  findUnique: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
};

const mockPrismaImpl: MockPrismaClient = {
  product: mockProduct,
  $transaction: jest.fn().mockImplementation((callback: (tx: MockPrismaClient) => Promise<unknown>) =>
    Promise.resolve(callback(mockPrismaImpl))
  ),
  $disconnect: jest.fn().mockResolvedValue(undefined),
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrismaImpl),
}));

// Mock ExcelJS
interface MockWorksheet {
  columns: any[];
  getRow: jest.Mock;
  addRow: jest.Mock;
  addRows: jest.Mock;
  protect: jest.Mock;
  unprotect: jest.Mock;
  eachRow: jest.Mock;
  _worksheet: {
    sheetProtection: { sheet: boolean };
  };
}

interface MockWorkbook {
  addWorksheet: jest.Mock<MockWorksheet>;
  getWorksheet: jest.Mock<MockWorksheet>;
  xlsx: {
    writeBuffer: jest.Mock<Promise<ArrayBuffer>>;
    load: jest.Mock<Promise<void>>;
  };
}

const mockWorksheetImplementation: MockWorksheet = {
  columns: [],
  getRow: jest.fn(() => ({
    font: {},
    fill: {},
    getCell: jest.fn(() => ({ protection: {} })),
    values: [],
  })),
  addRow: jest.fn(),
  addRows: jest.fn(),
  protect: jest.fn(),
  unprotect: jest.fn(),
  eachRow: jest.fn((callback: (row: { values: any[] }, rowNumber: number) => void) => {
    callback({ values: ['', '1', 'TEST001', 'テスト商品', '100'] }, 2);
  }),
  _worksheet: {
    sheetProtection: { sheet: true }
  }
};

const mockWorkbookImplementation: MockWorkbook = {
  addWorksheet: jest.fn(() => mockWorksheetImplementation),
  getWorksheet: jest.fn(() => mockWorksheetImplementation),
  xlsx: {
    writeBuffer: jest.fn(() => Promise.resolve(new ArrayBuffer(0))),
    load: jest.fn(() => Promise.resolve()),
  },
};

jest.mock('exceljs', () => ({
  Workbook: jest.fn(() => mockWorkbookImplementation),
}));

// グローバルなエラーハンドラーの設定
global.console.error = jest.fn();

// テストのセットアップ
beforeEach(() => {
  jest.clearAllMocks();
});
