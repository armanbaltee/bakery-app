import { Component } from '@angular/core';

@Component({
  selector: 'app-orders',
  standalone: true,
  template: `
    <div class="page-header">
      <div>
        <h1>Orders</h1>
        <p>Manage customer orders and deliveries</p>
      </div>
    </div>
    <div class="card">
      <div class="empty-state">
        <div class="empty-icon">📦</div>
        <h3>Orders Module</h3>
        <p>This module will be implemented next.</p>
      </div>
    </div>
  `
})
export class OrdersComponent {}
