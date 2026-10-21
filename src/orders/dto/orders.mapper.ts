import { Decimal } from '@prisma/client/runtime/client';

interface Product {
  id: number;
  productName: string;
}

interface OrderDetail {
  id: number;
  productId: number;
  quantity: number;
  unitPrice: Decimal;
  discount: Decimal;
  product: Product;
}

interface Order {
  orderDetails: OrderDetail[];
  createdAt?: Date;
  updatedAt?: Date;
  [key: string]: any;
}

export class OrdersMapper {
  static toOrderDetails(details: OrderDetail[]) {
    return details.map((od) => ({
      id: od.id,
      productId: od.productId ?? od.product?.id,
      quantity: od.quantity,
      unitPrice: Number(od.unitPrice),
      discount: Number(od.discount),
      productName: od.product.productName,
    }));
  }

  static calculateTotal(details: OrderDetail[]): number {
    const total = details.reduce((sum, od) => {
      const unitPrice = Number(od.unitPrice);
      const discount = Number(od.discount);

      return sum + od.quantity * unitPrice * (1 - discount / 100);
    }, 0);

    return Number(total.toFixed(2));
  }

  static toOrderResponse(order: Order) {
    return {
      ...order,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      totalAmount: this.calculateTotal(order.orderDetails),
      orderDetails: this.toOrderDetails(order.orderDetails),
    };
  }
}
