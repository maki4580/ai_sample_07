-- CreateTable
CREATE TABLE "products" (
    "productCode" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "demand" INTEGER NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("productCode")
);
