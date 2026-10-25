import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface OrderItem {
  id?: string;
  productId?: string;
  productName?: string;
  name?: string;
  quantity: number;
  unitPrice: number;
  price?: number;
  totalPrice?: number;
  selectedVariant?: string;
  customMessage?: string;
}

export interface Order {
  id: string;
  userId: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  items: OrderItem[];
  totalAmount: number;
  shippingAddress: {
    fullName: string;
    phone: string;
    street: string;
    city: string;
    postalCode?: string;
    notes?: string;
  };
  paymentMethod: 'COD' | 'EASYPAISA' | 'JAZZCASH';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED';
  status:
    | 'PENDING'
    | 'CONFIRMED'
    | 'PREPARING'
    | 'OUT_FOR_DELIVERY'
    | 'DELIVERED'
    | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
}

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="orders-page">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1>Customer Orders</h1>
          <p>Monitor real-time bakery orders, fulfillment status, and delivery tracking</p>
        </div>
        <button class="btn btn-ghost" (click)="loadOrders()" [disabled]="loading()">
          <span>🔄</span> Refresh Orders
        </button>
      </div>

      <!-- Quick Metrics -->
      <div class="metrics-grid">
        <div class="stat-card">
          <div class="stat-icon purple">📦</div>
          <div>
            <div class="stat-val">{{ orders().length }}</div>
            <div class="stat-lbl">Total Orders</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon yellow">⏳</div>
          <div>
            <div class="stat-val">{{ pendingCount() }}</div>
            <div class="stat-lbl">Pending Review</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon blue">👨‍🍳</div>
          <div>
            <div class="stat-val">{{ preparingCount() }}</div>
            <div class="stat-lbl">In Bakery Prep</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon green">🚚</div>
          <div>
            <div class="stat-val">{{ deliveryCount() }}</div>
            <div class="stat-lbl">Out for Delivery</div>
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
            placeholder="Search by Order ID, customer name, phone, or city..."
            [(ngModel)]="searchQuery"
          />
        </div>

        <div class="filter-actions">
          <select class="form-control filter-select" [(ngModel)]="selectedStatus">
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PREPARING">Preparing</option>
            <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <select class="form-control filter-select" [(ngModel)]="selectedPayment">
            <option value="">All Payments</option>
            <option value="COD">Cash on Delivery</option>
            <option value="EASYPAISA">EasyPaisa</option>
            <option value="JAZZCASH">JazzCash</option>
          </select>
        </div>
      </div>

      <!-- Orders Data Table -->
      <div class="card table-card">
        <div *ngIf="loading()" class="loading-state">
          <div class="spinner"></div>
          <p>Fetching orders from DynamoDB...</p>
        </div>

        <div *ngIf="!loading() && filteredOrders().length === 0" class="empty-state">
          <div class="empty-icon">📭</div>
          <h3>No Orders Found</h3>
          <p *ngIf="orders().length === 0">No customer has placed an order yet.</p>
          <p *ngIf="orders().length > 0">Try clearing or changing your search filters.</p>
        </div>

        <div *ngIf="!loading() && filteredOrders().length > 0" class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Order ID & Date</th>
                <th>Customer</th>
                <th>Items Ordered</th>
                <th>Total (PKR)</th>
                <th>Payment</th>
                <th>Fulfillment Status</th>
                <th style="text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let order of filteredOrders()">
                <td>
                  <div class="order-id-cell">
                    <span class="order-code">#{{ order.id | slice:0:8 }}</span>
                    <span class="order-date">{{ order.createdAt | date:'mediumDate' }} • {{ order.createdAt | date:'shortTime' }}</span>
                  </div>
                </td>
                <td>
                  <div class="customer-cell">
                    <span class="customer-name">{{ order.shippingAddress?.fullName || order.user?.firstName || 'Customer' }}</span>
                    <span class="customer-sub">{{ order.shippingAddress?.phone || order.user?.phone }}</span>
                    <span class="customer-city">{{ order.shippingAddress?.city }}</span>
                  </div>
                </td>
                <td>
                  <div class="items-summary-cell">
                    <span class="items-count-badge">{{ order.items?.length || 0 }} item(s)</span>
                    <div class="items-preview-text">
                      <span *ngFor="let item of (order.items || []) | slice:0:2; let last = last">
                        {{ item.quantity }}x {{ item.productName || item.name }}{{ !last ? ', ' : '' }}
                      </span>
                      <span *ngIf="(order.items || []).length > 2"> +{{ (order.items || []).length - 2 }} more</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="price-val">Rs. {{ order.totalAmount | number }}</span>
                </td>
                <td>
                  <div class="payment-cell">
                    <span class="badge" [ngClass]="{
                      'badge-purple': order.paymentMethod === 'JAZZCASH',
                      'badge-green': order.paymentMethod === 'EASYPAISA',
                      'badge-gray': order.paymentMethod === 'COD'
                    }">
                      {{ order.paymentMethod }}
                    </span>
                    <span class="sub-badge" [ngClass]="order.paymentStatus === 'PAID' ? 'text-green' : 'text-yellow'">
                      {{ order.paymentStatus === 'PAID' ? '● Paid' : '○ Pending' }}
                    </span>
                  </div>
                </td>
                <td>
                  <select
                    class="status-dropdown form-control"
                    [value]="order.status"
                    (change)="updateOrderStatus(order, $event)"
                    [ngClass]="{
                      'status-pending': order.status === 'PENDING',
                      'status-confirmed': order.status === 'CONFIRMED',
                      'status-preparing': order.status === 'PREPARING',
                      'status-delivery': order.status === 'OUT_FOR_DELIVERY',
                      'status-delivered': order.status === 'DELIVERED',
                      'status-cancelled': order.status === 'CANCELLED'
                    }"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="PREPARING">Preparing</option>
                    <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </td>
                <td style="text-align: right;">
                  <button class="btn btn-ghost btn-sm" (click)="openDetailModal(order)">
                    🔍 Details
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Order Detail Modal -->
      <div class="modal-overlay" *ngIf="selectedOrder()">
        <div class="modal-card">
          <div class="modal-header">
            <div>
              <h2>Order #{{ selectedOrder()!.id | slice:0:8 }} Details</h2>
              <span class="modal-sub">Placed on {{ selectedOrder()!.createdAt | date:'fullDate' }} at {{ selectedOrder()!.createdAt | date:'shortTime' }}</span>
            </div>
            <button class="btn-icon" (click)="closeDetailModal()">✕</button>
          </div>

          <div class="modal-body">
            <!-- Customer & Delivery Info -->
            <div class="detail-section card">
              <h3 class="section-title">📍 Delivery & Customer Info</h3>
              <div class="detail-grid">
                <div>
                  <span class="detail-lbl">Customer Name</span>
                  <div class="detail-val">{{ selectedOrder()!.shippingAddress.fullName }}</div>
                </div>
                <div>
                  <span class="detail-lbl">Phone Number</span>
                  <div class="detail-val">{{ selectedOrder()!.shippingAddress.phone }}</div>
                </div>
                <div>
                  <span class="detail-lbl">Delivery City</span>
                  <div class="detail-val">{{ selectedOrder()!.shippingAddress.city }}</div>
                </div>
                <div>
                  <span class="detail-lbl">Street Address</span>
                  <div class="detail-val">{{ selectedOrder()!.shippingAddress.street }}</div>
                </div>
              </div>
              <div *ngIf="selectedOrder()!.shippingAddress.notes" class="delivery-notes">
                <strong>Customer Notes:</strong> {{ selectedOrder()!.shippingAddress.notes }}
              </div>
            </div>

            <!-- Itemized Products -->
            <div class="detail-section card">
              <h3 class="section-title">🍰 Ordered Bakery Items</h3>
              <div class="items-list">
                <div class="order-item-row" *ngFor="let item of selectedOrder()!.items">
                  <div class="item-name-block">
                    <div class="item-title">{{ item.quantity }}x {{ item.productName || item.name }}</div>
                    <div *ngIf="item.customMessage" class="item-custom-msg">
                      ✏️ Inscription: "{{ item.customMessage }}"
                    </div>
                  </div>
                  <div class="item-price">
                    Rs. {{ (item.unitPrice || item.price || 0) * item.quantity | number }}
                  </div>
                </div>
              </div>

              <div class="order-total-bar">
                <span>Total Order Amount</span>
                <span class="total-number">Rs. {{ selectedOrder()!.totalAmount | number }}</span>
              </div>
            </div>

            <!-- Payment & Quick Actions -->
            <div class="detail-section card actions-card">
              <h3 class="section-title">⚡ Update Order & Payment Status</h3>
              <div class="form-row">
                <div class="form-group flex-1">
                  <label class="form-label">Order Fulfillment Status</label>
                  <select
                    class="form-control"
                    [ngModel]="selectedOrder()!.status"
                    (ngModelChange)="updateStatusFromModal($event, selectedOrder()!.paymentStatus)"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="PREPARING">Preparing</option>
                    <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>

                <div class="form-group flex-1">
                  <label class="form-label">Payment Status</label>
                  <select
                    class="form-control"
                    [ngModel]="selectedOrder()!.paymentStatus"
                    (ngModelChange)="updateStatusFromModal(selectedOrder()!.status, $event)"
                  >
                    <option value="PENDING">Payment Pending</option>
                    <option value="PAID">Paid</option>
                    <option value="FAILED">Payment Failed</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-primary" (click)="closeDetailModal()">
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .orders-page {
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
    .stat-icon.yellow { background: var(--yellow-bg); }
    .stat-icon.blue { background: var(--blue-bg); }
    .stat-icon.green { background: var(--green-bg); }
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
    .order-id-cell {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .order-code {
      font-weight: 700;
      color: var(--accent-light);
      letter-spacing: 0.5px;
    }
    .order-date {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .customer-cell {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .customer-name {
      font-weight: 600;
      color: var(--text-primary);
    }
    .customer-sub {
      font-size: 0.78rem;
      color: var(--text-secondary);
    }
    .customer-city {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .items-summary-cell {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .items-count-badge {
      font-size: 0.72rem;
      font-weight: 600;
      color: var(--text-secondary);
      background: var(--bg-input);
      padding: 2px 6px;
      border-radius: var(--radius-sm);
      display: inline-block;
      width: fit-content;
    }
    .items-preview-text {
      font-size: 0.8rem;
      color: var(--text-muted);
      max-width: 200px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .price-val {
      font-weight: 700;
      color: var(--text-primary);
      font-size: 0.95rem;
    }

    .payment-cell {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .sub-badge {
      font-size: 0.72rem;
      font-weight: 600;
    }
    .text-green { color: var(--green); }
    .text-yellow { color: var(--yellow); }

    .status-dropdown {
      padding: 6px 10px;
      font-size: 0.8rem;
      font-weight: 600;
      border-radius: var(--radius-sm);
      cursor: pointer;
      width: auto;
    }
    .status-pending { background: var(--yellow-bg); color: var(--yellow); border-color: rgba(245,158,11,0.3); }
    .status-confirmed { background: var(--blue-bg); color: var(--blue); border-color: rgba(59,130,246,0.3); }
    .status-preparing { background: var(--purple-bg); color: var(--purple); border-color: rgba(168,85,247,0.3); }
    .status-delivery { background: rgba(14,165,233,0.15); color: #0ea5e9; border-color: rgba(14,165,233,0.3); }
    .status-delivered { background: var(--green-bg); color: var(--green); border-color: rgba(34,197,94,0.3); }
    .status-cancelled { background: var(--red-bg); color: var(--red); border-color: rgba(239,68,68,0.3); }

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
    .modal-header h2 { font-size: 1.25rem; font-weight: 600; }
    .modal-sub { font-size: 0.8rem; color: var(--text-muted); }
    .modal-body {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }
    .detail-section {
      padding: 16px 20px;
    }
    .section-title {
      font-size: 0.95rem;
      font-weight: 600;
      margin-bottom: 12px;
      color: var(--text-primary);
    }
    .detail-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
    }
    .detail-lbl {
      font-size: 0.75rem;
      text-transform: uppercase;
      color: var(--text-muted);
      letter-spacing: 0.5px;
    }
    .detail-val {
      font-weight: 600;
      color: var(--text-secondary);
      margin-top: 2px;
    }
    .delivery-notes {
      margin-top: 12px;
      padding: 8px 12px;
      background: var(--bg-input);
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
      color: var(--yellow);
    }

    .items-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .order-item-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid var(--border);
    }
    .item-title {
      font-weight: 600;
      color: var(--text-primary);
    }
    .item-custom-msg {
      font-size: 0.78rem;
      color: var(--accent-light);
      margin-top: 2px;
    }
    .item-price {
      font-weight: 600;
      color: var(--text-secondary);
    }
    .order-total-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 14px;
      padding-top: 10px;
      border-top: 2px solid var(--border);
      font-weight: 600;
      color: var(--text-primary);
    }
    .total-number {
      font-size: 1.2rem;
      font-weight: 700;
      color: var(--accent-light);
    }

    .form-row {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }
    .flex-1 { flex: 1; min-width: 180px; }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      padding: 16px 24px;
      border-top: 1px solid var(--border);
    }
  `]
})
export class OrdersComponent implements OnInit {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  orders = signal<Order[]>([]);
  loading = signal<boolean>(true);
  selectedOrder = signal<Order | null>(null);

  searchQuery = '';
  selectedStatus = '';
  selectedPayment = '';

  filteredOrders = computed(() => {
    return this.orders().filter((o) => {
      const q = this.searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        o.id.toLowerCase().includes(q) ||
        (o.shippingAddress?.fullName && o.shippingAddress.fullName.toLowerCase().includes(q)) ||
        (o.shippingAddress?.phone && o.shippingAddress.phone.toLowerCase().includes(q)) ||
        (o.shippingAddress?.city && o.shippingAddress.city.toLowerCase().includes(q));

      const matchesStatus = !this.selectedStatus || o.status === this.selectedStatus;
      const matchesPayment = !this.selectedPayment || o.paymentMethod === this.selectedPayment;

      return matchesSearch && matchesStatus && matchesPayment;
    });
  });

  pendingCount = computed(() => this.orders().filter(o => o.status === 'PENDING').length);
  preparingCount = computed(() => this.orders().filter(o => o.status === 'PREPARING').length);
  deliveryCount = computed(() => this.orders().filter(o => o.status === 'OUT_FOR_DELIVERY').length);

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.loading.set(true);
    this.http.get<Order[]>(`${this.apiUrl}/orders?limit=100`).subscribe({
      next: (data) => {
        this.orders.set(data || []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load orders from API:', err);
        this.loading.set(false);
      }
    });
  }

  updateOrderStatus(order: Order, event: any) {
    const newStatus = event.target.value;
    this.http.patch<Order>(`${this.apiUrl}/orders/${order.id}/status`, {
      status: newStatus,
    }).subscribe({
      next: (updated) => {
        this.orders.update(list =>
          list.map(o => o.id === order.id ? { ...o, status: newStatus } : o)
        );
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to update order status');
        this.loadOrders(); // rollback
      }
    });
  }

  updateStatusFromModal(status: any, paymentStatus: any) {
    const cur = this.selectedOrder();
    if (!cur) return;

    this.http.patch<Order>(`${this.apiUrl}/orders/${cur.id}/status`, {
      status,
      paymentStatus,
    }).subscribe({
      next: (updated) => {
        this.selectedOrder.set({
          ...cur,
          status,
          paymentStatus,
        });
        this.orders.update(list =>
          list.map(o => o.id === cur.id ? { ...o, status, paymentStatus } : o)
        );
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to update order');
      }
    });
  }

  openDetailModal(order: Order) {
    this.selectedOrder.set(order);
  }

  closeDetailModal() {
    this.selectedOrder.set(null);
  }
}
