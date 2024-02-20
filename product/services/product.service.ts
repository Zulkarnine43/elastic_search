import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { throwError } from 'src/common/errors/errors.function';
import { generateSKU, sluggify } from 'src/common/helpers/helpers.function';
import { DataSource, In, Not, Repository } from 'typeorm';
import { Brand } from '../../brand/entities/brand.entity';
import { Category } from '../../category/entities/category.entity';
import { CategoryService } from '../../category/services/category.service';
import { SeoType } from '../../seo/entities/seo.entity';
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
import { Campaign } from '../entities/campaign.entity';
import { ProductLog } from '../entities/product-log.entity';
import { Product, ProductStatus } from '../entities/product.entity';
import { Sku, VariationStatus } from '../entities/sku.entity';
import { StorefrontService } from './storefront.service';
import { SearchService } from 'src/modules/search/search.service';

export enum DiscountType {
  PERCENTAGE = 'percentage',
  AMOUNT = 'amount',
}

@Injectable()
export class ProductService {
  select = {
    id: true,
    name: true,
    slug: true,
    sku: true,
    status: true,
    sbarcode: true,
    stylecode: true,
    hscode: true,
    thumbnail: true,
    shortDescription: true,
    longDescription: true,
    warrantyType: true,
    warranty: true,
    warrantyPolicy: true,
    vat: true,
    categoryId: true,
    brandId: true,
    isLive: true,
    gift: true,
    displayOnly: true,
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
    skus: {
      customSku: true,
      status: true,
      images: true,
      stockQuantity: true,
      purchasePrice: true,
      price: true,
      discountedPrice: true,
      preOrder: true,
      preOrderPer: true,
      stockOut: true,
    },
  };

  listSelect = [
    'product.id',
    'product.name',
    'product.slug',
    'product.sku',
    'product.status',
    'product.sbarcode',
    'product.stylecode',
    'product.hscode',
    'product.thumbnail',
    // 'product.shortDescription',
    // 'product.longDescription',
    // 'product.warrantyType',
    // 'product.warranty',
    // 'product.warrantyPolicy',
    // 'product.vat',
    'product.categoryId',
    'product.brandId',
    // 'product.isLive',
    // 'product.isFeatured',
    // 'product.featuredOrder',
    // 'product.gift',
    // 'product.displayOnly',
    'product.createdAt',
    'product.updatedAt',
    'category.id',
    'category.logo',
    'category.name',
    'category.slug',
    'category.parentId',
    'parent.id',
    'parent.logo',
    'parent.name',
    'parent.slug',
    // 'brand.id',
    // 'brand.logo',
    // 'brand.name',
    // 'brand.slug',
    // 'specifications.id',
    // 'specifications.key',
    // 'specifications.value',
    'skus.id',
    'skus.customSku',
    // 'skus.images',
    'skus.stockQuantity',
    'skus.status',
    'skus.purchasePrice',
    'skus.price',
    'skus.discountedPrice',
    // 'skus.preOrder',
    // 'skus.preOrderPer',
    // 'skus.stockOut',
    // 'stock.id',
    // 'stock.skuId',
    // 'stock.qty',
    // 'stock.warehouseId',
    // 'warehouse.id',
    // 'warehouse.name',
    // 'warehouse.address',
    // 'warehouse.phone',
    // 'warehouse.email',
    // 'warehouse.type',
    // 'warehouse.lat',
    // 'warehouse.long',
    // 'warehouse.openTime',
    // 'warehouse.closeDay',
    // 'attributes.id',
    // 'attributes.key',
    // 'attributes.value',
  ];

  queryBuilderSelect = [
    'product.id',
    'product.name',
    'product.slug',
    'product.sku',
    'product.status',
    'product.sbarcode',
    'product.stylecode',
    'product.hscode',
    'product.thumbnail',
    'product.shortDescription',
    'product.longDescription',
    'product.warrantyType',
    'product.warranty',
    'product.warrantyPolicy',
    'product.vat',
    'product.categoryId',
    'product.brandId',
    'product.isLive',
    'product.isFeatured',
    'product.featuredOrder',
    'product.gift',
    'product.displayOnly',
    'product.createdAt',
    'product.updatedAt',
    'category.id',
    'category.logo',
    'category.name',
    'category.slug',
    'brand.id',
    'brand.logo',
    'brand.name',
    'brand.slug',
    'specifications.id',
    'specifications.key',
    'specifications.value',
    'skus.id',
    'skus.customSku',
    'skus.images',
    'skus.stockQuantity',
    'skus.status',
    'skus.purchasePrice',
    'skus.price',
    'skus.discountedPrice',
    'skus.preOrder',
    'skus.preOrderPer',
    'skus.stockOut',
    'stock.id',
    'stock.skuId',
    'stock.qty',
    'stock.warehouseId',
    'warehouse.id',
    'warehouse.name',
    'warehouse.address',
    'warehouse.phone',
    'warehouse.email',
    'warehouse.type',
    'warehouse.lat',
    'warehouse.long',
    'warehouse.openTime',
    'warehouse.closeDay',
    'attributes.id',
    'attributes.key',
    'attributes.value',
  ];

  queryBasicSelect = [
    'product.id',
    'product.name',
    'product.slug',
    'product.sku',
    'product.status',
    'product.sbarcode',
    'product.stylecode',
    'product.hscode',
    'product.thumbnail',
    'product.shortDescription',
    'product.longDescription',
    'product.warrantyType',
    'product.warranty',
    'product.warrantyPolicy',
    'product.vat',
    'product.categoryId',
    'product.brandId',
    'product.isLive',
    'product.isFeatured',
    'product.featuredOrder',
    'product.gift',
    'product.displayOnly',
    'product.createdAt',
    'product.updatedAt',
    'category.id',
    'category.logo',
    'category.name',
    'category.slug',
    'brand.id',
    'brand.logo',
    'brand.name',
    'brand.slug',
    'specifications.id',
    'specifications.key',
    'specifications.value',
  ];

