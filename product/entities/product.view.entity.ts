import { ViewColumn, ViewEntity } from 'typeorm';

@ViewEntity({
  name: 'product_view',
  expression: `
  SELECT
    product.id as product_id,
    product.name as product_name,
    product.slug as product_slug,
    product.short_description as product_description,
    product.thumbnail as product_image,
    category.id as product_category_id,
    category.name as product_category_name,
    category.slug as product_category_slug,
    brand.id as product_brand_id,
    brand.name as product_brand_name,
    brand.slug as product_brand_slug,
    brand.banner as brand_image,
    seo.id as seo_id,
    seo.title as seo_title,
    seo.description as seo_description,
    seo.tag as seo_keywords
  FROM
    product
    LEFT JOIN category ON category.id = product.category_id
    LEFT JOIN brand ON brand.id = product.brand_id
    LEFT JOIN seo ON seo.ref_id = product.id
  GROUP BY
     product.id
  ORDER BY
    product.id ASC`,
})
export class ProductView {
  @ViewColumn()
  product_id: number;

  @ViewColumn()
  product_name: string;

  @ViewColumn()
  product_slug: string;

  @ViewColumn()
  product_description: string;

  @ViewColumn()
  product_image: string;

  @ViewColumn()
  product_category_id: number;

  @ViewColumn()
  product_category_name: string;

  @ViewColumn()
  product_category_slug: string;

  @ViewColumn()
  product_brand_id: number;

  @ViewColumn()
  product_brand_name: string;

  @ViewColumn()
  product_brand_slug: string;

  @ViewColumn()
  brand_image: string;

  @ViewColumn()
  seo_id: number;

  @ViewColumn()
  seo_title: string;

  @ViewColumn()
  seo_description: string;

  @ViewColumn()
  seo_keywords: string;

  // @ViewColumn()
  // sku_id: number;

  // @ViewColumn()
  // sku_sku: string;

  // @ViewColumn()
  // sku_price: number;

  // @ViewColumn()
  // sku_discount: number;

  // @ViewColumn()
  // sku_stock_quantity: number;

  // @OneToMany(() => Sku, (item) => item.product)
  // skus: Sku[];
}
