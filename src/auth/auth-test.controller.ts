import { Controller, Get } from '@nestjs/common';
import {
  AllowAnonymous,
  Roles,
  Session,
  UserHasPermission,
} from '@thallesp/nestjs-better-auth';

@Controller('test-auth')
export class AuthTestController {
  @Get('public')
  @AllowAnonymous()
  publicRoute() {
    return {
      message: 'This is a public route',
    };
  }

  @Get('profile')
  profile(@Session() session: any) {
    return {
      message: 'Authenticated successfully',
      user: session.user,
    };
  }

  @Get('admin')
  @Roles(['admin'])
  adminRoute() {
    return {
      message: 'Welcome Admin!',
    };
  }

  @Get('sales')
  @Roles(['sales'])
  salesRoute() {
    return {
      message: 'Welcome Sales!',
    };
  }

  @Get('order-create')
  @UserHasPermission({
    permission: {
      order: ['create'],
    },
  })
  createOrderPermission() {
    return {
      message: 'You can create orders!',
    };
  }

  @Get('product-delete')
  @UserHasPermission({
    permission: {
      product: ['delete'],
    },
  })
  deleteProductPermission() {
    return {
      message: 'You can delete products!',
    };
  }
}
