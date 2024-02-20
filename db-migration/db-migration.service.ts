import { Inject, Injectable, NotFoundException, forwardRef } from '@nestjs/common';
import { MediaSoftProductDto, MediaSoftProductStockDto } from './dto/create-db-migration.dto';
import { ApiService } from './api.service';
import * as knex from 'knex';
import { InjectConnection } from 'nest-knexjs';
import { UpdateExportCronSettings } from './dto/update-cron-settings.dto';
import { CronService } from 'src/cron/cron.service';
import { TaskScheduleService } from 'src/cron/task-scheduler.service';
import { SearchService } from 'src/modules/search/search.service';

@Injectable()
export class DbMigrationService {
  private imagePrefix = 'product/';
  private brandPrefix = 'brand/';

  constructor(
    @Inject(forwardRef(() => CronService))
    private readonly cronService: CronService,
    private readonly taskScheduleService: TaskScheduleService,
    private readonly searchService: SearchService,
    @InjectConnection() private readonly saas: knex.Knex,
  ) { }

  // update db-migration cron settings
  async updateDbMigrationCronSettings(updateCronDto: UpdateExportCronSettings) {
    const cronRecord = await this.saas('settings').where('type', 'migration-cron').first();

    if (cronRecord) {
      await this.saas('settings').update({ ...updateCronDto, updated_at: new Date() }).where('type', 'migration-cron');
    } else {
      await this.saas('settings').insert({ type: 'migration-cron', ...updateCronDto });
    }
    this.cronService.startDbMigrationCronJob(updateCronDto.schedule_minutes);

    return cronRecord;
  }

  // update order cron settings
  async updateOrderCronSettings(updateCronDto: UpdateExportCronSettings) {
    const cronRecord = await this.saas('settings').where('type', 'order-cron').first();

    if (cronRecord) {
      await this.saas('settings').update({ ...updateCronDto, updated_at: new Date() }).where('type', 'order-cron');
    } else {
      await this.saas('settings').insert({ type: 'order-cron', ...updateCronDto });
    }

    this.cronService.startOrderStatusUpdateCronJob(updateCronDto.schedule_minutes);
    return cronRecord;
  }

  // return media soft products
  async getMediaSoftProduct(mediaSoftProductDto?: MediaSoftProductDto) {
    const apiService = new ApiService();
    await apiService.login();
    return await apiService.mediaSoftApi(mediaSoftProductDto);
  }

  // return media soft products
  async getMediaSoftProductStock(mediaSoftProductStockDto: MediaSoftProductStockDto) {
    const apiService = new ApiService();
    await apiService.login();
    return await apiService.mediaSoftStockApi(mediaSoftProductStockDto);
  }

