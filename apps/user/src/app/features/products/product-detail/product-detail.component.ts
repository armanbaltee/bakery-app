import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductsService, Product } from '../../../core/services/products.service';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (loading()) {
      <div class="loading-overlay" style="min-height:500px"><div class="spinner"></div></div>
    } @else if (product()) {
      <div class="container product-detail-layout">
        <!-- Images -->
        <div class="product-images">
          <div class="main-image">
            @if (selectedImage()) {
              <img [src]="selectedImage()" [alt]="product()!.name" />
            } @else {
              <div class="image-placeholder-lg">🎂</div>
            }
          </div>
          @if (product()!.images.length > 1) {
            <div class="image-thumbs">
              @for (img of product()!.images; track img.id) {
                <button class="thumb" [class.active]="selectedImage() === img.url" (click)="selectedImage.set(img.url)">
                  <img [src]="img.url" [alt]="product()!.name" />
                </button>
              }
            </div>
          }
        </div>

        <!-- Info -->
        <div class="product-info-panel">
          <div class="product-meta">
            <span class="category-badge">{{ product()!.category?.name }}</span>
            @if (product()!.isBestSeller) { <span class="badge badge-brown">⭐ Best Seller</span> }
          </div>

          <h1>{{ product()!.name }}</h1>
          <p class="product-description">{{ product()!.description }}</p>

          <div class="price-display">
            <span class="price-label">Starting from</span>
            <span class="price-value">PKR {{ currentPrice() | number:'1.0-0' }}</span>
          </div>

          <!-- Customization Options -->
          @if (product()!.isCustomizable && product()!.customizationOptions?.length) {
            <div class="customizations">
              @for (opt of product()!.customizationOptions; track opt.id) {
                <div class="custom-group">
                  <label class="form-label">
                    {{ opt.label }}
                    @if (opt.isRequired) { <span class="required">*</span> }
                  </label>

                  @if (opt.options) {
                    <div class="option-chips">
                      @for (choice of opt.options; track choice.value) {
                        <button
                          class="option-chip"
                          [class.selected]="customizations[opt.type] === choice.value"
                          (click)="selectOption(opt.type, choice.value, choice.priceModifier || 0)">
                          {{ choice.label }}
                          @if (choice.priceModifier) {
                            <span class="modifier">+{{ choice.priceModifier | number:'1.0-0' }}</span>
                          }
                        </button>
                      }
                    </div>
                  } @else if (opt.type === 'TEXT') {
                    <input type="text" class="form-control" [placeholder]="opt.label"
                      [(ngModel)]="customizations[opt.type]" />
                  } @else if (opt.type === 'IMAGE') {
                    <input type="url" class="form-control" placeholder="Paste image URL or upload"
                      [(ngModel)]="customizations[opt.type]" />
                  }
                </div>
              }
            </div>
          }

          <!-- Quantity -->
          <div class="quantity-row">
            <label class="form-label">Quantity</label>
            <div class="qty-controls">
              <button (click)="decreaseQty()" class="qty-btn">−</button>
              <span>{{ qty }}</span>
              <button (click)="increaseQty()" class="qty-btn">+</button>
            </div>
          </div>

          <!-- Actions -->
          <div class="detail-actions">
            <button
              class="btn btn-primary btn-lg"
              [disabled]="product()!.stockStatus === 'OUT_OF_STOCK' || adding"
              (click)="addToCart()">
              {{ adding ? '✓ Added to Cart!' : '🛒 Add to Cart' }}
            </button>
          </div>

          <!-- Stock status -->
          @if (product()!.stockStatus === 'OUT_OF_STOCK') {
            <p class="out-of-stock">⚠️ Currently out of stock</p>
          } @else if (product()!.stockStatus === 'MADE_TO_ORDER') {
            <p class="made-to-order">✋ Made to order — allow 24–48 hrs</p>
          }
        </div>
      </div>
    } @else {
      <div class="container" style="text-align:center; padding: 80px 0;">
        <div style="font-size:4rem">🔍</div>
        <h2>Product not found</h2>
      </div>
    }
  `,
  styles: [`
    .product-detail-layout {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-3xl);
      padding-top: var(--space-2xl);
      padding-bottom: var(--space-3xl);
    }
    .main-image {
      border-radius: var(--radius-lg);
      overflow: hidden;
      background: var(--color-cream);
      aspect-ratio: 1;
    }
    .main-image img { width: 100%; height: 100%; object-fit: cover; }
    .image-placeholder-lg { display: flex; align-items: center; justify-content: center; height: 100%; font-size: 8rem; }
    .image-thumbs { display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap; }
    .thumb { width: 72px; height: 72px; border-radius: var(--radius-sm); overflow: hidden; border: 2px solid transparent; cursor: pointer; }
    .thumb.active { border-color: var(--color-brown); }
    .thumb img { width: 100%; height: 100%; object-fit: cover; }

    .product-meta { display: flex; gap: 8px; align-items: center; margin-bottom: var(--space-md); }
    .category-badge {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--color-brown);
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    h1 { margin-bottom: var(--space-md); }
    .product-description { color: var(--color-brown-light); line-height: 1.8; margin-bottom: var(--space-xl); }

    .price-display { margin-bottom: var(--space-xl); }
    .price-label { display: block; font-size: 0.8rem; color: var(--color-brown-light); margin-bottom: 4px; }
    .price-value { font-family: var(--font-heading); font-size: 2rem; font-weight: 700; color: var(--color-brown-dark); }

    .customizations { display: flex; flex-direction: column; gap: var(--space-lg); margin-bottom: var(--space-xl); }
    .custom-group { display: flex; flex-direction: column; gap: var(--space-sm); }
    .required { color: var(--color-error); }
    .option-chips { display: flex; flex-wrap: wrap; gap: 8px; }
    .option-chip {
      padding: 8px 16px;
      border-radius: var(--radius-full);
      border: 1.5px solid var(--color-cream-dark);
      font-size: 0.85rem;
      cursor: pointer;
      transition: all var(--transition-fast);
      background: var(--color-white);
      color: var(--color-espresso);
    }
    .option-chip:hover { border-color: var(--color-brown); color: var(--color-brown); }
    .option-chip.selected { background: var(--color-brown); color: #fff; border-color: var(--color-brown); }
    .modifier { font-size: 0.75rem; opacity: 0.8; margin-left: 4px; }

    .quantity-row { margin-bottom: var(--space-xl); }
    .qty-controls { display: flex; align-items: center; gap: var(--space-md); margin-top: 8px; }
    .qty-btn {
      width: 36px; height: 36px;
      border: 1.5px solid var(--color-cream-dark);
      border-radius: 50%;
      font-size: 1.2rem;
      display: flex; align-items: center; justify-content: center;
      transition: all var(--transition-fast);
      cursor: pointer;
    }
    .qty-btn:hover { border-color: var(--color-brown); color: var(--color-brown); }
    .qty-controls span { font-size: 1.1rem; font-weight: 600; min-width: 24px; text-align: center; }

    .detail-actions { margin-bottom: var(--space-md); }
    .out-of-stock { color: var(--color-error); font-size: 0.875rem; }
    .made-to-order { color: var(--color-warning); font-size: 0.875rem; }

    @media (max-width: 768px) {
      .product-detail-layout { grid-template-columns: 1fr; }
    }
  `]
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productsService = inject(ProductsService);
  private cart = inject(CartService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  product = signal<Product | null>(null);
  loading = signal(true);
  selectedImage = signal<string | null>(null);
  adding = false;
  qty = 1;
  priceModifier = 0;
  customizations: Record<string, unknown> = {};

  ngOnInit() {
    const slug = this.route.snapshot.paramMap.get('slug')!;
    this.productsService.getProductBySlug(slug).subscribe({
      next: (p) => {
        this.product.set(p);
        const primary = p.images.find((i) => i.isPrimary) || p.images[0];
        if (primary) this.selectedImage.set(primary.url);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  get currentPrice(): () => number {
    return () => Number(this.product()?.basePrice ?? 0) + this.priceModifier;
  }

  selectOption(type: string, value: string, modifier: number) {
    this.customizations[type] = value;
    // Recalculate price modifier for weight
    if (type === 'WEIGHT') {
      this.priceModifier = modifier;
    }
  }

  increaseQty() { this.qty++; }
  decreaseQty() { if (this.qty > 1) this.qty--; }

  addToCart() {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/account/login']);
      return;
    }
    this.adding = true;
    const customizationData: Record<string, unknown> = { ...this.customizations };
    if (this.priceModifier > 0) customizationData['weightPriceModifier'] = this.priceModifier;

    this.cart.addItem(this.product()!.id, this.qty, customizationData).subscribe({
      next: () => {
        this.toast.success(`${this.product()!.name} added to cart!`);
        setTimeout(() => (this.adding = false), 2000);
      },
      error: () => {
        this.toast.error('Failed to add to cart');
        this.adding = false;
      },
    });
  }
}
