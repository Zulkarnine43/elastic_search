import {
  Body,
  Controller,
  Get,
  HttpException,
  Param,
  Post,
  Query,
  Version,
} from '@nestjs/common';
import { LogicalProductGetDto } from '../dto/logical-product-get.dto';
import { StorefrontService } from '../services/storefront.service';

@Controller('product/storefront')
export class StorefrontController {
  constructor(private readonly storefrontService: StorefrontService) { }


  @Get('seo')
  @Version('1')
  async getProductSEOInfo() {
    try {
      return await this.storefrontService.getProductSEOInfo();
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  @Get('/product-details/:slug')
  @Version('1')
  async getProductDetails(@Param('slug') slug: string) {
    return await this.storefrontService.getProductDetails(slug);
  }

  @Post('/get-by-logic')
  @Version('1')
  async getByLogic(@Body() logic: LogicalProductGetDto) {
    return await this.storefrontService.getByLogic(logic);
  }

  @Post('/get-by-ids')
  @Version('1')
  async getByIds(@Body('ids') ids: number[], @Query() query) {
    return await this.storefrontService.getByIds(ids);
  }

  @Post('/get-by-skus')
  @Version('1')
  async getBySlugs(@Body('skus') skus: string[], @Query() query) {
    try {
      return await this.storefrontService.getBySkus(
        skus,
      );
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  @Get()
  @Version('1')
  async findAll(@Query() query) {
    const {
      category,
      brands,
      price,
      sortBy,
      sort,
      search,
      currentPage,
      perPage,
      ...dynamicQuery
    } = query;

    return await this.storefrontService.findAll(
      perPage ? +perPage : 10,
      currentPage ? +currentPage - 1 : 0,
      search && search,
      category && category,
      sortBy && sortBy,
      sort && sort,
      price && price,
      brands && brands,
      dynamicQuery && dynamicQuery,
    );
  }

  @Get()
  @Version('2')
  async findAllFilter(@Query() query) {
    const {
      category,
      brands,
      price,
      sortBy,
      sort,
      search,
      discount,
      currentPage,
      perPage,
      ...dynamicQuery
    } = query;

    return await this.storefrontService.findAllFilter(
      perPage ? +perPage : 10,
      currentPage ? +currentPage - 1 : 0,
      search && search,
      category && category,
      sortBy && sortBy,
      sort && sort,
      price && price,
      brands && brands,
      discount && discount,
      dynamicQuery && dynamicQuery,
      query,
    );
  }

  @Get('search')
  @Version('2')
  async findAllWithSearch(@Query() query) {
    const { search, currentPage, perPage, price, sortBy, sort } = query;

    return await this.storefrontService.findAllWithSearch(
      perPage ? +perPage : 10,
      currentPage ? +currentPage - 1 : 0,
      search && search,
      price && price,
      sortBy && sortBy,
      sort && sort,
      query,
    );
  }

  @Get('elastic-search')
  @Version('2')
  async findAllWithElasticSearch(@Query() query) {
    const {
      category,
      brand,
      price,
      search,
      currentPage,
      perPage,
    } = query;

    return await this.storefrontService.findAllWithElasticSearch(
      perPage ? +perPage : 10,
      currentPage ? +currentPage - 1 : 0,
      search && search,
      category && category,
      price && price,
      brand && brand,
    );
  }

  // @Get('view')
  // @Version('1')
  // async findAllView(@Query() query) {
  //   const {
  //     category,
  //     brands,
  //     price,
  //     sortBy,
  //     sort,
  //     search,
  //     currentPage,
  //     perPage,
  //     ...dynamicQuery
  //   } = query;

  //   return await this.storefrontService.findAllView(
  //     perPage ? +perPage : 10,
  //     currentPage ? +currentPage - 1 : 0,
  //     search && search,
  //     category && category,
  //     sortBy && sortBy,
  //     sort && sort,
  //     price && price,
  //     brands && brands,
  //     dynamicQuery && dynamicQuery,
  //   );
  // }

  @Get(':slug')
  @Version('1')
  async findOne(@Param('slug') slug: string) {
    return await this.storefrontService.findOne(slug);
  }

  // complete the look
  @Get('/complete-the-look/:id')
  @Version('1')
  async findCompleteTheLookProducts(
    @Param('id') id: string,
    @Query('limit') limit: string,
  ) {
    return await this.storefrontService.findCompleteTheLookProducts(
      +id,
      !!limit ? +limit : undefined,
    );
  }

  @Get('/related-products/:slug')
  @Version('1')
  async findRelatedProducts(
    @Param('slug') slug: string,
    @Query('limit') limit: string,
  ) {
    return await this.storefrontService.findRelatedProducts(
      slug,
      !!limit ? +limit : undefined,
    );
  }

  @Get('/brands-by-category/:slug')
  @Version('1')
  async brandsByCategory(@Param('slug') slug: string, @Query() query) {
    return await this.storefrontService.brandsByCategory(
      slug,
      query.perPage ? +query.perPage : 10,
      query.currentPage ? +query.currentPage - 1 : 0,
    );
  }
}
