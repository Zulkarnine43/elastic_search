import {
  Controller,
  Get,
  Param,
  Version,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { UserTypes } from 'src/common/decorators/user-type.decorator';
import { UserType } from 'src/modules/user/entities/user.entity';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { UserTypeGuard } from 'src/common/guards/user-type.guard';
import { MediasoftProductService } from '../services/mediasoft-product.service';

@Controller('product/mediasoft')
export class MediasoftProductController {
  constructor(private mediasoftProductService: MediasoftProductService) {}

  @Get('/syncAll')
  @Version('1')
  @UserTypes(UserType.ADMIN)
  @UseGuards(JwtAuthGuard, UserTypeGuard)
  async syncAll(@Req() req) {
    const response = await this.mediasoftProductService.syncAll(req.user);
    console.log('controller response');
    return response;
  }

  @Get('/stock/:barCode')
  @Version('1')
  @UserTypes(UserType.ADMIN)
  @UseGuards(JwtAuthGuard, UserTypeGuard)
  async getStock(@Param('barCode') barCode, @Req() req) {
    const response = await this.mediasoftProductService.getStock(
      req.user,
      barCode,
    );
    return response;
  }
}
