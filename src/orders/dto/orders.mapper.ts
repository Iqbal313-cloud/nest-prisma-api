import { Decimal } from '@prisma/client/runtime/client';

interface Product {
  productName: string;
}

interface OrderDetail {
  quantity: number;
  unitPrice: Decimal;
  discount: Decimal;
  product: Product;
}

interface Order {
  orderDetails: OrderDetail[];
  // [key: string]: any; // if you still need flexibility
}

export class OrdersMapper {
  static toOrderDetails(details: OrderDetail[]) {
    return details.map((od) => ({
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

      return sum + od.quantity * unitPrice * (1 - discount);
    }, 0);

    return Number(total.toFixed(2));
  }

  static toOrderResponse(order: Order) {
    const orderDetails = this.toOrderDetails(order.orderDetails);

    return {
      ...order,
      totalAmount: this.calculateTotal(order.orderDetails),
      orderDetails,
    };
  }
}

// export class OrdersMapper {
//   static toOrderDetails(details: any[]) {
//     return details.map((od) => ({
//       quantity: od.quantity,
//       unitPrice: od.unitPrice,
//       discount: od.discount,
//       productName: od.product.productName,
//     }));
//   }

//   static calculateTotal(details: any[]): number {
//     const total = details.reduce((sum, od) => {
//       const unitPrice = Number(od.unitPrice);
//       const discount = Number(od.discount);

//       return sum + od.quantity * unitPrice * (1 - discount);
//     }, 0);

//     return Number(total.toFixed(2));
//   }

//   static toOrderResponse(order: any) {
//     const orderDetails = this.toOrderDetails(order.orderDetails);

//     return {
//       ...order,
//       totalAmount: this.calculateTotal(order.orderDetails),
//       orderDetails,
//     };
//   }
// }

// import { OrderDetailDTO, OrderDTO } from './order-detail.dto';
// export class OrdersMapper {
//   static toOrderDetails(details: OrderDetailDTO[]) {
//     return details.map((od) => ({
//       quantity: od.quantity,
//       unitPrice: od.unitPrice,
//       discount: od.discount,
//       productName: od.product.productName,
//     }));
//   }

//   static calculateTotal(details: OrderDetailDTO[]): number {
//     return Number(
//       details
//         .reduce((sum, od) => {
//           return sum + od.quantity * od.unitPrice * (1 - od.discount);
//         }, 0)
//         .toFixed(2),
//     );
//   }

//   static toOrderResponse(order: OrderDTO) {
//     const orderDetails = this.toOrderDetails(order.orderDetails);

//     return {
//       ...order,
//       totalAmount: this.calculateTotal(order.orderDetails),
//       orderDetails,
//     };
//   }
// }
