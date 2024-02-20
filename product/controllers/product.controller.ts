import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  Version,
} from '@nestjs/common';
import { UserTypes } from 'src/common/decorators/user-type.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { UserTypeGuard } from 'src/common/guards/user-type.guard';
import { throwError } from '../../../common/errors/errors.function';
import { UserType } from '../../user/entities/user.entity';
import { AddSkuDto } from '../dto/add-sku.dto';
import { CreateProductDto } from '../dto/create-product.dto';
import { StatusUpdateProductDto } from '../dto/status-update-product.dto';
import { StatusUpdateSkuDto } from '../dto/status-update-sku.dto';
import { UpdateBasicInfoProductDto } from '../dto/update-basic-info-product.dto';
import { UpdateDeliveryAndServiceDto } from '../dto/update-delivery-and-service.dto';
import { UpdateMergeProductDto } from '../dto/update-merge-product-dto';
import { UpdateOfferLogicDto } from '../dto/update-offer-logic.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { UpdateSkuDto } from '../dto/update-sku.dto';
import { ProductService } from '../services/product.service';

@Controller('product')
export class ProductController {
  constructor(
    private readonly productService: ProductService,
  ) { }

  @Post('/sku/add/:id')
  @Version('1')
  @UserTypes(UserType.ADMIN)
  @UseGuards(JwtAuthGuard, UserTypeGuard)
  async addSku(
    @Req() req,
    @Param('id') id: string,
    @Body() addSkuDto: AddSkuDto,
  ) {
    return await this.productService.addSku(req.user, +id, addSkuDto);
  }

  @Patch('/sku/:id')
  @Version('1')
  @UserTypes(UserType.ADMIN)
  @UseGuards(JwtAuthGuard, UserTypeGuard)
  async updateSku(
    @Req() req,
    @Param('id') id: string,
    @Body() updateSkuDto: UpdateSkuDto,
  ) {
    return await this.productService.updateSku(req.user, +id, updateSkuDto);
  }

  @Delete('/sku/:id')
  @Version('1')
  @UserTypes(UserType.ADMIN)
  @UseGuards(JwtAuthGuard, UserTypeGuard)
  async deleteSku(@Req() req, @Param('id') id: string) {
    return await this.productService.deleteSku(req.user, +id);
  }

  @Patch('/sku/status/:id')
  @Version('1')
  @UserTypes(UserType.ADMIN)
  @UseGuards(JwtAuthGuard, UserTypeGuard)
  async updateSkuStatus(
    @Req() req,
    @Param('id') id: string,
    @Body() statusUpdateSkuDto: StatusUpdateSkuDto,
  ) {
    try {
      return await this.productService.updateSkuStatus(
        req.user,
        +id,
        statusUpdateSkuDto,
      );
    } catch (e) {
      throwError(500, [], e.message);
    }
  }

  @Patch('/status/:id')
  @Version('1')
  @UserTypes(UserType.ADMIN)
  @UseGuards(JwtAuthGuard, UserTypeGuard)
  async updateProductStatus(
    @Req() req,
    @Param('id') id: string,
    @Body() statusUpdateProductDto: StatusUpdateProductDto,
  ) {
    return await this.productService.updateProductStatus(
      req.user,
      +id,
      statusUpdateProductDto,
    );
  }

  @Patch('/delivery-and-service/:id')
  @Version('1')
  @UserTypes(UserType.ADMIN)
  @UseGuards(JwtAuthGuard, UserTypeGuard)
  async updateDeliveryAndService(
    @Req() req,
    @Param('id') id: string,
    @Body() updateDeliveryAndService: UpdateDeliveryAndServiceDto,
  ) {
    return await this.productService.updateDeliveryAndService(
      req.user,
      +id,
      updateDeliveryAndService,
    );
  }

  @Patch('/basic-info/:id')
  @Version('1')
  @UserTypes(UserType.ADMIN)
  @UseGuards(JwtAuthGuard, UserTypeGuard)
  async updateBasicInfo(
    @Req() req,
    @Param('id') id: string,
    @Body() updateBasicInfoProductDto: UpdateBasicInfoProductDto,
  ) {
    return await this.productService.updateBasicInfo(
      req.user,
      +id,
      updateBasicInfoProductDto,
    );
  }

