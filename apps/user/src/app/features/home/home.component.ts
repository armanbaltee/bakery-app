import { Component, OnInit, AfterViewInit, inject, signal, HostListener, HostBinding, ViewChild, ElementRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProductsService, Product, Category } from '../../core/services/products.service';
import { ProductCardComponent } from '../../shared/product-card/product-card.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule, ProductCardComponent],
  template: `
    <!-- Hero Scroll Track Container -->
    <div class="hero-scroll-track" #heroTrack>
      <!-- Sticky Viewport Container -->
      <div class="hero-sticky-container">
        <!-- Canvas Background -->
        <canvas class="hero-canvas" #heroCanvas></canvas>
        <!-- Overlay Dark Gradient for Readability -->
        <div class="hero-overlay-dark"></div>

        <!-- Overlay Text Content -->
        <div class="container hero-content-overlay" [style.opacity]="overlayOpacity()">
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
        </div>
      </div>
    </div>

    <!-- Floating Background Items -->
    <div class="parallax-container">
      <img src="/assets/croissant.png" class="floating-item item-croissant-1" alt="Croissant" />
      <img src="/assets/cookie.png" class="floating-item item-cookie-1" alt="Cookie" />
      <img src="/assets/cupcake.png" class="floating-item item-cupcake-1" alt="Cupcake" />
      <img src="/assets/mint-leaf.png" class="floating-item item-leaf-1" alt="Mint Leaf" />
      <img src="/assets/mint-leaf.png" class="floating-item item-leaf-2" alt="Mint Leaf" />
      <img src="/assets/croissant.png" class="floating-item item-croissant-2" alt="Croissant" />
      <img src="/assets/cookie.png" class="floating-item item-cookie-2" alt="Cookie" />
    </div>

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
    /* Host Container */
    :host {
      display: block;
      position: relative;
      overflow: visible;
      --scroll-y: 0px;
    }

    /* Hero Scroll Track and Sticky Viewport */
    .hero-scroll-track {
      height: 400vh;
      position: relative;
    }
    .hero-sticky-container {
      position: sticky;
      top: 0;
      left: 0;
      width: 100%;
      height: 100vh;
      overflow: hidden;
    }
    .hero-canvas {
      position: absolute;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      display: block;
      z-index: -1;
      will-change: transform;
    }
    .hero-overlay-dark {
      position: absolute;
      inset: 0;
      background: radial-gradient(circle, rgba(29, 13, 4, 0.4) 0%, rgba(29, 13, 4, 0.6) 100%);
      z-index: 0;
    }
    .hero-content-overlay {
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2;
      pointer-events: none;
      transition: opacity 0.15s ease-out;
    }
    
    /* Ensure only links/buttons have pointer events */
    .hero-text {
      pointer-events: auto;
      max-width: 850px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    /* Override typography color for overlay readability */
    .hero-text h1 {
      font-family: var(--font-heading);
      color: var(--color-white) !important;
      text-shadow: 0 4px 20px rgba(29, 13, 4, 0.55);
      margin-bottom: var(--space-lg);
      font-size: clamp(2.5rem, 6vw, 4.5rem);
      font-weight: 700;
      line-height: 1.15;
    }
    .hero-text h1 em {
      color: var(--color-blush-light) !important;
      font-style: italic;
      font-family: var(--font-heading);
    }
    .hero-subtitle {
      font-family: var(--font-body);
      color: var(--color-blush-light) !important;
      letter-spacing: 4px;
      font-weight: 600;
      font-size: 0.9rem;
      text-transform: uppercase;
      margin-bottom: var(--space-md);
      text-shadow: 0 2px 10px rgba(29, 13, 4, 0.3);
    }
    .hero-desc {
      font-family: var(--font-body);
      color: var(--color-cream) !important;
      text-shadow: 0 2px 12px rgba(29, 13, 4, 0.5);
      font-size: 1.15rem;
      line-height: 1.8;
      margin-bottom: var(--space-2xl);
      max-width: 620px;
    }
    .hero-actions {
      display: flex;
      gap: var(--space-md);
      flex-wrap: wrap;
      justify-content: center;
      margin-bottom: var(--space-2xl);
    }
    .hero-text .btn-primary {
      font-size: 1.05rem;
      padding: 18px 44px;
    }
    .hero-text .btn-secondary {
      font-size: 1.05rem;
      padding: 18px 44px;
      color: var(--color-white);
      border-color: var(--color-white);
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(8px);
    }
    .hero-text .btn-secondary:hover {
      background: var(--color-white);
      color: var(--color-espresso);
      box-shadow: var(--shadow-hover);
    }
    .hero-badges {
      display: flex;
      gap: var(--space-md);
      flex-wrap: wrap;
      justify-content: center;
    }
    .hero-badges span {
      color: var(--color-cream) !important;
      background: rgba(61, 26, 10, 0.55);
      padding: 8px 18px;
      border-radius: var(--radius-full);
      backdrop-filter: blur(6px);
      font-size: 0.85rem;
      font-weight: 500;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    }

    /* Parallax Elements (Moved below the 400vh Hero Scroll Track) */
    .parallax-container {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 1;
    }
    
    .floating-item {
      position: absolute;
      pointer-events: none;
      filter: drop-shadow(0 15px 25px rgba(0,0,0,0.08));
      transition: transform 0.1s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      opacity: 0.85;
      will-change: transform;
    }

    /* Floating Item Positions & Speeds */
    .item-croissant-1 {
      top: 420vh;
      left: -40px;
      width: 140px;
      transform: translateY(calc((var(--scroll-y) - 400vh) * -0.12)) rotate(calc(var(--scroll-y) * 0.08deg));
    }
    .item-cookie-1 {
      top: 460vh;
      right: -20px;
      width: 110px;
      transform: translateY(calc((var(--scroll-y) - 400vh) * -0.2)) rotate(calc(var(--scroll-y) * -0.15deg));
    }
    .item-cupcake-1 {
      top: 520vh;
      left: 10px;
      width: 130px;
      transform: translateY(calc((var(--scroll-y) - 400vh) * -0.15)) rotate(calc(var(--scroll-y) * 0.05deg));
    }
    .item-leaf-1 {
      top: 430vh;
      left: 18%;
      width: 50px;
      transform: translateY(calc((var(--scroll-y) - 400vh) * -0.25)) rotate(calc(var(--scroll-y) * 0.3deg));
      opacity: 0.7;
    }
    .item-leaf-2 {
      top: 580vh;
      right: 15%;
      width: 45px;
      transform: translateY(calc((var(--scroll-y) - 400vh) * -0.3)) rotate(calc(var(--scroll-y) * -0.2deg));
      opacity: 0.6;
    }
    .item-croissant-2 {
      top: 610vh;
      left: 20px;
      width: 120px;
      transform: translateY(calc((var(--scroll-y) - 400vh) * -0.08)) rotate(calc(var(--scroll-y) * -0.06deg));
    }
    .item-cookie-2 {
      top: 660vh;
      right: 15px;
      width: 100px;
      transform: translateY(calc((var(--scroll-y) - 400vh) * -0.18)) rotate(calc(var(--scroll-y) * 0.1deg));
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
      .categories-grid { grid-template-columns: repeat(2, 1fr); }
      .cta-card { flex-direction: column; text-align: center; }
      .cta-decoration { display: none; }
      .floating-item { display: none !important; }
    }
  `]
})
export class HomeComponent implements OnInit, AfterViewInit {
  private productsService = inject(ProductsService);

