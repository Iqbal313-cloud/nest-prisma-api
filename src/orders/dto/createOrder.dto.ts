import { OrderStatus } from 'src/generated/prisma/enums';

export class CreateOrderDto {
  orderDate?: Date;
  orderStatus?: OrderStatus;

  customerId?: number;
  employeeId?: number;

  orderDetails: {
    productId: number;
    quantity: number;
    unitPrice: number;
    discount: number;
  }[];
}
