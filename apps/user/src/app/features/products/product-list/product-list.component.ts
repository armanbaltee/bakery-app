import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductsService, Product, Category } from '../../../core/services/products.service';
import { ProductCardComponent } from '../../../shared/product-card/product-card.component';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ProductCardComponent],
  template: `
    <div class="page-header">
      <div class="container">
        <h1>Our Products</h1>
        <p>Fresh baked goods, delivered to your door</p>
      </div>
    </div>

    <div class="container products-layout">
      <!-- Sidebar Filters -->
      <aside class="sidebar">
        <div class="filter-card">
          <h4>Search</h4>
          <input
            type="text"
            class="form-control"
            placeholder="Search products..."
            [(ngModel)]="searchQuery"
            (input)="onFilterChange()"
          />
        </div>

        <div class="filter-card">
          <h4>Categories</h4>
          <ul class="cat-list">
            <li>
              <button [class.active]="!selectedCategory" (click)="selectCategory(null)">All</button>
            </li>
            @for (cat of categories(); track cat.id) {
              <li>
                <button [class.active]="selectedCategory === cat.id" (click)="selectCategory(cat.id)">
                  {{ cat.name }}
                </button>
              </li>
            }
          </ul>
        </div>

        <div class="filter-card">
          <h4>Price Range</h4>
          <div class="price-inputs">
            <input type="number" class="form-control" placeholder="Min" [(ngModel)]="minPrice" (change)="onFilterChange()" />
            <span>–</span>
            <input type="number" class="form-control" placeholder="Max" [(ngModel)]="maxPrice" (change)="onFilterChange()" />
          </div>
        </div>

        <button class="btn btn-ghost btn-sm" (click)="clearFilters()">Clear Filters</button>
      </aside>

      <!-- Products Grid -->
      <div class="products-main">
        <div class="products-toolbar">
          <p class="results-count">
            @if (!loading()) { {{ total() }} product{{ total() !== 1 ? 's' : '' }} found }
          </p>
        </div>

        @if (loading()) {
          <div class="loading-overlay"><div class="spinner"></div></div>
        } @else if (products().length === 0) {
          <div class="empty-state">
            <div class="empty-icon">🔍</div>
            <h3>No products found</h3>
            <p>Try adjusting your filters</p>
            <button class="btn btn-primary" (click)="clearFilters()">Clear Filters</button>
          </div>
        } @else {
          <div class="grid-3">
            @for (product of products(); track product.id) {
              <app-product-card [product]="product" />
            }
          </div>

          <!-- Pagination -->
          @if (totalPages() > 1) {
            <div class="pagination">
              <button [disabled]="page() <= 1" (click)="changePage(page()-1)" class="btn btn-ghost btn-sm">← Prev</button>
              <span>Page {{ page() }} of {{ totalPages() }}</span>
              <button [disabled]="page() >= totalPages()" (click)="changePage(page()+1)" class="btn btn-ghost btn-sm">Next →</button>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .page-header {
      background: linear-gradient(135deg, var(--color-cream) 0%, var(--color-blush-light) 100%);
      padding: var(--space-2xl) 0;
      border-bottom: 1px solid var(--color-cream-dark);
    }
    .page-header h1 { margin-bottom: 8px; }
    .page-header p { color: var(--color-brown-light); }

    .products-layout {
      display: grid;
      grid-template-columns: 260px 1fr;
      gap: var(--space-2xl);
      padding-top: var(--space-2xl);
      padding-bottom: var(--space-3xl);
    }

    .sidebar { display: flex; flex-direction: column; gap: var(--space-md); }
    .filter-card {
      background: var(--color-white);
      border-radius: var(--radius-md);
      padding: var(--space-lg);
      box-shadow: var(--shadow-sm);
    }
    .filter-card h4 { margin-bottom: var(--space-md); font-size: 0.95rem; }
    .cat-list { list-style: none; display: flex; flex-direction: column; gap: 4px; }
    .cat-list button {
      width: 100%;
      text-align: left;
      padding: 8px 12px;
      border-radius: var(--radius-sm);
      font-size: 0.875rem;
      color: var(--color-brown-light);
      transition: all var(--transition-fast);
      border: none;
      background: none;
      cursor: pointer;
    }
    .cat-list button:hover, .cat-list button.active {
      background: var(--color-cream-dark);
      color: var(--color-brown);
      font-weight: 600;
    }
    .price-inputs { display: flex; align-items: center; gap: 8px; }
    .price-inputs input { min-width: 0; }

    .products-main { min-width: 0; }
    .products-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--space-lg);
    }
    .results-count { color: var(--color-brown-light); font-size: 0.875rem; }

    .empty-state {
      text-align: center;
      padding: var(--space-3xl);
      background: var(--color-white);
      border-radius: var(--radius-md);
    }
    .empty-icon { font-size: 4rem; margin-bottom: var(--space-md); }

    .pagination {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-md);
      margin-top: var(--space-2xl);
      font-size: 0.9rem;
    }

    @media (max-width: 768px) {
      .products-layout { grid-template-columns: 1fr; }
      .sidebar { order: 2; }
    }
  `]
})
export class ProductListComponent implements OnInit {
  private productsService = inject(ProductsService);
  private route = inject(ActivatedRoute);

  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  loading = signal(true);
  total = signal(0);
  page = signal(1);
  totalPages = signal(1);

  searchQuery = '';
  selectedCategory: string | null = null;
  minPrice: number | null = null;
  maxPrice: number | null = null;

  ngOnInit() {
    this.productsService.getCategories().subscribe((cats) => this.categories.set(cats));

    this.route.queryParams.subscribe((params) => {
      this.selectedCategory = params['categoryId'] || null;
      this.searchQuery = params['search'] || '';
      this.loadProducts();
    });
  }

  loadProducts() {
    this.loading.set(true);
    const filters: Record<string, unknown> = { page: this.page(), limit: 12 };
    if (this.selectedCategory) filters['categoryId'] = this.selectedCategory;
    if (this.searchQuery) filters['search'] = this.searchQuery;
    if (this.minPrice) filters['minPrice'] = this.minPrice;
    if (this.maxPrice) filters['maxPrice'] = this.maxPrice;

    this.productsService.getProducts(filters).subscribe((res) => {
      this.products.set(res.items);
      this.total.set(res.total);
      this.totalPages.set(res.totalPages);
      this.loading.set(false);
    });
  }

  selectCategory(id: string | null) {
    this.selectedCategory = id;
    this.page.set(1);
    this.loadProducts();
  }

  onFilterChange() {
    this.page.set(1);
    this.loadProducts();
  }

  changePage(p: number) {
    this.page.set(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.loadProducts();
  }

  clearFilters() {
    this.selectedCategory = null;
    this.searchQuery = '';
    this.minPrice = null;
    this.maxPrice = null;
    this.page.set(1);
    this.loadProducts();
  }
}
