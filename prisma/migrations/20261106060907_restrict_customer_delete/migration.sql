-- DropForeignKey
ALTER TABLE "Orders" DROP CONSTRAINT "Orders_customerId_fkey";

-- AddForeignKey
ALTER TABLE "Orders" ADD CONSTRAINT "Orders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
