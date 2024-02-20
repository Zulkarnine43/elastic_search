import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import axios from 'axios';
import { Connection, Model } from 'mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Not, Repository } from 'typeorm';
// import { ProductDocument } from 'src/schema/product.schema';
import { Product, ProductStatus } from '../product/entities/product.entity';
import { CategoryService } from '../category/services/category.service';
import { Sku, VariationStatus } from '../product/entities/sku.entity';
// import * as axios from 'axios';

@Injectable()
export class SearchService {
  index = 'search-test';

  constructor(
    private readonly elasticsearchService: ElasticsearchService,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Sku) private skuRepository: Repository<Sku>,
    private categoryService: CategoryService,
    // @InjectConnection() private connection: Connection,
    // @InjectModel('PRODUCTS')
    // private product: Model<ProductDocument>,
  ) { }

  //   curl -X POST '<ENTERPRISE_SEARCH_BASE_URL>/api/as/v1/engines/national-parks-demo/documents' \
  // -H 'Content-Type: application/json' \
  // -H 'Authorization: Bearer private-xxxxxxxxxxxxxxxxxxxx' \
  // -d '[
  //   {
  //     "description": "Death Valley is the hottest, lowest, and driest place in the United States. Daytime temperatures have topped 130 °F (54 °C) and it is home to Badwater Basin, the lowest elevation in North America. The park contains canyons, badlands, sand dunes, and mountain ranges, while more than 1000 species of plants grow in this geologic graben. Additional points of interest include salt flats, historic mines, and springs.",
  //     "nps_link": "https://www.nps.gov/deva/index.htm",
  //     "states": [
  //       "California",
  //       "Nevada"
  //     ],
  //     "title": "Death Valley",
  //     "visitors": "1296283",
  //     "world_heritage_site": "false",
  //     "location": "36.24,-116.82",
  //     "acres": "3373063.14",
  //     "square_km": "13650.3",
  //     "date_established": "1994-10-31T06:00:00Z",
  //     "id": "park_death-valley"
  //   }
  // ]'

  //   ENTERPRISE_SEARCH_BASE_URL=https://mm-search.ent.ap-southeast-1.aws.found.io
  //  ENTERPRISE_SEARCH_PRIVATE_KEY='private-upy7s1daza6rnfw8xfxm36pj'
  //  ENTERPRISE_SEARCH_ENGINE=dev-v2-engine

  async appSearchIndexProduct(products) {
    // return product;
    // for (const product of products) {
    // console.log(product);
    await this.appSearcBulkRemoveProductFromIndex(products.map((p) => p.id));

    try {
      const ENTERPRISE_SEARCH_BASE_URL = process.env.ENTERPRISE_SEARCH_BASE_URL;
      const PRIVATE_KEY = process.env.ENTERPRISE_SEARCH_PRIVATE_KEY;

      const result = await axios.post(
        `${ENTERPRISE_SEARCH_BASE_URL}/api/as/v1/engines/${process.env.ENTERPRISE_SEARCH_ENGINE}/documents`,
        products,
        {
          headers: {
            Authorization: `Bearer ${PRIVATE_KEY}`,
            'Content-Type': 'application/json',
          },
        },
      );

      console.log('Indexed data length: ', result.data.length);
      console.log(result.data);
    } catch (e) {
      console.log(e);
      return e;
    }
  }

  async appSearcBulkRemoveProductFromIndex(ids) {
    try {
      const ENTERPRISE_SEARCH_BASE_URL = process.env.ENTERPRISE_SEARCH_BASE_URL;
      const PRIVATE_KEY = process.env.ENTERPRISE_SEARCH_PRIVATE_KEY;

      const result = await axios.delete(
        `${ENTERPRISE_SEARCH_BASE_URL}/api/as/v1/engines/${process.env.ENTERPRISE_SEARCH_ENGINE}/documents`,
        {
          data: [7432],
          headers: {
            Authorization: `Bearer ${PRIVATE_KEY}`,
            'Content-Type': 'application/json',
          },
        },
      );
    } catch (e) {
      console.log(e);
      return e;
    }
  }

  async appSearchRemoveProductFromIndex(id) {
    try {
      const ENTERPRISE_SEARCH_BASE_URL = process.env.ENTERPRISE_SEARCH_BASE_URL;
      const PRIVATE_KEY = process.env.ENTERPRISE_SEARCH_PRIVATE_KEY;

      const result = await axios.delete(
        `${ENTERPRISE_SEARCH_BASE_URL}/api/as/v1/engines/${process.env.ENTERPRISE_SEARCH_ENGINE}/documents`,
        {
          data: [id],
          headers: {
            Authorization: `Bearer ${PRIVATE_KEY}`,
            'Content-Type': 'application/json',
          },
        },
      );
    } catch (e) {
      console.log(e);
      return e;
    }
  }

  async indexProducts(product) {
    for (let i = 0; i < product.length; i++) {
      await this.removeProductFromIndex(product[i].id);
      await this.appSearchIndexProduct(product);
    }

    return;
  }

  async indexProduct(product) {
    await this.appSearchIndexProduct(product);
  }

  async search(
    text: string,
    categories: string,
    brands: string,
    shops: string,
  ) {
    const filters = {
      query: text,

      result_fields: {
        productId: { raw: {} },
        name: { raw: {} },
        'seo.keyword': { raw: {} },
      },
      page: {
        size: 2,
        current: 1,
      },
    };

    if (text) {
      filters['search_fields'] = {
        name: { weight: 9 },
        'seo.keyword': {},
      };
    }

    console.log(categories);
    if (categories) {
      filters['filters'] = {
        'breadcumb.slug': categories.split(','),
      };
    }

    try {
      const ENTERPRISE_SEARCH_BASE_URL = process.env.ENTERPRISE_SEARCH_BASE_URL;
      const PRIVATE_KEY = process.env.ENTERPRISE_SEARCH_PRIVATE_KEY;

      const result = await axios.post(
        `${ENTERPRISE_SEARCH_BASE_URL}/api/as/v1/engines/${process.env.ENTERPRISE_SEARCH_ENGINE}/search`,
        filters,
        {
          headers: {
            Authorization: `Bearer ${PRIVATE_KEY}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return result.data;
    } catch (e) {
      console.log(e);
      return e;
    }

    // return result.body;
    // const hits = result.body.hits.hits;

    // return hits.map((item) => item._source);
  }

  async createProductIndex(limit = 100, skip = 0) {
    const dataLimit = 100;
    // if(skip)

    for (let i = 1; i <= Math.ceil(limit / dataLimit); i++) {
      const skus = await this.skuRepository.find({
        skip: skip,
        take: dataLimit,
        relations: ['product', 'product.brand', 'product.specifications', 'product.seo'],
        where: {
          status: VariationStatus.ACTIVE, // active status of the sku
          product: {
            status: ProductStatus.ACTIVE, // active status of the product
          },
        },
      });

      if (skus && skus.length > 0) {
        const mappedSkuList = skus.map(async (sku) => {
          sku['breadcrumb'] = [];
          if (sku && sku?.product && sku?.product?.categoryId) {
            const breadcrumb = await this.categoryService.generateBreadcrumb(sku?.product?.categoryId);
            sku['breadcrumb'] = breadcrumb;
          }
          return { ...sku };
        });

        const skusList = await Promise.all(mappedSkuList);

        skip = skip + dataLimit;

        const mapData = skusList.map(async (sku) => {
          return await this.formatPostData(sku)
        });
        const data = await Promise.all(mapData)

        if (data.length) {
          await this.appSearchIndexProduct(data);
        }

        console.log('original data length: ', data.length);
      } else {
        return skip
      }
    }

    return skip;
  }

  async removeSkuFromIndex(sku_id) {
    await this.appSearchRemoveProductFromIndex(sku_id);
  }

  async removeSkusFromIndex(product_id) {
    const skus = await this.skuRepository.find({ where: { productId: product_id } });
    if (skus && skus.length > 0) {
      for (let i = 0; i < skus.length; i++) {
        await this.appSearchRemoveProductFromIndex(skus[i].id);
      }
    } else {
      return
    }
  }

  async removeMediaSoftSkusFromIndex(ProductIds) {
    const skus = await this.skuRepository.find({
      where: {
        productId: In(ProductIds),
      },
    });
    if (skus && skus.length > 0) {
      for (let i = 0; i < skus.length; i++) {
        await this.appSearchRemoveProductFromIndex(skus[i].id);
      }
    } else {
      return
    }
  }

  async addedSkuFromIndex(sku_id) {
    const sku = await this.skuRepository.findOne({
      relations: ['product', 'product.brand', 'product.specifications', 'product.seo'],
      where: {
        id: sku_id,
        status: VariationStatus.ACTIVE, // active status of the sku
        product: {
          status: ProductStatus.ACTIVE, // active status of the product
        },
      },
    });

    if (sku) {
      sku['breadcrumb'] = [];
      if (sku && sku?.product && sku?.product?.categoryId) {
        const breadcrumb = await this.categoryService.generateBreadcrumb(sku?.product?.categoryId);
        sku['breadcrumb'] = breadcrumb;
      }
      const data = await this.formatPostData(sku)
      if (data) {
        await this.appSearchIndexProduct([data]);
      }
    } else {
      return
    }
  }

  async addedProductFromIndex(product_id) {
    const skus = await this.skuRepository.find({
      relations: ['product', 'product.brand', 'product.specifications', 'product.seo'],
      where: {
        productId: product_id,
        status: VariationStatus.ACTIVE, // active status of the sku
        product: {
          status: ProductStatus.ACTIVE, // active status of the product
        },
      },
    });

    if (skus && skus.length > 0) {
      const mappedSkuList = skus.map(async (sku) => {
        sku['breadcrumb'] = [];
        if (sku && sku?.product && sku?.product?.categoryId) {
          const breadcrumb = await this.categoryService.generateBreadcrumb(sku?.product?.categoryId);
          sku['breadcrumb'] = breadcrumb;
        }
        return { ...sku };
      });

      const skusList = await Promise.all(mappedSkuList);

      const mapData = skusList.map(async (sku) => {
        return await this.formatPostData(sku)
      });
      const data = await Promise.all(mapData)

      if (data.length) {
        await this.appSearchIndexProduct(data);
      }

      console.log('original data length: ', data.length);
    } else {
      return
    }
  }

  async addedMediaSoftProductFromIndex(ProductIds) {
    const skus = await this.skuRepository.find({
      relations: ['product', 'product.brand', 'product.specifications', 'product.seo'],
      where: {
        productId: In(ProductIds),
        status: VariationStatus.ACTIVE, // active status of the sku
        product: {
          status: ProductStatus.ACTIVE, // active status of the product
        },
      },
    });

    if (skus && skus.length > 0) {
      const mappedSkuList = skus.map(async (sku) => {
        sku['breadcrumb'] = [];
        if (sku && sku?.product && sku?.product?.categoryId) {
          const breadcrumb = await this.categoryService.generateBreadcrumb(sku?.product?.categoryId);
          sku['breadcrumb'] = breadcrumb;
        }
        return { ...sku };
      });

      const skusList = await Promise.all(mappedSkuList);

      const mapData = skusList.map(async (sku) => {
        return await this.formatPostData(sku)
      });
      const data = await Promise.all(mapData)

      if (data.length) {
        await this.appSearchIndexProduct(data);
      }

      console.log('original data length: ', data.length);
    } else {
      return
    }
  }

  async removeProductFromIndex(product_id) {
    await this.appSearchRemoveProductFromIndex(product_id);
  }

  async removeMergeProductsFromIndex(mergeProducts) {
    const skus = await this.skuRepository.find({
      where: {
        id: In(mergeProducts),
      },
    });
    if (skus && skus.length > 0) {
      for (let i = 0; i < skus.length; i++) {
        await this.appSearchRemoveProductFromIndex(skus[i].id);
      }
    } else {
      return
    }
  }

  async formatPostData(sku) {
    return {
      id: sku?.id ? sku?.id : null,
      sku: sku?.sku ? sku?.sku : '',
      custom_sku: sku?.customSku ? sku?.customSku : '',
      model_no: sku?.modelNo ? sku?.modelNo : '',
      price: sku?.price ? sku?.price : 0,
      discounted_price: sku?.discountedPrice ? sku?.discountedPrice : 0,
      discounted_type: sku?.discountedType ? sku?.discountedType : '',
      discounted_value: sku?.discountedValue ? sku?.discountedValue : 0,
      discounted_price_start: sku?.discountedPriceStart ? sku?.discountedPriceStart : '',
      discounted_price_end: sku?.discountedPriceEnd ? sku?.discountedPriceEnd : '',
      stock_quantity: sku?.stockQuantity ? sku?.stockQuantity : 0,
      pre_order: sku?.preOrder ? sku?.preOrder : false,
      barcode: sku?.barcode ? sku?.barcode : '',
      sbarcode: sku?.sbarcode ? sku?.sbarcode : '',
      stylecode: sku?.stylecode ? sku?.stylecode : '',
      vat: sku?.vat ? sku?.vat : 0,
      purchase_price: sku?.purchasePrice ? sku?.purchasePrice : 0,
      cost_price: sku?.costPrice ? sku?.costPrice : 0,
      point_earn: sku?.pointEarn ? sku?.pointEarn : 0,
      status: sku?.status ? sku?.status : '',
      created_at: sku?.createdAt ? sku?.createdAt : '',
      updated_at: sku?.updatedAt ? sku?.updatedAt : '',

      product_id: sku?.product && sku?.product?.id ? sku?.product?.id : null,
      product_name: sku?.product && sku?.product?.name ? sku?.product?.name : '',
      product_slug: sku?.product && sku?.product?.slug ? sku?.product?.slug : '',
      is_live: sku?.product && sku?.product?.isLive ? sku?.product?.isLive : true,
      is_featured: sku?.product && sku?.product?.isFeatured ? sku?.product?.isFeatured : false,
      featured_order: sku?.product && sku?.product?.featuredOrder ? sku?.product?.featuredOrder : null,
      inside_dhaka: sku?.product && sku?.product?.insideDhaka ? sku?.product?.insideDhaka : null,
      outside_dhaka: sku?.product && sku?.product?.outsideDhaka ? sku?.product?.outsideDhaka : null,
      product_status: sku?.product && sku?.product?.status ? sku?.product?.status : 'draft',
      display_only: sku?.product && sku?.product?.displayOnly ? sku?.product?.displayOnly : false,
      warranty_type: sku?.product && sku?.product?.warrantyType ? sku?.product?.warrantyType : '',
      warranty: sku?.product && sku?.product?.warranty ? sku?.product?.warranty : '',
      warranty_policy: sku?.product && sku?.product?.warrantyPolicy ? sku?.product?.warrantyPolicy : '',
      package_weight: sku?.product && sku?.product?.packageWeight ? sku?.product?.packageWeight : 0,
      package_length: sku?.product && sku?.product?.packageLength ? sku?.product?.packageLength : 0,
      package_width: sku?.product && sku?.product?.packageWidth ? sku?.product?.packageWidth : 0,
      package_height: sku?.product && sku?.product?.packageHeight ? sku?.product?.packageHeight : 0,

      short_description: sku?.product && sku?.product?.shortDescription ? sku?.product?.shortDescription : '',
      long_description: sku?.product && sku?.product?.longDescription ? sku?.product?.longDescription : '',
      product_created_at: sku?.product && sku?.product?.createdAt ? sku?.product?.createdAt : '',
      product_updated_at: sku?.product && sku?.product?.updatedAt ? sku?.product?.updatedAt : '',

      category_ids: sku?.['breadcrumb'] ? sku['breadcrumb'].map((item) => item.id) : [],
      category_slugs: sku?.['breadcrumb'] ? sku['breadcrumb'].map((item) => item.slug) : [],
      category_names: sku?.['breadcrumb'] ? sku['breadcrumb'].map((item) => item.name) : [],

      brand_id:
        sku?.product && sku?.product?.brand && sku?.product?.brand['id'] ? sku?.product?.brand['id'] : null,
      brand_slug:
        sku?.product && sku?.product?.brand && sku?.product?.brand['slug'] ? sku?.product?.brand['slug'] : '',
      brand_name:
        sku?.product && sku?.product?.brand && sku?.product?.brand['name'] ? sku?.product?.brand['name'] : '',
      brand_logo:
        sku?.product && sku?.product?.brand && sku?.product?.brand['logo'] ? sku?.product?.brand['logo'] : '',

      seo_title:
        sku?.product && sku?.product?.seo && sku?.product?.seo['title'] ? sku?.product?.seo['title'] : '',
      seo_tag:
        sku?.product && sku?.product?.seo && sku?.product?.seo['tag'] ? sku?.product?.seo['tag'] : '',
      seo_description:
        sku?.product && sku?.product?.seo && sku?.product?.seo['description']
          ? sku?.product?.seo['description']
          : '',

      specification_names: sku?.product?.specifications.map(
        (item) => item.key,
      ),
      specification_values: sku?.product?.specifications.map(
        (item) => item.value,
      ),
    };
  }

  async searchForPosts(text: string) {
    // const results = await this.search(text);
    // return results;
  }

  async indexCategory(category) {
    await this.elasticsearchService.index({
      index: this.index,
      refresh: true,
      body: {
        image: category.icon,
        name: category.name,
        id: null,
        brand_id: null,
        category_id: category.id,
        shop_id: null,
        datatype: 'category',
        slug: category.slug,
      },
    });
  }

  async indexBrand(brand) {
    await this.elasticsearchService.index({
      index: this.index,
      refresh: true,
      body: {
        image: brand.logo,
        name: brand.name,
        id: null,
        brand_id: brand.id,
        category_id: null,
        shop_id: null,
        datatype: 'brand',
        slug: brand.slug,
      },
    });
  }

  async indexCategories() {
    const response = await axios({
      method: 'get',
      url: `${process.env.CATALOG_URL}/category`,
    }).then((response) => response.data);

    if (response.length) {
      console.log('hit');
      for (let i = 1; i < response.length; i++) {
        await this.indexCategory(response[i]);
      }

      return response;
    }
  }

  async indexBrands() {
    const response = await axios({
      method: 'get',
      url: `${process.env.CATALOG_URL}/brand`,
    }).then((response) => response.data);

    // return response;
    if (response.length) {
      console.log('hit');
      for (let i = 1; i < response.length; i++) {
        await this.indexBrand(response[i]);
      }

      return response;
    }
  }

  async indexShops() {
    const response = await axios({
      method: 'get',
      url: `${process.env.SHOPMANAGER_URL}/shop/get-all-public-shops`,
    }).then((response) => response.data);

    if (response.length) {
      console.log('hit');
      for (let i = 1; i < response.length; i++) {
        await this.indexShop(response[i]);
      }

      return response;
    }
  }

  async indexShop(shop) {
    await this.elasticsearchService.deleteByQuery({
      index: this.index,
      body: {
        query: {
          match: {
            shop_id: shop.id,
          },
        },
      },
    });

    await this.elasticsearchService.index({
      index: this.index,
      refresh: true,
      body: {
        image: shop.avatar,
        name: shop.name,
        id: null,
        brand_id: null,
        category_id: null,
        shop_id: shop.id,
        datatype: 'shop',
        slug: shop.slug,
      },
    });
  }
}