  // migrate with new database from media soft product
  async migrateMediaSoftGadgetModelProduct(mediaSoftProductDto?: MediaSoftProductDto) {

    const products = await this.getMediaSoftProduct(mediaSoftProductDto);
    if (!products?.data) {
      throw new NotFoundException('product not found');
    }

    // return products.data;
    // create category
    const mediaSoftCategoriesSet = new Set(products.data.map(product => product.categoryName));
    const newDbCategories = await this.saas('category');
    const newDbCategoriesMap = new Map(newDbCategories?.map(category => [category.name, category.id]));

    const createCategoryPromise = [...mediaSoftCategoriesSet].map(async (category) => {
      if (!newDbCategoriesMap.has(category)) {
        const [newCategoryId] = await this.saas('category').insert({ name: String(category), slug: this.generateSlug(String(category)), leaf: 0 });
        newDbCategoriesMap.set(category, newCategoryId);
      }
    });

    // create brand
    const mediaSoftBrandsSet = new Set(products.data.map(product => product.brandName));
    const newDbBrands = await this.saas('brand');
    const newDbBrandsMap = new Map(newDbBrands?.map(brand => [String(brand.name).toLowerCase(), brand.id]));

    const createBrandPromise = [...mediaSoftBrandsSet].map(async (brandName) => {
      if (!newDbBrandsMap.has(String(brandName).toLowerCase())) {
        const [newBrandId] = await this.saas('brand').insert({ name: String(brandName), slug: this.generateSlug(String(brandName)) });
        newDbBrandsMap.set(String(brandName).toLowerCase(), newBrandId);
      }
    });

    await Promise.all([...createCategoryPromise, ...createBrandPromise]);

    // return [...newDbBrandsMap];
    // create map for all new products
    // const allNewProducts = await this.saas('product').select('id', 'mediasoft_model_id', 'name');
    // const allNewProductsMap = new Map(allNewProducts?.map(product => [product.mediasoft_model_id, product]));

    const allSkuProducts = await this.saas('sku').select('id', 'custom_sku');
    const allSkuProductsMap = new Map(allSkuProducts?.map(product => [product.custom_sku, product.id]));

    // return [...allSkuProductsMap];

    const willInsertProductsMap = new Map();
    const willInsertGadgetProductMap = new Map();
    const willInsertGadgetSkuProductMap = new Map();

    products.data?.forEach(async (product) => {

      const checkMultipleGadgetProductMap = new Map();

      product.productDetailResponses?.forEach((subProduct) => {
        const existedSkuProductId = allSkuProductsMap.get(subProduct.pBarCode);

        if (!existedSkuProductId) {
          const categoryId = newDbCategoriesMap.get(product.categoryName);
          const brandId = newDbBrandsMap.get(String(product.brandName).toLowerCase());

          if (product.categoryName != 'Live Demo') {
            willInsertProductsMap.set(Number(product.modelId), {
              mediasoft_model_id: product.modelId,
              mediasoft_model_name: product.modelName,
              name: product.modelName,
              category_id: categoryId,
              brand_id: brandId,
              status: 'draft'
            });

            // if (subProduct.gadgetModelID) {
            //   checkMultipleGadgetProductMap.set(subProduct.gadgetModelID, subProduct);
            // }
          }
        }


        checkMultipleGadgetProductMap.set(subProduct.gadgetModelID, subProduct);
      });


      if (checkMultipleGadgetProductMap.size > 1) {

        for (let [key, targetProduct] of checkMultipleGadgetProductMap) {
          const isExistSku = allSkuProductsMap.get(targetProduct.pBarCode)
          if (key && !isExistSku) {

            const categoryId = newDbCategoriesMap.get(targetProduct.categoryName);
            const brandId = newDbBrandsMap.get(String(targetProduct.brandName).toLowerCase());

            willInsertGadgetProductMap.set(targetProduct.pBarCode, {
              mediasoft_model_id: targetProduct.modelId,
              mediasoft_model_name: targetProduct.modelName,
              name: targetProduct.modelName,
              category_id: categoryId,
              brand_id: brandId,
              item_id: targetProduct.itemId,
              gadget_model_id: targetProduct.gadgetModelID,
              status: 'draft',
              sku: targetProduct.pBarCode,
            });

            willInsertGadgetSkuProductMap.set(targetProduct.pBarCode, targetProduct);
          }
        }
      }
    });


    // return [...willInsertGadgetSkuProductMap.values()];

    const willInsertProducts = [...willInsertProductsMap.values()];
    const willInsertGadgetProducts = [...willInsertGadgetProductMap.values()];

    if (willInsertProducts.length || willInsertGadgetProducts.length) {
      const existedProducts = await this.saas('product').whereIn('mediasoft_model_id', willInsertProducts.map(product => product.mediasoft_model_id));
      const existedGadgetProducts = await this.saas('product').whereIn('sku', willInsertGadgetProducts.map(product => product.sku));
      // return existedProducts;
      existedProducts?.forEach(product => {
        willInsertProductsMap.delete(product.mediasoft_model_id);
      })

      existedGadgetProducts?.forEach(product => {
        willInsertGadgetProductMap.delete(product.sku);
      })
    }
    // return [...willInsertGadgetProductMap.values()];
    // return [...willInsertProductsMap.values()];

    if ([...willInsertProductsMap.values()].length) {

      const insertProductIds = await this.saas('product').insert([...willInsertProductsMap.values()]);
      if (insertProductIds && insertProductIds.length > 0) {
        await this.searchService.removeMediaSoftSkusFromIndex(insertProductIds);
        await this.searchService.addedMediaSoftProductFromIndex(insertProductIds);
      }
    }

    if ([...willInsertGadgetProductMap.values()].length) {

      const insertGadgetProductIds = await this.saas('product').insert([...willInsertGadgetProductMap.values()]);
      if (insertGadgetProductIds && insertGadgetProductIds.length > 0) {
        await this.searchService.removeMediaSoftSkusFromIndex(insertGadgetProductIds);
        await this.searchService.addedMediaSoftProductFromIndex(insertGadgetProductIds);
      }
    }

    // return [...willInsertGadgetSkuProductMap.keys()];
    const willInsertNewSku = [];
    const newGadgetProducts = await this.saas('product').whereIn('sku', [...willInsertGadgetSkuProductMap.keys()]).andWhereNot('mediasoft_model_id', null);
    // return newGadgetProducts;
    newGadgetProducts.forEach(product => {
      const newSkuProduct = willInsertGadgetSkuProductMap.get(product.sku);

      if (newSkuProduct) {
        willInsertNewSku.push({ product_id: product.id, ...newSkuProduct });
      }
    })



    // return willInsertNewSku;
    const promise = willInsertNewSku.map(async (subProduct) => {
      const [skuId] = await this.saas('sku').insert({
        product_id: subProduct.product_id,
        sku: subProduct.pBarCode,
        custom_sku: subProduct.pBarCode,
        stock_quantity: 1,
        price: subProduct.salePrice,
        discounted_price: subProduct.salePrice,
        cost_price: subProduct.costPrice,
        point_earn: subProduct.pointEarn,
        sbarcode: subProduct.sBarCode,
        vat: subProduct.vatPercent,
        gadget_model_id: subProduct.gadgetModelID,
        item_id: subProduct.itemId,
      });

      return await this.saas('sku_attribute').insert([{
        sku_id: skuId,
        key: 'Color',
        value: subProduct.colorName,
      }, {
        sku_id: skuId,
        key: 'Memory',
        value: subProduct.memoryCapacity,
      }]);
    });

    await Promise.all(promise);
    // return willInsertNewSku;
    return {
      insertedSku: willInsertNewSku,
      insertedGadgetProduct: [...willInsertGadgetProductMap.values()],
      insertedProduct: [...willInsertProductsMap.values()]
    }
  }

