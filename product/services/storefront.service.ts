import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cache } from 'cache-manager';
import { throwError } from 'src/common/errors/errors.function';
import { Brackets, DataSource, In, IsNull, Repository } from 'typeorm';
import { Brand, BrandStatus } from '../../brand/entities/brand.entity';
import { CategoryBinding } from '../../category/entities/category-binding.entity';
import {
  Category,
  CategoryStatus,
} from '../../category/entities/category.entity';
import { CategoryService } from '../../category/services/category.service';
import { SeoType } from '../../seo/entities/seo.entity';
import { LogicalProductGetDto } from '../dto/logical-product-get.dto';
import { Product, ProductStatus } from '../entities/product.entity';
import { Sku, VariationStatus } from '../entities/sku.entity';
import axios from 'axios';

@Injectable()
export class StorefrontService {
  select = {
    id: true,
    name: true,
    slug: true,
    sku: true,
    sbarcode: true,
    stylecode: true,
    hscode: true,
    thumbnail: true,
    shortDescription: true,
    warrantyType: true,
    warranty: true,
    warrantyPolicy: true,
    vat: true,
    categoryId: true,
    brandId: true,
    isLive: true,
    isFeatured: true,
    displayOnly: true,
    gift: true,
    createdAt: true,
    updatedAt: true,
    category: {
      id: true,
      logo: true,
      name: true,
      slug: true,
    },
    brand: {
      id: true,
      logo: true,
      name: true,
      slug: true,
    },
    specifications: {
      id: true,
      key: true,
      value: true,
    },
    seo: {
      id: true,
      title: true,
      description: true,
      tag: true,
      imgText: true,
    },
  };

  listSelect = [
    'product.id',
    'product.name',
    'product.slug',
    'product.sku',
    'product.sbarcode',
    'product.stylecode',
    'product.hscode',
    'product.thumbnail',
    'product.shortDescription',
    'product.vat',
    'product.categoryId',
    'product.brandId',
    'product.isLive',
    'product.isFeatured',
    'product.featuredOrder',
    'product.displayOnly',
    'product.status',
    'product.updatedAt',
    'product.createdAt',
    'product.gift',
    'product.warrantyType',
    'product.warranty',
    'product.warrantyPolicy',
    'category.id',
    'category.logo',
    'category.name',
    'category.slug',
    'category.leaf',
    'brand.id',
    'brand.logo',
    'brand.name',
    'brand.slug',
    // 'specifications.id',
    // 'specifications.key',
    // 'specifications.value',
    'skus.id',
    'skus.productId',
    'skus.images',
    'skus.sku',
    'skus.customSku',
    'skus.barcode',
    'skus.sbarcode',
    'skus.stylecode',
    'skus.modelNo',
    'skus.vat',
    'skus.purchasePrice',
    'skus.discountedType',
    'skus.discountedValue',
    'skus.discountedPrice',
    'skus.discountedPriceStart',
    'skus.discountedPriceEnd',
    'skus.price',
    'skus.stockQuantity',
    'skus.preOrder',
    'skus.preOrderPer',
    'skus.stockOut',
    'skus.status',
    // 'attributes.id',
    // 'attributes.key',
    // 'attributes.value',
    'seo.id',
    'seo.title',
    'seo.description',
    'seo.tag',
    'seo.imgText',
    'seo.image',
  ];

  logicSelect = [
    'product.id',
    'product.name',
    'product.slug',
    'product.sku',
    'product.sbarcode',
    'product.stylecode',
    'product.hscode',
    'product.thumbnail',
    'product.shortDescription',
    'product.vat',
    'product.categoryId',
    'product.brandId',
    'product.isLive',
    'product.isFeatured',
    'product.featuredOrder',
    'product.displayOnly',
    'product.status',
    'product.updatedAt',
    'product.createdAt',
    'product.gift',
    'category.id',
    'category.logo',
    'category.name',
    'category.slug',
    'category.leaf',
    'brand.id',
    'brand.logo',
    'brand.name',
    'brand.slug',
    // 'specifications.id',
    // 'specifications.key',
    // 'specifications.value',
    'skus.id',
    'skus.productId',
    'skus.images',
    'skus.sku',
    'skus.customSku',
    'skus.barcode',
    'skus.sbarcode',
    'skus.stylecode',
    'skus.modelNo',
    'skus.vat',
    'skus.purchasePrice',
    'skus.discountedType',
    'skus.discountedValue',
    'skus.discountedPrice',
    'skus.discountedPriceStart',
    'skus.discountedPriceEnd',
    'skus.price',
    'skus.stockQuantity',
    'skus.preOrder',
    'skus.preOrderPer',
    'skus.stockOut',
    'skus.status',
    // 'attributes.id',
    // 'attributes.key',
    // 'attributes.value',
    // 'seo.id',
    // 'seo.title',
    // 'seo.description',
    // 'seo.tag',
    // 'seo.imgText',
    // 'seo.image',
  ];

  productBasicSelect = [
    'product.id',
    'product.name',
    'product.slug',
    'product.thumbnail',
    'product.sku',
    'product.categoryId',
    'product.brandId',
    'category.id',
    'category.logo',
    'category.name',
    'category.slug',
    'brand.id',
    'brand.logo',
    'brand.name',
    'brand.slug',
  ];