  categories = signal<Category[]>([]);
  featuredProducts = signal<Product[]>([]);
  bestSellers = signal<Product[]>([]);
  loadingFeatured = signal(true);
  loadingBest = signal(true);

  @ViewChild('heroCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('heroTrack', { static: false }) trackRef!: ElementRef<HTMLDivElement>;

  images: HTMLImageElement[] = [];
  totalFrames = 153;
  overlayOpacity = signal(1);
  currentFrameIndex = 0;

  @HostBinding('style.--scroll-y') scrollY = '0px';

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.scrollY = `${window.scrollY}px`;
    this.scheduleRender();
  }

  @HostListener('window:resize')
  onResize() {
    this.resizeCanvas();
  }

  ngOnInit() {
    this.preloadImages();

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

  ngAfterViewInit() {
    // Initial size setup and draw first frame
    setTimeout(() => {
      this.resizeCanvas();
      this.scheduleRender();
    }, 150);
  }

  preloadImages() {
    for (let i = 1; i <= this.totalFrames; i++) {
      const img = new Image();
      const frameNum = String(i).padStart(3, '0');
      img.src = `/uploads/Images/ezgif-frame-${frameNum}.jpg`;
      img.onload = () => {
        if (i === 1) {
          this.scheduleRender();
        }
      };
      this.images.push(img);
    }
  }

  resizeCanvas() {
    if (!this.canvasRef) return;
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    this.renderFrame(this.currentFrameIndex);
  }

  private renderScheduled = false;

  scheduleRender() {
    if (this.renderScheduled) return;
    this.renderScheduled = true;
    requestAnimationFrame(() => {
      this.renderScheduled = false;
      this.updateAndRender();
    });
  }

  updateAndRender() {
    if (!this.trackRef || !this.canvasRef) return;
    
    const track = this.trackRef.nativeElement;
    const rect = track.getBoundingClientRect();
    
    const totalScrollable = rect.height - window.innerHeight;
    const relativeScroll = -rect.top;
    
    const progress = Math.max(0, Math.min(1, relativeScroll / totalScrollable));
    
    // Fade out overlay text in the first 30% of the scroll track
    this.overlayOpacity.set(Math.max(0, 1 - progress / 0.3));
    
    // Map progress to image frames
    const frameIndex = Math.max(0, Math.min(this.totalFrames - 1, Math.floor(progress * this.totalFrames)));
    this.currentFrameIndex = frameIndex;
    
    this.renderFrame(frameIndex);
  }

  renderFrame(index: number) {
    if (!this.canvasRef) return;
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Find the closest loaded image if the target one isn't ready
    let img = this.images[index];
    if (!img || !img.complete) {
      for (let i = index; i >= 0; i--) {
        if (this.images[i] && this.images[i].complete) {
          img = this.images[i];
          break;
        }
      }
    }
    if (!img || !img.complete) {
      for (let i = index; i < this.totalFrames; i++) {
        if (this.images[i] && this.images[i].complete) {
          img = this.images[i];
          break;
        }
      }
    }

    if (img && img.complete) {
      this.drawImageProp(ctx, img);
    }
  }

  drawImageProp(ctx: CanvasRenderingContext2D, img: HTMLImageElement) {
    const canvas = ctx.canvas;
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const imgWidth = img.width;
    const imgHeight = img.height;

    const r = Math.max(canvasWidth / imgWidth, canvasHeight / imgHeight);
    const newWidth = imgWidth * r;
    const newHeight = imgHeight * r;
    const x = (canvasWidth - newWidth) / 2;
    const y = (canvasHeight - newHeight) / 2;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.drawImage(img, x, y, newWidth, newHeight);
  }

  getCategoryEmoji(slug: string): string {
    const map: Record<string, string> = {
      cakes: '🎂', cupcakes: '🧁', pastries: '🥐', cookies: '🍪', breads: '🍞',
    };
    return map[slug] || '🍰';
  }
}