  @Patch('/offer-logics/:id')
  @Version('1')
  @UserTypes(UserType.ADMIN)
  @UseGuards(JwtAuthGuard, UserTypeGuard)
  async updateOfferLogics(
    @Req() req,
    @Param('id') id: string,
    @Body() updateOfferLogics: UpdateOfferLogicDto,
  ) {
    return await this.productService.updateOfferLogics(
      req.user,
      +id,
      updateOfferLogics,
    );
  }

  // update campaign product
  // @Post('/campaign')
  // @Version('1')
  // @UserTypes(UserType.ADMIN)
  // @UseGuards(JwtAuthGuard, UserTypeGuard)
  // async campaign(@Req() req, @Body() productCampaign: ProductCampaignDto) {
  //   return await this.productService.campaign(req.user, productCampaign);
  // }

  // check unique slug
  @Get('/check-slug/:slug')
  @Version('1')
  @UserTypes(UserType.ADMIN)
  @UseGuards(JwtAuthGuard, UserTypeGuard)
  async checkUniqueSlug(@Req() req, @Param('slug') slug: string) {
    return await this.productService.checkUniqueSlug(req.user, slug);
  }

  @Post()
  @Version('1')
  @UserTypes(UserType.ADMIN)
  @UseGuards(JwtAuthGuard, UserTypeGuard)
  async create(@Req() req, @Body() createProductDto: CreateProductDto) {
    return await this.productService.create(req.user, createProductDto);
  }

  @Patch('update-merge-product/:id')
  @Version('1')
  @UserTypes(UserType.ADMIN)
  @UseGuards(JwtAuthGuard, UserTypeGuard)
  async updateMergeProduct(
    @Req() req,
    @Param('id') id: number,
    @Body() updateMergeProductDto: UpdateMergeProductDto,
  ) {
    return await this.productService.updateMergeProduct(
      req.user,
      +id,
      updateMergeProductDto,
    );
  }

  @Get()
  @Version('1')
  @UserTypes(UserType.ADMIN)
  @UseGuards(JwtAuthGuard, UserTypeGuard)
  async findAll(@Req() req, @Query() query) {
    return await this.productService.findAll(
      req.user,
      query.perPage ? +query.perPage : 10,
      query.currentPage ? +query.currentPage - 1 : 0,
      query.search && query.search,
      query.status && query.status,
      query.sku && query.sku,
      query.category && query.category,
      query.brands && query.brands,
    );
  }

  @Get('/logs')
  @Version('1')
  @UserTypes(UserType.ADMIN)
  @UseGuards(JwtAuthGuard, UserTypeGuard)
  async findLog(@Req() req, @Query() query) {
    return await this.productService.findLog(
      req.user,
      query.perPage ? +query.perPage : 10,
      query.currentPage ? +query.currentPage - 1 : 0,
      query.productId && query.productId,
      query.userId && query.userId,
      query.status && query.status,
    );
  }

  @Get('db-health-check')
  @Version('1')
  // @UserTypes(UserType.ADMIN)
  // @UseGuards(JwtAuthGuard, UserTypeGuard)
  async findHealth() {
    return await this.productService.findHealth();
  }

  @Get(':id')
  @Version('1')
  // @UserTypes(UserType.ADMIN)
  // @UseGuards(JwtAuthGuard, UserTypeGuard)
  async findOne(@Req() req, @Param('id') id: string) {
    return await this.productService.findOne(+id);
  }

  @Get('basic/:id')
  @Version('1')
  // @UserTypes(UserType.ADMIN)
  // @UseGuards(JwtAuthGuard, UserTypeGuard)
  async findBasicOne(@Req() req, @Param('id') id: string) {
    return await this.productService.findBasicOne(+id);
  }

  @Get('sku/:id')
  @Version('1')
  // @UserTypes(UserType.ADMIN)
  // @UseGuards(JwtAuthGuard, UserTypeGuard)
  async findSkusOne(@Req() req, @Param('id') id: string) {
    return await this.productService.findSkusByProductID(+id);
  }

  @Patch(':id')
  @Version('1')
  @UserTypes(UserType.ADMIN)
  @UseGuards(JwtAuthGuard, UserTypeGuard)
  async update(
    @Req() req,
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return await this.productService.update(+id, updateProductDto);
  }

  @Delete(':id')
  @Version('1')
  @UserTypes(UserType.ADMIN)
  @UseGuards(JwtAuthGuard, UserTypeGuard)
  async remove(@Req() req, @Param('id') id: string) {
    return await this.productService.remove(req.user, +id);
  }
}
