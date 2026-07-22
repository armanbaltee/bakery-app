import { Component } from '@angular/core';

@Component({
  selector: 'app-categories',
  standalone: true,
  template: `
    <div class="page-header">
      <div>
        <h1>Categories</h1>
        <p>Manage product categories</p>
      </div>
    </div>
    <div class="card">
      <div class="empty-state">
        <div class="empty-icon">🏷️</div>
        <h3>Categories Module</h3>
        <p>This module will be implemented next.</p>
      </div>
    </div>
  `
})
export class CategoriesComponent {}
