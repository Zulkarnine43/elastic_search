import { ProductSearchBody } from './product-search-body.types';

export interface ProductSearchResult {
  hits: {
    total: number;
    hits: Array<{
      _source: ProductSearchBody;
    }>;
  };
}
