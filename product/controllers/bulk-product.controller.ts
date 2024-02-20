import {
  Controller,
  Get,
  Param,
  Version,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { UserTypes } from 'src/common/decorators/user-type.decorator';
import { UserType } from '../../user/entities/user.entity';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { UserTypeGuard } from 'src/common/guards/user-type.guard';
import { BulkProductService } from '../services/bulk-product.service';

@Controller('product/bulk')
export class BulkProductController {
  constructor(private readonly bulkProductService: BulkProductService) {}

  @Get('/generate-excel/:categoryId')
  @Version('1')
  // @UserTypes(UserType.ADMIN)
  // @UseGuards(JwtAuthGuard, UserTypeGuard)
  async generateExcel(
    @Req() req,
    @Res() res,
    @Param('categoryId') categoryId: string,
  ) {
    return await this.bulkProductService.generateExcel(
      res,
      req.user,
      +categoryId,
    );
  }

  // @Post('/upload-excel')
  // @Version('1')
  // @UserTypes(UserType.ADMIN)
  // @UseGuards(JwtAuthGuard, UserTypeGuard)
  // async addSku(
  //   @Req() req,
  //   @Param('id') id: string,
  //   @Body() addSkuDto: AddSkuDto,
  // ) {
  //   return await this.productService.addSku(req.user, +id, addSkuDto);
  // }
}
