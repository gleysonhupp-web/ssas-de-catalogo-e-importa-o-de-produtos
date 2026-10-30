-- Preço no fornecedor (referência) e preço de revenda escolhido pelo lojista antes da importação.
ALTER TABLE "CatalogProduct" ADD COLUMN "supplierPrice" DECIMAL(10,2);
ALTER TABLE "CartItem" ADD COLUMN "resalePriceCents" INTEGER;
ALTER TABLE "OrderItem" ADD COLUMN "resalePriceCents" INTEGER;
ALTER TABLE "ImportItem" ADD COLUMN "resalePriceCents" INTEGER;