  private PRODUCT_CACHE_TTL = Number(process.env.PRODUCT_CACHE_TTL || 300000);
  private DEFAULT_CACHE_TTL = Number(process.env.DEFAULT_CACHE_TTL || 600000);
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(CategoryBinding)
    private categoryBindingRepository: Repository<CategoryBinding>,
    @InjectRepository(Brand)
    private brandRepository: Repository<Brand>,
    @InjectRepository(Sku)
    private skuRepository: Repository<Sku>,
    private dataSource: DataSource,
    private categoryService: CategoryService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) { }

  async findAll(
    perPage = 10,
    currentPage = 0,
    search = null,
    category = null,
    sortBy = null,
    sort = null,
    price = null,
    brands = null,
    dynamicQuery = null,
  ) {
    // const queryRunner = this.dataSource.createQueryRunner();
    // await queryRunner.connect();

    // await queryRunner.startTransaction();

    try {
      let filter;
      let andFilter = {};
      const sortLogic = {};
      andFilter = {
        status: ProductStatus.ACTIVE,
        skus: { status: VariationStatus.ACTIVE },
      };

      let leafCategory = [];

      // if (category) {
      //   let categoryitem;
      //   try {
      //     categoryitem = await this.categoryRepository.findOne({
      //       where: { slug: category },
      //     });

      //     if (!categoryitem) throwError(400, [], 'Invalid category');

      //     const allCategories = await this.categoryRepository.find({
      //       where: { deletedAt: IsNull() },
      //     });
      //     const leafCategoryIds = await this.findNestedCategory(
      //       allCategories,
      //       categoryitem.id,
      //     );
      //     leafCategory = [...leafCategoryIds, categoryitem.id];

      //     // if (!categoryitem.leaf) {
      //     //   this.categoryService.leafCategoryIds = [];
      //     //   await this.categoryService.findLeafCategories(categoryitem.id);
      //     //   leafCategory = this.categoryService.leafCategoryIds;
      //     // } else {
      //     //   leafCategory = [categoryitem.id];
      //     // }

      //     andFilter = { ...andFilter, categoryId: In(leafCategory) };
      //   } catch (e) {
      //     if (e instanceof HttpException) {
      //       throw e;
      //     }
      //     console.log(e);
      //     throwError(400, [], 'Invalid category');
      //   }
      // }

      const query = await this.productRepository.createQueryBuilder('product');

      query.leftJoinAndSelect('product.category', 'category');
      query.leftJoinAndSelect('product.brand', 'brand');
      // query.leftJoinAndSelect('product.specifications', 'specifications');
      query.innerJoinAndSelect('product.skus', 'skus');
      query.leftJoinAndSelect('skus.attributes', 'attributes');
      // query.leftJoinAndSelect('skus.stocks', 'stocks');
      query.leftJoinAndSelect('product.seo', 'seo', 'seo.type = :type', {
        type: SeoType.PRODUCT,
      });

      query.select(this.listSelect);
      // also select total sku price
      query.addSelect((qb) => {
        return qb
          .select(
            'COALESCE(SUM(skus.price + skus.discountedPrice), 0)',
            'totalSkuPrice',
          )
          .from(Sku, 'skus')
          .where('skus.productId = product.id');
      });

      // query.select(
      //   `product.*`,
      //   `COALESCE(SUM(skus.price + skus.discount), 0) AS totalSkuPrice`,
      // );

      //
      // if (leafCategory && leafCategory.length > 0) {
      //   query.where('product.categoryId IN (:...leafCategory)', {
      //     leafCategory,
      //   });
      // }

      if (brands && brands.length > 0) {
        brands = brands.split(',');
        // get all the brands id
        const brandIds = [];
        for (const brand of brands) {
          const brandItem = await this.brandRepository.findOne({
            where: { slug: brand },
          });

          if (!brandItem) continue;

          brandIds.push(brandItem.id);
        }

        if (brandIds.length > 0) {
          query.andWhere('product.brandId IN (:...brandIds)', { brandIds });
        }
      }

      if (price) {
        const minPrice = price.split(',')[0];
        const maxPrice = price.split(',')[1];

        if (minPrice && maxPrice) {
          query.andWhere(
            'skus.discountedPrice BETWEEN :minPrice AND :maxPrice',
            {
              minPrice,
              maxPrice,
            },
          );
        } else if (minPrice) {
          query.andWhere('skus.discountedPrice >= :minPrice', {
            minPrice,
          });
        } else if (maxPrice) {
          query.andWhere('skus.discountedPrice <= :maxPrice', {
            maxPrice,
          });
        }
      }

      if (search) {
        query.orWhere(
          '(product.name LIKE :search OR product.sku LIKE :search OR category.name LIKE :search OR skus.sku LIKE :search OR skus.customSku LIKE :search )',
          { search: `%${search}%` },
        );
      }

      // delete user_id form dynamicQuery
      if (dynamicQuery && dynamicQuery.user_id) {
        delete dynamicQuery.user_id;
      }
      // Process dynamic filters on skus.attributes
      // Process dynamic filters on skus.attributes
      // if (dynamicQuery) {
      //
      //   query.leftJoinAndSelect('skus.attributes', 'attributes');
      //   query.leftJoinAndSelect('product.specifications', 'specifications');
      //   query.andWhere(
      //     new Brackets((qb) => {
      //       for (const [key, value] of Object.entries(dynamicQuery)) {
      //         const filterValues = String(value)
      //           .split(',')
      //           .map((item) => item.trim());

      //         if (filterValues.length === 0) continue;
      //         const parameterName = `${key}`;
      //         console.log(parameterName);
      //         const attributeKey = `attributes.key`;
      //         const attributeValue = `attributes.value`;

      //         qb.orWhere(
      //           'attributes.key = :parameterName AND attributes.value IN (:...filterValues)',
      //           { parameterName, filterValues },
      //         );

      //         for (const filterValue of filterValues) {
      //           qb.orWhere(
      //             'specifications.key = :parameterName AND specifications.value LIKE :filterValue',
      //             { parameterName, filterValue: `%${filterValue}%` },
      //           );
      //         }
      //       }
      //     }),
      //   );
      // }

      // send all active product
      query.andWhere('product.status = :status', {
        status: ProductStatus.ACTIVE,
      });

      // Add sorting
      query.orderBy('product.isFeatured', 'DESC');
      query.addOrderBy('product.featuredOrder', 'DESC');
      if (sortBy && sort) {
        if (sortBy === 'price') {
          query.addOrderBy(`skus.discountedPrice`, sort);
        } else {
          query.addOrderBy(`product.${sortBy}`, sort);
        }
      } else {
        query.addOrderBy('product.createdAt', 'ASC');
      }

      // take: perPage,
      //   skip: currentPage * perPage,

      query.take(perPage);
      query.skip(currentPage * perPage);
      // return query.getSql();

      let [products, total] = await query.getManyAndCount();

      // return sql;
      // get today date
      const today = new Date();
      today.setHours(today.getHours() + 6);
      // today.setHours(0, 0, 0, 0);

      // change sku discount price of products array
      products = products.map((product) => {
        product.skus = product.skus.map((sku) => {
          sku.discountedPrice =
            (sku.discountedPrice !== 0 &&
              today >= new Date(sku.discountedPriceStart) &&
              today <= new Date(sku.discountedPriceEnd)) ||
              (sku.discountedPrice !== 0 &&
                sku.discountedPriceStart === null &&
                sku.discountedPriceEnd === null)
              ? sku.discountedPrice
              : sku.price;
          return sku;
        });
        return product;
      });

      // await queryRunner.commitTransaction();
      // await queryRunner.release();

      return {
        data: products,
        perPage: perPage,
        currentPage: currentPage + 1,
        totalPage: Math.ceil(total / perPage),
        totalResult: total,
      };
    } catch (error) {
      // await queryRunner.rollbackTransaction();
      // await queryRunner.release();
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    } finally {
      // await queryRunner.release();
    }
  }

  async findAllFilter(
    perPage = 10,
    currentPage = 0,
    search = null,
    category = null,
    sortBy = null,
    sort = null,
    price = null,
    brands = null,
    discount = null,
    dynamicQuery = null,
    reqQuery,
  ) {
    // const queryRunner = this.dataSource.createQueryRunner();
    // await queryRunner.connect();

    try {
      // sort the query & generate cacheKey
      const sortedProps = Object.keys(reqQuery).sort();
      const cacheKey = sortedProps
        ?.map((prop) => prop + '_' + reqQuery[prop])
        .join('_');

      // if find on cache, then response send
      const responseFromCache = await this.cacheManager.get(cacheKey);
      if (responseFromCache) {
        return responseFromCache;
      }

      let filter;
      let andFilter = {};
      const sortLogic = {};
      andFilter = {
        status: ProductStatus.ACTIVE,
        skus: { status: VariationStatus.ACTIVE },
      };

      let leafCategory = [];

      if (category) {
        let categoryItems;
        try {
          const categorySlugs = category.split(',');

          categoryItems = await this.categoryRepository.find({
            where: { slug: In(categorySlugs) },
          });

          //

          if (!categoryItems) throwError(400, [], 'Invalid category');

          const allCategories = await this.categoryRepository.find({
            where: { deletedAt: null },
          });

          for (const categoryItem of categoryItems) {
            const nestedCategoryIds = await this.findNestedCategory(
              allCategories,
              categoryItem.id,
            );
            leafCategory.push(...nestedCategoryIds, categoryItem.id);
          }

          andFilter = { ...andFilter, categoryId: In(leafCategory) };
        } catch (e) {
          if (e instanceof HttpException) {
            throw e;
          }
          console.log(e);
          throwError(400, [], 'Invalid category');
        }
      }

      // const query = queryRunner.manager
      //   .createQueryBuilder()
      //   .select('p.name', 'name')
      //   .addSelect('p.slug', 'slug')
      //   .addSelect('p.thumbnail', 'thumbnail')
      //   .addSelect('s.product_id', 'p_id')
      //   .addSelect('MIN(s.price)', 'price')
      //   .addSelect('MIN(s.discounted_price)', 'discounted_price')
      //   // .addSelect('SUM(s.stock_quantity)', 'stockQuantity')
      //   // .addSelect('SUM(s.stock_quantity) OVER (PARTITION BY p.id) AS stockQuantity')
      //   .addSelect('(SELECT SUM(ss.stock_quantity) FROM sku ss WHERE p.id = ss.product_id AND ss.status = "active") as stockQuantity')
      //   .addSelect('c.name', 'category_name')
      //   .addSelect('c.id', 'category_id')
      //   .addSelect('b.name', 'brand_name')
      //   .addSelect('b.id', 'brand_id')
      //   .addSelect('b.logo', 'brand_logo')
      //   .from('sku', 's')
      //   .groupBy('s.product_id')
      //   .leftJoin('product', 'p', `p.id = s.product_id`)
      //   .leftJoin('category', 'c', 'p.category_id = c.id')
      //   .leftJoin('brand', 'b', 'p.brand_id = b.id')
      //   .leftJoin('specification', 'sp', 'p.id = sp.product_id')
      //   .where(`p.status = 'active'`)
      //   .where(`s.status = 'active'`);

      const query = await this.productRepository
        .createQueryBuilder('p')
        .select([
          'p.name AS name',
          'p.slug AS slug',
          'p.thumbnail AS thumbnail',
          'p.id AS p_id',
          'b.name AS brand_name',
          'b.logo AS brand_logo',
          'b.id AS brand_id',
          'c.name AS category_name',
          'c.id AS category_id',
          'MIN(s.price) AS price',
          `
          MIN(
              CASE 
                  WHEN ((s.discountedPrice <> 0 AND CURRENT_TIMESTAMP() BETWEEN s.discountedPriceStart AND s.discountedPriceEnd) 
                      OR (s.discountedPrice <> 0 AND s.discountedPriceStart IS NULL AND s.discountedPriceEnd IS NULL))
                  THEN s.discountedPrice 
                  ELSE s.price  
              END
          ) AS discounted_price`,
          'COALESCE(sku_counts.sku_count, 0) AS sku_count',
          'COALESCE(stock_quantities.total_quantity, 0) AS stockQuantity',
        ])
        .leftJoin('p.skus', 's')
        .leftJoin('p.brand', 'b')
        .leftJoin('p.category', 'c')
        .leftJoin(
          (subQuerySkuCounts) =>
            subQuerySkuCounts
              .select(['product_id', 'COUNT(id) AS sku_count'])
              .from(Sku, 'sku')
              .where('sku.status = :status AND sku.deleted_at IS NULL', {
                status: 'active',
              })
              .groupBy('product_id'),
          'sku_counts',
          'p.id = sku_counts.product_id',
        )
        .leftJoin(
          (subQueryStockQuantities) =>
            subQueryStockQuantities
              .select(['product_id', 'SUM(stock_quantity) AS total_quantity'])
              .from(Sku, 'sku')
              .where('sku.status = :status AND sku.deleted_at IS NULL', {
                status: 'active',
              })
              .groupBy('product_id'),
          'stock_quantities',
          'p.id = stock_quantities.product_id',
        )
        .leftJoin('p.specifications', 'sp')
        .leftJoin('s.attributes', 'sa')
        .andWhere(
          'p.status = :status AND s.status = :status AND s.deleted_at IS NULL',
          {
            status: 'active',
          },
        )
        .groupBy('p.id');

      // if (search) {
      //

      //   query.andWhere(
      //     new Brackets((qb) => {
      //       qb.where('p.name LIKE :search', { search: `%${search}%` });
      //       // qb.orWhere('p.sku LIKE :search', { search: `%${search}%` });
      //       // qb.orWhere('c.name LIKE :search', { search: `%${search}%` });
      //       qb.orWhere('s.sku LIKE :search', { search: `%${search}%` });
      //       // qb.orWhere('s.customSku LIKE :search', { search: `%${search}%` });
      //       qb.orWhere('s.modelNo LIKE :search', { search: `%${search}%` });
      //     }),
      //   );
      // }

      if (leafCategory && leafCategory.length > 0) {
        query.andWhere('p.categoryId IN (:...leafCategory)', {
          leafCategory,
        });
      }

      if (brands && brands.length > 0) {
        brands = brands.split(',');
        // get all the brands id
        const brandIds = [];
        for (const brand of brands) {
          const brandItem = await this.brandRepository.findOne({
            where: { slug: brand },
          });

          if (!brandItem) continue;

          brandIds.push(brandItem.id);
        }

        if (brandIds.length > 0) {
          query.andWhere('p.brandId IN (:...brandIds)', { brandIds });
        }
      }

      if (price) {
        const minPrice = price.split(',')[0];
        const maxPrice = price.split(',')[1];

        if (minPrice && maxPrice) {
          query.andHaving('discounted_price BETWEEN :minPrice AND :maxPrice', {
            minPrice,
            maxPrice,
          });
        } else if (minPrice) {
          query.andHaving('discounted_price >= :minPrice', {
            minPrice,
          });
        } else if (maxPrice) {
          query.andHaving('discounted_price <= :maxPrice', {
            maxPrice,
          });
        }
      }

      // delete user_id form dynamicQuery
      if (dynamicQuery && dynamicQuery.user_id) {
        delete dynamicQuery.user_id;
      }

      if (dynamicQuery) {
        query.andWhere(
          new Brackets((qb) => {
            for (const [key, value] of Object.entries(dynamicQuery)) {
              const filterValues = String(value)
                .split(',')
                .map((item) => item.trim());

              if (filterValues.length === 0) continue;
              const parameterName = `${key}`;
              console.log(parameterName);
              console.log(filterValues);
              // for (const filterValue of filterValues) {
              //   console.log(parameterName);
              //   console.log(filterValue);
              //   qb.orWhere(
              //     'sp.key = :parameterName AND sp.value LIKE :filterValue',
              //     { parameterName, filterValue: `%${filterValue}%` },
              //   );
              // }

              qb.orWhere(
                'sa.key = :parameterName AND sa.value IN (:...filterValues)',
                { parameterName, filterValues },
              );
              qb.orWhere(
                `sp.key = :parameterName AND sp.value IN (:...filterValues)`,
                { parameterName, filterValues },
              );
            }
          }),
        );
      }

      if (discount) {
        if (discount === 'only') {
          query.having('discounted_price < price');
        } else if (discount === 'no') {
          query.having('discounted_price = price');
          query.orHaving('discounted_price <= 0');
        }
      }

      // Add sorting
      if (sortBy && sort) {
        if ((discount && discount === 'only') || discount === 'no') {
          query.andHaving('stockQuantity > 0');
        } else {
          query.having('stockQuantity > 0');
        }
        if (sortBy === 'price') {
          query.orderBy(`discounted_price`, sort);
          // query.addOrderBy(`stockQuantity`, 'DESC');
        } else {
          query.orderBy(`p.${sortBy}`, sort);
        }
      } else {
        query.orderBy('stockQuantity', 'DESC');
      }

      query.addOrderBy('p.isFeatured', 'DESC');
      query.addOrderBy('p.featuredOrder', 'DESC');

      const getCount = await query.getRawMany();
      // .offset(currentPage * perPage)
      // .limit(perPage)
      // .getCount();
      const total = getCount.length;

      let products = [];
      if (total > 0) {
        products = await query
          .offset(currentPage * perPage)
          .limit(perPage)
          .getRawMany();
      }

      // await queryRunner.release();

      const response = {
        data: products,
        perPage: perPage,
        currentPage: currentPage + 1,
        totalPage: Math.ceil(total / perPage),
        totalResult: total,
      };

      // set cache
      await this.cacheManager.set(cacheKey, response, this.PRODUCT_CACHE_TTL);

      return response;
    } catch (error) {
      // await queryRunner.release();
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }


  // get product seo info
  async getProductSEOInfo() {
    const productsPromise = this.productRepository.find({
      where: { status: ProductStatus.ACTIVE },
      select: { slug: true },
    });

    const brandsPromise = this.brandRepository.find({
      where: { status: BrandStatus.ACTIVE },
      select: { slug: true },
    });

    const categoriesPromise = this.categoryRepository.find({
      where: { status: CategoryStatus.ACTIVE },
      select: { slug: true },
    });

    // resolve all
    const [products, brands, categories] = await Promise.all([productsPromise, brandsPromise, categoriesPromise]);

    // get slug from all
    const productSlugs = products?.map(product => product.slug);
    const brandSlugs = brands?.map(brand => brand.slug);
    const categorySlugs = categories?.map(category => category.slug);

    return {
      productSlugs,
      brandSlugs,
      categorySlugs
    }
  }

  async findAllWithSearch(
    perPage = 10,
    currentPage = 0,
    search = null,
    price = null,
    sortBy = null,
    sort = null,
    reqQuery: object,
  ) {
    // const queryRunner = this.dataSource.createQueryRunner();
    // await queryRunner.connect();
    // await queryRunner.startTransaction();

    try {
      // if find on cache, then response send
      const sortedProps = Object.keys(reqQuery).sort();
      const cacheKey = sortedProps
        ?.map((prop) => prop + '_' + reqQuery[prop])
        .join('_');

      const responseFromCache = await this.cacheManager.get(cacheKey);
      if (responseFromCache) {
        return responseFromCache;
      }

      const query = await this.productRepository
        .createQueryBuilder('p')
        .select([
          'p.name AS name',
          'p.slug AS slug',
          'p.thumbnail AS thumbnail',
          'p.id AS p_id',
          'b.name AS brand_name',
          'b.logo AS brand_logo',
          'b.id AS brand_id',
          'c.name AS category_name',
          'c.id AS category_id',
          'MIN(s.price) AS price',
          `
          MIN(
              CASE 
                  WHEN ((s.discountedPrice <> 0 AND CURRENT_TIMESTAMP() BETWEEN s.discountedPriceStart AND s.discountedPriceEnd) 
                      OR (s.discountedPrice <> 0 AND s.discountedPriceStart IS NULL AND s.discountedPriceEnd IS NULL))
                  THEN s.discountedPrice 
                  ELSE s.price  
              END
          ) AS discounted_price`,
          'COALESCE(sku_counts.sku_count, 0) AS sku_count',
          'COALESCE(stock_quantities.total_quantity, 0) AS stockQuantity',
        ])
        .leftJoin('p.skus', 's')
        .leftJoin('p.brand', 'b')
        .leftJoin('p.category', 'c')
        .leftJoin(
          (subQuerySkuCounts) =>
            subQuerySkuCounts
              .select(['product_id', 'COUNT(id) AS sku_count'])
              .from(Sku, 'sku')
              .where('sku.status = :status AND sku.deleted_at IS NULL', {
                status: 'active',
              })
              .groupBy('product_id'),
          'sku_counts',
          'p.id = sku_counts.product_id',
        )
        .leftJoin(
          (subQueryStockQuantities) =>
            subQueryStockQuantities
              .select(['product_id', 'SUM(stock_quantity) AS total_quantity'])
              .from(Sku, 'sku')
              .where('sku.status = :status AND sku.deleted_at IS NULL', {
                status: 'active',
              })
              .groupBy('product_id'),
          'stock_quantities',
          'p.id = stock_quantities.product_id',
        )
        .andWhere(
          'p.status = :status AND s.status = :status AND s.deleted_at IS NULL',
          {
            status: 'active',
          },
        )
        .groupBy('p.id');

      if (search) {
        query.andWhere(
          `(
            p.name LIKE :search
            OR p.sku LIKE :search
            OR c.name LIKE :search
            OR (
              p.id IN (
                SELECT product_id
                FROM sku
                WHERE sku.sku LIKE :search
                OR sku.custom_sku LIKE :search
                OR sku.model_no LIKE :search
              )
            )
          )`,
          { search: `%${search}%` },
        );
        // query.andWhere(
        //   new Brackets((qb) => {
        //     qb.where('p.name LIKE :search', { search: `%${search}%` });
        //     qb.orWhere('p.sku LIKE :search', { search: `%${search}%` });
        //     qb.orWhere('c.name LIKE :search', { search: `%${search}%` });
        //     qb.orWhere('s.sku LIKE :search', { search: `%${search}%` });
        //     qb.orWhere('s.customSku LIKE :search', { search: `%${search}%` });
        //     qb.orWhere('s.modelNo LIKE :search', { search: `%${search}%` });
        //   }),
        // );
      }

      if (price) {
        const minPrice = price.split(',')[0];
        const maxPrice = price.split(',')[1];

        if (minPrice && maxPrice) {
          query.andHaving('discounted_price BETWEEN :minPrice AND :maxPrice', {
            minPrice,
            maxPrice,
          });
        } else if (minPrice) {
          query.andHaving('discounted_price >= :minPrice', {
            minPrice,
          });
        } else if (maxPrice) {
          query.andHaving('discounted_price <= :maxPrice', {
            maxPrice,
          });
        }
      }

      // Add sorting
      if (sortBy && sort) {
        if (sortBy === 'price') {
          query.orderBy(`discounted_price`, sort);
          // query.addOrderBy(`stockQuantity`, 'DESC');
        } else {
          query.orderBy(`p.${sortBy}`, sort);
        }
      } else {
        query.orderBy('stockQuantity', 'DESC');
      }

      query.addOrderBy('p.isFeatured', 'DESC');
      query.addOrderBy('p.featuredOrder', 'DESC');

      const getCount = await query.getRawMany();
      const total = getCount.length;

      let products = [];
      if (total > 0) {
        products = await query
          .offset(currentPage * perPage)
          .limit(perPage)
          .getRawMany();
      }

      const response = {
        data: products,
        perPage: perPage,
        currentPage: currentPage + 1,
        totalPage: Math.ceil(total / perPage),
        totalResult: total,
      };

      // set cache
      await this.cacheManager.set(cacheKey, response, this.PRODUCT_CACHE_TTL);

      // await queryRunner.commitTransaction();
      // await queryRunner.release();

      return response;
    } catch (error) {
      // await queryRunner.rollbackTransaction();
      // await queryRunner.release();
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    } finally {
      // await queryRunner.release();
    }
  }

  async findAllWithElasticSearch(
    perPage = 10,
    currentPage = 0,
    search = null,
    category = null,
    price = null,
    brand = null,
  ) {
    try {
      const filters = {
        query: search,

        result_fields: {
          product_id: { raw: {} },
          product_name: { raw: {} },
          seo_tag: { raw: {} },
          category_ids: { raw: {} },
          brand_id: { raw: {} },
        },
        filters: {
          all: []
        },
        page: {
          size: 2000,
          current: 1,
        }
      };

      if (category) {
        filters.filters.all = [
          { category_names: category },
        ];

        console.log("categories filter", filters.filters.all)
      }

      if (brand) {
        filters.filters.all = [
          ...filters['filters'].all,
          { brand_name: brand }
        ];
      }

      if (price) {
        const min_price = price.split(',')[0];
        const max_price = price.split(',')[1];
        filters.filters.all = [
          ...filters['filters'].all,
          { 'discounted_price': { from: min_price ? +min_price : 0, to: max_price ? +max_price : 100000 } }
        ];
      }

      // console.log(filters);

      try {
        const ENTERPRISE_SEARCH_BASE_URL = process.env.ENTERPRISE_SEARCH_BASE_URL;
        const ENTERPRISE_SEARCH_PRIVATE_KEY = process.env.ENTERPRISE_SEARCH_PRIVATE_KEY;
        const ENTERPRISE_SEARCH_ENGINE = process.env.ENTERPRISE_SEARCH_ENGINE;

        const result = await axios.post(
          `${ENTERPRISE_SEARCH_BASE_URL}/api/as/v1/engines/${ENTERPRISE_SEARCH_ENGINE}/search`,
          filters,
          {
            headers: {
              Authorization: `Bearer ${ENTERPRISE_SEARCH_PRIVATE_KEY}`,
              'Content-Type': 'application/json',
            },
          },
        );

        const elasticResponse = result.data;

        let products = [];
        let total = 0;
        let response;

        if (elasticResponse && elasticResponse?.results.length > 0) {
          let resultIds = [];
          let resultIdsSet = new Set(elasticResponse?.results?.map(item => item?.product_id?.raw));
          resultIds = Array.from(resultIdsSet);
          console.log(resultIds);

          if (resultIds && resultIds.length > 0) {
            const query = await this.productRepository
              .createQueryBuilder('p')
              .where('p.id IN (:...resultIds)', { resultIds })
              .select([
                'p.name AS name',
                'p.slug AS slug',
                'p.thumbnail AS thumbnail',
                'p.id AS p_id',
                'b.name AS brand_name',
                'b.logo AS brand_logo',
                'b.id AS brand_id',
                'c.name AS category_name',
                'c.id AS category_id',
                'MIN(s.price) AS price',
                `
            MIN(
                CASE 
                    WHEN ((s.discountedPrice <> 0 AND CURRENT_TIMESTAMP() BETWEEN s.discountedPriceStart AND s.discountedPriceEnd) 
                        OR (s.discountedPrice <> 0 AND s.discountedPriceStart IS NULL AND s.discountedPriceEnd IS NULL))
                    THEN s.discountedPrice 
                    ELSE s.price  
                END
            ) AS discounted_price`,
                'COALESCE(sku_counts.sku_count, 0) AS sku_count',
                'COALESCE(stock_quantities.total_quantity, 0) AS stockQuantity',
              ])
              .leftJoin('p.skus', 's')
              .leftJoin('p.brand', 'b')
              .leftJoin('p.category', 'c')
              .leftJoin(
                (subQuerySkuCounts) =>
                  subQuerySkuCounts
                    .select(['product_id', 'COUNT(id) AS sku_count'])
                    .from(Sku, 'sku')
                    .where('sku.status = :status AND sku.deleted_at IS NULL', {
                      status: 'active',
                    })
                    .groupBy('product_id'),
                'sku_counts',
                'p.id = sku_counts.product_id',
              )
              .leftJoin(
                (subQueryStockQuantities) =>
                  subQueryStockQuantities
                    .select(['product_id', 'SUM(stock_quantity) AS total_quantity'])
                    .from(Sku, 'sku')
                    .where('sku.status = :status AND sku.deleted_at IS NULL', {
                      status: 'active',
                    })
                    .groupBy('product_id'),
                'stock_quantities',
                'p.id = stock_quantities.product_id',
              )
              .andWhere(
                'p.status = :status AND s.status = :status AND s.deleted_at IS NULL',
                {
                  status: 'active',
                },
              )
              .groupBy('p.id');

            const getCount = await query.getRawMany();
            total = getCount.length;

            if (total > 0) {
              products = await query
                .offset(currentPage * perPage)
                .limit(perPage)
                .getRawMany();

              products.sort((a, b) => {
                const aIndex = resultIds.indexOf(String(a.p_id));
                const bIndex = resultIds.indexOf(String(b.p_id));

                return aIndex - bIndex;
              });
            }
          }
          response = {
            data: products,
            perPage: perPage,
            currentPage: currentPage + 1,
            totalPage: Math.ceil(total / perPage),
            totalResult: total,
          };
        } else {
          response = {
            data: products,
            perPage: perPage,
            currentPage: currentPage + 1,
            totalPage: Math.ceil(total / perPage),
            totalResult: total,
          };
        }

        return response
      } catch (e) {
        console.log("error ", e.response.data);
        return e;
      }
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  // async findAllView(
  //   perPage = 10,
  //   currentPage = 0,
  //   search = null,
  //   category = null,
  //   sortBy = null,
  //   sort = null,
  //   price = null,
  //   brands = null,
  //   dynamicQuery = null,
  // ) {
  //   const queryRunner = this.dataSource.createQueryRunner();
  //   await queryRunner.connect();

  //   await queryRunner.startTransaction();

  //   try {
  //     let filter;
  //     let andFilter = {};
  //     const sortLogic = {};
  //     andFilter = {
  //       status: ProductStatus.ACTIVE,
  //       skus: { status: VariationStatus.ACTIVE },
  //     };

  //     const query = queryRunner.manager
  //       .getRepository(ProductView)
  //       .createQueryBuilder('product_view');

  //     // query.leftJoinAndSelect('product.category', 'category');
  //     // query.leftJoinAndSelect('product.brand', 'brand');
  //     // query.leftJoinAndSelect('product.specifications', 'specifications');
  //     // query.innerJoinAndSelect('product.skus', 'skus');
  //     // query.leftJoinAndSelect('skus.attributes', 'attributes');
  //     // query.leftJoinAndSelect('skus.stocks', 'stocks');
  //     // query.leftJoinAndSelect('product.seo', 'seo', 'seo.type = :type', {
  //     //   type: SeoType.PRODUCT,
  //     // });

  //     // query.select(this.listSelect);

  //     // let leafCategory = [];

  //     // if (category) {
  //     //   let categoryitem;
  //     //   try {
  //     //     categoryitem = await this.categoryRepository.findOne({
  //     //       where: { slug: category },
  //     //     });

  //     //     if (!categoryitem) throwError(400, [], 'Invalid category');

  //     //     const allCategories = await this.categoryRepository.find({
  //     //       where: { deletedAt: IsNull() },
  //     //     });
  //     //     const leafCategoryIds = await this.findNestedCategory(
  //     //       allCategories,
  //     //       categoryitem.id,
  //     //     );
  //     //     leafCategory = [...leafCategoryIds, categoryitem.id];

  //     //     // if (!categoryitem.leaf) {
  //     //     //   this.categoryService.leafCategoryIds = [];
  //     //     //   await this.categoryService.findLeafCategories(categoryitem.id);
  //     //     //   leafCategory = this.categoryService.leafCategoryIds;
  //     //     // } else {
  //     //     //   leafCategory = [categoryitem.id];
  //     //     // }

  //     //     andFilter = { ...andFilter, categoryId: In(leafCategory) };
  //     //   } catch (e) {
  //     //     if (e instanceof HttpException) {
  //     //       throw e;
  //     //     }
  //     //     console.log(e);
  //     //     throwError(400, [], 'Invalid category');
  //     //   }
  //     // }

  //     // const query = queryRunner.manager
  //     //   .getRepository(Product)
  //     //   .createQueryBuilder('product');

  //     // query.leftJoinAndSelect('product.category', 'category');
  //     // query.leftJoinAndSelect('product.brand', 'brand');
  //     // // query.leftJoinAndSelect('product.specifications', 'specifications');
  //     // query.innerJoinAndSelect('product.skus', 'skus');
  //     // query.leftJoinAndSelect('skus.attributes', 'attributes');
  //     // // query.leftJoinAndSelect('skus.stocks', 'stocks');
  //     // query.leftJoinAndSelect('product.seo', 'seo', 'seo.type = :type', {
  //     //   type: SeoType.PRODUCT,
  //     // });

  //     // query.select(this.listSelect);
  //     // // also select total sku price
  //     // query.addSelect((qb) => {
  //     //   return qb
  //     //     .select(
  //     //       'COALESCE(SUM(skus.price + skus.discountedPrice), 0)',
  //     //       'totalSkuPrice',
  //     //     )
  //     //     .from(Sku, 'skus')
  //     //     .where('skus.productId = product.id');
  //     // });

  //     // // query.select(
  //     // //   `product.*`,
  //     // //   `COALESCE(SUM(skus.price + skus.discount), 0) AS totalSkuPrice`,
  //     // // );

  //     // //
  //     // if (leafCategory && leafCategory.length > 0) {
  //     //   query.where('product.categoryId IN (:...leafCategory)', {
  //     //     leafCategory,
  //     //   });
  //     // }

  //     // if (brands && brands.length > 0) {
  //     //   brands = brands.split(',');
  //     //   // get all the brands id
  //     //   const brandIds = [];
  //     //   for (const brand of brands) {
  //     //     const brandItem = await this.brandRepository.findOne({
  //     //       where: { slug: brand },
  //     //     });

  //     //     if (!brandItem) continue;

  //     //     brandIds.push(brandItem.id);
  //     //   }
  //     //

  //     //   if (brandIds.length > 0) {
  //     //     query.andWhere('product.brandId IN (:...brandIds)', { brandIds });
  //     //   }
  //     // }

  //     // if (price) {
  //     //   const minPrice = price.split(',')[0];
  //     //   const maxPrice = price.split(',')[1];

  //     //   if (minPrice && maxPrice) {
  //     //     query.andWhere(
  //     //       'skus.discountedPrice BETWEEN :minPrice AND :maxPrice',
  //     //       {
  //     //         minPrice,
  //     //         maxPrice,
  //     //       },
  //     //     );
  //     //   } else if (minPrice) {
  //     //     query.andWhere('skus.discountedPrice >= :minPrice', {
  //     //       minPrice,
  //     //     });
  //     //   } else if (maxPrice) {
  //     //     query.andWhere('skus.discountedPrice <= :maxPrice', {
  //     //       maxPrice,
  //     //     });
  //     //   }
  //     // }

  //     // if (search) {
  //     //   query.orWhere(
  //     //     '(product.name LIKE :search OR product.sku LIKE :search OR category.name LIKE :search OR skus.sku LIKE :search OR skus.customSku LIKE :search )',
  //     //     { search: `%${search}%` },
  //     //   );
  //     // }

  //     // // delete user_id form dynamicQuery
  //     // if (dynamicQuery && dynamicQuery.user_id) {
  //     //   delete dynamicQuery.user_id;
  //     // }
  //     // // Process dynamic filters on skus.attributes
  //     // // Process dynamic filters on skus.attributes
  //     // if (dynamicQuery) {
  //     //   query.andWhere(
  //     //     new Brackets((qb) => {
  //     //       for (const [key, value] of Object.entries(dynamicQuery)) {
  //     //         const filterValues = String(value)
  //     //           .split(',')
  //     //           .map((item) => item.trim());

  //     //         if (filterValues.length === 0) continue;
  //     //         const parameterName = `${key}`;
  //     //         console.log(parameterName);
  //     //         const attributeKey = `attributes.key`;
  //     //         const attributeValue = `attributes.value`;

  //     //         qb.orWhere(
  //     //           'attributes.key = :parameterName AND attributes.value IN (:...filterValues)',
  //     //           { parameterName, filterValues },
  //     //         );

  //     //         for (const filterValue of filterValues) {
  //     //           qb.orWhere(
  //     //             'specifications.key = :parameterName AND specifications.value LIKE :filterValue',
  //     //             { parameterName, filterValue: `%${filterValue}%` },
  //     //           );
  //     //         }
  //     //       }
  //     //     }),
  //     //   );
  //     // }

  //     // // send all active product
  //     // query.andWhere('product.status = :status', {
  //     //   status: ProductStatus.ACTIVE,
  //     // });

  //     // Add sorting
  //     // query.orderBy('product.isFeatured', 'DESC');
  //     // query.addOrderBy('product.featuredOrder', 'DESC');
  //     // if (sortBy && sort) {
  //     //   if (sortBy === 'price') {
  //     //     query.addOrderBy(`skus.discountedPrice`, sort);
  //     //   } else {
  //     //     query.addOrderBy(`product.${sortBy}`, sort);
  //     //   }
  //     // } else {
  //     //   query.addOrderBy('product.createdAt', 'ASC');
  //     // }

  //     // take: perPage,
  //     //   skip: currentPage * perPage,

  //     query.take(perPage);
  //     query.skip(currentPage * perPage);
  //     // return query.getSql();

  //
  //     let [products, total] = await query.getManyAndCount();
  //
  //

  //     // return sql;

  //     await queryRunner.commitTransaction();

  //     // get today date
  //     const today = new Date();
  //     // today.setHours(0, 0, 0, 0);

  //     // change sku discount price of products array
  //     // products = products.map((product) => {
  //     //   product.skus = product.skus.map((sku) => {
  //     //     sku.discountedPrice =
  //     //       sku.discountedPrice !== 0 &&
  //     //       today >= new Date(sku.discountedPriceStart) &&
  //     //       today <= new Date(sku.discountedPriceEnd)
  //     //         ? sku.discountedPrice
  //     //         : sku.price;
  //     //     return sku;
  //     //   });
  //     //   return product;
  //     // });

  //     return {
  //       data: products,
  //       perPage: perPage,
  //       currentPage: currentPage + 1,
  //       totalPage: Math.ceil(total / perPage),
  //       totalResult: total,
  //     };
  //   } catch (error) {
  //     await queryRunner.rollbackTransaction();
  //     throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
  //   } finally {
  //     await queryRunner.release();
  //   }
  // }

  async findOne(slug: string) {
    // const queryRunner = this.dataSource.createQueryRunner();
    // await queryRunner.connect();
    // let product;
    try {
      // check product exits or not
      const isExistProduct = await this.productRepository.findOne({
        where: {
          slug: slug,
          status: ProductStatus.ACTIVE,
        },
      });
      // if product is not exits then throw error
      if (!isExistProduct) {
        throwError(HttpStatus.NOT_FOUND, [], 'Product not found');
      }
      let product = await this.productRepository
        .createQueryBuilder('product')
        .leftJoin('product.category', 'category')
        .leftJoin('product.brand', 'brand')
        .leftJoin('product.specifications', 'specifications')
        // .innerJoinAndSelect('product.skus', 'skus')
        .leftJoin('product.skus', 'skus', 'skus.status = :status', {
          status: 'active',
        })
        .leftJoin('skus.attributes', 'attributes')
        .leftJoin(
          'product.seo',
          'seo',
          'seo.refId = :refId AND seo.type = :type',
          {
            refId: isExistProduct.id,
            type: SeoType.PRODUCT,
          },
        )
        .where('product.slug = :slug', { slug })
        .andWhere('product.status = :status', {
          status: ProductStatus.ACTIVE,
        })
        .andWhere('skus.status = :status', {
          status: VariationStatus.ACTIVE,
        })
        .select([
          ...this.listSelect,
          'attributes.id',
          'attributes.key',
          'attributes.value',
          'attributes.code',
          'attributes.image',
          'specifications.id',
          'specifications.key',
          'specifications.value',
        ])
        .getOne();
      // let product = await this.productRepository.findOne({
      //   where: {
      //     slug: slug,
      //     status: ProductStatus.ACTIVE,
      //     skus: { status: VariationStatus.ACTIVE },
      //   },
      //   relations: [
      //     'category',
      //     'brand',
      //     'specifications',
      //     'skus',
      //     'skus.attributes',
      //     'skus.stocks',
      //     'seo',
      //   ],
      //   select: { ...this.select },
      // });

      const categories = await this.categoryService.generateBreadcrumb(
        product.categoryId,
      );

      product['categories'] = categories;

      if (!product) throwError(HttpStatus.NOT_FOUND, [], 'Product not found');

      // get today date
      const today = new Date();
      today.setHours(today.getHours() + 6);
      // today.setHours(0, 0, 0, 0);

      // (matchProduct?.discount === true &&
      //   sku.discountedPrice !== 0 &&
      //   today >= new Date(sku.discountedPriceStart) &&
      //   today <= new Date(sku.discountedPriceEnd)) ||
      // (matchProduct?.discount === true &&
      //   sku.discountedPrice !== 0 &&
      //   sku.discountedPriceStart === null &&
      //   sku.discountedPriceEnd === null)

      // change sku discount price
      product.skus = product.skus.map((sku) => {
        sku.discountedPrice =
          (sku.discountedPrice !== 0 &&
            today >= new Date(sku.discountedPriceStart) &&
            today <= new Date(sku.discountedPriceEnd)) ||
            (sku.discountedPrice !== 0 &&
              sku.discountedPriceStart === null &&
              sku.discountedPriceEnd === null)
            ? sku.discountedPrice
            : sku.price;
        return sku;
      });

      // await queryRunner.release();

      return product;
    } catch (e) {
      // await queryRunner.release();
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  async findRelatedProducts(slug: string, limit = 5) {
    // const queryRunner = this.dataSource.createQueryRunner();
    // await queryRunner.connect();
    // let product;
    try {
      // check product exits or not
      const isExistProduct = await this.productRepository.findOne({
        where: {
          slug: slug,
          status: ProductStatus.ACTIVE,
        },
      });
      // if product is not exits then throw error
      if (!isExistProduct) {
        throwError(HttpStatus.NOT_FOUND, [], 'Product not found');
      }

      let whereRawCondition = `(SELECT SUM(stock_quantity) FROM sku WHERE sku.product_id = product.id AND status = 'active') > 0`;

      let products = await this.productRepository
        .createQueryBuilder('product')
        .where(whereRawCondition)
        .leftJoinAndSelect('product.category', 'category')
        .leftJoinAndSelect('product.brand', 'brand')
        // .leftJoinAndSelect('product.specifications', 'specifications')
        // .innerJoinAndSelect('product.skus', 'skus')
        .innerJoinAndSelect('product.skus', 'skus', 'skus.status = :status', {
          status: 'active',
        })
        // .leftJoinAndSelect('skus.attributes', 'attributes')
        // .leftJoinAndSelect('skus.stocks', 'stocks')
        .leftJoinAndSelect('product.seo', 'seo', 'seo.type = :type', {
          type: SeoType.PRODUCT,
        })
        .andWhere('product.categoryId = :categoryId', {
          categoryId: isExistProduct.categoryId,
        })
        .andWhere('product.id != :id', { id: isExistProduct.id })
        .andWhere('product.status = :status', {
          status: ProductStatus.ACTIVE,
        })
        .select(this.listSelect)
        .take(limit)
        .getMany();

      if (!products) throwError(HttpStatus.NOT_FOUND, [], 'Product not found');
      // get today
      const today = new Date();
      today.setHours(today.getHours() + 6);
      // change sku discount price of products array
      products = products.map((product) => {
        // product['totalQuantity'] = 0
        product.skus = product.skus.map((sku) => {
          sku.discountedPrice =
            (sku.discountedPrice !== 0 &&
              today >= new Date(sku.discountedPriceStart) &&
              today <= new Date(sku.discountedPriceEnd)) ||
              (sku.discountedPrice !== 0 &&
                sku.discountedPriceStart === null &&
                sku.discountedPriceEnd === null)
              ? sku.discountedPrice
              : sku.price;
          return sku;
        });
        return product;
      });
      // await queryRunner.release();
      return products;
    } catch (e) {
      // await queryRunner.release();
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  async findCompleteTheLookProducts(id: number, limit = 5) {
    // const queryRunner = this.dataSource.createQueryRunner();
    // await queryRunner.connect();

    // let product;
    try {
      // check product exits or not
      const isExistProduct = await this.productRepository.findOne({
        where: {
          id: id,
          status: ProductStatus.ACTIVE,
        },
      });
      // if product is not exits then throw error
      if (!isExistProduct) {
        throwError(HttpStatus.NOT_FOUND, [], 'Product not found');
      }

      // get category binding ids
      const categoryBinding = await this.categoryBindingRepository
        .createQueryBuilder('categoryBinding')
        .leftJoinAndSelect('categoryBinding.singleCategory', 'singleCategory')
        .where('categoryBinding.categoryId = :categoryId', {
          categoryId: isExistProduct.categoryId,
        })
        .andWhere('singleCategory.status = :status', {
          status: CategoryStatus.ACTIVE,
        })
        .getMany();

      const categoryBindingIds = categoryBinding.map(
        (item) => item.categoryBindingId,
      );

      let whereRawCondition = `(SELECT SUM(stock_quantity) FROM sku WHERE sku.product_id = product.id AND status = 'active') > 0`;

      let products = await this.productRepository
        .createQueryBuilder('product')
        .where(whereRawCondition)
        .leftJoinAndSelect('product.category', 'category')
        .leftJoinAndSelect('product.brand', 'brand')
        // .leftJoinAndSelect('product.specifications', 'specifications')
        // .innerJoinAndSelect('product.skus', 'skus')
        .innerJoinAndSelect('product.skus', 'skus', 'skus.status = :status', {
          status: 'active',
        })
        // .leftJoinAndSelect('skus.attributes', 'attributes')
        // .leftJoinAndSelect('skus.stocks', 'stocks')
        .leftJoinAndSelect('product.seo', 'seo', 'seo.type = :type', {
          type: SeoType.PRODUCT,
        })
        .where('product.categoryId IN (:...categoryBindingIds)', {
          categoryBindingIds,
        })
        // .andWhere('product.categoryId = :categoryId', {
        //   categoryId: In(categoryBindingIds),
        // })
        .andWhere('product.id != :id', { id: isExistProduct.id })
        .andWhere('product.status = :status', {
          status: ProductStatus.ACTIVE,
        })
        .select(this.listSelect)
        .take(limit)
        .getMany();

      if (!products) throwError(HttpStatus.NOT_FOUND, [], 'Product not found');
      // get today
      const today = new Date();
      today.setHours(today.getHours() + 6);
      // change sku discount price of products array
      products = products.map((product) => {
        // product['totalQuantity'] = 0
        product.skus = product.skus.map((sku) => {
          sku.discountedPrice =
            (sku.discountedPrice !== 0 &&
              today >= new Date(sku.discountedPriceStart) &&
              today <= new Date(sku.discountedPriceEnd)) ||
              (sku.discountedPrice !== 0 &&
                sku.discountedPriceStart === null &&
                sku.discountedPriceEnd === null)
              ? sku.discountedPrice
              : sku.price;
          return sku;
        });
        return product;
      });
      // await queryRunner.release();
      return products;
    } catch (e) {
      // await queryRunner.release();
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  async brandsByCategory(slug: string, perPage = 10, currentPage = 0) {
    // const queryRunner = this.dataSource.createQueryRunner();
    // await queryRunner.connect();
    try {
      // check category exits or not

      const category = await this.categoryRepository
        .createQueryBuilder('category')
        .where('category.slug = :slug', { slug: slug })
        .andWhere('category.status = :status', {
          status: ProductStatus.ACTIVE,
        })
        .getOne();

      // if category is not exits then throw error
      if (!category) {
        throwError(HttpStatus.NOT_FOUND, [], 'Category not found');
      }

      let leafCategory = [];

      if (category) {
        try {
          const allCategories = await this.categoryRepository.find({
            where: { deletedAt: IsNull() },
          });
          const leafCategoryIds = await this.findNestedCategory(
            allCategories,
            category.id,
          );
          leafCategory = [...leafCategoryIds, category.id];
        } catch (e) {
          if (e instanceof HttpException) {
            throw e;
          }
          console.log(e);
          throwError(400, [], 'Invalid category');
        }
      }

      // find all products by check category id
      const query = await this.productRepository.createQueryBuilder('product');

      query.leftJoinAndSelect('product.category', 'category');
      query.leftJoinAndSelect('product.brand', 'brand');
      query.where('product.category_id IN (:...leafCategory)', {
        leafCategory,
      });
      query.andWhere('product.status = :status', {
        status: ProductStatus.ACTIVE,
      });
      query.select(this.productBasicSelect);
      query.orderBy('product.createdAt', 'DESC');
      const products = await query.getMany();

      // Extract unique brand ids using a Set
      const uniqueBrandIdsSet = new Set(
        products.map((product) => product.brandId),
      );

      // Convert the Set to an array
      const uniqueBrandIds = Array.from(uniqueBrandIdsSet);

      // find all brands by uniqueBrandIds with pagination
      let andFilter = {};
      andFilter = {
        status: ProductStatus.ACTIVE,
        id: In(uniqueBrandIds),
      };

      const [brands, total] = await this.brandRepository.findAndCount({
        where: andFilter,
        select: [
          'id',
          'name',
          'slug',
          'logo',
          'description',
          'isFeatured',
          'status',
        ],
        take: perPage,
        skip: currentPage * perPage,
      });

      // await queryRunner.release();

      return {
        data: brands,
        perPage: perPage,
        currentPage: currentPage + 1,
        totalPage: Math.ceil(total / perPage),
        totalResult: total,
      };
    } catch (e) {
      // await queryRunner.release();
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  async getProductDetails(slug: string) {
    let product;
    try {
      product = await this.productRepository.findOne({
        where: {
          slug: slug,
          status: ProductStatus.ACTIVE,
        },
        select: {
          longDescription: true,
        },
      });
    } catch (e) { }

    if (!product) throwError(HttpStatus.NOT_FOUND, [], 'Product not found');

    return product;
  }

  async getByIds(ids: number[]) {
    try {
      // sort the query & generate cacheKey
      const sortedProps = ids.sort();
      let cacheKey = sortedProps.join('_');

      // if find on cache, then response send
      const responseFromCache = await this.cacheManager.get(cacheKey);
      if (responseFromCache) {
        return responseFromCache;
      }

      // get products by ids
      const query = await this.productRepository.createQueryBuilder('product');

      // // relations with tables
      query.leftJoin('product.category', 'category');
      query.leftJoin('product.brand', 'brand');
      // query.innerJoinAndSelect('product.skus', 'skus');
      query.innerJoin('product.skus', 'skus', 'skus.status = :status', {
        status: 'active',
      });
      query.leftJoin('skus.attributes', 'attributes');
      query.leftJoin('skus.stocks', 'stocks');

      // add where condition
      query.where('product.status = :status', {
        status: ProductStatus.ACTIVE,
      });
      query.andWhere('skus.status = :status', {
        status: VariationStatus.ACTIVE,
      });
      query.andWhere('product.id IN (:...ids)', { ids });
      query.andWhere(
        `(SELECT SUM(stock_quantity) FROM sku WHERE sku.product_id = product.id AND status = 'active') > 0`,
      );

      // // take and skip
      // query.take(perPage);
      // query.skip(currentPage * perPage);

      // selete fields
      query.select(this.logicSelect);

      // get products
      const [products, total] = await query.getManyAndCount();
      // let andFilter = {};
      // andFilter = {
      //   status: ProductStatus.ACTIVE,
      //   skus: { status: VariationStatus.ACTIVE },
      //   id: In(ids),
      // };

      // const [products, total] = await this.productRepository.findAndCount({
      //   where: andFilter,
      //   relations: [
      //     'category',
      //     'brand',
      //     'skus',
      //     'skus.attributes',
      //     'skus.stocks',
      //   ],
      //   select: { ...this.select },
      //   take: perPage,
      //   skip: currentPage * perPage,
      // });

      // get today date
      const today = new Date();
      today.setHours(today.getHours() + 6);
      // today.setHours(0, 0, 0, 0);
      // change sku discount price of products array
      products.map((product) => {
        product.skus = product.skus.map((sku) => {
          sku.discountedPrice =
            (sku.discountedPrice !== 0 &&
              today >= new Date(sku.discountedPriceStart) &&
              today <= new Date(sku.discountedPriceEnd)) ||
              (sku.discountedPrice !== 0 &&
                sku.discountedPriceStart === null &&
                sku.discountedPriceEnd === null)
              ? sku.discountedPrice
              : sku.price;
          return sku;
        });
        return product;
      });

      const response = {
        data: products,
        // perPage: perPage,
        // currentPage: currentPage + 1,
        // totalPage: Math.ceil(total / perPage),
        totalResult: total,
      };
      // set cache
      await this.cacheManager.set(cacheKey, response, this.DEFAULT_CACHE_TTL);

      return response;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  // generate cache key
  private generateCacheKey(logic: object) {
    let cacheKey = '';
    Object.keys(logic)
      .sort()
      .map((key) => {
        if (Array.isArray(logic[key])) {
          cacheKey += key + '_';
          logic[key]
            .sort((a, b) => a.id - b.id)
            .forEach((item) => {
              if (typeof item == 'object') {
                cacheKey +=
                  Object.keys(item)
                    .sort()
                    ?.map((prop) => prop + '_' + item[prop])
                    .join('_') + '_';
              }
            });
        } else if (typeof logic[key] == 'string') {
          cacheKey += '_' + key + '_' + logic[key];
        }
      });

    return cacheKey;
  }

  // async getByLogic(logic: LogicalProductGetDto) {
  //   // get all the leaf categories of individual category
  //   const categoryItems = [];
  //   if (logic.category && logic.category?.length > 0) {
  //     const allCategories = await this.categoryRepository.find({
  //       where: { deletedAt: null, status: CategoryStatus.ACTIVE },
  //     });
  //     for (let i = 0; i < logic.category.length; i++) {
  //       let leafCategory = [];
  //       const category = logic.category[i];

  //       // find category by id
  //       const categoryitem = await this.categoryRepository.findOne({
  //         where: { id: category.id },
  //       });

  //       if (!categoryitem) throwError(400, [], 'Invalid category');

  //       if (!categoryitem.leaf) {
  //         const nestedCategoryIds = await this.findNestedCategory(
  //           allCategories,
  //           category.id,
  //         );
  //         leafCategory.push(...nestedCategoryIds, category.id);
  //       } else {
  //         leafCategory = [categoryitem.id];
  //       }

  //       if (leafCategory.length) {
  //         categoryItems.push({
  //           leaf: leafCategory,
  //           limit: category.limit ? category.limit : 10,
  //         });
  //       }
  //     }
  //     // for (const category of logic.category) {
  //     //   let leafCategory = [];

  //     //   if (category?.id) {
  //     //     let categoryitem;
  //     //     try {
  //     //       categoryitem = await this.categoryRepository.findOne({
  //     //         where: { id: category.id },
  //     //       });

  //     //       if (!categoryitem) throwError(400, [], 'Invalid category');

  //     //       if (!categoryitem.leaf) {
  //     //         this.categoryService.leafCategoryIds = [];
  //     //         await this.categoryService.findLeafCategories(categoryitem.id);
  //     //         leafCategory = this.categoryService.leafCategoryIds;
  //     //       } else {
  //     //         leafCategory = [categoryitem.id];
  //     //       }
  //     //     } catch (e) {
  //     //       if (e instanceof HttpException) {
  //     //         throw e;
  //     //       }
  //     //       console.log(e);
  //     //       throwError(400, [], 'Invalid category');
  //     //     }
  //     //   }

  //     //   if (leafCategory.length) {
  //     //     categoryItems.push({
  //     //       leaf: leafCategory,
  //     //       limit: category.limit ? category.limit : 10,
  //     //     });
  //     //   }
  //     // }
  //   }

  //   let stockOutWhereQuery = `(SELECT SUM(stock_quantity) FROM sku WHERE sku.product_id = product.id AND status = 'active') > 0`;

  //   // await queryRunner.startTransaction();

  //   const products = [];
  //   try {
  //     for (const category of categoryItems) {
  //       let categoryProducts = [];
  //       if (logic.categoryOrder === 'random') {
  //         const query = this.productRepository.createQueryBuilder('product');

  //         query.leftJoin('product.category', 'category');
  //         query.leftJoin('product.brand', 'brand');
  //         // query.leftJoinAndSelect('product.specifications', 'specifications');
  //         // query.innerJoinAndSelect('product.skus', 'skus');
  //         query.innerJoin('product.skus', 'skus', 'skus.status = :status', {
  //           status: 'active',
  //         });
  //         query.leftJoin('skus.attributes', 'attributes');
  //         query.leftJoin('skus.stocks', 'stocks');

  //         query.where('category.id IN (:...leafCategory)', {
  //           leafCategory: category.leaf,
  //         });

  //         // get active product
  //         query.andWhere('product.status = :status', {
  //           status: ProductStatus.ACTIVE,
  //         });

  //         if (logic.isFeatured && logic.isFeatured) {
  //           query.andWhere('product.isFeatured = :isFeatured', {
  //             isFeatured: logic.isFeatured,
  //           });
  //         }
  //         // is product is stock out then remove it
  //         if (!logic.isShowStockOut) {
  //           query.andWhere(stockOutWhereQuery);
  //         }

  //         query.select(this.logicSelect);

  //         query.take(category.limit);
  //         query.orderBy(`RAND()`);

  //         const product = await query.getMany();
  //         categoryProducts.push(...product);
  //       } else {
  //         const orderBy = logic.brandOrder
  //           ? (logic.brandOrder.toUpperCase() as 'ASC' | 'DESC')
  //           : 'DESC';
  //         const query = this.productRepository
  //           .createQueryBuilder('product')
  //           .leftJoin('product.category', 'category')
  //           .leftJoin('product.brand', 'brand')
  //           // .leftJoinAndSelect('product.skus', 'skus')
  //           .innerJoin('product.skus', 'skus', 'skus.status = :status', {
  //             status: 'active',
  //           })
  //           .leftJoin('skus.attributes', 'attributes')
  //           .leftJoin('skus.stocks', 'stocks')
  //           .where({
  //             categoryId: In(category.leaf),
  //             status: ProductStatus.ACTIVE,
  //           });

  //         if (logic.isFeatured) {
  //           query.andWhere('isFeatured = :isFeatured', {
  //             isFeatured: logic.isFeatured,
  //           });
  //         }

  //         // if isRemoveStockOut is true then remove stock out products
  //         if (!logic.isShowStockOut) {
  //           query.andWhere(stockOutWhereQuery);
  //         }
  //         query.select(this.logicSelect);

  //         query.take(category.limit);

  //         query.orderBy('product.createdAt', orderBy ? orderBy : 'DESC');

  //         // get all category products
  //         const product = await query.getMany();
  //         categoryProducts.push(...product);
  //       }

  //       categoryProducts.length > 0 && products.push(...categoryProducts);
  //     }
  //     // get products

  //     // get products by brand
  //     if (logic.brand && logic.brand?.length > 0) {
  //       let brandProducts = [];
  //       for (const brand of logic.brand) {
  //         if (logic.brandOrder === 'random') {
  //           const query = this.productRepository.createQueryBuilder('product');

  //           query.leftJoin('product.category', 'category');
  //           query.leftJoin('product.brand', 'brand');
  //           // query.leftJoinAndSelect('product.specifications', 'specifications');
  //           // query.innerJoinAndSelect('product.skus', 'skus');
  //           query.innerJoin('product.skus', 'skus', 'skus.status = :status', {
  //             status: 'active',
  //           });
  //           query.leftJoin('skus.attributes', 'attributes');
  //           query.leftJoin('skus.stocks', 'stocks');

  //           query.where('brand.id = :id', {
  //             id: brand.id,
  //           });
  //           // get active product
  //           query.andWhere('product.status = :status', {
  //             status: ProductStatus.ACTIVE,
  //           });

  //           if (logic.isFeatured && logic.isFeatured) {
  //             query.andWhere('product.isFeatured = :isFeatured', {
  //               isFeatured: logic.isFeatured,
  //             });
  //           }

  //           // if isRemoveStockOut is true then remove stock out products
  //           if (!logic.isShowStockOut) {
  //             query.andWhere(stockOutWhereQuery);
  //           }

  //           query.select(this.logicSelect);

  //           query.take(brand.limit ? +brand.limit : 10);
  //           query.orderBy(`RAND()`);

  //           const product = await query.getMany();
  //           brandProducts.push(...product);
  //         } else {
  //           const orderBy = logic.brandOrder
  //             ? (logic.brandOrder.toUpperCase() as 'ASC' | 'DESC')
  //             : 'DESC';
  //           const query = this.productRepository
  //             .createQueryBuilder('product')
  //             .where('brand.id = :brandId', { brandId: brand.id })
  //             .andWhere('product.status = :status', {
  //               status: ProductStatus.ACTIVE,
  //             });

  //           if (logic.isFeatured) {
  //             query.andWhere('isFeatured = :isFeatured', {
  //               isFeatured: logic.isFeatured,
  //             });
  //           }

  //           // if isRemoveStockOut is true then remove stock out products
  //           if (!logic.isShowStockOut) {
  //             query.andWhere(stockOutWhereQuery);
  //           }

  //           const product = await query
  //             .leftJoin('product.category', 'category')
  //             .leftJoin('product.brand', 'brand')
  //             // .leftJoinAndSelect('product.skus', 'skus')
  //             .innerJoin('product.skus', 'skus', 'skus.status = :status', {
  //               status: 'active',
  //             })
  //             .leftJoin('skus.attributes', 'attributes')
  //             .leftJoin('skus.stocks', 'stocks')
  //             .select(this.logicSelect)
  //             .take(brand?.limit ? +brand?.limit : 10)
  //             .orderBy('product.createdAt', orderBy ? orderBy : 'DESC')
  //             .getMany();

  //           brandProducts.push(...product);

  //           // brandProducts = await queryRunner.manager
  //           //   .getRepository('product')
  //           //   .find({
  //           //     where: {
  //           //       brandId: brand.id,
  //           //       status: ProductStatus.ACTIVE,
  //           //       ...(logic.isFeatured ? { isFeatured: logic.isFeatured } : {}), // Conditionally add isFeatured filter
  //           //     },
  //           //     relations: [
  //           //       'category',
  //           //       'brand',
  //           //       'skus',
  //           //       'skus.attributes',
  //           //       'skus.stocks',
  //           //     ],
  //           //     select: { ...this.select },
  //           //     take: brand?.limit ? +brand?.limit : 10,
  //           //     order: {
  //           //       createdAt: 'RANDOM()',
  //           //     },
  //           //   });
  //         }
  //       }

  //       brandProducts.length > 0 && products.push(...brandProducts);
  //     }

  //     // get today date
  //     const today = new Date();
  //     // today.setHours(0, 0, 0, 0);
  //     // change sku discount price of products array
  //     products.map((product) => {
  //       product.skus = product.skus.map((sku) => {
  //         sku.discountedPrice =
  //           (sku.discountedPrice !== 0 &&
  //             today >= new Date(sku.discountedPriceStart) &&
  //             today <= new Date(sku.discountedPriceEnd)) ||
  //           (sku.discountedPrice !== 0 &&
  //             sku.discountedPriceStart === null &&
  //             sku.discountedPriceEnd === null)
  //             ? sku.discountedPrice
  //             : sku.price;
  //         return sku;
  //       });
  //       return product;
  //     });

  //     // get unique products only
  //     const uniqueItems = [...new Set(products.map((obj) => obj.id))].map(
  //       (id) => products.find((obj) => obj.id === id),
  //     );

  //     return uniqueItems;
  //   } catch (e) {
  //     console.log(e);
  //     throwError(500, [], 'Unable to get products');
  //   }

  //   return 'logical product get';
  // }

  hasCircularReference(
    categories: { name: string; id: number; parentId: number | null }[],
    categoryId: number,
    visitedCategories = new Set(),
  ) {
    const category = categories.find((cat) => cat.id === categoryId);

    if (categoryId && visitedCategories.has(categoryId)) {
      return true;
    }

    visitedCategories.add(categoryId);

    // Recursive call for the parent category
    if (category && (category.parentId !== null || category.parentId != 0)) {
      return this.hasCircularReference(
        categories,
        category.parentId,
        visitedCategories,
      );
    }

    // If no circular reference found
    return false;
  }

  async getByLogic(logic: LogicalProductGetDto) {
    // const categories = await this.categoryRepository.find({ select: { id: true, parentId: true, name: true } });
    // // console.log(this.hasCircularReference(categories, 10));
    // const circular = [];
    // categories?.forEach(category => {
    //   if (this.hasCircularReference(categories, category.id)) {
    //     circular.push(category);
    //   }
    // })
    // return circular;
    // return categories;

    // sort the query & generate cacheKey
    const cacheKey = this.generateCacheKey(logic);

    // if find on cache, then response send
    const responseFromCache = await this.cacheManager.get(cacheKey);
    if (responseFromCache) {
      return responseFromCache;
    }

    // get all the leaf categories of individual category
    const categoryItems = [];
    if (logic.category && logic.category?.length > 0) {
      for (const category of logic.category) {
        let leafCategory = [];

        if (category?.id) {
          let categoryitem;
          try {
            categoryitem = await this.categoryRepository.findOne({
              where: { id: category.id },
            });

            if (!categoryitem) throwError(400, [], 'Invalid category');

            if (!categoryitem.leaf) {
              this.categoryService.leafCategoryIds = [];
              await this.categoryService.findLeafCategories(categoryitem.id);
              leafCategory = this.categoryService.leafCategoryIds;
            } else {
              leafCategory = [categoryitem.id];
            }
          } catch (e) {
            if (e instanceof HttpException) {
              throw e;
            }
            console.log(e);
            throwError(400, [], 'Invalid category');
          }
        }

        if (leafCategory.length) {
          categoryItems.push({
            leaf: leafCategory,
            limit: category.limit ? category.limit : 10,
          });
        }
      }
    }

    // return categoryItems;
    // const categoryItems = [];
    // if (logic.category && logic.category?.length > 0) {
    //   const allCategories = await this.categoryRepository.find({
    //     where: { deletedAt: null, status: CategoryStatus.ACTIVE },
    //   });
    //   for (let i = 0; i < logic.category.length; i++) {
    //     let leafCategory = [];
    //     const category = logic.category[i];

    //     // find category by id
    //     const categoryitem = await this.categoryRepository.findOne({
    //       where: { id: category.id },
    //     });

    //     if (!categoryitem) throwError(400, [], 'Invalid category');

    //     if (!categoryitem.leaf) {
    //       const nestedCategoryIds = await this.findNestedCategory(
    //         allCategories,
    //         category.id,
    //       );
    //       leafCategory.push(...nestedCategoryIds, category.id);
    //     } else {
    //       leafCategory = [categoryitem.id];
    //     }

    //     if (leafCategory.length) {
    //       categoryItems.push({
    //         leaf: leafCategory,
    //         limit: category.limit ? category.limit : 10,
    //       });
    //     }
    //   }
    //   // for (const category of logic.category) {
    //   //   let leafCategory = [];

    //   //   if (category?.id) {
    //   //     let categoryitem;
    //   //     try {
    //   //       categoryitem = await this.categoryRepository.findOne({
    //   //         where: { id: category.id },
    //   //       });

    //   //       if (!categoryitem) throwError(400, [], 'Invalid category');

    //   //       if (!categoryitem.leaf) {
    //   //         this.categoryService.leafCategoryIds = [];
    //   //         await this.categoryService.findLeafCategories(categoryitem.id);
    //   //         leafCategory = this.categoryService.leafCategoryIds;
    //   //       } else {
    //   //         leafCategory = [categoryitem.id];
    //   //       }
    //   //     } catch (e) {
    //   //       if (e instanceof HttpException) {
    //   //         throw e;
    //   //       }
    //   //       console.log(e);
    //   //       throwError(400, [], 'Invalid category');
    //   //     }
    //   //   }

    //   //   if (leafCategory.length) {
    //   //     categoryItems.push({
    //   //       leaf: leafCategory,
    //   //       limit: category.limit ? category.limit : 10,
    //   //     });
    //   //   }
    //   // }
    // }
    // return categoryItems;

    let stockOutWhereQuery = `(SELECT SUM(stock_quantity) FROM sku WHERE sku.product_id = product.id AND status = 'active') > 0`;

    // const queryRunner = this.dataSource.createQueryRunner();
    // await queryRunner.connect();
    // await queryRunner.startTransaction();

    const products = [];
    try {
      for (const category of categoryItems) {
        let categoryProducts = [];
        if (logic.categoryOrder === 'random') {
          const query = await this.productRepository.createQueryBuilder(
            'product',
          );

          query.leftJoin('product.category', 'category');
          query.leftJoin('product.brand', 'brand');
          // query.leftJoinAndSelect('product.specifications', 'specifications');
          // query.innerJoinAndSelect('product.skus', 'skus');
          query.innerJoin('product.skus', 'skus', 'skus.status = :status', {
            status: 'active',
          });
          query.leftJoin('skus.attributes', 'attributes');
          query.leftJoin('skus.stocks', 'stocks');

          query.where('category.id IN (:...leafCategory)', {
            leafCategory: category.leaf,
          });

          // get active product
          query.andWhere('product.status = :status', {
            status: ProductStatus.ACTIVE,
          });

          if (logic.isFeatured && logic.isFeatured) {
            query.andWhere('product.isFeatured = :isFeatured', {
              isFeatured: logic.isFeatured,
            });
          }
          // is product is stock out then remove it
          if (!logic.isShowStockOut) {
            query.andWhere(stockOutWhereQuery);
          }

          query.select(this.logicSelect);

          query.take(category.limit);
          query.orderBy(`RAND()`);

          const product = await query.getMany();
          categoryProducts.push(...product);
        } else {
          const orderBy = logic.brandOrder
            ? (logic.brandOrder.toUpperCase() as 'ASC' | 'DESC')
            : 'DESC';
          const query = await this.productRepository
            .createQueryBuilder('product')
            .leftJoin('product.category', 'category')
            .leftJoin('product.brand', 'brand')
            // .leftJoinAndSelect('product.skus', 'skus')
            .innerJoin('product.skus', 'skus', 'skus.status = :status', {
              status: 'active',
            })
            .leftJoin('skus.attributes', 'attributes')
            .leftJoin('skus.stocks', 'stocks')
            .where({
              categoryId: In(category.leaf),
              status: ProductStatus.ACTIVE,
            });

          if (logic.isFeatured) {
            query.andWhere('isFeatured = :isFeatured', {
              isFeatured: logic.isFeatured,
            });
          }

          // if isRemoveStockOut is true then remove stock out products
          if (!logic.isShowStockOut) {
            query.andWhere(stockOutWhereQuery);
          }
          query.select(this.logicSelect);

          query.take(category.limit);

          query.orderBy('product.createdAt', orderBy ? orderBy : 'DESC');

          // get all category products
          const product = await query.getMany();
          categoryProducts.push(...product);
        }

        categoryProducts.length > 0 && products.push(...categoryProducts);
      }
      // get products

      // get products by brand
      if (logic.brand && logic.brand?.length > 0) {
        let brandProducts = [];
        for (const brand of logic.brand) {
          if (logic.brandOrder === 'random') {
            const query = await this.productRepository.createQueryBuilder(
              'product',
            );

            query.leftJoin('product.category', 'category');
            query.leftJoin('product.brand', 'brand');
            // query.leftJoinAndSelect('product.specifications', 'specifications');
            // query.innerJoinAndSelect('product.skus', 'skus');
            query.innerJoin('product.skus', 'skus', 'skus.status = :status', {
              status: 'active',
            });
            query.leftJoin('skus.attributes', 'attributes');
            query.leftJoin('skus.stocks', 'stocks');

            query.where('brand.id = :id', {
              id: brand.id,
            });
            // get active product
            query.andWhere('product.status = :status', {
              status: ProductStatus.ACTIVE,
            });

            if (logic.isFeatured && logic.isFeatured) {
              query.andWhere('product.isFeatured = :isFeatured', {
                isFeatured: logic.isFeatured,
              });
            }

            // if isRemoveStockOut is true then remove stock out products
            if (!logic.isShowStockOut) {
              query.andWhere(stockOutWhereQuery);
            }

            query.select(this.logicSelect);

            query.take(brand.limit ? +brand.limit : 10);
            query.orderBy(`RAND()`);

            const product = await query.getMany();
            brandProducts.push(...product);
          } else {
            const orderBy = logic.brandOrder
              ? (logic.brandOrder.toUpperCase() as 'ASC' | 'DESC')
              : 'DESC';
            const query = await this.productRepository
              .createQueryBuilder('product')
              .where('brand.id = :brandId', { brandId: brand.id })
              .andWhere('product.status = :status', {
                status: ProductStatus.ACTIVE,
              });

            if (logic.isFeatured) {
              query.andWhere('isFeatured = :isFeatured', {
                isFeatured: logic.isFeatured,
              });
            }

            // if isRemoveStockOut is true then remove stock out products
            if (!logic.isShowStockOut) {
              query.andWhere(stockOutWhereQuery);
            }

            const product = await query
              .leftJoin('product.category', 'category')
              .leftJoin('product.brand', 'brand')
              // .leftJoinAndSelect('product.skus', 'skus')
              .innerJoin('product.skus', 'skus', 'skus.status = :status', {
                status: 'active',
              })
              .leftJoin('skus.attributes', 'attributes')
              .leftJoin('skus.stocks', 'stocks')
              .select(this.logicSelect)
              .take(brand?.limit ? +brand?.limit : 10)
              .orderBy('product.createdAt', orderBy ? orderBy : 'DESC')
              .getMany();

            brandProducts.push(...product);

            // brandProducts = await queryRunner.manager
            //   .getRepository('product')
            //   .find({
            //     where: {
            //       brandId: brand.id,
            //       status: ProductStatus.ACTIVE,
            //       ...(logic.isFeatured ? { isFeatured: logic.isFeatured } : {}), // Conditionally add isFeatured filter
            //     },
            //     relations: [
            //       'category',
            //       'brand',
            //       'skus',
            //       'skus.attributes',
            //       'skus.stocks',
            //     ],
            //     select: { ...this.select },
            //     take: brand?.limit ? +brand?.limit : 10,
            //     order: {
            //       createdAt: 'RANDOM()',
            //     },
            //   });
          }
        }

        brandProducts.length > 0 && products.push(...brandProducts);
      }

      // get today date
      const today = new Date();
      today.setHours(today.getHours() + 6);
      // today.setHours(0, 0, 0, 0);
      // change sku discount price of products array
      products.map((product) => {
        product.skus = product.skus.map((sku) => {
          sku.discountedPrice =
            (sku.discountedPrice !== 0 &&
              today >= new Date(sku.discountedPriceStart) &&
              today <= new Date(sku.discountedPriceEnd)) ||
              (sku.discountedPrice !== 0 &&
                sku.discountedPriceStart === null &&
                sku.discountedPriceEnd === null)
              ? sku.discountedPrice
              : sku.price;
          return sku;
        });
        return product;
      });

      // get unique products only
      const uniqueItems = [...new Set(products.map((obj) => obj.id))].map(
        (id) => products.find((obj) => obj.id === id),
      );

      // await queryRunner.commitTransaction();
      // await queryRunner.release();

      // set cache
      await this.cacheManager.set(
        cacheKey,
        uniqueItems,
        this.DEFAULT_CACHE_TTL,
      );
      return uniqueItems;
    } catch (e) {
      console.log(e);
      // await queryRunner.rollbackTransaction();
      // await queryRunner.release();
      throwError(500, [], 'Unable to get products');
    } finally {
      // await queryRunner.release();
    }

    return 'logical product get';
  }

  async getBySkus(skus: string[]) {
    let andFilter = {};
    andFilter = {
      status: ProductStatus.ACTIVE,
      skus: { sku: In(skus), status: VariationStatus.ACTIVE },
    };

    const [products, total] = await this.productRepository.findAndCount({
      relations: [
        'category',
        'brand',
        'skus',
        'skus.attributes',
        'skus.stocks',
      ],
      select: { ...this.select },

      where: andFilter,
    });

    // get today date
    const today = new Date();
    today.setHours(today.getHours() + 6);
    // change sku discount price of products array
    products.map((product) => {
      product.skus = product.skus.map((sku) => {
        sku.discountedPrice =
          (sku.discountedPrice !== 0 &&
            today >= new Date(sku.discountedPriceStart) &&
            today <= new Date(sku.discountedPriceEnd)) ||
            (sku.discountedPrice !== 0 &&
              sku.discountedPriceStart === null &&
              sku.discountedPriceEnd === null)
            ? sku.discountedPrice
            : sku.price;
        return sku;
      });
      return product;
    });

    return {
      data: products,
      totalResult: total,
    };
  }

  // find nested category by id
  async findNestedCategory(categories: any[], id: number) {
    let nestedChilds = [];
    function getNested(data, id) {
      const childs = data.filter(
        (item) => item.parentId === id && item.status === CategoryStatus.ACTIVE,
      );
      if (childs.length > 0) {
        nestedChilds = nestedChilds.concat(childs.map((item) => item.id));
      }
      childs.forEach((item) => {
        // Check if the item's ID is not already in nestedChilds
        // if (!nestedChilds.includes(item.id)) {
        getNested(data, item.id);
        // } else {
        //   const filePath = path.join(process.cwd(), 'category.log');
        //   const logMessage = `Category ID: ${item.id}`;
        //   fs.appendFileSync(filePath, logMessage + '\n');
        // }
      });
    }

    getNested(categories, id);
    return nestedChilds;
  }
}
