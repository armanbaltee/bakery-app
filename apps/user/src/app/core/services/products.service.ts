import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  basePrice: number;
  isCustomizable: boolean;
  stockStatus: string;
  isFeatured: boolean;
  isBestSeller: boolean;
  images: { id: string; url: string; isPrimary: boolean }[];
  category: { id: string; name: string; slug: string };
  variants: { id: string; type: string; label: string; priceModifier: number }[];
  customizationOptions: {
    id: string;
    type: string;
    label: string;
    isRequired: boolean;
    options: { label: string; value: string; priceModifier?: number }[] | null;
  }[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
}

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getProducts(filters: Record<string, unknown> = {}) {
    let params = new HttpParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== '') {
        params = params.set(k, String(v));
      }
    });
    return this.http.get<{
      items: Product[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`${this.api}/products`, { params });
  }

  getProductBySlug(slug: string) {
    return this.http.get<Product>(`${this.api}/products/${slug}`);
  }

  getCategories() {
    return this.http.get<Category[]>(`${this.api}/categories`);
  }
}
