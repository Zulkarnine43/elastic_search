import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Like, Repository } from 'typeorm';
import { throwError } from '../../../common/errors/errors.function';
import { sluggify } from '../../../common/helpers/helpers.function';
import { Brand } from '../../brand/entities/brand.entity';
import { Category } from '../../category/entities/category.entity';
import { CategoryService } from '../../category/services/category.service';
import { ProductCampaignDto } from '../dto/product-campaign.dto';
import { Campaign } from '../entities/campaign.entity';
import { Product } from '../entities/product.entity';
import { Sku } from '../entities/sku.entity';
import { DiscountType } from './product.service';
import { StorefrontService } from './storefront.service';

@Injectable()
export class CampaignService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
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
  ) {}

  // create campaign
  async campaign(user, productCampaign: ProductCampaignDto) {
    // if category and brand and include sku not entired then throw error
    if (
      !productCampaign?.categoryId?.length &&
      !productCampaign?.brandId?.length &&
      !productCampaign?.includeSku?.length
    ) {
      console.log('error', 'Category, Brand, Include Sku not found');

      throwError(
        HttpStatus.BAD_REQUEST,
        [],
        'Category, Brand, Include Sku not found',
      );
    }
    try {
      // check category and brand exist or not
      if (productCampaign?.categoryId?.length > 0) {
        for (let i = 0; i < productCampaign.categoryId.length; i++) {
          const cat = productCampaign.categoryId[i];
          const category = await this.categoryRepository.findOne({
            where: { id: cat },
          });

          if (!category)
            throwError(HttpStatus.BAD_REQUEST, [], 'Category not found');
        }
      }

      if (productCampaign?.brandId?.length > 0) {
        for (let i = 0; i < productCampaign.brandId.length; i++) {
          const b = productCampaign.brandId[i];
          const brand = await this.brandRepository.findOne({
            where: { id: b },
          });

          if (!brand) throwError(HttpStatus.BAD_REQUEST, [], 'Brand not found');
        }
      }
      // find category id
      let categoryItems = [];
      if (productCampaign?.categoryId?.length > 0) {
        const allCategories = await this.categoryRepository.find({
          where: { deletedAt: null },
        });

        for (let i = 0; i < productCampaign.categoryId.length; i++) {
          const cat = productCampaign.categoryId[i];
          const nestedCategoryIds =
            await this.storefrontProductService.findNestedCategory(
              allCategories,
              cat,
            );
          categoryItems.push(...nestedCategoryIds, cat);
        }
      }
      // get all product by category id and brand id
      const skuQuery = this.skuRepository
        .createQueryBuilder('sku')
        .leftJoinAndSelect('sku.product', 'product')
        .select([
          'sku.id',
          'sku.sku',
          'sku.price',
          'product.id',
          'product.name',
          'product.slug',
          'product.categoryId',
          'product.brandId',
        ]);
      // if category idfound
      if (categoryItems.length > 0) {
        skuQuery.where('product.categoryId IN (:...categoryItems)', {
          categoryItems,
        });
      }

      // if brand id found
      if (productCampaign?.brandId?.length > 0) {
        skuQuery.andWhere('product.brandId IN (:...brandId)', {
          brandId: productCampaign.brandId,
        });
      }
      // if include and exclude sku found
      if (productCampaign?.includeSku?.length > 0) {
        skuQuery.andWhere('sku.sku IN (:...includeSku)', {
          includeSku: productCampaign.includeSku,
        });
      }

      if (productCampaign?.excludeSku?.length > 0) {
        skuQuery.andWhere('sku.sku NOT IN (:...excludeSku)', {
          excludeSku: productCampaign.excludeSku,
        });
      }

      let skus = await skuQuery.orderBy('sku.id', 'DESC').getMany();

      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      let saveCampaign;
      try {
        // insert campaign data
        // Generate slug
        let slug = sluggify(productCampaign.name);
        let isSlugExist;
        // verify slug exist or not
        try {
          isSlugExist = await this.campaignRepository.findOne({
            where: { slug: slug },
          });
        } catch (e) {
          console.log(e);
          throwError(
            HttpStatus.INTERNAL_SERVER_ERROR,
            [],
            'Cannot create slug',
          );
        }

        // if slug exist add random number with slug
        if (isSlugExist) {
          slug = slug + Math.floor(Math.random() * 1000);
        }
        const campaignData = {
          startDate: new Date(productCampaign.startDate),
          endDate: new Date(productCampaign.endDate),
          discountType: productCampaign.discountType,
          discountValue: productCampaign.discountValue,
          name: productCampaign.name,
          slug: slug,
          logo: productCampaign.logo,
          brandId:
            productCampaign?.brandId?.length > 0
              ? productCampaign?.brandId?.join(',')
              : null,
          categoryId:
            productCampaign?.categoryId?.length > 0
              ? productCampaign?.categoryId?.join(',')
              : null,
          excludeSku:
            productCampaign?.excludeSku.length > 0
              ? productCampaign?.excludeSku.join(',')
              : null,
          includeSku:
            productCampaign?.includeSku.length > 0
              ? productCampaign?.includeSku.join(',')
              : null,
        };

        // insert campaign data
        saveCampaign = await queryRunner.manager
          .getRepository('campaign')
          .save({
            ...campaignData,
          });

        // update product campaign
        for (let i = 0; i < skus.length; i++) {
          const sku = skus[i];

          let discountedPrice;
          if (productCampaign.discountType === DiscountType.AMOUNT) {
            const discountedAmount = productCampaign.discountValue;
            discountedPrice = sku.price - discountedAmount;
          } else if (productCampaign.discountType === DiscountType.PERCENTAGE) {
            const discountedAmount = Number(
              (sku.price * (productCampaign.discountValue / 100)).toFixed(2),
            );
            discountedPrice = sku.price - discountedAmount;
          }
          // update sku
          const isUpdate = await queryRunner.manager
            .getRepository('sku')
            .createQueryBuilder('sku')
            .update()
            .set({
              discountedType: productCampaign.discountType,
              discountedValue: productCampaign.discountValue,
              discountedPrice: discountedPrice,
              discountedPriceStart: productCampaign.startDate,
              discountedPriceEnd: productCampaign.endDate,
            })
            .where('id = :id', { id: sku.id })
            .execute();
          // console.log('sku', sku.price, discountedPrice, isUpdate);
        }
        await queryRunner.commitTransaction();
      } catch (error) {
        console.log('error', error.message);
        await queryRunner.rollbackTransaction();
        await queryRunner.release();

        throwError(
          HttpStatus.INTERNAL_SERVER_ERROR,
          [],
          'Cannot create campaign',
        );
      } finally {
        await queryRunner.release();
      }

      return saveCampaign;
    } catch (error) {
      console.log('error', error.message);

      throwError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        [],
        'Cannot create campaign',
      );
    }
  }

  // find all campaign
  async findAll(user, perPage: number, currentPage: number, search = '') {
    try {
      // where condition
      let filter = {};
      if (search) {
        filter = {
          ...filter,
          name: Like('%' + search + '%'),
        };
      }
      const [campaigns, total] = await this.campaignRepository.findAndCount({
        order: { id: 'DESC' },
        where: filter,
        withDeleted: true,
        take: perPage,
        skip: perPage * currentPage,
      });

      // get details brand and category of campaign
      for (let i = 0; i < campaigns.length; i++) {
        const campaign = campaigns[i];
        const brandIds = campaign.brandId?.split(',');
        const categoryIds = campaign.categoryId?.split(',');
        let brands = [];
        if (brandIds?.length > 0) {
          for (let j = 0; j < brandIds.length; j++) {
            const brand = await this.brandRepository.findOne({
              where: { id: Number(brandIds[j]) },
              select: ['id', 'name', 'slug', 'logo'],
            });
            brands.push(brand);
          }
        }
        let categories = [];
        if (categoryIds?.length > 0) {
          for (let j = 0; j < categoryIds.length; j++) {
            const category = await this.categoryRepository.findOne({
              where: { id: Number(categoryIds[j]) },
              select: ['id', 'name', 'slug', 'logo'],
            });
            const breadcrumb =
              await this.categoryService.generateListBreadcrumb(category);
            category['breadcrumb'] = breadcrumb;
            categories.push(category);
          }
        }
        campaign['brands'] = brands;
        campaign['categories'] = categories;
      }

      const response = {
        data: campaigns,
        perPage: perPage,
        currentPage: currentPage + 1,
        totalPage: Math.ceil(total / perPage),
        totalResult: total,
      };

      return response;
    } catch (error) {
      console.log('error', error.message);

      throwError(HttpStatus.INTERNAL_SERVER_ERROR, [], 'Cannot find campaign');
    }
  }

  // find all campaign
  async findBySlug(user, slug: string) {
    try {
      const campaign = await this.campaignRepository.findOne({
        where: { slug: slug },
      });

      // if campaign not found
      if (!campaign)
        throwError(HttpStatus.BAD_REQUEST, [], 'Campaign not found');

      // get details brand and category of campaign

      const brandIds = campaign.brandId?.split(',');
      const categoryIds = campaign.categoryId?.split(',');
      let brands = [];
      if (brandIds?.length > 0) {
        for (let j = 0; j < brandIds.length; j++) {
          const brand = await this.brandRepository.findOne({
            where: { id: Number(brandIds[j]) },
            select: ['id', 'name', 'slug', 'logo'],
          });
          brands.push(brand);
        }
      }
      let categories = [];
      if (categoryIds?.length > 0) {
        for (let j = 0; j < categoryIds.length; j++) {
          const category = await this.categoryRepository.findOne({
            where: { id: Number(categoryIds[j]) },
            select: ['id', 'name', 'slug', 'logo'],
          });
          const breadcrumb = await this.categoryService.generateListBreadcrumb(
            category,
          );
          category['breadcrumb'] = breadcrumb;
          categories.push(category);
        }
      }
      campaign['brands'] = brands;
      campaign['categories'] = categories;

      return campaign;
    } catch (error) {
      console.log('error', error.message);

      throwError(HttpStatus.INTERNAL_SERVER_ERROR, [], 'Cannot find campaign');
    }
  }

  // // find by slug
  // async findBySlug(user, slug: string) {
  //   try {
  //     // check campaign exits or not
  //     const campaign = await this.campaignRepository.findOne({
  //       where: { slug: slug },
  //     });
  //     if (!campaign)
  //       throwError(HttpStatus.BAD_REQUEST, [], 'Campaign not found');
  //     // find category id
  //     let categoryItems = [];
  //     if (campaign.categoryId) {
  //       const allCategories = await this.categoryRepository.find({
  //         where: { deletedAt: null },
  //       });
  //       const campaignCategoryIds = campaign.categoryId.split(',');

  //       for (let i = 0; i < campaignCategoryIds.length; i++) {
  //         const cat = Number(campaignCategoryIds[i]);
  //         const nestedCategoryIds =
  //           await this.storefrontProductService.findNestedCategory(
  //             allCategories,
  //             cat,
  //           );
  //         categoryItems.push(...nestedCategoryIds, cat);
  //       }
  //     }

  //     // get all product by category id and brand id
  //     const skuQuery = this.skuRepository
  //       .createQueryBuilder('sku')
  //       .leftJoin('sku.product', 'product')
  //       .leftJoin('product.brand', 'brand')
  //       .leftJoin('product.category', 'category')
  //       .select([
  //         'sku.id',
  //         'sku.sku',
  //         'sku.price',
  //         'sku.discountedType',
  //         'sku.discountedValue',
  //         'sku.discountedPrice',
  //         'sku.discountedPriceStart',
  //         'sku.discountedPriceEnd',
  //         'product.id',
  //         'product.name',
  //         'product.slug',
  //         'product.categoryId',
  //         'product.brandId',
  //         'brand.id',
  //         'brand.name',
  //         'brand.slug',
  //         'brand.logo',
  //         'category.id',
  //         'category.name',
  //         'category.slug',
  //         'category.logo',
  //       ]);
  //     // if category idfound
  //     if (categoryItems.length > 0) {
  //       skuQuery.where('product.categoryId IN (:...categoryItems)', {
  //         categoryItems,
  //       });
  //     }

  //     // if brand id found
  //     if (campaign.brandId) {
  //       const brandIds = campaign.brandId.split(',').map(Number);
  //       skuQuery.andWhere('product.brandId IN (:...brandId)', {
  //         brandId: brandIds,
  //       });
  //     }
  //     // if include and exclude sku found
  //     if (campaign.includeSku) {
  //       const includeSku = campaign.includeSku.split(',');
  //       skuQuery.andWhere('sku.sku IN (:...includeSku)', {
  //         includeSku: includeSku,
  //       });
  //     }

  //     if (campaign.excludeSku) {
  //       const excludeSku = campaign.excludeSku.split(',');
  //       skuQuery.andWhere('sku.sku NOT IN (:...excludeSku)', {
  //         excludeSku: excludeSku,
  //       });
  //     }

  //     let skus = await skuQuery.orderBy('sku.id', 'DESC').getMany();

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

  // find by slug
  async findByCampaignProductBySlug(
    user,
    slug: string,
    perPage = 10,
    currentPage = 0,
  ) {
    try {
      // check campaign exits or not
      const campaign = await this.campaignRepository.findOne({
        where: { slug: slug },
      });
      if (!campaign)
        throwError(HttpStatus.BAD_REQUEST, [], 'Campaign not found');
      // find category id
      let categoryItems = [];
      if (campaign.categoryId) {
        const allCategories = await this.categoryRepository.find({
          where: { deletedAt: null },
        });
        const campaignCategoryIds = campaign.categoryId.split(',');

        for (let i = 0; i < campaignCategoryIds.length; i++) {
          const cat = Number(campaignCategoryIds[i]);
          const nestedCategoryIds =
            await this.storefrontProductService.findNestedCategory(
              allCategories,
              cat,
            );
          categoryItems.push(...nestedCategoryIds, cat);
        }
      }

      const query = this.productRepository
        .createQueryBuilder('p')
        .select([
          'p.name AS name',
          'p.slug AS slug',
          'p.thumbnail AS thumbnail',
          'p.id AS p_id',
          'p.status AS p_status',
          'b.name AS brand_name',
          'b.logo AS brand_logo',
          'b.id AS brand_id',
          'c.name AS category_name',
          'c.id AS category_id',
          'MIN(s.price) AS price',
          'MIN(s.discounted_price) AS discounted_price',
          'COALESCE(sku_counts.sku_count, 0) AS sku_count',
          'COALESCE(stock_quantities.total_quantity, 0) AS stockQuantity',
        ])
        .leftJoin(
          'p.skus',
          's',
          's.status = :status AND s.deleted_at IS NULL',
          {
            status: 'active',
          },
        )
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
        .having('p_status = :status', {
          status: 'active',
        })
        .groupBy('p.id')
        .orderBy('p.id', 'DESC');

      // if category idfound
      if (categoryItems.length > 0) {
        query.where('p.categoryId IN (:...categoryItems)', {
          categoryItems,
        });
      }

      // if brand id found
      if (campaign.brandId) {
        const brandIds = campaign.brandId.split(',').map(Number);
        query.andWhere('p.brandId IN (:...brandId)', {
          brandId: brandIds,
        });
      }
      // if include and exclude sku found
      if (campaign.includeSku) {
        const includeSku = campaign.includeSku.split(',');
        query.andWhere('s.sku IN (:...includeSku)', {
          includeSku: includeSku,
        });
      }

      if (campaign.excludeSku) {
        const excludeSku = campaign.excludeSku.split(',');
        query.andWhere('s.sku NOT IN (:...excludeSku)', {
          excludeSku: excludeSku,
        });
      }

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
      return response;
    } catch (error) {
      console.log('error', error.message);

      throwError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        [],
        'Cannot update campaign',
      );
    }
  }

  // delete campaign
  async deleteCampaign(user, id: number) {
    try {
      const campaign = await this.campaignRepository.findOne({
        where: { id: id },
      });
      if (!campaign)
        throwError(HttpStatus.BAD_REQUEST, [], 'Campaign not found');

      // find enter brand and category and skus
      const brandIds = campaign.brandId?.split(',').map(Number);
      const categoryIds = campaign.categoryId?.split(',').map(Number);
      const includeSku = campaign.includeSku?.split(',');
      const excludeSku = campaign.excludeSku?.split(',');
      // get all product by category id and brand id
      const skuQuery = this.skuRepository
        .createQueryBuilder('sku')
        .leftJoinAndSelect('sku.product', 'product')
        .select([
          'sku.id',
          'sku.sku',
          'sku.price',
          'product.id',
          'product.name',
          'product.slug',
          'product.categoryId',
          'product.brandId',
        ]);
      // if category idfound
      if (categoryIds?.length > 0) {
        skuQuery.where('product.categoryId IN (:...categoryIds)', {
          categoryIds,
        });
      }

      // if brand id found
      if (brandIds?.length > 0) {
        skuQuery.andWhere('product.brandId IN (:...brandId)', {
          brandId: brandIds,
        });
      }
      // if include and exclude sku found
      if (includeSku?.length > 0) {
        skuQuery.andWhere('sku.sku IN (:...includeSku)', {
          includeSku: includeSku,
        });
      }

      if (excludeSku?.length > 0) {
        skuQuery.andWhere('sku.sku NOT IN (:...excludeSku)', {
          excludeSku: excludeSku,
        });
      }

      let skus = await skuQuery.orderBy('sku.id', 'DESC').getMany();

      // delete campaign and update skus
      await this.dataSource.transaction(async (manager) => {
        // delete campaign
        await manager.getRepository('campaign').softDelete({ id: id });

        // update sku
        for (let i = 0; i < skus.length; i++) {
          const sku = skus[i];

          await manager
            .getRepository('sku')
            .createQueryBuilder('sku')
            .update()
            .set({
              discountedType: null,
              discountedValue: null,
              discountedPrice: 0,
              discountedPriceStart: null,
              discountedPriceEnd: null,
            })
            .where('id = :id', { id: sku.id })
            .execute();
        }
      });

      // check campaign exits
      const isCampaign = await this.campaignRepository.findOne({
        where: { id: id },
      });
      if (isCampaign)
        throwError(HttpStatus.BAD_REQUEST, [], 'Cannot delete campaign');

      return {
        status: 'success',
        message: 'Campaign deleted successfully',
        code: HttpStatus.OK,
      };
    } catch (error) {
      console.log('error', error);

      throwError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        [],
        'Cannot delete campaign',
      );
    }
  }
}
