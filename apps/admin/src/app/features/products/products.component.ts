import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Product {
  id: string;
  name: string;
  slug?: string;
  description: string;
  shortDescription?: string;
  basePrice: number;
  categoryId: string;
  category?: Category;
  stockStatus: 'IN_STOCK' | 'OUT_OF_STOCK' | 'PRE_ORDER';
  isFeatured: boolean;
  isBestSeller: boolean;
  isCustomizable: boolean;
  images?: { id: string; url: string; isPrimary: boolean }[];
  imageUrl?: string;
  createdAt?: string;
}

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="products-page">
      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h1>Product Catalog</h1>
          <p>Add, edit, manage bakery items, inventory, and pricing</p>
        </div>
        <button class="btn btn-primary" (click)="openCreateModal()">
          <span>➕</span> Add New Product
        </button>
      </div>

      <!-- Quick Metrics -->
      <div class="metrics-grid">
        <div class="stat-card">
          <div class="stat-icon purple">🛍️</div>
          <div>
            <div class="stat-val">{{ products().length }}</div>
            <div class="stat-lbl">Total Products</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon green">✅</div>
          <div>
            <div class="stat-val">{{ inStockCount() }}</div>
            <div class="stat-lbl">In Stock</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon yellow">⭐</div>
          <div>
            <div class="stat-val">{{ featuredCount() }}</div>
            <div class="stat-lbl">Featured Items</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon red">⚠️</div>
          <div>
            <div class="stat-val">{{ outOfStockCount() }}</div>
            <div class="stat-lbl">Out of Stock</div>
          </div>
        </div>
      </div>

      <!-- Filters & Search Toolbar -->
      <div class="toolbar card">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            type="text"
            class="form-control"
            placeholder="Search products by name..."
            [(ngModel)]="searchQuery"
          />
        </div>

        <div class="filter-actions">
          <select class="form-control filter-select" [(ngModel)]="selectedCategory">
            <option value="">All Categories</option>
            <option *ngFor="let cat of categories()" [value]="cat.id">
              {{ cat.name }}
            </option>
          </select>

          <select class="form-control filter-select" [(ngModel)]="selectedStock">
            <option value="">All Stock Status</option>
            <option value="IN_STOCK">In Stock</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
            <option value="PRE_ORDER">Pre-Order</option>
          </select>
        </div>
      </div>

      <!-- Products Table -->
      <div class="card table-card">
        <div *ngIf="loading()" class="loading-state">
          <div class="spinner"></div>
          <p>Loading products from database...</p>
        </div>

        <div *ngIf="!loading() && filteredProducts().length === 0" class="empty-state">
          <div class="empty-icon">🧁</div>
          <h3>No products found</h3>
          <p *ngIf="products().length === 0">Get started by creating your first product!</p>
          <p *ngIf="products().length > 0">Try adjusting your search or filters.</p>
          <button *ngIf="products().length === 0" class="btn btn-primary" (click)="openCreateModal()">
            ➕ Add Your First Product
          </button>
        </div>

        <div *ngIf="!loading() && filteredProducts().length > 0" class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price (PKR)</th>
                <th>Stock Status</th>
                <th>Tags</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let prod of filteredProducts()">
                <td>
                  <div class="product-info-cell">
                    <img
                      [src]="getProductImage(prod)"
                      alt="{{ prod.name }}"
                      class="product-thumb"
                      (error)="onImageError($event)"
                    />
                    <div>
                      <div class="product-name">{{ prod.name }}</div>
                      <div class="product-desc">{{ prod.shortDescription || prod.description | slice:0:50 }}...</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="badge badge-gray">{{ prod.category?.name || getCategoryName(prod.categoryId) || 'Uncategorized' }}</span>
                </td>
                <td>
                  <span class="price-text">Rs. {{ prod.basePrice | number }}</span>
                </td>
                <td>
                  <span class="badge" [ngClass]="{
                    'badge-green': prod.stockStatus === 'IN_STOCK',
                    'badge-red': prod.stockStatus === 'OUT_OF_STOCK',
                    'badge-yellow': prod.stockStatus === 'PRE_ORDER'
                  }">
                    {{ prod.stockStatus === 'IN_STOCK' ? 'In Stock' : prod.stockStatus === 'OUT_OF_STOCK' ? 'Out of Stock' : 'Pre-Order' }}
                  </span>
                </td>
                <td>
                  <div class="tag-badges">
                    <span *ngIf="prod.isFeatured" class="badge badge-purple">Featured</span>
                    <span *ngIf="prod.isBestSeller" class="badge badge-yellow">Best Seller</span>
                    <span *ngIf="prod.isCustomizable" class="badge badge-blue">Customizable</span>
                  </div>
                </td>
                <td style="text-align: right;">
                  <div class="actions-cell">
                    <button class="btn btn-ghost btn-sm" (click)="openEditModal(prod)" title="Edit Product">
                      ✏️ Edit
                    </button>
                    <button class="btn btn-danger btn-sm" (click)="deleteProduct(prod)" title="Delete Product">
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Add / Edit Modal Dialog -->
      <div class="modal-overlay" *ngIf="isModalOpen()">
        <div class="modal-card">
          <div class="modal-header">
            <h2>{{ isEditing() ? 'Edit Product' : 'Add New Product' }}</h2>
            <button class="btn-icon" (click)="closeModal()">✕</button>
          </div>

          <form (ngSubmit)="saveProduct()" class="modal-form">
            <div class="form-row">
              <div class="form-group flex-2">
                <label class="form-label">Product Name *</label>
                <input
                  type="text"
                  class="form-control"
                  placeholder="e.g. Belgian Chocolate Truffle Cake"
                  [(ngModel)]="formData.name"
                  name="name"
                  required
                />
              </div>

              <div class="form-group flex-1">
                <label class="form-label">Base Price (PKR) *</label>
                <input
                  type="number"
                  class="form-control"
                  placeholder="2500"
                  [(ngModel)]="formData.basePrice"
                  name="basePrice"
                  min="0"
                  required
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label class="form-label">Category *</label>
                <select class="form-control" [(ngModel)]="formData.categoryId" name="categoryId" required>
                  <option value="" disabled>Select Category</option>
                  <option *ngFor="let cat of categories()" [value]="cat.id">
                    {{ cat.name }}
                  </option>
                </select>
              </div>

              <div class="form-group flex-1">
                <label class="form-label">Stock Status</label>
                <select class="form-control" [(ngModel)]="formData.stockStatus" name="stockStatus">
                  <option value="IN_STOCK">In Stock</option>
                  <option value="OUT_OF_STOCK">Out of Stock</option>
                  <option value="PRE_ORDER">Pre-Order</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Image URL</label>
              <input
                type="url"
                class="form-control"
                placeholder="https://images.unsplash.com/... or uploaded S3 URL"
                [(ngModel)]="formData.imageUrl"
                name="imageUrl"
              />
              <div *ngIf="formData.imageUrl" class="image-preview-wrap">
                <img [src]="formData.imageUrl" alt="Preview" class="preview-img" (error)="onImageError($event)" />
                <span class="preview-lbl">Preview</span>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Short Tagline / Summary</label>
              <input
                type="text"
                class="form-control"
                placeholder="Brief highlight, e.g. Decadent dark chocolate ganache layered cake"
                [(ngModel)]="formData.shortDescription"
                name="shortDescription"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Full Description</label>
              <textarea
                class="form-control"
                rows="3"
                placeholder="Detailed ingredients, taste profile, weight and allergy info..."
                [(ngModel)]="formData.description"
                name="description"
              ></textarea>
            </div>

            <div class="checkbox-row">
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="formData.isFeatured" name="isFeatured" />
                <span>⭐ Feature on Homepage</span>
              </label>

              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="formData.isBestSeller" name="isBestSeller" />
                <span>🔥 Best Seller</span>
              </label>

              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="formData.isCustomizable" name="isCustomizable" />
                <span>🎂 Allow Custom Message / Flavor</span>
              </label>
            </div>

            <div *ngIf="formError()" class="alert-error">
              {{ formError() }}
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-ghost" (click)="closeModal()" [disabled]="submitting()">
                Cancel
              </button>
              <button type="submit" class="btn btn-primary" [disabled]="submitting()">
                <span *ngIf="submitting()" class="spinner-sm"></span>
                {{ isEditing() ? 'Update Product' : 'Create Product' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .products-page {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }
    .page-header h1 {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    .page-header p {
      color: var(--text-secondary);
      font-size: 0.9rem;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
      gap: 16px;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 18px 20px;
    }
    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
    }
    .stat-icon.purple { background: var(--purple-bg); }
    .stat-icon.green { background: var(--green-bg); }
    .stat-icon.yellow { background: var(--yellow-bg); }
    .stat-icon.red { background: var(--red-bg); }
    .stat-val {
      font-size: 1.6rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    .stat-lbl {
      font-size: 0.8rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
      padding: 16px 20px;
    }
    .search-box {
      position: relative;
      flex: 1;
      min-width: 260px;
    }
    .search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 0.9rem;
      pointer-events: none;
    }
    .search-box input {
      padding-left: 36px;
    }
    .filter-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }
    .filter-select {
      min-width: 160px;
    }

    .table-card {
      padding: 0;
      overflow: hidden;
    }
    .product-info-cell {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .product-thumb {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-sm);
      object-fit: cover;
      background: var(--bg-input);
      border: 1px solid var(--border);
    }
    .product-name {
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 2px;
    }
    .product-desc {
      font-size: 0.78rem;
      color: var(--text-muted);
    }
    .price-text {
      font-weight: 600;
      color: var(--accent-light);
    }
    .tag-badges {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
    .actions-cell {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }

    .loading-state, .empty-state {
      padding: 60px 20px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }
    .empty-icon {
      font-size: 3rem;
    }
    .spinner {
      width: 36px;
      height: 36px;
      border: 3px solid rgba(255,255,255,0.1);
      border-top-color: var(--accent);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    .spinner-sm {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255,255,255,0.2);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      display: inline-block;
      margin-right: 6px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Modal */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
    }
    .modal-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-xl);
      width: 100%;
      max-width: 680px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid var(--border);
    }
    .modal-header h2 {
      font-size: 1.25rem;
      font-weight: 600;
    }
    .modal-form {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }
    .form-row {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }
    .flex-1 { flex: 1; min-width: 180px; }
    .flex-2 { flex: 2; min-width: 220px; }

    .image-preview-wrap {
      margin-top: 8px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .preview-img {
      width: 60px;
      height: 60px;
      border-radius: var(--radius-sm);
      object-fit: cover;
      border: 1px solid var(--border);
    }
    .preview-lbl {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .checkbox-row {
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
      padding: 6px 0;
    }
    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      font-size: 0.85rem;
      color: var(--text-secondary);
    }
    .checkbox-label input {
      accent-color: var(--accent);
      width: 16px;
      height: 16px;
    }

    .alert-error {
      background: var(--red-bg);
      color: var(--red);
      border: 1px solid rgba(239, 68, 68, 0.3);
      padding: 10px 14px;
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 8px;
      padding-top: 16px;
      border-top: 1px solid var(--border);
    }
  `]
})
export class ProductsComponent implements OnInit {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  loading = signal<boolean>(true);
  submitting = signal<boolean>(false);
  isModalOpen = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  formError = signal<string | null>(null);

  searchQuery = '';
  selectedCategory = '';
  selectedStock = '';

  formData: {
    id?: string;
    name: string;
    basePrice: number | null;
    categoryId: string;
    description: string;
    shortDescription: string;
    imageUrl: string;
    stockStatus: 'IN_STOCK' | 'OUT_OF_STOCK' | 'PRE_ORDER';
    isFeatured: boolean;
    isBestSeller: boolean;
    isCustomizable: boolean;
  } = this.getEmptyForm();

  filteredProducts = computed(() => {
    return this.products().filter((p) => {
      const matchesSearch = !this.searchQuery ||
        p.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        (p.shortDescription && p.shortDescription.toLowerCase().includes(this.searchQuery.toLowerCase()));

      const matchesCat = !this.selectedCategory || p.categoryId === this.selectedCategory;
      const matchesStock = !this.selectedStock || p.stockStatus === this.selectedStock;

      return matchesSearch && matchesCat && matchesStock;
    });
  });

  inStockCount = computed(() => this.products().filter(p => p.stockStatus === 'IN_STOCK').length);
  featuredCount = computed(() => this.products().filter(p => p.isFeatured).length);
  outOfStockCount = computed(() => this.products().filter(p => p.stockStatus === 'OUT_OF_STOCK').length);

  ngOnInit() {
    this.loadCategories();
    this.loadProducts();
  }

  loadProducts() {
    this.loading.set(true);
    this.http.get<{ data: Product[] } | Product[]>(`${this.apiUrl}/products?limit=100`).subscribe({
      next: (res) => {
        const list = Array.isArray(res) ? res : res.data || [];
        this.products.set(list);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load products:', err);
        this.loading.set(false);
      }
    });
  }

  loadCategories() {
    this.http.get<Category[]>(`${this.apiUrl}/categories`).subscribe({
      next: (cats) => {
        this.categories.set(cats || []);
      },
      error: (err) => console.error('Failed to load categories:', err)
    });
  }

  getCategoryName(id: string): string {
    const found = this.categories().find(c => c.id === id);
    return found ? found.name : '';
  }

  getProductImage(prod: Product): string {
    if (prod.imageUrl) return prod.imageUrl;
    if (prod.images && prod.images.length > 0) return prod.images[0].url;
    return 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=120';
  }

  onImageError(event: any) {
    event.target.src = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=120';
  }

  openCreateModal() {
    this.isEditing.set(false);
    this.formData = this.getEmptyForm();
    if (this.categories().length > 0) {
      this.formData.categoryId = this.categories()[0].id;
    }
    this.formError.set(null);
    this.isModalOpen.set(true);
  }

  openEditModal(product: Product) {
    this.isEditing.set(true);
    this.formData = {
      id: product.id,
      name: product.name,
      basePrice: product.basePrice,
      categoryId: product.categoryId,
      description: product.description || '',
      shortDescription: product.shortDescription || '',
      imageUrl: product.imageUrl || (product.images?.[0]?.url || ''),
      stockStatus: product.stockStatus || 'IN_STOCK',
      isFeatured: !!product.isFeatured,
      isBestSeller: !!product.isBestSeller,
      isCustomizable: !!product.isCustomizable,
    };
    this.formError.set(null);
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  saveProduct() {
    if (!this.formData.name || !this.formData.basePrice || !this.formData.categoryId) {
      this.formError.set('Please fill out Product Name, Base Price, and select a Category.');
      return;
    }

    this.submitting.set(true);
    this.formError.set(null);

    const payload = {
      ...this.formData,
      basePrice: Number(this.formData.basePrice),
      images: this.formData.imageUrl ? [{ id: 'img-1', url: this.formData.imageUrl, isPrimary: true }] : [],
    };

    if (this.isEditing() && this.formData.id) {
      this.http.put(`${this.apiUrl}/products/${this.formData.id}`, payload).subscribe({
        next: () => {
          this.submitting.set(false);
          this.closeModal();
          this.loadProducts();
        },
        error: (err) => {
          this.submitting.set(false);
          this.formError.set(err.error?.error || 'Failed to update product. Please try again.');
        }
      });
    } else {
      this.http.post(`${this.apiUrl}/products`, payload).subscribe({
        next: () => {
          this.submitting.set(false);
          this.closeModal();
          this.loadProducts();
        },
        error: (err) => {
          this.submitting.set(false);
          this.formError.set(err.error?.error || 'Failed to create product. Please try again.');
        }
      });
    }
  }

  deleteProduct(prod: Product) {
    if (!confirm(`Are you sure you want to delete "${prod.name}"?`)) {
      return;
    }

    this.http.delete(`${this.apiUrl}/products/${prod.id}`).subscribe({
      next: () => {
        this.products.update(list => list.filter(p => p.id !== prod.id));
      },
      error: (err) => {
        alert(err.error?.error || 'Failed to delete product.');
      }
    });
  }

  private getEmptyForm() {
    return {
      name: '',
      basePrice: null as number | null,
      categoryId: '',
      description: '',
      shortDescription: '',
      imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600',
      stockStatus: 'IN_STOCK' as const,
      isFeatured: false,
      isBestSeller: false,
      isCustomizable: false,
    };
  }
}
