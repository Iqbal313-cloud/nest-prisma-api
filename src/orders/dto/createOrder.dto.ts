// import { OrderStatus } from 'src/generated/prisma/enums';

// export class CreateOrderDto {
//   orderDate?: Date;
//   orderStatus?: OrderStatus;

//   customerId?: number;
//   employeeId?: number;

//   orderDetails: {
//     productId: number;
//     quantity: number;
//     unitPrice: number;
//     discount: number;
//   }[];
// }

import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  Min,
  ValidateNested,
} from 'class-validator';

import { Type } from 'class-transformer';

import { OrderStatus } from 'src/generated/prisma/enums';

export class CreateOrderDetailDto {
  @IsInt()
  @Type(() => Number)
  productId: number;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  quantity: number;

  @IsNumber()
  @Type(() => Number)
  unitPrice: number;

  @IsNumber()
  @Type(() => Number)
  discount: number;
}

export class CreateOrderDto {
  @IsOptional()
  @Type(() => Date)
  orderDate?: Date;

  @IsOptional()
  @IsEnum(OrderStatus)
  orderStatus?: OrderStatus;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  customerId?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  employeeId?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderDetailDto)
  orderDetails: CreateOrderDetailDto[];
}
