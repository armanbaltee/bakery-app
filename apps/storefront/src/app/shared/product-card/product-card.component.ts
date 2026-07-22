import { Component, Input, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Product } from '../../core/services/products.service';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [RouterLink, CommonModule],
  template: `
    <div class="product-card">
      <!-- Image -->
      <a [routerLink]="['/products', product.slug]" class="product-image">
        @if (primaryImage) {
          <img [src]="primaryImage" [alt]="product.name" loading="lazy" />
        } @else {
          <div class="image-placeholder">🎂</div>
        }
        <div class="product-badges">
          @if (product.isBestSeller) {
            <span class="badge badge-brown">⭐ Best Seller</span>
          }
          @if (product.isCustomizable) {
            <span class="badge badge-info">✏️ Customizable</span>
          }
          @if (product.stockStatus === 'OUT_OF_STOCK') {
            <span class="badge badge-error">Out of Stock</span>
          }
        </div>
      </a>

      <!-- Info -->
      <div class="product-info">
        <p class="product-category">{{ product.category?.name }}</p>
        <h3 class="product-name">
          <a [routerLink]="['/products', product.slug]">{{ product.name }}</a>
        </h3>
        <p class="product-desc">{{ product.shortDescription }}</p>

        <div class="product-footer">
          <div class="product-price">
            <span class="price-from">From</span>
            <span class="price">PKR {{ product.basePrice | number:'1.0-0' }}</span>
          </div>
          <div class="product-actions">
            @if (product.isCustomizable) {
              <a [routerLink]="['/products', product.slug]" class="btn btn-primary btn-sm">
                Customize
              </a>
            } @else {
              <button
                class="btn btn-primary btn-sm"
                [disabled]="product.stockStatus === 'OUT_OF_STOCK' || adding"
                (click)="quickAdd()">
                {{ adding ? '✓ Added!' : '+ Cart' }}
              </button>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .product-card {
      background: var(--color-white);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-sm);
      transition: transform var(--transition-base), box-shadow var(--transition-base);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .product-card:hover {
      transform: translateY(-6px);
      box-shadow: var(--shadow-hover);
    }
    .product-image {
      position: relative;
      height: 220px;
      overflow: hidden;
      background: var(--color-cream);
      display: block;
    }
    .product-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform var(--transition-slow);
    }
    .product-card:hover .product-image img {
      transform: scale(1.06);
    }
    .image-placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      font-size: 4rem;
    }
    .product-badges {
      position: absolute;
      top: 10px;
      left: 10px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .product-info {
      padding: var(--space-lg);
      display: flex;
      flex-direction: column;
      flex: 1;
    }
    .product-category {
      font-size: 0.75rem;
      color: var(--color-brown);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 4px;
    }
    .product-name {
      font-size: 1rem;
      margin-bottom: var(--space-sm);
    }
    .product-name a {
      color: var(--color-espresso);
      transition: color var(--transition-fast);
    }
    .product-name a:hover { color: var(--color-brown); }
    .product-desc {
      font-size: 0.82rem;
      color: var(--color-brown-light);
      line-height: 1.5;
      flex: 1;
      margin-bottom: var(--space-md);
    }
    .product-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-sm);
    }
    .price-from {
      display: block;
      font-size: 0.7rem;
      color: var(--color-brown-light);
    }
    .price {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--color-brown-dark);
      font-family: var(--font-heading);
    }
  `]
})
export class ProductCardComponent {
  @Input({ required: true }) product!: Product;

  private cart = inject(CartService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);

  adding = false;

  get primaryImage(): string | null {
    const img = this.product.images?.find(i => i.isPrimary) || this.product.images?.[0];
    return img?.url || null;
  }

  quickAdd() {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/account/login']);
      return;
    }
    this.adding = true;
    this.cart.addItem(this.product.id, 1).subscribe({
      next: () => {
        this.toast.success(`${this.product.name} added to cart!`);
        setTimeout(() => (this.adding = false), 1500);
      },
      error: () => {
        this.toast.error('Failed to add to cart');
        this.adding = false;
      },
    });
  }
}
