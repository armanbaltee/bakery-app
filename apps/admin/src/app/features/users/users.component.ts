import { Component } from '@angular/core';

@Component({
  selector: 'app-users',
  standalone: true,
  template: `
    <div class="page-header">
      <div>
        <h1>Customers</h1>
        <p>Manage registered customers and staff</p>
      </div>
    </div>
    <div class="card">
      <div class="empty-state">
        <div class="empty-icon">👥</div>
        <h3>Customers Module</h3>
        <p>This module will be implemented next.</p>
      </div>
    </div>
  `
})
export class UsersComponent {}
