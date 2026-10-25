import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface UserItem {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: 'CUSTOMER' | 'ADMIN' | 'STAFF';
  createdAt: string;
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="users-page">
      <div class="page-header">
        <div>
          <h1>User & Customer Directory</h1>
          <p>View registered customers, admin team, and manage user roles</p>
        </div>
        <button class="btn btn-ghost" (click)="loadUsers()" [disabled]="loading()">
          <span>🔄</span> Refresh Users
        </button>
      </div>

      <!-- Quick Metrics -->
      <div class="metrics-grid">
        <div class="stat-card">
          <div class="stat-icon purple">👥</div>
          <div>
            <div class="stat-val">{{ users().length }}</div>
            <div class="stat-lbl">Total Users</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon green">🛍️</div>
          <div>
            <div class="stat-val">{{ customerCount() }}</div>
            <div class="stat-lbl">Registered Customers</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon yellow">👑</div>
          <div>
            <div class="stat-val">{{ adminCount() }}</div>
            <div class="stat-lbl">Admins & Staff</div>
          </div>
        </div>
      </div>

      <!-- Search & Filters -->
      <div class="toolbar card">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            type="text"
            class="form-control"
            placeholder="Search by name, email, or phone..."
            [(ngModel)]="searchQuery"
          />
        </div>

        <select class="form-control filter-select" [(ngModel)]="selectedRole">
          <option value="">All Roles</option>
          <option value="CUSTOMER">Customers Only</option>
          <option value="ADMIN">Admins Only</option>
          <option value="STAFF">Staff Only</option>
        </select>
      </div>

      <!-- Table -->
      <div class="card table-card">
        <div *ngIf="loading()" class="loading-state">
          <div class="spinner"></div>
          <p>Loading users from database...</p>
        </div>

        <div *ngIf="!loading() && filteredUsers().length === 0" class="empty-state">
          <div class="empty-icon">👥</div>
          <h3>No Users Found</h3>
          <p>No registered accounts match your criteria.</p>
        </div>

        <div *ngIf="!loading() && filteredUsers().length > 0" class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>User Name</th>
                <th>Email Address</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Joined Date</th>
                <th style="text-align: right;">Role Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let u of filteredUsers()">
                <td>
                  <div class="user-name-cell">
                    <div class="avatar">{{ (u.name || u.email | slice:0:1) | uppercase }}</div>
                    <div>
                      <div class="user-name">{{ u.name || (u.firstName + ' ' + (u.lastName || '')) }}</div>
                      <div class="user-id">ID: {{ u.id | slice:0:8 }}</div>
                    </div>
                  </div>
                </td>
                <td>{{ u.email }}</td>
                <td>{{ u.phone || 'N/A' }}</td>
                <td>
                  <span class="badge" [ngClass]="{
                    'badge-purple': u.role === 'ADMIN',
                    'badge-blue': u.role === 'STAFF',
                    'badge-gray': u.role === 'CUSTOMER'
                  }">
                    {{ u.role }}
                  </span>
                </td>
                <td>{{ u.createdAt | date:'mediumDate' }}</td>
                <td style="text-align: right;">
                  <select
                    class="form-control role-select"
                    [value]="u.role"
                    (change)="updateRole(u, $event)"
                  >
                    <option value="CUSTOMER">Customer</option>
                    <option value="STAFF">Staff</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .users-page {
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
    .stat-val { font-size: 1.6rem; font-weight: 700; color: var(--text-primary); }
    .stat-lbl { font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }

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
    .search-box input { padding-left: 36px; }
    .filter-select { min-width: 160px; }

    .table-card { padding: 0; overflow: hidden; }
    .user-name-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--accent);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.85rem;
    }
    .user-name { font-weight: 600; color: var(--text-primary); }
    .user-id { font-size: 0.72rem; color: var(--text-muted); }

    .role-select {
      width: auto;
      padding: 4px 8px;
      font-size: 0.8rem;
      display: inline-block;
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
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class UsersComponent implements OnInit {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  users = signal<UserItem[]>([]);
  loading = signal<boolean>(true);

  searchQuery = '';
  selectedRole = '';

  filteredUsers = computed(() => {
    return this.users().filter((u) => {
      const q = this.searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        (u.name && u.name.toLowerCase().includes(q)) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone && u.phone.includes(q));

      const matchesRole = !this.selectedRole || u.role === this.selectedRole;
      return matchesSearch && matchesRole;
    });
  });

  customerCount = computed(() => this.users().filter(u => u.role === 'CUSTOMER').length);
  adminCount = computed(() => this.users().filter(u => u.role === 'ADMIN' || u.role === 'STAFF').length);

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading.set(true);
    this.http.get<UserItem[]>(`${this.apiUrl}/users`).subscribe({
      next: (data) => {
        this.users.set(data || []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load users:', err);
        this.loading.set(false);
      }
    });
  }

  updateRole(user: UserItem, event: any) {
    const newRole = event.target.value;
    this.http.put(`${this.apiUrl}/users/${user.id}`, { role: newRole }).subscribe({
      next: () => {
        this.users.update(list =>
          list.map(u => u.id === user.id ? { ...u, role: newRole } : u)
        );
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to update user role');
        this.loadUsers();
      }
    });
  }
}
