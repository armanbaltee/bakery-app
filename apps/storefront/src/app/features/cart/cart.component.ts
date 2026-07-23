import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [RouterLink, CommonModule],
  template: `
    <div class="container cart-page">
      <h1>Shopping Cart</h1>

      @if (loading) {
        <div class="loading-overlay"><div class="spinner"></div></div>
      } @else if (!auth.isLoggedIn()) {
        <div class="empty-state">
          <div class="empty-icon">🔐</div>
          <h3>Sign in to view your cart</h3>
          <p>Please sign in to access your shopping cart</p>
          <a routerLink="/account/login" class="btn btn-primary">Sign In</a>
        </div>
      } @else if (!cart.cart() || cart.cart()!.items.length === 0) {
        <div class="empty-state">
          <div class="empty-icon">🛒</div>
          <h3>Your cart is empty</h3>
          <p>Add some delicious baked goods to your cart!</p>
          <a routerLink="/products" class="btn btn-primary">Browse Products</a>
        </div>
      } @else {
        <div class="cart-layout">
          <!-- Items -->
          <div class="cart-items">
            @for (item of cart.cart()!.items; track item.id) {
              <div class="cart-item">
                <div class="item-img">
                  @if (item.product.images?.[0]) {
                    <img [src]="item.product.images[0].url" [alt]="item.product.name" />
                  } @else {
                    <div class="img-placeholder">🎂</div>
                  }
                </div>
                <div class="item-info">
                  <h4><a [routerLink]="['/products', item.product.slug]">{{ item.product.name }}</a></h4>
                  @if (item.customizations && hasCustomizations(item.customizations)) {
                    <div class="customization-tags">
                      @for (entry of getCustomEntries(item.customizations); track entry[0]) {
                        <span class="badge badge-brown">{{ entry[0] }}: {{ entry[1] }}</span>
                      }
                    </div>
                  }
                  <p class="item-unit-price">PKR {{ item.unitPrice | number:'1.0-0' }} each</p>
                </div>
                <div class="item-qty">
                  <button class="qty-btn" (click)="updateQty(item.id, item.quantity - 1)">−</button>
                  <span>{{ item.quantity }}</span>
                  <button class="qty-btn" (click)="updateQty(item.id, item.quantity + 1)">+</button>
                </div>
                <div class="item-total">PKR {{ (item.unitPrice * item.quantity) | number:'1.0-0' }}</div>
                <button class="remove-btn" (click)="removeItem(item.id)" title="Remove">✕</button>
              </div>
            }
          </div>

          <!-- Summary -->
          <div class="cart-summary">
            <div class="summary-card">
              <h3>Order Summary</h3>
              <div class="summary-row">
                <span>Subtotal ({{ cart.itemCount() }} items)</span>
                <span>PKR {{ cart.total() | number:'1.0-0' }}</span>
              </div>
              <div class="summary-row">
                <span>Delivery Charge</span>
                <span>PKR 150</span>
              </div>
              <div class="summary-divider"></div>
              <div class="summary-row total">
                <span>Total</span>
                <span>PKR {{ (cart.total() + 150) | number:'1.0-0' }}</span>
              </div>
              <a routerLink="/checkout" class="btn btn-primary" style="width:100%;justify-content:center;margin-top:16px">
                Proceed to Checkout →
              </a>
              <a routerLink="/products" class="btn btn-ghost" style="width:100%;justify-content:center;margin-top:8px">
                Continue Shopping
              </a>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .cart-page {
      padding-top: var(--space-2xl);
      padding-bottom: var(--space-3xl);
    }
    h1 { margin-bottom: var(--space-2xl); }

    .cart-layout {
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: var(--space-2xl);
    }

    .cart-items { display: flex; flex-direction: column; gap: var(--space-md); }

    .cart-item {
      background: var(--color-white);
      border-radius: var(--radius-md);
      padding: var(--space-lg);
      display: flex;
      align-items: center;
      gap: var(--space-lg);
      box-shadow: var(--shadow-sm);
    }
    .item-img { width: 80px; height: 80px; border-radius: var(--radius-sm); overflow: hidden; flex-shrink: 0; }
    .item-img img { width: 100%; height: 100%; object-fit: cover; }
    .img-placeholder { display: flex; align-items: center; justify-content: center; height: 100%; background: var(--color-cream); font-size: 2rem; }
    .item-info { flex: 1; min-width: 0; }
    .item-info h4 { font-size: 0.95rem; margin-bottom: 4px; }
    .item-info h4 a { color: var(--color-espresso); }
    .item-info h4 a:hover { color: var(--color-brown); }
    .item-unit-price { font-size: 0.8rem; color: var(--color-brown-light); margin-top: 4px; }
    .customization-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; }

    .item-qty { display: flex; align-items: center; gap: 8px; }
    .qty-btn {
      width: 28px; height: 28px;
      border: 1.5px solid var(--color-cream-dark);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
      transition: all var(--transition-fast);
      font-size: 1rem;
    }
    .qty-btn:hover { border-color: var(--color-brown); color: var(--color-brown); }
    .item-qty span { min-width: 20px; text-align: center; font-weight: 600; }

    .item-total { font-weight: 700; font-family: var(--font-heading); min-width: 120px; text-align: right; }

    .remove-btn {
      color: var(--color-error);
      padding: 6px;
      border-radius: 50%;
      transition: background var(--transition-fast);
      font-size: 0.85rem;
    }
    .remove-btn:hover { background: #FDEAEA; }

    .summary-card {
      background: var(--color-white);
      border-radius: var(--radius-md);
      padding: var(--space-xl);
      box-shadow: var(--shadow-md);
      position: sticky;
      top: 90px;
    }
    .summary-card h3 { margin-bottom: var(--space-lg); }
    .summary-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 0.9rem; }
    .summary-row.total { font-weight: 700; font-size: 1.1rem; }
    .summary-divider { border-top: 1px solid var(--color-cream-dark); margin: 16px 0; }

    .empty-state { text-align: center; padding: var(--space-3xl); }
    .empty-icon { font-size: 5rem; margin-bottom: var(--space-lg); }
    .empty-state h3 { margin-bottom: var(--space-sm); }
    .empty-state p { color: var(--color-brown-light); margin-bottom: var(--space-xl); }

    @media (max-width: 768px) {
      .cart-layout { grid-template-columns: 1fr; }
      .cart-item { flex-wrap: wrap; }
    }
  `]
})
export class CartComponent implements OnInit {
  cart = inject(CartService);
  auth = inject(AuthService);
  private toast = inject(ToastService);

  loading = false;

  ngOnInit() {
    if (this.auth.isLoggedIn()) {
      this.loading = true;
      this.cart.loadCart().subscribe(() => (this.loading = false));
    }
  }

  updateQty(itemId: string, qty: number) {
    this.cart.updateItem(itemId, qty).subscribe({
      error: () => this.toast.error('Failed to update item'),
    });
  }

  removeItem(itemId: string) {
    this.cart.removeItem(itemId).subscribe({
      next: () => this.toast.success('Item removed'),
      error: () => this.toast.error('Failed to remove item'),
    });
  }

  hasCustomizations(c: Record<string, unknown>): boolean {
    return Object.keys(c).some(k => k !== 'weightPriceModifier' && c[k]);
  }

  getCustomEntries(c: Record<string, unknown>): [string, string][] {
    return Object.entries(c)
      .filter(([k, v]) => k !== 'weightPriceModifier' && v)
      .map(([k, v]) => [k, String(v)]);
  }
}