  querySkuSelect = [
    'skus.id',
    'skus.customSku',
    'skus.images',
    'skus.stockQuantity',
    'skus.status',
    'skus.purchasePrice',
    'skus.price',
    'skus.discountedPrice',
    'skus.discountedType',
    'skus.discountedValue',
    'skus.discountedPriceStart',
    'skus.discountedPriceEnd',
    'skus.preOrder',
    'skus.preOrderPer',
    'skus.stockOut',
    // 'stock.id',
    // 'stock.skuId',
    // 'stock.qty',
    // 'stock.warehouseId',
    // 'warehouse.id',
    // 'warehouse.name',
    // 'warehouse.address',
    // 'warehouse.phone',
    // 'warehouse.email',
    // 'warehouse.type',
    // 'warehouse.lat',
    // 'warehouse.long',
    // 'warehouse.openTime',
    // 'warehouse.closeDay',
    'attributes.id',
    'attributes.key',
    'attributes.value',
  ];

  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(ProductLog)
    private productLogRepository: Repository<ProductLog>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(Brand)
    private brandRepository: Repository<Brand>,
    @InjectRepository(Sku)
    private skuRepository: Repository<Sku>,
    @InjectRepository(Campaign)
    private campaignRepository: Repository<Campaign>,
    private dataSource: DataSource,
    private categoryService: CategoryService,
    private storefrontProductService: StorefrontService,
    private readonly searchService: SearchService,
  ) { }

  async create(user, createProductDto: CreateProductDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    let slug;

    if (createProductDto && createProductDto?.slug) {
      const isSlugExist = await this.productRepository.findOne({
        where: { slug: createProductDto?.slug },
      });

      if (isSlugExist) {
        slug = isSlugExist['slug'];
        const updateOldslug = isSlugExist['slug'] + ' ' + (new Date()).toLocaleDateString();
        await this.productRepository.update(isSlugExist.id, { slug: updateOldslug });
      } else {
        throwError(
          HttpStatus.BAD_REQUEST,
          [],
          'Slug Not Match combine product',
        );
      }
    } else {
      // Generate slug
      slug = sluggify(createProductDto.name);

      let isSlugExist;

      // verify slug exist or not
      try {
        isSlugExist = await this.productRepository.findOne({
          where: { slug: slug },
        });
      } catch (e) {
        console.log(e);
        throwError(HttpStatus.INTERNAL_SERVER_ERROR, [], e.message);
      }

      // if slug exist add random number with slug
      if (isSlugExist) {
        slug = slug + Math.floor(Math.random() * 1000);
      }

      // Check custom sku already exist or not
      if (createProductDto.customSku) {
        let sku;
        try {
          sku = await this.skuRepository.findOne({
            where: { customSku: createProductDto.customSku },
          });
        } catch (e) {
          throwError(HttpStatus.INTERNAL_SERVER_ERROR, [], e.message);
        }

        if (sku)
          throwError(
            HttpStatus.BAD_REQUEST,
            [],
            'Custom sku already exist with another product',
          );
      }
    }

    // Check category exist or not
    let category;
    if (createProductDto.categoryId) {
      try {
        category = await this.categoryRepository.findOne({
          where: { id: createProductDto.categoryId, leaf: true },
        });
      } catch (e) {
        console.log(e);
        throwError(HttpStatus.INTERNAL_SERVER_ERROR, [], e.message);
      }

      if (!category)
        throwError(HttpStatus.BAD_REQUEST, [], 'Category not found');
    }

    // Check brand exist or not
    let brand;
    if (createProductDto.brandId) {
      try {
        brand = await this.brandRepository.findOne({
          where: { id: createProductDto.brandId },
        });
      } catch (e) {
        console.log(e);
        throwError(HttpStatus.INTERNAL_SERVER_ERROR, [], e.message);
      }

      if (!brand) throwError(HttpStatus.BAD_REQUEST, [], 'Brand not found');
    }

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const skuString = generateSKU(
        createProductDto.name,
        Math.floor(1000 + Math.random() * 9000),
      );
      // Create New Product
      const productData = {
        name: createProductDto.name,
        slug: slug,
        sku: createProductDto?.sku ? createProductDto?.sku : skuString,
        customSku: createProductDto.customSku,
        thumbnail: createProductDto.thumbnail,
        displayOnly: createProductDto.displayOnly,
        isFeatured: createProductDto.isFeatured,
        ...(createProductDto.insideDhaka && {
          insideDhaka: createProductDto.insideDhaka,
        }),
        ...(createProductDto.outsideDhaka && {
          outsideDhaka: createProductDto.outsideDhaka,
        }),
        ...(createProductDto.gift && {
          gift: JSON.stringify(createProductDto.gift),
        }),
        ...(createProductDto.vat && { vat: createProductDto.vat }),
        ...(createProductDto.shortDescription && {
          shortDescription: createProductDto.shortDescription,
        }),
        ...(createProductDto.longDescription && {
          longDescription: createProductDto.longDescription,
        }),
        ...(createProductDto.categoryId && {
          categoryId: createProductDto.categoryId,
        }),
        ...(createProductDto.brandId && {
          brandId: createProductDto.brandId,
        }),
        ...(createProductDto.variationKeys && {
          variationKeys: createProductDto.variationKeys,
        }),
        ...(createProductDto.warrantyType && {
          warrantyType: createProductDto.warrantyType,
        }),
        ...(createProductDto.warranty && {
          warranty: createProductDto.warranty,
        }),
        ...(createProductDto.warrantyPolicy && {
          warrantyPolicy: createProductDto.warrantyPolicy,
        }),
        ...(createProductDto.packageWeight && {
          packageWeight: createProductDto.packageWeight,
        }),
        ...(createProductDto.packageHeight && {
          packageHeight: createProductDto.packageHeight,
        }),
        ...(createProductDto.packageLength && {
          packageLength: createProductDto.packageLength,
        }),
        ...(createProductDto.packageWidth && {
          packageWidth: createProductDto.packageWidth,
        }),
        ...(createProductDto.dangerousGoodsType && {
          dangerousGoodsType: createProductDto.dangerousGoodsType,
        }),
        // ...(createProductDto.displayOnly && {
        //   dangerousGoodsType: createProductDto.displayOnly,
        // }),
        // ...(createProductDto.isFeatured && {
        //   isFeatured: createProductDto.isFeatured,
        // }),
        ...(createProductDto.featuredOrder && {
          featuredOrder: createProductDto.featuredOrder,
        }),
      };

      const newProduct = await queryRunner.manager
        .getRepository('product')
        .save(productData);

      // insert seo data
      await queryRunner.manager.getRepository('seo').save({
        refId: newProduct.id,
        type: SeoType.PRODUCT,
        title: createProductDto.name,
        description: createProductDto.shortDescription,
        tag: JSON.stringify(createProductDto.tags),
        imgText: createProductDto.name,
        image: createProductDto.thumbnail,
      });

      // Store Product Specification
      if (
        createProductDto.specifications &&
        createProductDto.specifications.length > 0
      ) {
        const productSpecification = createProductDto.specifications.map(
          (item) => {
            return {
              productId: newProduct.id,
              key: item.key,
              value: item.value,
            };
          },
        );

        await queryRunner.manager
          .getRepository('specification')
          .save(productSpecification);
      }

      if (createProductDto.skus && createProductDto.skus.length > 0) {
        // Generate sku string

        for (let i = 0; i < createProductDto.skus.length; i++) {
          //get total stock quantity
          let totalStockQty = 0;
          if (createProductDto.skus[i]['warehouseSkusStock']) {
            totalStockQty = createProductDto.skus[i][
              'warehouseSkusStock'
            ].reduce((a, b) => a + Number(b.qty), 0);
          }
          let discountedAmount = 0;
          let discountedPrice = 0;
          if (createProductDto.skus[i].discountedType === DiscountType.AMOUNT) {
            discountedAmount = createProductDto.skus[i].discountedValue;
            discountedPrice = createProductDto.skus[i].price - discountedAmount;
          } else if (
            createProductDto.skus[i].discountedType === DiscountType.PERCENTAGE
          ) {
            discountedAmount = Number(
              (
                createProductDto.skus[i].price *
                (createProductDto.skus[i].discountedValue / 100)
              ).toFixed(2),
            );
            discountedPrice = createProductDto.skus[i].price - discountedAmount;
          }
          console.log('discountedAmount', discountedAmount);

          const newSku = await queryRunner.manager.getRepository('sku').save({
            productId: newProduct.id,
            sku: createProductDto.skus[i].sku
              ? createProductDto.skus[i].sku
              : skuString + '-' + i,
            images: createProductDto.skus[i].images,
            customSku: createProductDto.skus[i].customSku,
            purchasePrice: createProductDto.skus[i].purchasePrice,
            price: createProductDto.skus[i].price,
            discountedType: createProductDto.skus[i].discountedType,
            discountedValue: createProductDto.skus[i].discountedValue,
            discountedPrice: discountedPrice,
            discountedPriceStart: createProductDto.skus[i].discountedPriceStart,
            discountedPriceEnd: createProductDto.skus[i].discountedPriceEnd,
            preOrder: createProductDto.skus[i].preOrder,
            preOrderPer: createProductDto.skus[i].preOrderPer,
            stockOut: createProductDto.skus[i].stockOut,
            stockQuantity: totalStockQty,
          });

          // if sku has quantity then add stock
          if (createProductDto.skus[i]['warehouseSkusStock']) {
            const skuQuentities = createProductDto.skus[i][
              'warehouseSkusStock'
            ].map((item) => {
              return {
                skuId: newSku.id,
                warehouseId: item.warehouseId,
                qty: item.qty,
              };
            });

            await queryRunner.manager
              .getRepository('warehouse_skus_stock')
              .save(skuQuentities);
          }

          // if sku has attributes then add attributes
          if (createProductDto.skus[i].attributes) {
            const skuAttributes = createProductDto.skus[i].attributes.map(
              (item) => {
                return {
                  skuId: newSku.id,
                  key: item.key,
                  value: item.value,
                };
              },
            );

            await queryRunner.manager
              .getRepository('sku_attribute')
              .save(skuAttributes);
          }
        }
      }
      await queryRunner.commitTransaction();
      // await queryRunner.release();

      await this.searchService.removeSkusFromIndex(newProduct?.id);
      await this.searchService.addedProductFromIndex(newProduct?.id);

      const id = newProduct?.id;
      let oldProductData = {};

      await this.insertProductLog(
        user,
        id,
        'product',
        'Added new Product',
        oldProductData,
        newProduct,
      );

      return await this.productRepository
        .createQueryBuilder('product')
        .where({ id: newProduct.id })
        .leftJoinAndSelect('product.category', 'category')
        .leftJoinAndSelect('product.brand', 'brand')
        .innerJoinAndSelect('product.skus', 'skus')
        .leftJoinAndSelect('product.specifications', 'specifications')
        .leftJoinAndSelect('skus.attributes', 'attributes')
        .leftJoinAndSelect('skus.warehouseSkusStock', 'stock')
        .leftJoinAndSelect('stock.warehouses', 'warehouse')
        .select(this.queryBuilderSelect)
        .getOne();
    } catch (e) {
      console.log(e);
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      const errorMessage = {
        statusCode: 500,
        success: false,
        message: 'Can not create Product',
        error: {},
      };
      throw new HttpException(errorMessage, HttpStatus.BAD_REQUEST);
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(
    user,
    perPage = 10,
    currentPage = 0,
    search = null,
    status = null,
    sku = null,
    category = null,
    brands = null,
  ) {
    let whereRawCondition = 'product.deleted_at IS NULL';

    // if status query exits
    if (status) {
      whereRawCondition += ` AND product.status = '${status}'`;
    }

    // if sku query exits
    if (sku) {
      whereRawCondition += ` AND product.sku = ${sku}`;
    }

    // if category query exits
    if (category) {
      whereRawCondition += ` AND product.category_id = ${category}`;
    }

    // if brand query exits
    if (brands) {
      whereRawCondition += ` AND product.brand_id = ${brands}`;
    }

    // if search query exits
    if (search) {
      whereRawCondition += ` 
      AND (product.name LIKE '%${search}%' 
      OR product.sku LIKE '%${search}%' 
      OR category.name LIKE '%${search}%' 
      OR (
        product.id IN (
          SELECT product_id
          FROM sku
          WHERE sku.sku LIKE '%${search}%' 
          OR sku.custom_sku LIKE '%${search}%' 
          OR sku.model_no LIKE '%${search}%'
        )
      ))`;
    }

    const [products, total] = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('category.parent', 'parent')
      // .leftJoinAndSelect('product.brand', 'brand')
      .innerJoinAndSelect('product.skus', 'skus')
      // .leftJoinAndSelect('skus.attributes', 'attributes')
      // .leftJoinAndSelect('skus.warehouseSkusStock', 'stock')
      // .leftJoinAndSelect('stock.warehouses', 'warehouse')
      .where(whereRawCondition)
      .select(this.listSelect)
      .orderBy('product.id', 'DESC')
      .take(perPage)
      .skip(currentPage * perPage)
      .getManyAndCount();

    // const [products, totaldsiplayOnly] = await this.productRepository.findAndCount({
    //   where: filter,
    //   order: { createdAt: 'DESC' },
    //   relations: [
    //     'category',
    //     'brand',
    //     'specifications',
    //     'skus',
    //     'skus.attributes',
    //     'skus.warehouseSku',
    //   ],
    //   select: { ...this.select, skus: { id: true, status: true } },
    //   take: perPage,
    //   skip: currentPage * perPage,
    // });

    const mappedProductList = products.map(async (product) => {
      const breadcrumb = await this.categoryService.generateListBreadcrumb(
        product?.category,
      );
      product['breadcrumb'] = breadcrumb;
      return { ...product };
    });

    const productsList = await Promise.all(mappedProductList);

    const response = {
      data: productsList,
      perPage: perPage,
      currentPage: currentPage + 1,
      totalPage: Math.ceil(total / perPage),
      totalResult: total,
    };

    return response;
  }

  async findOne(id: number) {
    let product;
    try {
      product = await this.productRepository
        .createQueryBuilder('product')
        .where({ id: id })
        .leftJoin('product.category', 'category')
        .leftJoin('product.brand', 'brand')
        .leftJoin('product.specifications', 'specifications')
        // .leftJoin('product.skus', 'skus', 'skus.status = :status', {
        //   status: 'active',
        // })
        .innerJoinAndSelect('product.skus', 'skus')
        .leftJoin('skus.attributes', 'attributes')
        .leftJoin('skus.warehouseSkusStock', 'stock')
        .leftJoin('stock.warehouses', 'warehouse')
        .select([
          ...this.queryBuilderSelect,
          'skus.discountedType',
          'skus.discountedValue',
          'skus.discountedPriceStart',
          'skus.discountedPriceEnd',
          // 'specifications.id',
          // 'specifications.key',
          // 'specifications.value',
        ])
        .getOne();
      product.categories = await this.categoryService.generateBreadcrumb(
        product.categoryId,
      );
      // product.skus = await this.skuRepository.find({
      //   where: { productId: id },
      // });
    } catch (e) {
      console.log(e);
    }
    if (!product) throwError(HttpStatus.NOT_FOUND, [], 'Product not found');

    return product;
  }

  async findHealth() {
    // const queryRunner = this.dataSource.createQueryRunner();
    // await queryRunner.connect();
    // await queryRunner.startTransaction();
    try {
      const total = await this.productRepository
        .createQueryBuilder('product')
        .getCount();

      // await queryRunner.commitTransaction();
      // await queryRunner.release();

      return {
        count: total,
      };
    } catch (e) {
      // await queryRunner.rollbackTransaction();
      // await queryRunner.release();
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    } finally {
      // await queryRunner.release();
    }
  }

  async findBasicOne(id: number) {
    let product;
    try {
      product = await this.productRepository
        .createQueryBuilder('product')
        .where({ id: id })
        .leftJoinAndSelect('product.category', 'category')
        .leftJoinAndSelect('product.brand', 'brand')
        .leftJoinAndSelect('product.specifications', 'specifications')
        .select([...this.queryBasicSelect])
        .getOne();
      product.categories = await this.categoryService.generateBreadcrumb(
        product.categoryId,
      );
    } catch (e) {
      console.log(e);
    }
    if (!product) throwError(HttpStatus.NOT_FOUND, [], 'Product not found');

    return product;
  }

  async findSkusByProductID(id: number) {
    if (!id) throwError(HttpStatus.NOT_FOUND, [], 'Product id not found');

    let product;
    try {
      product = await this.skuRepository
        .createQueryBuilder('skus')
        .leftJoinAndSelect('skus.attributes', 'attributes')
        // .leftJoinAndSelect('skus.warehouseSkusStock', 'stock')
        // .leftJoinAndSelect('stock.warehouses', 'warehouse')
        .where('skus.productId = :id', { id })
        .select([...this.querySkuSelect])
        .getMany();
    } catch (e) {
      console.log(e);
    }
    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    return `This action updates a #${id} product`;
  }

  async remove(user, id: number) {
    let product;
    let result;
    try {
      product = await this.productRepository.findOne({ where: { id: id } });

      if (!product) throwError(HttpStatus.NOT_FOUND, [], 'Product not found');

      result = await this.productRepository.delete(id);

      const updatedProductData = {};

      if (result) {
        await this.searchService.removeSkusFromIndex(id);
        await this.insertProductLog(
          user,
          id,
          'product',
          'Product Delete',
          product,
          updatedProductData,
        );
      }
    } catch (e) {
      throwError(HttpStatus.INTERNAL_SERVER_ERROR, [], e.message);
    }

    if (result && result.affected) {
      return { status: true, data: { id: id } };
    }

    return { status: false };
  }

  async updateMergeProduct(
    user,
    id: number,
    updateMergeProductDto: UpdateMergeProductDto,
  ) {
    // Check porduct exist or not
    if (!id) throwError(HttpStatus.BAD_REQUEST, [], 'Product id is required');

    let product;
    try {
      product = await this.productRepository.findOne({ where: { id: id } });
    } catch (e) {
      throwError(HttpStatus.INTERNAL_SERVER_ERROR, [], e.message);
    }

    if (!product) throwError(HttpStatus.NOT_FOUND, [], 'Product not found');

    // const queryRunner = this.dataSource.createQueryRunner();
    // await queryRunner.connect();
    // await queryRunner.startTransaction();
    try {
      const productData = {
        mergeId: id,
        status: ProductStatus.INACTIVE,
        deletedAt: new Date(),
      };
      // update info
      if (updateMergeProductDto?.mergeProducts.length > 0) {
        for (const productId of updateMergeProductDto?.mergeProducts) {
          await this.productRepository.update(productId, productData);
        }
      } else {
        throwError(
          HttpStatus.NOT_FOUND,
          [],
          'Merge Products Array can not be empty',
        );
      }

      let oldProductData = [];
      oldProductData = await this.productRepository.find({
        where: { id: In(updateMergeProductDto.mergeProducts) },
      });

      // await queryRunner.commitTransaction();

      // await queryRunner.release();

      if (updateMergeProductDto && updateMergeProductDto?.mergeProducts && updateMergeProductDto?.mergeProducts.length > 0) {
        await this.searchService.removeMergeProductsFromIndex(updateMergeProductDto?.mergeProducts);
      }
      await this.searchService.addedProductFromIndex(id);

      let updatedProductData = await this.productRepository.findOne({
        where: { id: id },
        relations: ['skus'],
      });

      if (oldProductData.length === 0) {
        oldProductData = updateMergeProductDto.mergeProducts;
      }

      await this.insertProductLog(
        user,
        id,
        'product',
        'Merge Products to create new product',
        oldProductData,
        updatedProductData,
      );

      const updatedProduct = await this.productRepository
        .createQueryBuilder('product')
        .where({ id: id })
        .leftJoinAndSelect('product.category', 'category')
        .leftJoinAndSelect('product.brand', 'brand')
        .leftJoinAndSelect('product.specifications', 'specifications')
        .innerJoinAndSelect('product.skus', 'skus')
        .leftJoinAndSelect('skus.attributes', 'attributes')
        .leftJoinAndSelect('skus.warehouseSkusStock', 'stock')
        .leftJoinAndSelect('stock.warehouses', 'warehouse')
        .select(this.queryBuilderSelect)
        .getOne();

      return {
        status: true,
        data: updatedProduct,
      };
    } catch (e) {
      // await queryRunner.rollbackTransaction();
      // await queryRunner.release();
      throwError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        [],
        'Can not update product',
      );
    }
  }

  async updateBasicInfo(
    user,
    id: number,
    updateBasicInfoProductDto: UpdateBasicInfoProductDto,
  ) {
    // Check porduct exist or not
    if (!id) throwError(HttpStatus.BAD_REQUEST, [], 'Product id is required');

    // check slug is unique or not
    if (updateBasicInfoProductDto.slug) {
      const isSlugExist = await this.productRepository.findOne({
        where: { slug: updateBasicInfoProductDto.slug, id: Not(id) },
      });

      if (isSlugExist)
        throwError(HttpStatus.BAD_REQUEST, [], 'Slug already exist');
    }

    let oldProductData;
    try {
      oldProductData = await this.productRepository.findOne({
        where: { id: id },
        relations: ['specifications'],
      });
    } catch (e) {
      throwError(HttpStatus.INTERNAL_SERVER_ERROR, [], e.message);
    }

    if (!oldProductData)
      throwError(HttpStatus.NOT_FOUND, [], 'Product not found');

    // Check custom sku already exist or not
    if (updateBasicInfoProductDto.customSku) {
      let sku;
      try {
        sku = await this.skuRepository.findOne({
          where: {
            customSku: updateBasicInfoProductDto.customSku,
            id: Not(id),
          },
        });
      } catch (e) {
        throwError(HttpStatus.INTERNAL_SERVER_ERROR, [], e.message);
      }

      if (sku && sku.id !== id)
        throwError(
          HttpStatus.BAD_REQUEST,
          [],
          'Custom sku already exist with another product',
        );
    }

    // Check category exist or not
    let category;
    if (updateBasicInfoProductDto.categoryId) {
      try {
        category = await this.categoryRepository.findOne({
          where: { id: updateBasicInfoProductDto.categoryId, leaf: true },
        });
      } catch (e) {
        console.log(e);
        throwError(HttpStatus.INTERNAL_SERVER_ERROR, [], e.message);
      }

      if (!category)
        throwError(HttpStatus.BAD_REQUEST, [], 'Category not found');
    }

    // Check brand exist or not
    let brand;
    if (updateBasicInfoProductDto.brandId) {
      try {
        brand = await this.brandRepository.findOne({
          where: { id: updateBasicInfoProductDto.brandId },
        });
      } catch (e) {
        console.log(e);
        throwError(HttpStatus.INTERNAL_SERVER_ERROR, [], e.message);
      }

      if (!brand) throwError(HttpStatus.BAD_REQUEST, [], 'Brand not found');
    }

    // const queryRunner = this.dataSource.createQueryRunner();
    // await queryRunner.connect();
    // await queryRunner.startTransaction();
    try {
      await this.dataSource.transaction(async (manager) => {
        const productData = {
          name: updateBasicInfoProductDto.name,
          slug: updateBasicInfoProductDto.slug,
          thumbnail: updateBasicInfoProductDto.thumbnail,
          customSku: updateBasicInfoProductDto.customSku,
          displayOnly: updateBasicInfoProductDto.displayOnly,
          isFeatured: updateBasicInfoProductDto.isFeatured,
          ...(updateBasicInfoProductDto.insideDhaka && {
            insideDhaka: updateBasicInfoProductDto.insideDhaka,
          }),
          ...(updateBasicInfoProductDto.outsideDhaka && {
            outsideDhaka: updateBasicInfoProductDto.outsideDhaka,
          }),
          ...(updateBasicInfoProductDto.vat && {
            vat: updateBasicInfoProductDto.vat,
          }),
          ...(updateBasicInfoProductDto.shortDescription && {
            shortDescription: updateBasicInfoProductDto.shortDescription,
          }),
          ...(updateBasicInfoProductDto.longDescription && {
            longDescription: updateBasicInfoProductDto.longDescription,
          }),
          ...(updateBasicInfoProductDto.categoryId && {
            categoryId: updateBasicInfoProductDto.categoryId,
          }),
          ...(updateBasicInfoProductDto.brandId && {
            brandId: updateBasicInfoProductDto.brandId,
          }),
          ...(updateBasicInfoProductDto.variationKeys && {
            variationKeys: updateBasicInfoProductDto.variationKeys,
          }),
          // ...(updateBasicInfoProductDto.displayOnly && {
          //   displayOnly: updateBasicInfoProductDto.displayOnly,
          // }),
          // ...(updateBasicInfoProductDto.isFeatured && {
          //   isFeatured: updateBasicInfoProductDto.isFeatured,
          // }),
          ...(updateBasicInfoProductDto.featuredOrder && {
            featuredOrder: updateBasicInfoProductDto.featuredOrder,
          }),
        };
        // update basic info
        await manager.getRepository('product').update(id, productData);

        // // If categoryId changed then remove all the skus
        // if (updateBasicInfoProductDto.categoryId !== product.categoryId) {
        //   await queryRunner.manager
        //     .getRepository('sku')
        //     .delete({ productId: id });
        // }

        // delete specification
        await manager.getRepository('specification').delete({ productId: id });

        // delete specification
        if (
          updateBasicInfoProductDto.specifications &&
          updateBasicInfoProductDto.specifications.length > 0
        ) {
          const productSpecification =
            updateBasicInfoProductDto.specifications.map((item) => {
              return {
                productId: id,
                key: item.key,
                value: item.value,
              };
            });
          // add specification
          await manager
            .getRepository('specification')
            .save(productSpecification);
        }

        // await queryRunner.commitTransaction();
      });
      // await queryRunner.release();

      await this.searchService.removeSkusFromIndex(id);
      await this.searchService.addedProductFromIndex(id);

      let updatedProductData = await this.productRepository.findOne({
        where: { id: id },
        relations: ['specifications'],
      });

      await this.insertProductLog(
        user,
        id,
        'product',
        'Product Basic Update',
        oldProductData,
        updatedProductData,
      );

      const updatedProduct = await this.productRepository
        .createQueryBuilder('product')
        .where({ id: id })
        .leftJoinAndSelect('product.category', 'category')
        .leftJoinAndSelect('product.brand', 'brand')
        .leftJoinAndSelect('product.specifications', 'specifications')
        .innerJoinAndSelect('product.skus', 'skus')
        .leftJoinAndSelect('skus.attributes', 'attributes')
        .leftJoinAndSelect('skus.warehouseSkusStock', 'stock')
        .leftJoinAndSelect('stock.warehouses', 'warehouse')
        .select(this.queryBuilderSelect)
        .getOne();

      const categories = await this.categoryService.generateBreadcrumb(
        oldProductData.categoryId,
      );

      updatedProduct['categories'] = categories;

      return updatedProduct;
    } catch (e) {
      // await queryRunner.rollbackTransaction();
      // await queryRunner.release();
      console.log(e.message);

      throwError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        [],
        'Can not update Product',
      );
    }
  }

  async insertProductLog(user, product_id, type, msg, old_data, new_data) {
    try {
      const newLog = {
        userId: user.id,
        productId: product_id,
        type: type,
        message: msg,
        oldData: JSON.stringify(old_data),
        newData: JSON.stringify(new_data),
      };
      // console.log('newLog', newLog);
      return await this.productLogRepository.save({ ...newLog });
    } catch (e) {
      console.log(e);
    }
  }

  // update offere logics
  async updateOfferLogics(
    user,
    id: number,
    updateOfferLogics: UpdateOfferLogicDto,
  ) {
    // Check porduct exist or not
    if (!id) throwError(HttpStatus.BAD_REQUEST, [], 'Product id is required');

    let product;
    try {
      product = await this.productRepository.findOne({ where: { id: id } });
    } catch (e) {
      throwError(HttpStatus.INTERNAL_SERVER_ERROR, [], e.message);
    }

    if (!product) throwError(HttpStatus.NOT_FOUND, [], 'Product not found');

    // const queryRunner = this.dataSource.createQueryRunner();
    // await queryRunner.connect();
    // await queryRunner.startTransaction();
    try {
      const productData = {
        gift: JSON.stringify(updateOfferLogics.gift),
      };
      // update basic info
      await this.productRepository.update(id, productData);

      // await queryRunner.commitTransaction();
      // await queryRunner.release();

      await this.searchService.removeSkusFromIndex(id);
      await this.searchService.addedProductFromIndex(id);

      const newProductData = await this.productRepository.findOne({
        where: { id: id },
      });

      await this.insertProductLog(
        user,
        id,
        'product',
        'Product Offer Logic Update',
        product,
        newProductData,
      );

      const updatedProduct = await this.productRepository
        .createQueryBuilder('product')
        .where({ id: id })
        .leftJoinAndSelect('product.category', 'category')
        .leftJoinAndSelect('product.brand', 'brand')
        .leftJoinAndSelect('product.specifications', 'specifications')
        .innerJoinAndSelect('product.skus', 'skus')
        .leftJoinAndSelect('skus.attributes', 'attributes')
        .leftJoinAndSelect('skus.warehouseSkusStock', 'stock')
        .leftJoinAndSelect('stock.warehouses', 'warehouse')
        .select(this.queryBuilderSelect)
        .getOne();

      const categories = await this.categoryService.generateBreadcrumb(
        product.categoryId,
      );

      updatedProduct['categories'] = categories;

      return updatedProduct;
    } catch (e) {
      // await queryRunner.rollbackTransaction();
      // await queryRunner.release();
      throwError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        [],
        'Can not update Product',
      );
    }
  }

  // create campaign
  // async campaign(user, productCampaign: ProductCampaignDto) {
  //   try {
  //     // check category and brand exist or not
  //     if (productCampaign.categoryId) {
  //       const category = await this.categoryRepository.findOne({
  //         where: { id: productCampaign.categoryId },
  //       });

  //       if (!category)
  //         throwError(HttpStatus.BAD_REQUEST, [], 'Category not found');
  //     }

  //     if (productCampaign.brandId) {
  //       const brand = await this.brandRepository.findOne({
  //         where: { id: productCampaign.brandId },
  //       });

  //       if (!brand) throwError(HttpStatus.BAD_REQUEST, [], 'Brand not found');
  //     }
  //     // find category id
  //     let categoryItems = [];
  //     if (productCampaign.categoryId) {
  //       const allCategories = await this.categoryRepository.find({
  //         where: { deletedAt: null },
  //       });

  //       const nestedCategoryIds =
  //         await this.storefrontProductService.findNestedCategory(
  //           allCategories,
  //           productCampaign.categoryId,
  //         );
  //       categoryItems.push(...nestedCategoryIds, productCampaign.categoryId);
  //     }
  //     // get all product by category id and brand id
  //     const skuQuery = this.skuRepository
  //       .createQueryBuilder('sku')
  //       .leftJoinAndSelect('sku.product', 'product')
  //       .select([
  //         'sku.id',
  //         'sku.sku',
  //         'sku.price',
  //         'product.id',
  //         'product.name',
  //         'product.slug',
  //         'product.categoryId',
  //         'product.brandId',
  //       ]);
  //     // if category id and brand id found
  //     if (categoryItems.length > 0) {
  //       skuQuery.where('product.categoryId IN (:...categoryItems)', {
  //         categoryItems,
  //       });
  //     }

  //     if (productCampaign.brandId) {
  //       skuQuery.andWhere('product.brandId = :brandId', {
  //         brandId: productCampaign.brandId,
  //       });
  //     }

  //     let skus = await skuQuery.orderBy('sku.id', 'DESC').getMany();

  //     // remove include and exclude product from product list
  //     if (productCampaign.excludeSku.length > 0) {
  //       skus = skus.filter(
  //         (sku) => !productCampaign.excludeSku.includes(sku.sku),
  //       );
  //     }

  //     if (productCampaign.includeSku.length > 0) {
  //       for (let i = 0; i < productCampaign.includeSku.length; i++) {
  //         const inSku = productCampaign.includeSku[i];
  //         // check inSku exist or not
  //         const isExistSku = await this.skuRepository
  //           .createQueryBuilder('sku')
  //           .leftJoinAndSelect('sku.product', 'product')
  //           .select([
  //             'sku.id',
  //             'sku.sku',
  //             'sku.price',
  //             'product.id',
  //             'product.name',
  //             'product.slug',
  //             'product.categoryId',
  //             'product.brandId',
  //           ])
  //           .where('sku.sku = :sku', { sku: inSku })
  //           .getOne();
  //         if (!isExistSku) {
  //           throwError(HttpStatus.BAD_REQUEST, [], 'Include sku not found');
  //         }
  //         // check inSku already exist or not
  //         const isSkuAlreadyInSkus = skus.find((sku) => sku.sku === inSku);
  //         if (!isSkuAlreadyInSkus) {
  //           skus.push(isExistSku);
  //         }
  //       }
  //     }

  //     // update product campaign
  //     for (let i = 0; i < skus.length; i++) {
  //       const sku = skus[i];

  //       let discountedPrice;
  //       if (productCampaign.discountType === DiscountType.AMOUNT) {
  //         const discountedAmount = productCampaign.discountValue;
  //         discountedPrice = sku.price - discountedAmount;
  //       } else if (productCampaign.discountType === DiscountType.PERCENTAGE) {
  //         const discountedAmount = Number(
  //           (sku.price * (productCampaign.discountValue / 100)).toFixed(2),
  //         );
  //         discountedPrice = sku.price - discountedAmount;
  //       }
  //       // update sku
  //       const isUpdate = await this.skuRepository
  //         .createQueryBuilder('sku')
  //         .update()
  //         .set({
  //           discountedType: productCampaign.discountType,
  //           discountedValue: productCampaign.discountValue,
  //           discountedPrice: discountedPrice,
  //           discountedPriceStart: productCampaign.campaignStartDate,
  //           discountedPriceEnd: productCampaign.campaignStartDate,
  //         })
  //         .where('id = :id', { id: sku.id })
  //         .execute();
  //       console.log('sku', sku.price, discountedPrice, isUpdate);
  //     }

  //     return skus;
  //   } catch (error) {
  //     console.log('error', error.message);

  //     throwError(
  //       HttpStatus.INTERNAL_SERVER_ERROR,
  //       [],
  //       'Cannot update campaign',
  //     );
  //   }
  // }

  // check unique slug
  async checkUniqueSlug(user, slug: string) {
    // verify slug exist or not
    const isSlugExist = await this.productRepository.findOne({
      where: { slug: slug },
    });

    // if slug exist
    if (isSlugExist) {
      return { status: false };
    }

    return { status: true };
  }

  async updateDeliveryAndService(
    user,
    id: number,
    updateDeliveryAndService: UpdateDeliveryAndServiceDto,
  ) {
    // Check porduct exist or not
    if (!id) throwError(HttpStatus.BAD_REQUEST, [], 'Product id is required');

    let product;
    try {
      product = await this.productRepository.findOne({ where: { id: id } });
    } catch (e) {
      throwError(HttpStatus.INTERNAL_SERVER_ERROR, [], e.message);
    }

    if (!product) throwError(HttpStatus.NOT_FOUND, [], 'Product not found');

    try {
      const productData = {
        ...(updateDeliveryAndService.warrantyType && {
          warrantyType: updateDeliveryAndService.warrantyType,
        }),
        ...(updateDeliveryAndService.warranty && {
          warranty: updateDeliveryAndService.warranty,
        }),
        ...(updateDeliveryAndService.warrantyPolicy && {
          warrantyPolicy: updateDeliveryAndService.warrantyPolicy,
        }),
        ...(updateDeliveryAndService.packageWeight && {
          packageWeight: updateDeliveryAndService.packageWeight,
        }),
        ...(updateDeliveryAndService.packageHeight && {
          packageHeight: updateDeliveryAndService.packageHeight,
        }),
        ...(updateDeliveryAndService.packageLength && {
          packageLength: updateDeliveryAndService.packageLength,
        }),
        ...(updateDeliveryAndService.packageWidth && {
          packageWidth: updateDeliveryAndService.packageWidth,
        }),
        ...(updateDeliveryAndService.dangerousGoodsType && {
          dangerousGoodsType: updateDeliveryAndService.dangerousGoodsType,
        }),
      };
      // update basic info
      await this.productRepository.update(id, productData);

      // delete specification
      // await queryRunner.manager
      //   .getRepository('specification')
      //   .delete({ productId: id });
      // await queryRunner.commitTransaction();
      // await queryRunner.release();


      await this.searchService.removeSkusFromIndex(id);
      await this.searchService.addedProductFromIndex(id);

      const newProductData = await this.productRepository.findOne({
        where: { id: id },
      });

      await this.insertProductLog(
        user,
        id,
        'product',
        'Product Delivery And Service Update',
        product,
        newProductData,
      );

      const updatedProduct = await this.productRepository
        .createQueryBuilder('product')
        .where({ id: id })
        .leftJoinAndSelect('product.category', 'category')
        .leftJoinAndSelect('product.brand', 'brand')
        .leftJoinAndSelect('product.specifications', 'specifications')
        .innerJoinAndSelect('product.skus', 'skus')
        .leftJoinAndSelect('skus.attributes', 'attributes')
        .leftJoinAndSelect('skus.warehouseSkusStock', 'stock')
        .leftJoinAndSelect('stock.warehouses', 'warehouse')
        .select(this.queryBuilderSelect)
        .getOne();

      const categories = await this.categoryService.generateBreadcrumb(
        product.categoryId,
      );

      updatedProduct['categories'] = categories;

      return updatedProduct;
    } catch (e) {
      // await queryRunner.rollbackTransaction();
      // await queryRunner.release();
      throwError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        [],
        'Delivery update failed',
      );
    }
  }

  async updateProductStatus(
    user,
    id: number,
    updateProductStatusDto: StatusUpdateProductDto,
  ) {
    // Check porduct exist or not
    if (!id) throwError(HttpStatus.BAD_REQUEST, [], 'Product id is required');

    let product;
    try {
      product = await this.productRepository.findOne({ where: { id: id } });
    } catch (e) {
      throwError(HttpStatus.INTERNAL_SERVER_ERROR, [], e.message);
    }

    if (!product) throwError(HttpStatus.NOT_FOUND, [], 'Product not found');

    // const queryRunner = this.dataSource.createQueryRunner();
    // await queryRunner.connect();
    // await queryRunner.startTransaction();
    try {
      await this.dataSource.transaction(async (manager) => {
        const productData = {
          status: updateProductStatusDto.status,
        };
        // update basic info
        await manager.getRepository('product').update(id, productData);

        // If updated status is active, then check all sku status and update it
        if (updateProductStatusDto.status === 'active') {
          const skus = await manager
            .getRepository('sku')
            .find({ where: { productId: id } });

          // Check every status is inactive or not
          const isInactive = skus.every((item) => item.status === 'inactive');

          if (isInactive) {
            if (skus && skus.length > 0) {
              const skuIds = skus.map((item) => item.id);

              await manager
                .getRepository('sku')
                .update(skuIds, { status: 'active' });
            }
          }
        }
        await this.searchService.removeSkusFromIndex(id);
        await this.searchService.addedProductFromIndex(id);
      });
      // await queryRunner.release();

      const newProductData = await this.productRepository.findOne({
        where: { id: id },
      });

      await this.insertProductLog(
        user,
        id,
        'product',
        'Product Status Update',
        product,
        newProductData,
      );

      const updatedProduct = await this.productRepository
        .createQueryBuilder('product')
        .where({ id: id })
        .leftJoinAndSelect('product.category', 'category')
        .leftJoinAndSelect('product.brand', 'brand')
        .leftJoinAndSelect('product.specifications', 'specifications')
        .innerJoinAndSelect('product.skus', 'skus')
        .leftJoinAndSelect('skus.attributes', 'attributes')
        .leftJoinAndSelect('skus.warehouseSkusStock', 'stock')
        .leftJoinAndSelect('stock.warehouses', 'warehouse')
        .select(this.queryBuilderSelect)
        .getOne();

      return updatedProduct;
    } catch (e) {
      console.log(e.message);
      throwError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        [],
        'Product status update failed',
      );
    }
  }

  async updateSkuStatus(
    user,
    id: number,
    updateSkuStatusDto: StatusUpdateSkuDto,
  ) {
    // Check porduct exist or not
    if (!id) throwError(HttpStatus.BAD_REQUEST, [], 'Sku id is required');

    // const queryRunner = this.dataSource.createQueryRunner();
    // await queryRunner.connect();
    // await queryRunner.startTransaction();

    let sku;
    try {
      sku = await this.skuRepository.findOne({ where: { id: id } });
    } catch (e) {
      throwError(HttpStatus.INTERNAL_SERVER_ERROR, [], e.message);
    }

    if (!sku) {
      throwError(HttpStatus.NOT_FOUND, [], 'Sku not found');
    }

    const productId = sku?.['productId'];

    try {
      let allInactive;
      let existProduct;
      let skus;
      this.dataSource.transaction(async (manager) => {
        const productData = {
          status: updateSkuStatusDto.status,
        };
        // update basic info
        await manager.getRepository('sku').update(id, productData);

        // Check product status need to update or not
        if (updateSkuStatusDto.status === 'inactive') {
          skus = await this.skuRepository.find({
            where: { productId: sku.productId },
          });

          allInactive = skus.every((item) => item.status === 'inactive');

          if (allInactive) {
            existProduct = await manager
              .getRepository('product')
              .findOne({ where: { id: sku.productId } });

            await manager
              .getRepository('product')
              .update(sku.productId, { status: 'inactive' });
          }
        }
      });

      if (allInactive) {
        const updateProduct = await this.productRepository.findOne({
          where: { id: sku.productId },
        });
        await this.searchService.removeSkusFromIndex(sku?.productId);

        await this.insertProductLog(
          user,
          productId,
          'product',
          'All skus are inactive, so Product Status Update',
          existProduct,
          updateProduct,
        );
      } else {
        await this.searchService.removeSkuFromIndex(id);
        await this.searchService.addedSkuFromIndex(id);
      }

      const updatedSku = await this.skuRepository.findOne({
        where: { id: id },
      });

      await this.insertProductLog(
        user,
        productId,
        'product',
        'Product Sku Status Update',
        sku,
        updatedSku,
      );

      return updatedSku;
    } catch (e) {
      // await queryRunner.rollbackTransaction();
      // await queryRunner.release();
      throwError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        [],
        'Sku status update failed',
      );
    }
  }

  async deleteSku(user, id: number) {
    if (!id) throwError(HttpStatus.BAD_REQUEST, [], 'Sku id is required');

    // Check porduct exist or not
    let sku;
    try {
      sku = await this.skuRepository.findOne({ where: { id: id } });
    } catch (e) {
      throwError(HttpStatus.INTERNAL_SERVER_ERROR, [], e.message);
    }

    if (!sku) throwError(HttpStatus.NOT_FOUND, [], 'Sku not found');

    //get product
    let product;
    try {
      product = await this.productRepository.findOne({
        where: { id: sku.productId },
      });
    } catch (e) {
      throwError(HttpStatus.INTERNAL_SERVER_ERROR, [], e.message);
    }

    // Check is this only sku of product or not
    let skus;
    try {
      skus = await this.skuRepository.find({
        where: {
          productId: sku.productId,
          ...(product.status === ProductStatus.ACTIVE && {
            status: VariationStatus.ACTIVE,
          }),
        },
      });
    } catch (e) {
      throwError(HttpStatus.INTERNAL_SERVER_ERROR, [], e.message);
    }

    if (skus.length == 1)
      throwError(
        HttpStatus.BAD_REQUEST,
        [],
        `You can not delete last ${product.status === ProductStatus.ACTIVE ? 'active ' : ''
        }sku of a product`,
      );

    let result;
    try {
      result = await this.skuRepository.delete(id);
      if (result) {
        const productId = sku?.['productId'];
        const updatedSku = {};

        if (id) {
          await this.searchService.removeSkuFromIndex(id);
        }

        await this.insertProductLog(
          user,
          productId,
          'product',
          'Product Sku Delete',
          sku,
          updatedSku,
        );
      }
    } catch (e) {
      throwError(HttpStatus.INTERNAL_SERVER_ERROR, [], e.message);
    }

    if (result && result.affected) {
      return { status: true, data: { id: id } };
    }

    return { status: false };
  }

  async updateSku(user, id: number, updateSkuDto: UpdateSkuDto) {
    // Check porduct exist or not
    if (!id) throwError(HttpStatus.BAD_REQUEST, [], 'Sku id is required');

    let existSku;
    try {
      existSku = await this.skuRepository.findOne({
        where: { id: id },
        relations: [
          'attributes',
          // 'warehouseSkusStock',
          // 'warehouseSkusStock.warehouses',
        ],
      });
    } catch (e) {
      throwError(HttpStatus.INTERNAL_SERVER_ERROR, [], e.message);
    }

    if (!existSku) throwError(HttpStatus.NOT_FOUND, [], 'Sku not found');

    // const queryRunner = this.dataSource.createQueryRunner();
    // await queryRunner.connect();
    // await queryRunner.startTransaction();
    try {
      // calculate total stock quantity
      // let totalStockQty = 0;
      // if (updateSkuDto.warehouseSkusStock) {
      //   totalStockQty = updateSkuDto.warehouseSkusStock.reduce(
      //     (a, b) => a + Number(b.qty),
      //     0,
      //   );
      // }

      let discountedAmount;
      let discountedPrice;
      if (updateSkuDto.discountedType === DiscountType.AMOUNT) {
        discountedAmount = updateSkuDto.discountedValue;
        discountedPrice = updateSkuDto.price - discountedAmount;
      } else if (updateSkuDto.discountedType === DiscountType.PERCENTAGE) {
        discountedAmount = Number(
          (updateSkuDto.price * (updateSkuDto.discountedValue / 100)).toFixed(
            2,
          ),
        );
        discountedPrice = updateSkuDto.price - discountedAmount;
      }

      await this.dataSource.transaction(async (manager) => {
        await manager.getRepository('sku').update(
          { id },
          {
            images: updateSkuDto.images,
            customSku: updateSkuDto.customSku,
            purchasePrice: updateSkuDto.purchasePrice,
            price: updateSkuDto.price,
            discountedType: updateSkuDto.discountedType,
            discountedValue: updateSkuDto.discountedValue,
            discountedPrice: discountedPrice,
            discountedPriceStart: updateSkuDto.discountedPriceStart,
            discountedPriceEnd: updateSkuDto.discountedPriceEnd,
            // stockQuantity: totalStockQty,
            preOrder: updateSkuDto.preOrder,
            preOrderPer: updateSkuDto.preOrderPer,
            stockOut: updateSkuDto.stockOut,
          },
        );

        // update each warehouseSkusStock
        // if (updateSkuDto.warehouseSkusStock) {
        //   for (let i = 0; i < updateSkuDto.warehouseSkusStock.length; i++) {
        //     const warehouseSku = updateSkuDto.warehouseSkusStock[i];
        //     await queryRunner.manager
        //       .getRepository('warehouse_skus_stock')
        //       .update(
        //         {
        //           warehouseId: warehouseSku.warehouseId,
        //           skuId: id,
        //         },
        //         {
        //           qty: warehouseSku.qty,
        //         },
        //       );
        //   }
        // }

        // Delete old attributes
        await manager.getRepository('sku_attribute').delete({ skuId: id });

        if (updateSkuDto.attributes) {
          const skuAttributes = updateSkuDto.attributes.map((item) => {
            return {
              skuId: id,
              key: item.key,
              value: item.value,
            };
          });

          await manager.getRepository('sku_attribute').save(skuAttributes);
        }
      });

      //updatedSku
      const updatedSku = await this.skuRepository.findOne({
        where: { id: id },
        relations: [
          'attributes',
          // 'warehouseSkusStock',
          // 'warehouseSkusStock.warehouses',
        ],
      });

      if (id) {
        await this.searchService.removeSkuFromIndex(id);
        await this.searchService.addedSkuFromIndex(id);
      }

      const productId = updatedSku?.['productId'];

      await this.insertProductLog(
        user,
        productId,
        'product',
        'Product Sku Update',
        existSku,
        updatedSku,
      );

      return updatedSku;
    } catch (e) {
      throwError(HttpStatus.INTERNAL_SERVER_ERROR, [], e.message);
    }
  }

  async addSku(user, id: number, addSkuDto: AddSkuDto) {
    let product;
    try {
      product = await this.productRepository.findOne({ where: { id: id } });
    } catch (e) {
      throwError(HttpStatus.INTERNAL_SERVER_ERROR, [], e.message);
    }

    if (!product) throwError(HttpStatus.NOT_FOUND, [], 'Product not found');

    // const queryRunner = this.dataSource.createQueryRunner();

    // await queryRunner.connect();
    // await queryRunner.startTransaction();

    try {
      // Get sku count
      const skuCount = await this.skuRepository.count({
        where: { productId: id },
      });
      // Generate sku string

      // calculate total stock quantity
      let totalStockQty = 0;
      if (
        addSkuDto.warehouseSkusStock &&
        addSkuDto.warehouseSkusStock.length > 0
      ) {
        totalStockQty = addSkuDto.warehouseSkusStock.reduce(
          (a, b) => a + Number(b.qty),
          0,
        );
      }

      let discountedAmount;
      let discountedPrice;
      if (addSkuDto.discountedType === 'amount') {
        discountedAmount = addSkuDto.discountedValue;
        discountedPrice = addSkuDto.price - discountedAmount;
      } else if (addSkuDto.discountedType === 'percentage') {
        discountedAmount = Number(
          (addSkuDto.price * (addSkuDto.discountedValue / 100)).toFixed(2),
        );
        discountedPrice = addSkuDto.price - discountedAmount;
      }

      // console.log('discountedAmount', discountedAmount);
      let newSku;
      await this.dataSource.transaction(async (manager) => {
        newSku = await manager.getRepository('sku').save({
          productId: product.id,
          sku: product.sku + '-' + skuCount + 1,
          images: addSkuDto.images,
          customSku: addSkuDto.customSku,
          purchasePrice: addSkuDto.purchasePrice,
          price: addSkuDto.price,
          discountedType: addSkuDto.discountedType,
          discountedValue: addSkuDto.discountedValue,
          discountedPrice: discountedPrice,
          discountedPriceStart: addSkuDto.discountedPriceStart,
          discountedPriceEnd: addSkuDto.discountedPriceEnd,
          preOrder: addSkuDto.preOrder,
          preOrderPer: addSkuDto.preOrderPer,
          stockOut: addSkuDto.stockOut,
          stockQuantity: totalStockQty,
        });

        // if sku has quantity then add stock
        if (
          addSkuDto.warehouseSkusStock &&
          addSkuDto.warehouseSkusStock.length > 0
        ) {
          const skuQuentities = addSkuDto.warehouseSkusStock.map((item) => {
            return {
              skuId: newSku.id,
              warehouseId: item.warehouseId,
              qty: item.qty,
            };
          });

          await manager
            .getRepository('warehouse_skus_stock')
            .save(skuQuentities);
        }

        if (addSkuDto.attributes) {
          const skuAttributes = addSkuDto.attributes.map((item) => {
            return {
              skuId: newSku.id,
              key: item.key,
              value: item.value,
            };
          });

          await manager.getRepository('sku_attribute').save(skuAttributes);
        }
      });
      // await queryRunner.commitTransaction();
      // await queryRunner.release();

      await this.searchService.removeSkuFromIndex(newSku?.id);
      await this.searchService.addedSkuFromIndex(newSku?.id);

      const sku = await this.skuRepository.findOne({
        where: { id: newSku.id },
        relations: [
          'attributes',
          'warehouseSkusStock',
          'warehouseSkusStock.warehouses',
        ],
      });

      const productId = sku?.['productId'];
      const oldData = {};

      await this.insertProductLog(
        user,
        productId,
        'product',
        'Product Added New Sku',
        oldData,
        sku,
      );

      return sku;
    } catch (e) {
      // await queryRunner.rollbackTransaction();
      // await queryRunner.release();
      throwError(HttpStatus.INTERNAL_SERVER_ERROR, [], e.message);
    }
  }

  async findLog(
    user,
    perPage = 10,
    currentPage = 0,
    productId = null,
    userId = null,
    status = null,
  ) {
    let whereRawCondition = 'product_log.deleted_at IS NULL';

    // if productId query exits
    if (productId) {
      whereRawCondition += ` AND product_log.product_id = '${productId}'`;
    }

    // if userId query exits
    if (userId) {
      whereRawCondition += ` AND product_log.user_id = '${userId}'`;
    }

    // if status query exits
    if (status) {
      whereRawCondition += ` AND product_log.status = '${status}'`;
    }

    const [logs, total] = await this.productLogRepository
      .createQueryBuilder('product_log')
      .where(whereRawCondition)
      .leftJoinAndSelect('product_log.user', 'user')
      .leftJoinAndSelect('product_log.product', 'product')
      .leftJoinAndSelect('product.skus', 'skus')
      .orderBy('product_log.createdAt', 'DESC')
      .take(perPage)
      .skip(currentPage * perPage)
      .getManyAndCount();

    return {
      data: logs,
      perPage: perPage,
      currentPage: currentPage + 1,
      totalPage: Math.ceil(total / perPage),
      totalResult: total,
    };
  }
}