  // migrate with new database from media soft product
  async migrateMediaSoftProduct(mediaSoftProductDto?: MediaSoftProductDto) {

    const products = await this.getMediaSoftProduct(mediaSoftProductDto);
    if (!products?.data) {
      throw new NotFoundException('product not found');
    }

    const newParentProducts = await this.saas('product').whereNotNull('mediasoft_model_id');
    const newParentProductsMap = new Map(newParentProducts?.map(product => [String(product.mediasoft_model_id) + (product.gadget_model_id || ''), product.id]));
    const newParentGadgetProductsMap = new Map();

    newParentProducts?.forEach(product => {
      if (product.gadget_model_id) {
        newParentGadgetProductsMap.set(product.gadget_model_id, product.id);
      }
    })

    // // return [...newParentGadgetProductsMap];


    const allNewSkuProducts = await this.saas('sku').select('id', 'sku', 'custom_sku', 'price', 'point_earn', 'vat', 'item_id', 'model_no', 'discounted_type', 'discounted_value');
    const allNewSkuProductsMap = new Map(allNewSkuProducts?.map(product => [product.custom_sku, product]));

    const insertedProduct = [];
    const updatedSku = [];

    // return [...allNewSkuProductsMap];
    const migratePromises = products.data?.map(async (product) => {

      return product.productDetailResponses?.map(async (subProduct) => {
        const existedSkuProduct = allNewSkuProductsMap.get(subProduct.pBarCode);

        if (existedSkuProduct) {
          if (
            existedSkuProduct.price != subProduct.salePrice ||
            existedSkuProduct.point_earn != subProduct.pointEarn ||
            existedSkuProduct.vat != subProduct.vatPercent ||
            existedSkuProduct.model_no != subProduct.modelNo
          ) {
            const updateBody = {
              price: subProduct.salePrice,
              cost_price: subProduct.costPrice,
              point_earn: subProduct.pointEarn,
              sbarcode: subProduct.sBarCode,
              vat: subProduct.vatPercent,
              gadget_model_id: subProduct.gadgetModelID,
              item_id: subProduct.itemId,
              model_no: subProduct.modelNo,
              updated_at: new Date()
            };

            if (
              existedSkuProduct.price != subProduct.salePrice &&
              existedSkuProduct.discounted_type &&
              existedSkuProduct.discounted_value
            ) {
              if (existedSkuProduct.discounted_type === 'percentage') {
                const discounted_price = updateBody.price - (updateBody.price * (Number(existedSkuProduct.discounted_value) / 100));
                updateBody['discounted_price'] = discounted_price;

              } else if (existedSkuProduct.discounted_type === 'amount') {
                const discounted_price = updateBody.price - Number(existedSkuProduct.discounted_value);
                updateBody['discounted_price'] = discounted_price;
              }
            }

            updatedSku.push({
              ...updateBody,
              id: existedSkuProduct.id,
              sku: subProduct.pBarCode,
              prev_price: existedSkuProduct.price,
              prev_point_earn: existedSkuProduct.point_earn,
              prev_vat: existedSkuProduct.vat,
              discounted_type: existedSkuProduct.discounted_type,
              discounted_value: existedSkuProduct.discounted_value
            });
            const updateData = await this.saas('sku').update(updateBody).where('id', existedSkuProduct.id);
            if (updateData) {
              await this.searchService.removeSkuFromIndex(existedSkuProduct?.id);
              await this.searchService.addedSkuFromIndex(existedSkuProduct?.id);
            }
            return updateData
          }

        } else if (subProduct.categoryName != 'Live Demo') {
          const productId = newParentProductsMap.get(String(Number(subProduct.modelId)) + (subProduct.gadgetModelID || ''));

          if (productId) {
            const insertBody = {
              product_id: productId,
              sku: subProduct.pBarCode,
              custom_sku: subProduct.pBarCode,
              stock_quantity: 1,
              price: subProduct.salePrice,
              discounted_price: subProduct.salePrice,
              cost_price: subProduct.costPrice,
              point_earn: subProduct.pointEarn,
              sbarcode: subProduct.sBarCode,
              vat: subProduct.vatPercent,
              gadget_model_id: subProduct.gadgetModelID,
              item_id: subProduct.itemId,
              model_no: subProduct.modelNo
            };

            insertedProduct.push(insertBody);
            const [skuId] = await this.saas('sku').insert(insertBody);

            const attributes = [];
            if (subProduct.colorName != 'N/A') {
              attributes.push({
                sku_id: skuId,
                key: 'Color',
                value: subProduct.colorName,
              });
            }

            if (subProduct.memoryCapacity != 'N/A') {
              attributes.push({
                sku_id: skuId,
                key: 'Memory',
                value: subProduct.memoryCapacity,
              });
            }
            await this.saas('sku_attribute').insert(attributes);
            await this.searchService.removeSkuFromIndex(skuId);
            await this.searchService.addedSkuFromIndex(skuId);
          }
        }
      })
    })

    await Promise.all(migratePromises);

    return { updatedSku, insertedProduct };
  }

