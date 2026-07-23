import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../../core/services/toast.service';
import { environment } from '../../../../environments/environment';

interface OrderItem {
  id: string;
  product: {
    id: string;
    name: string;
    slug: string;
    images: { url: string; isPrimary: boolean }[];
  };
  quantity: number;
  unitPrice: number;
  customizations: Record<string, unknown>;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  subtotal: number;
  deliveryCharge: number;
  totalAmount: number;
  deliveryAddress: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
    contactPhone: string;
  };
  notes: string;
  items: OrderItem[];
  createdAt: string;
}

interface OrdersResponse {
  items: Order[];
  total: number;
  page: number;
  totalPages: number;
}

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="orders-page">
      <div class="container">

        <!-- Header -->
        <div class="page-header fade-in-up">
          <div>
            <h1>My Orders</h1>
            <p>Track and manage all your bakery orders</p>
          </div>
          <a routerLink="/account/profile" class="btn btn-secondary">← Back to Profile</a>
        </div>

        <!-- Loading -->
        @if (loading()) {
          <div class="loading-overlay" style="min-height:300px">
            <div class="spinner"></div>
          </div>
        }

        <!-- Empty State -->
        @else if (!orders().length) {
          <div class="empty-orders card">
            <div class="empty-icon">🛍️</div>
            <h2>No orders yet</h2>
            <p>You haven't placed any orders. Start shopping!</p>
            <a routerLink="/products" class="btn btn-primary btn-lg">Shop Now</a>
          </div>
        }

        <!-- Orders List -->
        @else {
          <div class="orders-list">
            @for (order of orders(); track order.id) {
              <div class="order-card card" [class.expanded]="expandedId() === order.id">

                <!-- Order Header -->
                <div class="order-header" (click)="toggleExpand(order.id)">
                  <div class="order-info">
                    <div class="order-number"># {{ order.orderNumber }}</div>
                    <div class="order-date">{{ order.createdAt | date:'dd MMM yyyy, h:mm a' }}</div>
                  </div>

                  <div class="order-status-group">
                    <span class="badge" [class]="getStatusClass(order.status)">
                      {{ getStatusLabel(order.status) }}
                    </span>
                    <span class="badge" [class]="getPaymentClass(order.paymentStatus)">
                      {{ order.paymentStatus }}
                    </span>
                  </div>

                  <div class="order-total">
                    <span class="total-label">Total</span>
                    <span class="total-amount">Rs {{ order.totalAmount | number:'1.0-0' }}</span>
                  </div>

                  <button class="expand-btn" [class.rotated]="expandedId() === order.id">▼</button>
                </div>

                <!-- Order Progress Bar -->
                <div class="progress-track">
                  @for (step of orderSteps; track step.key) {
                    <div class="step" [class.active]="isStepActive(order.status, step.key)" [class.current]="order.status === step.key">
                      <div class="step-dot">{{ step.icon }}</div>
                      <div class="step-label">{{ step.label }}</div>
                    </div>
                    @if (!$last) {
                      <div class="step-line" [class.active]="isStepActive(order.status, step.key)"></div>
                    }
                  }
                </div>

                <!-- Expanded Details -->
                @if (expandedId() === order.id) {
                  <div class="order-details">
                    <div class="detail-grid">

                      <!-- Items -->
                      <div class="detail-section">
                        <h4>Items Ordered</h4>
                        @for (item of order.items; track item.id) {
                          <div class="order-item">
                            <div class="item-img">
                              @if (getPrimaryImage(item)) {
                                <img [src]="getPrimaryImage(item)" [alt]="item.product.name" />
                              } @else {
                                <div class="item-img-placeholder">🎂</div>
                              }
                            </div>
                            <div class="item-info">
                              <div class="item-name">{{ item.product.name }}</div>
                              @if (item.customizations && hasCustomizations(item.customizations)) {
                                <div class="item-customizations">
                                  @for (entry of getCustomizationEntries(item.customizations); track entry[0]) {
                                    <span class="custom-tag">{{ entry[0] }}: {{ entry[1] }}</span>
                                  }
                                </div>
                              }
                              <div class="item-qty">Qty: {{ item.quantity }}</div>
                            </div>
                            <div class="item-price">Rs {{ (item.unitPrice * item.quantity) | number:'1.0-0' }}</div>
                          </div>
                        }
                      </div>

                      <!-- Delivery & Payment -->
                      <div class="detail-section">
                        <h4>Delivery Address</h4>
                        <div class="detail-card">
                          <p>{{ order.deliveryAddress.street }}</p>
                          <p>{{ order.deliveryAddress.city }}, {{ order.deliveryAddress.province }} {{ order.deliveryAddress.postalCode }}</p>
                          <p class="contact-phone">📞 {{ order.deliveryAddress.contactPhone }}</p>
                        </div>

                        <h4 style="margin-top: var(--space-lg)">Payment</h4>
                        <div class="detail-card">
                          <div class="payment-row">
                            <span>Method</span>
                            <span>{{ order.paymentMethod || 'Not set' }}</span>
                          </div>
                          <div class="payment-row">
                            <span>Subtotal</span>
                            <span>Rs {{ order.subtotal | number:'1.0-0' }}</span>
                          </div>
                          <div class="payment-row">
                            <span>Delivery</span>
                            <span>Rs {{ order.deliveryCharge | number:'1.0-0' }}</span>
                          </div>
                          <div class="payment-row total-row">
                            <span>Total</span>
                            <span>Rs {{ order.totalAmount | number:'1.0-0' }}</span>
                          </div>
                        </div>

                        @if (order.notes) {
                          <div class="order-notes">
                            <span>📝</span> {{ order.notes }}
                          </div>
                        }
                      </div>
                    </div>
                  </div>
                }

              </div>
            }
          </div>

          <!-- Pagination -->
          @if (totalPages() > 1) {
            <div class="pagination">
              <button class="btn btn-ghost btn-sm" [disabled]="page() === 1" (click)="changePage(page() - 1)">← Prev</button>
              @for (p of pageRange(); track p) {
                <button class="page-btn" [class.active]="page() === p" (click)="changePage(p)">{{ p }}</button>
              }
              <button class="btn btn-ghost btn-sm" [disabled]="page() === totalPages()" (click)="changePage(page() + 1)">Next →</button>
            </div>
          }
        }

      </div>
    </div>
  `,
  styles: [`
    .orders-page {
      padding: var(--space-3xl) 0;
      min-height: 80vh;
      animation: fadeInUp 0.4s ease forwards;
    }
    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: var(--space-2xl);
      flex-wrap: wrap;
      gap: var(--space-lg);
    }
    .page-header h1 { margin-bottom: 4px; }
    .page-header p { color: var(--color-brown-light); }

    /* Empty State */
    .empty-orders {
      text-align: center;
      padding: var(--space-3xl);
      max-width: 480px;
      margin: 0 auto;
    }
    .empty-icon { font-size: 4rem; margin-bottom: var(--space-lg); }
    .empty-orders h2 { margin-bottom: var(--space-md); }
    .empty-orders p { color: var(--color-brown-light); margin-bottom: var(--space-xl); }

    /* Orders List */
    .orders-list { display: flex; flex-direction: column; gap: var(--space-lg); }
    .order-card {
      padding: 0;
      overflow: hidden;
      border: 2px solid transparent;
      transition: border-color var(--transition-base);
    }
    .order-card.expanded { border-color: var(--color-blush); }
    .order-card:hover { transform: none; box-shadow: var(--shadow-md); }

    /* Order Header */
    .order-header {
      display: flex;
      align-items: center;
      gap: var(--space-lg);
      padding: var(--space-lg) var(--space-xl);
      cursor: pointer;
      transition: background var(--transition-fast);
      flex-wrap: wrap;
    }
    .order-header:hover { background: var(--color-cream); }
    .order-info { flex: 1; min-width: 140px; }
    .order-number { font-weight: 700; font-size: 1rem; color: var(--color-espresso); font-family: var(--font-heading); }
    .order-date { font-size: 0.8rem; color: var(--color-brown-light); margin-top: 2px; }
    .order-status-group { display: flex; gap: var(--space-sm); flex-wrap: wrap; }
    .order-total { text-align: right; min-width: 100px; }
    .total-label { display: block; font-size: 0.75rem; color: var(--color-brown-light); }
    .total-amount { font-weight: 700; font-size: 1.1rem; color: var(--color-espresso); font-family: var(--font-heading); }
    .expand-btn {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 0.8rem;
      color: var(--color-brown-light);
      transition: transform var(--transition-fast);
      padding: 4px;
    }
    .expand-btn.rotated { transform: rotate(180deg); }

    /* Progress Track */
    .progress-track {
      display: flex;
      align-items: center;
      padding: var(--space-lg) var(--space-xl);
      background: var(--color-cream);
      border-top: 1px solid var(--color-cream-dark);
      overflow-x: auto;
    }
    .step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      min-width: 70px;
      opacity: 0.35;
      transition: opacity var(--transition-base);
    }
    .step.active { opacity: 1; }
    .step.current .step-dot {
      box-shadow: 0 0 0 4px rgba(124,74,45,0.2);
    }
    .step-dot {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--color-cream-dark);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      transition: background var(--transition-base);
    }
    .step.active .step-dot { background: var(--color-brown); }
    .step-label { font-size: 0.68rem; text-align: center; color: var(--color-espresso); font-weight: 500; }
    .step-line {
      flex: 1;
      height: 2px;
      background: var(--color-cream-dark);
      margin-bottom: 20px;
      transition: background var(--transition-base);
      min-width: 20px;
    }
    .step-line.active { background: var(--color-brown); }

    /* Expanded Details */
    .order-details {
      border-top: 1px solid var(--color-cream-dark);
      padding: var(--space-xl);
      animation: fadeInUp 0.3s ease forwards;
    }
    .detail-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-xl);
    }
    .detail-section h4 {
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--color-brown);
      margin-bottom: var(--space-md);
    }
    .order-item {
      display: flex;
      align-items: flex-start;
      gap: var(--space-md);
      padding: var(--space-md) 0;
      border-bottom: 1px solid var(--color-cream-dark);
    }
    .order-item:last-child { border-bottom: none; }
    .item-img {
      width: 56px;
      height: 56px;
      border-radius: var(--radius-sm);
      overflow: hidden;
      flex-shrink: 0;
      background: var(--color-cream-dark);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .item-img img { width: 100%; height: 100%; object-fit: cover; }
    .item-img-placeholder { font-size: 1.5rem; }
    .item-info { flex: 1; }
    .item-name { font-weight: 600; font-size: 0.9rem; margin-bottom: 4px; }
    .item-customizations { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 4px; }
    .custom-tag {
      font-size: 0.7rem;
      background: var(--color-blush-light);
      color: var(--color-brown-dark);
      padding: 2px 8px;
      border-radius: var(--radius-full);
    }
    .item-qty { font-size: 0.8rem; color: var(--color-brown-light); }
    .item-price { font-weight: 700; font-size: 0.95rem; white-space: nowrap; }
    .detail-card {
      background: var(--color-cream);
      border-radius: var(--radius-md);
      padding: var(--space-lg);
      font-size: 0.9rem;
    }
    .detail-card p { margin-bottom: 4px; }
    .contact-phone { color: var(--color-brown-light); margin-top: 6px !important; }
    .payment-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 1px solid var(--color-cream-dark);
      font-size: 0.875rem;
    }
    .payment-row:last-child { border-bottom: none; }
    .total-row { font-weight: 700; color: var(--color-espresso); }
    .order-notes {
      margin-top: var(--space-md);
      padding: var(--space-md);
      background: var(--color-blush-light);
      border-radius: var(--radius-sm);
      font-size: 0.875rem;
      color: var(--color-brown-dark);
    }

    /* Pagination */
    .pagination {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-sm);
      margin-top: var(--space-2xl);
    }
    .page-btn {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-sm);
      border: 1.5px solid var(--color-cream-dark);
      background: var(--color-white);
      cursor: pointer;
      font-size: 0.875rem;
      font-family: var(--font-body);
      transition: all var(--transition-fast);
    }
    .page-btn.active {
      background: var(--color-brown);
      color: white;
      border-color: var(--color-brown);
    }
    .page-btn:hover:not(.active) { border-color: var(--color-brown); }

    @media (max-width: 768px) {
      .detail-grid { grid-template-columns: 1fr; }
      .order-header { gap: var(--space-md); }
    }
  `]
})
export class MyOrdersComponent implements OnInit {
  private http = inject(HttpClient);
  private toast = inject(ToastService);

  private api = environment.apiUrl;

  orders = signal<Order[]>([]);
  loading = signal(true);
  page = signal(1);
  totalPages = signal(1);
  expandedId = signal<string | null>(null);

  readonly orderSteps = [
    { key: 'PENDING', icon: '🕐', label: 'Pending' },
    { key: 'CONFIRMED', icon: '✅', label: 'Confirmed' },
    { key: 'PREPARING', icon: '👨‍🍳', label: 'Preparing' },
    { key: 'OUT_FOR_DELIVERY', icon: '🚚', label: 'On the Way' },
    { key: 'DELIVERED', icon: '🎉', label: 'Delivered' },
  ];

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.loading.set(true);
    this.http.get<OrdersResponse>(`${this.api}/orders/my?page=${this.page()}&limit=10`).subscribe({
      next: (res) => {
        this.orders.set(res.items || []);
        this.totalPages.set(res.totalPages || 1);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Failed to load orders');
        this.loading.set(false);
      }
    });
  }

  changePage(p: number) {
    this.page.set(p);
    this.loadOrders();
  }

  toggleExpand(id: string) {
    this.expandedId.set(this.expandedId() === id ? null : id);
  }

  isStepActive(currentStatus: string, stepKey: string): boolean {
    if (currentStatus === 'CANCELLED') return stepKey === 'PENDING';
    const statusOrder = ['PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'];
    const current = statusOrder.indexOf(currentStatus);
    const step = statusOrder.indexOf(stepKey);
    return step <= current;
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'badge badge-warning',
      CONFIRMED: 'badge badge-info',
      PREPARING: 'badge badge-info',
      OUT_FOR_DELIVERY: 'badge badge-brown',
      DELIVERED: 'badge badge-success',
      CANCELLED: 'badge badge-error',
    };
    return map[status] || 'badge';
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      PENDING: '🕐 Pending',
      CONFIRMED: '✅ Confirmed',
      PREPARING: '👨‍🍳 Preparing',
      OUT_FOR_DELIVERY: '🚚 Out for Delivery',
      DELIVERED: '🎉 Delivered',
      CANCELLED: '❌ Cancelled',
    };
    return map[status] || status;
  }

  getPaymentClass(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'badge badge-warning',
      PAID: 'badge badge-success',
      FAILED: 'badge badge-error',
      REFUNDED: 'badge badge-info',
    };
    return map[status] || 'badge';
  }

  getPrimaryImage(item: OrderItem): string {
    const primary = item.product.images?.find(i => i.isPrimary);
    return primary?.url || item.product.images?.[0]?.url || '';
  }

  hasCustomizations(c: Record<string, unknown>): boolean {
    return Object.keys(c || {}).length > 0;
  }

  getCustomizationEntries(c: Record<string, unknown>): [string, unknown][] {
    return Object.entries(c || {});
  }

  pageRange(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  }
}
