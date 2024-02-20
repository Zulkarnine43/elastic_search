import { Controller, Get, Param, Query, Version } from '@nestjs/common';
import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) { }

  @Get('category-index')
  async indexCategory() {
    return await this.searchService.indexCategories();
  }

  @Get('brand-index')
  async indexBrand() {
    return await this.searchService.indexBrands();
  }

  
  @Get('create-index')
  @Version('1')
  async createIndex(@Query() query) {
    return await this.searchService.createProductIndex(
      +query?.limit,
      +query?.skip,
    );
  }

  @Get('delete-product-index/:id')
  async deleteProductIndex(@Param('id') id) {
    return await this.searchService.appSearchRemoveProductFromIndex(+id);
  }

  @Get('shop-index')
  async indexShop() {
    return await this.searchService.indexShops();
  }

  @Get('search-index')
  @Version('1')
  async search(@Query('text') text, @Query() query) {
    return await this.searchService.search(
      text,
      query.categories ? query.categories : null,
      query.brands,
      query.shops,
    );
  }
}