  // migrate stock quantity
  async migrateStockQuantity(mediaSoftProductStockDto?: MediaSoftProductStockDto) {
    const stock = await this.getMediaSoftProductStock(mediaSoftProductStockDto);

    if (!stock?.data?.length) {
      throw new NotFoundException('stock not found');
    }

    const warehouses = await this.saas('stock_count_warehouse').groupBy('code');

    const stockListMap = new Map();

    stock.data?.forEach(stockItem => {
      stockItem?.stockList?.forEach(item => {
        const sku = item?.pBarcode?.slice(5) || 'undefined';
        const key = `${sku}_${item.shopID}`;

        if (!stockListMap.has(key)) {
          stockListMap.set(key, {
            shopID: item.shopID,
            sku,
            totalQuantity: Number(item.balQty)
          });
        } else {
          const existedItem = stockListMap.get(key);
          const totalQuantity = existedItem.totalQuantity + Number(item.balQty);
          stockListMap.set(key, { ...existedItem, totalQuantity });
        }
      })
    });

    const skuProducts = await this.saas('sku').select('id', 'sku', 'custom_sku', 'stock_quantity');
    const existedSkuStocks = await this.saas('warehouse_skus_stock')
      .leftJoin(
        'warehouse',
        'warehouse.id',
        '=',
        'warehouse_skus_stock.warehouse_id'
      ).leftJoin(
        'sku',
        'sku.id',
        '=',
        'warehouse_skus_stock.sku_id'
      ).select(
        'warehouse_skus_stock.id as stockId',
        'warehouse.id as warehouse_id',
        'code as store_code',
        'sku_id',
        'sku',
        'custom_sku',
        'qty as quantity'
      );

    // return existedSkuStocks;

    const existedSkuStocksMap = new Map(existedSkuStocks?.map(stockItem => [`${stockItem.custom_sku}_${stockItem.store_code}`, stockItem]));

    const insertItems = [];
    const updateItems = [];


    const skuProductsMap = new Map();
    skuProducts?.forEach(product => {
      skuProductsMap.set(String(product.id), product);

      warehouses?.forEach(warehouse => {
        const key = `${product.custom_sku}_${warehouse.code}`;
        const stockExist = stockListMap.get(key);


        if (stockExist) {
          const existedStock = existedSkuStocksMap.get(key);

          if (existedStock && existedStock.quantity != stockExist.totalQuantity) {

            updateItems.push({
              id: existedStock.stockId,
              qty: stockExist.totalQuantity,
              prev_qty: existedStock.quantity
            })
          } else if (!existedStock) {

            insertItems.push({
              sku_id: product.id,
              warehouse_id: warehouse.id,
              qty: stockExist.totalQuantity,
            })
          }
        }
      });

      // if (skuTotalQty != product.stock_quantity && isStockChange) {
      //   updateTotalCountSku.push({
      //     id: product.id,
      //     sku: product.sku,
      //     stock_quantity: skuTotalQty,
      //     prev_quantity: product.stock_quantity
      //   })
      // }
    });

    // return { updateItems, insertItems };
    if (insertItems.length) {
      await this.saas('warehouse_skus_stock').insert(insertItems);
    }

    if (updateItems.length) {
      const updated = updateItems.map(async (item) => {
        return await this.saas('warehouse_skus_stock').update({ qty: item.qty, updated_at: new Date() }).where('id', item.id);
      });

      await Promise.all(updated);
    }

    const updatedStocks = await this.saas('warehouse_skus_stock').select("sku_id").sum("qty as total_qty").groupBy("sku_id");

    // return updatedStocks;
    const updateTotalCountSku = [];
    updatedStocks?.forEach(stockSku => {
      const existingSku = skuProductsMap.get(String(stockSku.sku_id));

      if (existingSku && existingSku.stock_quantity != stockSku.total_qty) {
        updateTotalCountSku.push({
          sku_id: stockSku.sku_id,
          stock_quantity: Number(stockSku.total_qty),
          prev_quantity: existingSku.stock_quantity
        })
      }
    })

    // return updateTotalCountSku;
    if (updateTotalCountSku.length) {
      const updated = updateTotalCountSku.map(async (item) => {
        const data = await this.saas('sku').update({ stock_quantity: item.stock_quantity, updated_at: new Date() }).where('id', item.sku_id);
        await this.searchService.removeSkuFromIndex(item?.sku_id);
        await this.searchService.addedSkuFromIndex(item?.sku_id);
        return data;
      });

      await Promise.all(updated);
    }

    return { updateTotalCountSku, updateItems: updateItems, insertItems: insertItems };
  }

