import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProductsService, Product, Category } from '../../core/services/products.service';
import { ProductCardComponent } from '../../shared/product-card/product-card.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule, ProductCardComponent],
  template: `
    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-bg"></div>
      <div class="container hero-content">
        <div class="hero-text fade-in-up">
          <p class="hero-subtitle">Freshly Baked with Love</p>
          <h1>Handcrafted Cakes<br>& Pastries for<br><em>Every Occasion</em></h1>
          <p class="hero-desc">
            From custom celebration cakes to daily pastries, everything is made from scratch
            using the finest ingredients. Order online, delivered to your door.
          </p>
          <div class="hero-actions">
            <a routerLink="/products" class="btn btn-primary btn-lg">Shop Now</a>
            <a routerLink="/products" [queryParams]="{isCustomizable: 'true'}" class="btn btn-secondary btn-lg">Custom Cakes</a>
          </div>
          <div class="hero-badges">
            <span>🌾 Fresh Daily</span>
            <span>🚚 Same Day Delivery</span>
            <span>✨ 100% Handcrafted</span>
          </div>
        </div>
        <div class="hero-image">
          <div class="hero-img-circle">
            <div class="hero-emoji">🎂</div>
          </div>
          <div class="floating-badge badge-1">⭐ 4.9 Rating</div>
          <div class="floating-badge badge-2">🎉 500+ Orders</div>
        </div>
      </div>
    </section>

    <!-- Categories -->
    <section class="section categories-section">
      <div class="container">
        <div class="section-header">
          <p class="subtitle">Browse By</p>
          <h2>Our Categories</h2>
          <div class="divider"></div>
        </div>
        <div class="categories-grid">
          @for (cat of categories(); track cat.id) {
            <a [routerLink]="['/products']" [queryParams]="{categoryId: cat.id}" class="category-card">
              <div class="cat-icon">{{ getCategoryEmoji(cat.slug) }}</div>
              <h3>{{ cat.name }}</h3>
              <p>{{ cat.description }}</p>
            </a>
          }
        </div>
      </div>
    </section>

    <!-- Featured Products -->
    <section class="section featured-section">
      <div class="container">
        <div class="section-header">
          <p class="subtitle">Handpicked for You</p>
          <h2>Featured Treats</h2>
          <div class="divider"></div>
          <p>Our most loved creations, made fresh every day</p>
        </div>
        @if (loadingFeatured()) {
          <div class="loading-overlay"><div class="spinner"></div></div>
        } @else {
          <div class="grid-4">
            @for (product of featuredProducts(); track product.id) {
              <app-product-card [product]="product" />
            }
          </div>
        }
        <div style="text-align:center; margin-top: 40px;">
          <a routerLink="/products" class="btn btn-secondary">View All Products</a>
        </div>
      </div>
    </section>

    <!-- Best Sellers -->
    <section class="section best-sellers-section">
      <div class="container">
        <div class="section-header">
          <p class="subtitle">Customer Favorites</p>
          <h2>Best Sellers</h2>
          <div class="divider"></div>
        </div>
        @if (loadingBest()) {
          <div class="loading-overlay"><div class="spinner"></div></div>
        } @else {
          <div class="grid-4">
            @for (product of bestSellers(); track product.id) {
              <app-product-card [product]="product" />
            }
          </div>
        }
      </div>
    </section>

    <!-- CTA Banner -->
    <section class="cta-section">
      <div class="container">
        <div class="cta-card">
          <div class="cta-text">
            <h2>Order a Custom Cake 🎂</h2>
            <p>Celebrate every occasion with a personalized cake. Choose your size, flavor, add a message and a reference design — we'll make it perfect.</p>
            <a routerLink="/products" [queryParams]="{featured:'true'}" class="btn btn-primary btn-lg">Design Your Cake</a>
          </div>
          <div class="cta-decoration">🎂🧁🍰🎉</div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    /* Hero */
    .hero {
      position: relative;
      min-height: 600px;
      overflow: hidden;
      display: flex;
      align-items: center;
    }
    .hero-bg {
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, var(--color-cream) 0%, var(--color-blush-light) 60%, var(--color-cream-dark) 100%);
    }
    .hero-content {
      position: relative;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-3xl);
      align-items: center;
      padding-top: var(--space-3xl);
      padding-bottom: var(--space-3xl);
    }
    .hero-subtitle {
      color: var(--color-brown);
      font-size: 0.85rem;
      font-weight: 600;
      letter-spacing: 3px;
      text-transform: uppercase;
      margin-bottom: var(--space-md);
    }
    .hero-text h1 {
      margin-bottom: var(--space-lg);
      color: var(--color-espresso);
    }
    .hero-text h1 em {
      color: var(--color-brown);
      font-style: italic;
    }
    .hero-desc {
      color: var(--color-brown-light);
      font-size: 1.05rem;
      line-height: 1.8;
      margin-bottom: var(--space-xl);
      max-width: 460px;
    }
    .hero-actions {
      display: flex;
      gap: var(--space-md);
      flex-wrap: wrap;
      margin-bottom: var(--space-xl);
    }
    .hero-badges {
      display: flex;
      gap: var(--space-md);
      flex-wrap: wrap;
    }
    .hero-badges span {
      font-size: 0.8rem;
      color: var(--color-brown-light);
      font-weight: 500;
    }
    .hero-image {
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .hero-img-circle {
      width: 360px;
      height: 360px;
      background: linear-gradient(135deg, var(--color-blush) 0%, var(--color-blush-light) 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: var(--shadow-lg);
      animation: float 4s ease-in-out infinite;
    }
    .hero-emoji { font-size: 9rem; }
    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-16px); }
    }
    .floating-badge {
      position: absolute;
      background: #fff;
      border-radius: var(--radius-full);
      padding: 8px 16px;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--color-espresso);
      box-shadow: var(--shadow-md);
      animation: floatBadge 3s ease-in-out infinite;
    }
    .badge-1 { top: 20%; right: 0; animation-delay: 0.5s; }
    .badge-2 { bottom: 20%; left: 0; animation-delay: 1s; }
    @keyframes floatBadge {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-8px); }
    }

    /* Categories */
    .categories-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: var(--space-lg);
    }
    .category-card {
      background: var(--color-white);
      border-radius: var(--radius-md);
      padding: var(--space-xl) var(--space-lg);
      text-align: center;
      box-shadow: var(--shadow-sm);
      transition: all var(--transition-base);
      border: 2px solid transparent;
    }
    .category-card:hover {
      transform: translateY(-6px);
      box-shadow: var(--shadow-hover);
      border-color: var(--color-blush);
    }
    .cat-icon { font-size: 2.5rem; margin-bottom: var(--space-sm); }
    .category-card h3 { font-size: 1rem; margin-bottom: 4px; }
    .category-card p { font-size: 0.78rem; color: var(--color-brown-light); }

    /* Best sellers bg */
    .best-sellers-section { background: var(--color-cream-dark); }

    /* CTA */
    .cta-section { padding: var(--space-3xl) 0; }
    .cta-card {
      background: linear-gradient(135deg, var(--color-brown) 0%, var(--color-brown-dark) 100%);
      border-radius: var(--radius-lg);
      padding: var(--space-3xl);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--space-2xl);
    }
    .cta-text h2 { color: var(--color-cream); margin-bottom: var(--space-md); }
    .cta-text p { color: var(--color-blush-light); margin-bottom: var(--space-xl); max-width: 520px; line-height: 1.7; }
    .cta-text .btn-primary {
      background: var(--color-cream);
      color: var(--color-brown-dark);
      border-color: var(--color-cream);
    }
    .cta-text .btn-primary:hover {
      background: var(--color-blush-light);
      border-color: var(--color-blush-light);
    }
    .cta-decoration { font-size: 5rem; text-align: center; line-height: 1.5; }

    @media (max-width: 1024px) {
      .categories-grid { grid-template-columns: repeat(3, 1fr); }
    }
    @media (max-width: 768px) {
      .hero-content { grid-template-columns: 1fr; }
      .hero-image { display: none; }
      .hero { min-height: auto; }
      .hero-content { padding: var(--space-2xl) var(--space-md); }
      .categories-grid { grid-template-columns: repeat(2, 1fr); }
      .cta-card { flex-direction: column; text-align: center; }
      .cta-decoration { display: none; }
    }
  `]
})
export class HomeComponent implements OnInit {
  private productsService = inject(ProductsService);

  categories = signal<Category[]>([]);
  featuredProducts = signal<Product[]>([]);
  bestSellers = signal<Product[]>([]);
  loadingFeatured = signal(true);
  loadingBest = signal(true);

  ngOnInit() {
    this.productsService.getCategories().subscribe((cats) => this.categories.set(cats));

    this.productsService.getProducts({ featured: 'true', limit: 4 }).subscribe((res) => {
      this.featuredProducts.set(res.items);
      this.loadingFeatured.set(false);
    });

    this.productsService.getProducts({ bestSeller: 'true', limit: 4 }).subscribe((res) => {
      this.bestSellers.set(res.items);
      this.loadingBest.set(false);
    });
  }

  getCategoryEmoji(slug: string): string {
    const map: Record<string, string> = {
      cakes: '🎂', cupcakes: '🧁', pastries: '🥐', cookies: '🍪', breads: '🍞',
    };
    return map[slug] || '🍰';
  }
}
