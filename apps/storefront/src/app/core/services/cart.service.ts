import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface CartItem {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    slug: string;
    basePrice: number;
    images: { url: string; isPrimary: boolean }[];
  };
  quantity: number;
  unitPrice: number;
  customizations: Record<string, unknown>;
}

export interface Cart {
  id: string;
  items: CartItem[];
}

@Injectable({ providedIn: 'root' })
export class CartService {
  cart = signal<Cart | null>(null);
  itemCount = computed(() => this.cart()?.items.reduce((s, i) => s + i.quantity, 0) ?? 0);
  total = computed(() =>
    this.cart()?.items.reduce((s, i) => s + Number(i.unitPrice) * i.quantity, 0) ?? 0
  );

  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  loadCart() {
    return this.http.get<Cart>(`${this.api}/cart`).pipe(
      tap((cart) => this.cart.set(cart))
    );
  }

  addItem(productId: string, quantity: number, customizations?: Record<string, unknown>) {
    return this.http.post<Cart>(`${this.api}/cart/items`, { productId, quantity, customizations }).pipe(
      tap((cart) => this.cart.set(cart))
    );
  }

  updateItem(itemId: string, quantity: number) {
    return this.http.put<Cart>(`${this.api}/cart/items/${itemId}`, { quantity }).pipe(
      tap((cart) => this.cart.set(cart))
    );
  }

  removeItem(itemId: string) {
    return this.http.delete<Cart>(`${this.api}/cart/items/${itemId}`).pipe(
      tap((cart) => this.cart.set(cart))
    );
  }

  clearLocal() {
    this.cart.set(null);
  }
}