  // change order status
  async changeOrderStatus(minutes: number) {

    let currentDate = new Date();
    currentDate.setMinutes(currentDate.getMinutes() - minutes);
    currentDate.setHours(currentDate.getHours() + 6);

    const updatedCount = await this.saas('order').update({ status: 'Cancelled By Cron' })
      .whereIn('payment_method', ['bkash', 'portpos', 'online_payment'])
      .andWhere('payment_status', 'unpaid')
      .andWhere('status', 'Pending')
      .andWhereNot('status', 'Cancelled By Cron')
      .andWhere('created_at', '<=', currentDate);

    console.log(`${updatedCount} orders updated.`);
    return updatedCount;
  }

  // migrate product log
  async migrateProductLog() {
    const productLogsRes = (await this.saas('product_log').where({ message: 'Product Sku Update' }).select('id', 'new_data', 'created_at').orderBy('created_at', 'asc'));

    const productLogsMap = new Map();

    productLogsRes?.forEach(log => {
      const product = JSON.parse(log.new_data);
      if (product.customSku && !productLogsMap.has(product.custom_sku)) {
        productLogsMap.set(product.customSku, { ...product, created_at: log.created_at });
      }
    });

    const updatedPromise = [...productLogsMap.values()]?.map(async (product) => {
      const updateBody = {
        discounted_type: product.discountedType,
        discounted_value: product.discountedValue,
        discounted_price: product.discountedPrice,
        discounted_price_start: product.discountedPriceStart ? new Date(product.discountedPriceStart) : null,
        discounted_price_end: product.discountedPriceEnd ? new Date(product.discountedPriceEnd) : null,
        updated_at: new Date()
      };

      await this.saas('sku').update(updateBody).where('custom_sku', product.customSku);
      await this.searchService.removeSkuFromIndex(product?.id);
      await this.searchService.addedSkuFromIndex(product?.id);
      return { ...updateBody, custom_sku: product.customSku, log_created_at: product.created_at, };
    });

    return await Promise.all(updatedPromise);
    // return updatedPromise;
  }

