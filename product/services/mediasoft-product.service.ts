import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Brand } from '../../brand/entities/brand.entity';
import { Category } from '../../category/entities/category.entity';
import { CategoryService } from '../../category/services/category.service';
import { Product } from '../entities/product.entity';
import { Sku } from '../entities/sku.entity';
import { MediasoftProviderModule } from 'src/providers/mediasoft/provider.module';
import { sluggify } from 'src/common/helpers/helpers.function';
import { TaskScheduler } from '../entities/task-scheduler.entity';

export interface PreparedProductData {
  sku: number;
  barcode: string;
  sbarcode: string;
  stylecode: string;
  hscode: string;
  name: string;
  categoryCode: string;
  subcategoryCode: string;
  skus?: Skus[];
}

export interface Skus {
  sku: number;
  companyCode: string;
  barCode: string;
  sbarCode: string;
  styleCode: string;
  vat: number;
  price: number;
  mrpExcludedVat: number;
  stockQuantity: number;
  variations: Variation[];
  skuStocks: SkuStock[];
}

export interface SkuStock {
  storeCode: string;
  storeName: string;
  stockQuantity: number;
}

export interface Variation {
  name: string;
  value: string;
  is_sale_prop: boolean;
}

@Injectable()
export class MediasoftProductService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(Brand)
    private brandRepository: Repository<Brand>,
    @InjectRepository(TaskScheduler)
    private taskSchedule: Repository<TaskScheduler>,
    @InjectRepository(Sku)
    private skuRepository: Repository<Sku>,
    private dataSource: DataSource,
    private categoryService: CategoryService,
    private mediasoftProvider: MediasoftProviderModule,
  ) {}

  // @Cron('0 0 * * * *')
  // async triggerCronJob() {
  //   console.log('Initiating hourly scheduler');

  //   // Find last completed scheduled task
  //   const lastTask = await this.taskSchedule.find({
  //     order: {
  //       taskDate: 'DESC',
  //     },
  //     take: 1,
  //   });

  //   // if the last completed task exist then get the date
  //   let dateString = '';
  //   if (lastTask.length > 0) {
  //     const lastTaskDate = lastTask[0].createdAt;
  //     // subtract 7 days in milliseconds
  //     const pastWeekDate = new Date(lastTaskDate);
  //     const year = pastWeekDate.getFullYear();
  //     const month = ('0' + (pastWeekDate.getMonth() + 1)).slice(-2);
  //     const day = ('0' + pastWeekDate.getDate()).slice(-2);
  //     const hour = ('0' + pastWeekDate.getHours()).slice(-2);
  //     const minute = ('0' + pastWeekDate.getMinutes()).slice(-2);
  //     const second = ('0' + pastWeekDate.getSeconds()).slice(-2);
  //     const millisecond = ('00' + pastWeekDate.getMilliseconds()).slice(-3);

  //     dateString = `${year}${month}${day}${hour}${minute}${second}.${millisecond}`;
  //   } else {
  //     dateString = '19700301111213.617';
  //   }

  //   console.log(dateString);

  //   // Insert to the task schedule table
  //   const taskSchedule = await this.taskSchedule.save({
  //     name: 'Mediasoft Product Sync',
  //     type: 'CRON',
  //     status: 'RUNNING',
  //     taskDate: dateString,
  //   });

  //   await this.syncAll(dateString);

  //   // Update the task schedule table and update the status
  //   await this.taskSchedule.update(taskSchedule.id, {
  //     status: 'COMPLETED',
  //   });
  //   console.log('Completing hourly scheduler');
  // }

  async syncAll(user, date = '19700301111213.617') {
    const response = await this.mediasoftProvider.getProductsByDate(date);

    const products = response?.Data;

    if (!products || !products.length) {
      console.log('No Products found');
      return;
    }

    console.log('length ', products.length);
    const productData = [];
    for (let i = 0; i < products.length; i++) {
      if (products[i]['ITEM_TYPE'] == 'variable') {
        const data: PreparedProductData = {
          sku: products[i]['SKU'],
          barcode: products[i]['BARCODE'],
          sbarcode: products[i]['SBARCODE'],
          stylecode: products[i]['STYLE_CODE'],
          hscode: products[i]['HSCODE'],
          name: products[i]['NAME'],
          categoryCode: products[i]['CATEGORY_CODE'],
          subcategoryCode: products[i]['SUB_CATEGORY_CODE'],
        };

        const skus = [];
        const childProductList = products[i]['ChildProductList'];

        if (childProductList) {
          for (let j = 0; j < products[i]['ChildProductList'].length; j++) {
            // Get the stock from Banani Outlet
            const stockResponse = await this.mediasoftProvider.getProductStock(
              childProductList[j]['BARCODE'],
            );

            let stockQuantity = 0;
            const skuStocks = [];
            if (stockResponse.Data) {
              for (const eachStock of stockResponse.Data.ProductStockList) {
                stockQuantity = stockQuantity + eachStock['SAL_BAL_QTY'];
                const { STORE_CODE, STORE_NAME, SAL_BAL_QTY } = eachStock;
                skuStocks.push({
                  storeCode: STORE_CODE,
                  storeName: STORE_NAME,
                  stockQuantity: SAL_BAL_QTY,
                });
              }
            }

            const variations = [];
            const productAttributeList =
              childProductList[j]['ProductAttributeList'];
            for (let k = 0; k < productAttributeList.length; k++) {
              variations.push({
                name: productAttributeList[k]['VARIANCE_NAME'],
                value: productAttributeList[k]['ATTRIBUTE_NAME'],
                is_sale_prop: productAttributeList[k]['SHOW_BARCODE'],
              });
            }

            // skus['variations'] = variations;

            skus.push({
              sku: childProductList[j]['SKU'],
              companyCode: childProductList[j]['COMPANY_CODE'],
              barCode: childProductList[j]['BARCODE'],
              sbarCode: childProductList[j]['SBARCODE'],
              styleCode: childProductList[j]['STYLE_CODE'],
              vat: childProductList[j]['SAL_VAT_PERCENT'],
              price: childProductList[j]['MRP'],
              mrpExcludedVat: childProductList[j]['MRP_EXCLD_VAT'],
              stockQuantity: stockQuantity,
              variations: variations,
              skuStocks: skuStocks,
            });
          }
        }

        data['skus'] = skus;

        await this.storeProductToDB(data);

        productData.push(data);
      }
    }

    return productData;
  }

  async storeProductToDB(productData: PreparedProductData) {
    console.log('statrting db store....');
    const queryRunner = this.dataSource.createQueryRunner();
    // Check product is already exists or not by barcode
    const productExist = await this.productRepository.findOne({
      where: { barcode: productData.barcode },
    });

    // if exist then update the product else create new

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let newProduct;
      if (productExist) {
        // update product
        newProduct = await queryRunner.manager.getRepository('product').update(
          { id: productExist.id },
          {
            barcode: productData.barcode,
            name: productData.name,
            slug: sluggify(productData.name),
            stylecode: productData.stylecode,
            hscode: productData.hscode,
            categoryCode: productData.categoryCode,
            subcategoryCode: productData.subcategoryCode,
          },
        );
      } else {
        // create product
        newProduct = await queryRunner.manager.getRepository('product').save({
          sku: 'sku-' + productData.sku,
          barcode: productData.barcode,
          name: productData.name,
          slug: sluggify(productData.name),
          stylecode: productData.stylecode,
          hscode: productData.hscode,
          categoryCode: productData.categoryCode,
          subcategoryCode: productData.subcategoryCode,
        });
      }
      // update skus
      const skus = productData.skus;
      for (let i = 0; i < skus.length; i++) {
        const skuExist = await this.skuRepository.findOne({
          where: { barcode: skus[i].barCode, productId: newProduct.id },
        });

        let newSku;
        if (skuExist) {
          newSku = await queryRunner.manager.getRepository('sku').update(
            { id: skuExist.id },
            {
              barcode: skus[i].barCode,
              sbarcode: skus[i].sbarCode,
              stylecode: skus[i].styleCode,
              vat: skus[i].vat,
              price: skus[i].price,
              discountedPrice: skus[i].price,
              stockQuantity: skus[i].stockQuantity,
            },
          );
        } else {
          newSku = await queryRunner.manager.getRepository('sku').save({
            sku: 'sku-' + skus[i].sku,
            productId: newProduct.id,
            companyCode: skus[i].companyCode,
            barcode: skus[i].barCode,
            sbarcode: skus[i].sbarCode,
            stylecode: skus[i].styleCode,
            vat: skus[i].vat,
            price: skus[i].price,
            discountedPrice: skus[i].price,
            stockQuantity: skus[i].stockQuantity,
          });
        }

        if (skuExist) newSku = skuExist;

        console.log('New Sku ', newSku);

        // update sku stock
        for (let j = 0; j < skus[i].skuStocks.length; j++) {
          const eachSkuStock = skus[i].skuStocks[j];
          // check sku stock is already exists or not
          const existSkuStock = await queryRunner.manager
            .getRepository('sku_stock')
            .findOne({
              where: { skuId: newSku.id, storeCode: eachSkuStock.storeCode },
            });

          if (existSkuStock) {
            await queryRunner.manager.getRepository('sku_stock').update(
              { id: existSkuStock.id },
              {
                storeName: eachSkuStock.storeName,
                stockQuantity: eachSkuStock.stockQuantity,
              },
            );
          } else {
            await queryRunner.manager.getRepository('sku_stock').save({
              skuId: newSku.id,
              storeCode: eachSkuStock.storeCode,
              storeName: eachSkuStock.storeName,
              stockQuantity: eachSkuStock.stockQuantity,
            });
          }
        }

        // update specifications
        for (let j = 0; j < skus[i].variations.length; j++) {
          // check is_sale_prop true or false
          // if true then it will be an attributes
          // else it will be specification

          if (skus[i].variations[j].is_sale_prop) {
            const attributeExist = await queryRunner.manager
              .getRepository('sku_attribute')
              .findOne({
                where: {
                  skuId: newSku.id,
                  key: skus[i].variations[j].name,
                  value: skus[i].variations[j].value,
                },
              });

            if (!attributeExist) {
              await queryRunner.manager.getRepository('sku_attribute').save({
                skuId: newSku.id,
                key: skus[i].variations[j].name,
                value: skus[i].variations[j].value,
              });
            }
          } else {
            const specificationExist = await queryRunner.manager
              .getRepository('specification')
              .findOne({
                where: {
                  productId: newProduct.id,
                  key: skus[i].variations[j].name,
                  value: skus[i].variations[j].value,
                },
              });

            if (!specificationExist) {
              await queryRunner.manager.getRepository('specification').save({
                productId: newProduct.id,
                key: skus[i].variations[j].name,
                value: skus[i].variations[j].value,
              });
            }
          }
        }
      }

      await queryRunner.commitTransaction();
      // await queryRunner.release();
    } catch (e) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      console.log(e);
    } finally {
      await queryRunner.release();
    }
  }

  async getStock(user, barCode) {
    const response = await this.mediasoftProvider.getProductStock(barCode);

    return response;
  }
}
