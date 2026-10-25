import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  createdAt?: string;
}

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="categories-page">
      <div class="page-header">
        <div>
          <h1>Categories</h1>
          <p>Organize bakery catalog into sections (Cakes, Pastries, Breads, etc.)</p>
        </div>
        <button class="btn btn-primary" (click)="openCreateModal()">
          <span>➕</span> Add New Category
        </button>
      </div>

      <div class="card table-card">
        <div *ngIf="loading()" class="loading-state">
          <div class="spinner"></div>
          <p>Loading categories...</p>
        </div>

        <div *ngIf="!loading() && categories().length === 0" class="empty-state">
          <div class="empty-icon">🏷️</div>
          <h3>No Categories Yet</h3>
          <p>Create your first category to group products.</p>
          <button class="btn btn-primary" (click)="openCreateModal()">
            ➕ Add Your First Category
          </button>
        </div>

        <div *ngIf="!loading() && categories().length > 0" class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Slug</th>
                <th>Description</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let cat of categories()">
                <td>
                  <div class="cat-info-cell">
                    <img [src]="cat.imageUrl || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=100'" alt="{{ cat.name }}" class="cat-thumb" />
                    <span class="cat-name">{{ cat.name }}</span>
                  </div>
                </td>
                <td>
                  <span class="badge badge-gray">{{ cat.slug }}</span>
                </td>
                <td>
                  <span class="cat-desc">{{ cat.description || 'No description' }}</span>
                </td>
                <td style="text-align: right;">
                  <button class="btn btn-danger btn-sm" (click)="deleteCategory(cat)">
                    🗑️ Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Add Category Modal -->
      <div class="modal-overlay" *ngIf="isModalOpen()">
        <div class="modal-card">
          <div class="modal-header">
            <h2>Add New Category</h2>
            <button class="btn-icon" (click)="closeModal()">✕</button>
          </div>

          <form (ngSubmit)="saveCategory()" class="modal-form">
            <div class="form-group">
              <label class="form-label">Category Name *</label>
              <input
                type="text"
                class="form-control"
                placeholder="e.g. Signature Cakes"
                [(ngModel)]="formData.name"
                name="name"
                required
              />
            </div>

            <div class="form-group">
              <label class="form-label">Image URL</label>
              <input
                type="url"
                class="form-control"
                placeholder="https://images.unsplash.com/..."
                [(ngModel)]="formData.imageUrl"
                name="imageUrl"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Description</label>
              <textarea
                class="form-control"
                rows="3"
                placeholder="Brief description for customers browsing this section..."
                [(ngModel)]="formData.description"
                name="description"
              ></textarea>
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
                Create Category
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .categories-page {
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

    .table-card {
      padding: 0;
      overflow: hidden;
    }
    .cat-info-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .cat-thumb {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-sm);
      object-fit: cover;
      background: var(--bg-input);
    }
    .cat-name {
      font-weight: 600;
      color: var(--text-primary);
    }
    .cat-desc {
      color: var(--text-secondary);
      font-size: 0.85rem;
    }

    .loading-state, .empty-state {
      padding: 60px 20px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }
    .empty-icon { font-size: 3rem; }
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
      max-width: 520px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid var(--border);
    }
    .modal-form {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }
    .alert-error {
      background: var(--red-bg);
      color: var(--red);
      padding: 10px 14px;
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
    }
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding-top: 16px;
      border-top: 1px solid var(--border);
    }
  `]
})
export class CategoriesComponent implements OnInit {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  categories = signal<Category[]>([]);
  loading = signal<boolean>(true);
  submitting = signal<boolean>(false);
  isModalOpen = signal<boolean>(false);
  formError = signal<string | null>(null);

  formData = {
    name: '',
    imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600',
    description: '',
  };

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    this.loading.set(true);
    this.http.get<Category[]>(`${this.apiUrl}/categories`).subscribe({
      next: (res) => {
        this.categories.set(res || []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load categories:', err);
        this.loading.set(false);
      }
    });
  }

  openCreateModal() {
    this.formData = {
      name: '',
      imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600',
      description: '',
    };
    this.formError.set(null);
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  saveCategory() {
    if (!this.formData.name) {
      this.formError.set('Category name is required.');
      return;
    }

    this.submitting.set(true);
    this.formError.set(null);

    this.http.post(`${this.apiUrl}/categories`, this.formData).subscribe({
      next: () => {
        this.submitting.set(false);
        this.closeModal();
        this.loadCategories();
      },
      error: (err) => {
        this.submitting.set(false);
        this.formError.set(err.error?.error || 'Failed to create category.');
      }
    });
  }

  deleteCategory(cat: Category) {
    if (!confirm(`Are you sure you want to delete category "${cat.name}"?`)) {
      return;
    }

    this.http.delete(`${this.apiUrl}/categories/${cat.id}`).subscribe({
      next: () => {
        this.categories.update(list => list.filter(c => c.id !== cat.id));
      },
      error: (err) => {
        alert(err.error?.error || 'Failed to delete category.');
      }
    });
  }
}
