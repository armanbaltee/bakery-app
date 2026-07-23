import { Component } from '@angular/core';

@Component({
  selector: 'app-products',
  standalone: true,
  template: `
    <div class="page-header">
      <div>
        <h1>Products</h1>
        <p>Manage bakery items, pricing, and inventory</p>
      </div>
    </div>
    <div class="card">
      <div class="empty-state">
        <div class="empty-icon">🛍️</div>
        <h3>Products Module</h3>
        <p>This module will be implemented next.</p>
      </div>
    </div>
  `
})
export class ProductsComponent {}