  // generate slug
  private generateSlug(str: string) {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };


  // migration with today
  async migrateMediaSoftInstant() {
    const name = 'db-migration';

    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    const createDate = `${year}-${month + 1}-${day}`;

    const body = {
      categoryName: "",
      productName: "",
      modelName: "",
      brandName: "",
      createDate: createDate
    }

    try {
      const start = new Date();
      const res = await this.migrateMediaSoftGadgetModelProduct();
      const end = new Date();

      await this.taskScheduleService.createTaskScheduler({
        name: name,
        type: "cron-mediasoft-gadget",
        status: 'completed',
        start_date: start,
        end_date: end,
        total_data: JSON.stringify(res)
      });
    } catch (error) {
      console.log(error.message);
    }

    try {
      const start = new Date();
      const res = await this.migrateMediaSoftProduct();
      const end = new Date();

      await this.taskScheduleService.createTaskScheduler({
        name: name,
        type: "cron-mediasoft-product",
        status: 'completed',
        start_date: start,
        end_date: end,
        total_data: JSON.stringify(res)
        // total_data: ''
      });
    } catch (error) {
      console.log(error.message);
    }

    await setTimeout(async () => {
      try {
        const start = new Date();
        const res = await this.migrateStockQuantity();
        const end = new Date();
        await this.taskScheduleService.createTaskScheduler({
          name: name,
          type: "cron-stock-quantity",
          status: 'completed',
          start_date: start,
          end_date: end,
          total_data: JSON.stringify(res)
          // total_data: ''
        });
      } catch (error) {
        console.log(error.message);
      }
    }, 3000)
  }
}
