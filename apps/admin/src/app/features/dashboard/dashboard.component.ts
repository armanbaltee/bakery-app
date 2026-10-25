import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { DecimalPipe, DatePipe } from '@angular/common';

import { environment } from '../../../environments/environment';

const API = environment.apiUrl;

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  totalProducts: number;
  totalCustomers: number;
  recentOrders: any[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, DecimalPipe, DatePipe],
  template: `
    <div class="page-header">
      <div>
        <h1>Dashboard</h1>
        <p>Welcome back, {{ greeting() }}</p>
      </div>
      <div class="header-date">{{ today }}</div>
    </div>

    @if (loading()) {
      <div class="loading-center"><div class="spinner"></div></div>
    } @else {
      <!-- Stat Cards -->
      <div class="grid-4" style="margin-bottom: 28px">
        <div class="stat-card">
          <div class="stat-icon" style="background: var(--blue-bg)">📦</div>
          <div class="stat-info">
            <div class="stat-label">Total Orders</div>
            <div class="stat-value" style="color: var(--blue)">{{ stats()?.totalOrders | number }}</div>
            <div class="stat-change"><span class="badge badge-blue">All Time</span></div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: var(--yellow-bg)">⏳</div>
          <div class="stat-info">
            <div class="stat-label">Pending Orders</div>
            <div class="stat-value" style="color: var(--yellow)">{{ stats()?.pendingOrders | number }}</div>
            <div class="stat-change"><span class="badge badge-yellow">Needs Action</span></div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: var(--green-bg)">💰</div>
          <div class="stat-info">
            <div class="stat-label">Total Revenue</div>
            <div class="stat-value" style="color: var(--green)">PKR {{ stats()?.totalRevenue | number:'1.0-0' }}</div>
            <div class="stat-change change-up">↑ All time</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: var(--purple-bg)">👥</div>
          <div class="stat-info">
            <div class="stat-label">Customers</div>
            <div class="stat-value" style="color: var(--purple)">{{ stats()?.totalCustomers | number }}</div>
            <div class="stat-change"><span class="badge badge-purple">Registered</span></div>
          </div>
        </div>
      </div>

      <!-- Recent Orders -->
      <div class="card">
        <div class="page-header" style="margin-bottom: 16px">
          <div>
            <h2 style="font-size: 1rem; font-weight: 600">Recent Orders</h2>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px">Latest incoming orders</p>
          </div>
          <a routerLink="/orders" class="btn btn-ghost btn-sm">View All →</a>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              @for (order of stats()?.recentOrders; track order.id) {
                <tr>
                  <td style="font-family: monospace; font-size: 0.8rem">#{{ order.id.slice(-8).toUpperCase() }}</td>
                  <td>{{ order.user?.firstName }} {{ order.user?.lastName }}</td>
                  <td>PKR {{ order.totalAmount | number:'1.0-0' }}</td>
                  <td>
                    <span class="badge" [class]="paymentBadge(order.paymentMethod)">
                      {{ order.paymentMethod }}
                    </span>
                  </td>
                  <td>
                    <span class="badge" [class]="statusBadge(order.status)">
                      {{ order.status }}
                    </span>
                  </td>
                  <td style="font-size: 0.8rem">{{ order.createdAt | date:'MMM d, h:mm a' }}</td>
                </tr>
              } @empty {
                <tr><td colspan="6" class="empty-state">No orders yet</td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    }
  `,
  styles: [`
    .header-date { color: var(--text-muted); font-size: 0.85rem; }
    h2 { font-size: 1.1rem; }
  `]
})
export class DashboardComponent implements OnInit {
  private http = inject(HttpClient);
  loading = signal(true);
  stats = signal<DashboardStats | null>(null);
  today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good Morning! 🌅' : h < 17 ? 'Good Afternoon! ☀️' : 'Good Evening! 🌙';
  };

  ngOnInit() {
    this.http.get<DashboardStats>(`${API}/reports/dashboard`).subscribe({
      next: (data) => { this.stats.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  statusBadge(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'badge badge-yellow', CONFIRMED: 'badge badge-blue',
      PREPARING: 'badge badge-purple', OUT_FOR_DELIVERY: 'badge badge-blue',
      DELIVERED: 'badge badge-green', CANCELLED: 'badge badge-red',
    };
    return map[status] ?? 'badge badge-gray';
  }

  paymentBadge(method: string): string {
    const map: Record<string, string> = { COD: 'badge badge-green', EASYPAISA: 'badge badge-blue', JAZZCASH: 'badge badge-red' };
    return map[method] ?? 'badge badge-gray';
  }
}
