import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Brand } from '../../brand/entities/brand.entity';
import { Category } from '../../category/entities/category.entity';
import { CategoryService } from '../../category/services/category.service';
import { Product } from '../entities/product.entity';
import { Sku } from '../entities/sku.entity';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';
import { throwError } from 'src/common/errors/errors.function';

@Injectable()
export class BulkProductService {
  select = {
    category: {
      id: true,
      name: true,
      slug: true,
      leaf: true,
    },
    brand: {
      id: true,
      name: true,
      slug: true,
    },
    specifications: {
      id: true,
      key: true,
      value: true,
    },
  };

  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(Brand)
    private brandRepository: Repository<Brand>,
    @InjectRepository(Sku)
    private skuRepository: Repository<Sku>,
    private dataSource: DataSource,
    private categoryService: CategoryService,
  ) {}

  async generateExcel(res: Response, user, categoryId) {
    let category;
    try {
      category = await this.categoryRepository.findOne({
        where: { id: categoryId, leaf: true },
        relations: ['attributes'],
      });
    } catch (e) {
      console.log(e);
      throwError(HttpStatus.INTERNAL_SERVER_ERROR, [], 'Something went wrong');
    }

    if (!category) throwError(HttpStatus.NOT_FOUND, [], 'Category not found');

    console.log(category);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Create Product');
    const columns = [
      { header: 'Group', key: 'group', width: 20, outlineLevel: 1 },
      { header: 'Name', key: 'name', width: 30, outlineLevel: 1 },
      { header: 'Thumbnail', key: 'thumbnail', width: 20, outlineLevel: 1 },
      { header: 'Category Id', key: 'categoryId', width: 10, outlineLevel: 1 },
      { header: 'Category', key: 'categoryId', width: 10, outlineLevel: 1 },
      { header: 'Brand', key: 'brandId', width: 10, outlineLevel: 1 },
      {
        header: 'Short Description',
        key: 'shortDescription',
        width: 40,
        outlineLevel: 1,
      },
      {
        header: 'Long Description',
        key: 'longDescription',
        width: 40,
        outlineLevel: 1,
      },
    ];

    if (category.attributes.length > 0) {
      category.attributes.forEach((attribute) => {
        if (!attribute.is_sale_prop) {
          columns.push({
            header: attribute.label,
            key: attribute.id,
            width: 20,
            outlineLevel: 1,
          });
        }
      });
    }

    columns.push(
      ...[
        { header: 'Image1', key: 'image1', width: 20, outlineLevel: 1 },
        { header: 'Image2', key: 'image2', width: 20, outlineLevel: 1 },
        { header: 'Image3', key: 'image3', width: 20, outlineLevel: 1 },
        { header: 'Image4', key: 'image4', width: 20, outlineLevel: 1 },
        { header: 'Image5', key: 'image5', width: 20, outlineLevel: 1 },
        { header: 'Image6', key: 'image6', width: 20, outlineLevel: 1 },
        { header: 'Custom SKU', key: 'customSku', width: 20, outlineLevel: 1 },
      ],
    );

    if (category.attributes.length > 0) {
      category.attributes.forEach((attribute) => {
        if (attribute.is_sale_prop) {
          columns.push({
            header: attribute.label,
            key: attribute.id,
            width: 20,
            outlineLevel: 1,
          });
        }
      });
    }
    // get category attributes

    columns.push(
      ...[
        { header: 'Price', key: 'price', width: 20, outlineLevel: 1 },
        {
          header: 'Discounted Price',
          key: 'discountedPrice',
          width: 20,
          outlineLevel: 1,
        },
        { header: 'Stock', key: 'stockQuantity', width: 10, outlineLevel: 1 },
      ],
    );

    worksheet.columns = columns;

    for (let i = 2; i < 100; i++) {
      const demo = worksheet.getCell(`D${i}`);
      demo.value = category.id;

      const demo2 = worksheet.getCell(`E${i}`);
      demo2.value = category.name;
    }

    const specificationsLength = category.attributes.filter(
      (attribute) => !attribute.is_sale_prop,
    ).length;

    category.attributes
      .filter((attribute) => !attribute.is_sale_prop)
      .forEach((attribute, index) => {
        for (let i = 2; i < 100; i++) {
          const demo = worksheet.getCell(
            `${this.getColumnLetter(index + 9)}${i}`,
          );

          if (
            attribute.type === 'singleSelect' ||
            attribute.type === 'multiSelect'
          ) {
            demo.dataValidation = {
              type: 'list',
              allowBlank: true,
              formulae: [
                this.validationConversation(attribute.options.split(',')),
              ],
            };
          }
        }
      });

    // for sale properties
    const salePropertiesLength = category.attributes.filter(
      (attribute) => attribute.is_sale_prop,
    ).length;

    category.attributes
      .filter((attribute) => attribute.is_sale_prop)
      .forEach((attribute, index) => {
        for (let i = 2; i < 100; i++) {
          const demo = worksheet.getCell(
            `${this.getColumnLetter(index + 16 + specificationsLength)}${i}`,
          );

          if (
            attribute.type === 'singleSelect' ||
            attribute.type === 'multiSelect'
          ) {
            demo.dataValidation = {
              type: 'list',
              allowBlank: true,
              formulae: [
                this.validationConversation(attribute.options.split(',')),
              ],
            };
          }
        }
      });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=' + `${category.name}.xlsx`,
    );

    return workbook.xlsx.write(res).then(function () {
      res.status(200).end();
    });
  }

  getColumnLetter(columnNumber: number) {
    let letter = '';
    while (columnNumber > 0) {
      const remainder = (columnNumber - 1) % 26;
      letter = String.fromCharCode(65 + remainder) + letter;
      columnNumber = (columnNumber - remainder - 1) / 26;
    }
    return letter;
  }

  validationConversation(options) {
    const emptyArray = [];
    let optionsString = '';
    let convertedString = '';
    options.forEach((option) => {
      optionsString += option + ', ';
      emptyArray.push(option);
    });
    convertedString += `'"${optionsString}"'`;
    return convertedString.substring(1, convertedString.length - 1);
  }
}
