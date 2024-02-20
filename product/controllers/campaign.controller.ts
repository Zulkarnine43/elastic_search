import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
  Version,
} from '@nestjs/common';
import { UserTypes } from '../../../common/decorators/user-type.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { UserTypeGuard } from '../../../common/guards/user-type.guard';
import { UserType } from '../../user/entities/user.entity';
import { ProductCampaignDto } from '../dto/product-campaign.dto';
import { CampaignService } from '../services/campaign.service';

@Controller('campaign')
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  // update campaign product
  @Post('')
  @Version('1')
  @UserTypes(UserType.ADMIN)
  @UseGuards(JwtAuthGuard, UserTypeGuard)
  async campaign(@Req() req, @Body() productCampaign: ProductCampaignDto) {
    return await this.campaignService.campaign(req.user, productCampaign);
  }

  // Get all campaign
  @Get()
  @Version('1')
  @UserTypes(UserType.ADMIN)
  @UseGuards(JwtAuthGuard, UserTypeGuard)
  async findAll(@Req() req, @Query() query) {
    return await this.campaignService.findAll(
      req.user,
      query.perPage ? +query.perPage : 10,
      query.currentPage ? +query.currentPage - 1 : 0,
      query.search ? query.search : '',
    );
  }

  // Get campaign by slug
  @Get('storefront/:slug')
  @Version('1')
  async findBySlug(@Req() req, @Param('slug') slug: string) {
    return await this.campaignService.findBySlug(req.user, slug);
  }

  // Get campaign by slug
  @Get('storefront/product/:slug')
  @Version('1')
  async findByCampaignProductBySlug(
    @Req() req,
    @Param('slug') slug: string,
    @Query() query,
  ) {
    return await this.campaignService.findByCampaignProductBySlug(
      req.user,
      slug,
      query.perPage ? +query.perPage : 10,
      query.currentPage ? +query.currentPage - 1 : 0,
    );
  }

  // delete campaign
  @Delete(':id')
  @Version('1')
  @UserTypes(UserType.ADMIN)
  @UseGuards(JwtAuthGuard, UserTypeGuard)
  async deleteCampaign(@Req() req, @Param('id') id: string) {
    return await this.campaignService.deleteCampaign(req.user, +id);
  }
}
