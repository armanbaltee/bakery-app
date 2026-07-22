import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AdminAuthService } from '../../core/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="admin-shell">
      <!-- Sidebar -->
      <aside class="sidebar" [class.collapsed]="collapsed()">
        <div class="sidebar-brand">
          <span class="brand-icon">🎂</span>
          @if (!collapsed()) { <span class="brand-name">BakeryAdmin</span> }
        </div>

        <nav class="sidebar-nav">
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">📊</span>
            @if (!collapsed()) { <span>Dashboard</span> }
          </a>
          <a routerLink="/orders" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">📦</span>
            @if (!collapsed()) { <span>Orders</span> }
          </a>
          <a routerLink="/products" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">🛍️</span>
            @if (!collapsed()) { <span>Products</span> }
          </a>
          <a routerLink="/categories" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">🏷️</span>
            @if (!collapsed()) { <span>Categories</span> }
          </a>
          <a routerLink="/users" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">👥</span>
            @if (!collapsed()) { <span>Customers</span> }
          </a>
        </nav>

        <div class="sidebar-footer">
          <button class="nav-item logout-btn" (click)="auth.logout()">
            <span class="nav-icon">🚪</span>
            @if (!collapsed()) { <span>Logout</span> }
          </button>
        </div>
      </aside>

      <!-- Main -->
      <div class="main-area">
        <!-- Top Header -->
        <header class="top-header">
          <button class="collapse-btn" (click)="collapsed.set(!collapsed())">
            {{ collapsed() ? '→' : '←' }}
          </button>
          <div class="header-right">
            <div class="admin-badge">
              <div class="avatar">{{ initials() }}</div>
              @if (!collapsed()) {
                <span class="admin-name">{{ auth.user()?.firstName }} {{ auth.user()?.lastName }}</span>
              }
              <span class="role-chip">{{ auth.user()?.role }}</span>
            </div>
          </div>
        </header>

        <!-- Page Content -->
        <main class="page-content">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [`
    .admin-shell { display: flex; height: 100vh; overflow: hidden; }

    /* ─── Sidebar ─── */
    .sidebar {
      width: var(--sidebar-w); flex-shrink: 0;
      background: var(--bg-sidebar);
      border-right: 1px solid var(--border);
      display: flex; flex-direction: column;
      transition: width 0.25s ease;
      overflow: hidden;
    }
    .sidebar.collapsed { width: 68px; }

    .sidebar-brand {
      display: flex; align-items: center; gap: 10px;
      padding: 20px 16px; border-bottom: 1px solid var(--border);
      font-size: 1.1rem; font-weight: 700; white-space: nowrap;
    }
    .brand-icon { font-size: 1.5rem; flex-shrink: 0; }
    .brand-name { background: linear-gradient(135deg, var(--accent-light), #c084fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }

    .sidebar-nav { flex: 1; padding: 12px 8px; display: flex; flex-direction: column; gap: 2px; overflow-y: auto; }

    .nav-item {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 12px; border-radius: var(--radius-md);
      color: var(--text-secondary); font-weight: 500; font-size: 0.9rem;
      transition: all var(--transition); white-space: nowrap;
      border: none; background: none; width: 100%; text-align: left; cursor: pointer;
    }
    .nav-item:hover { background: rgba(255,255,255,0.05); color: var(--text-primary); }
    .nav-item.active { background: var(--accent-glow); color: var(--accent-light); }
    .nav-icon { font-size: 1.15rem; flex-shrink: 0; width: 20px; text-align: center; }

    .sidebar-footer { padding: 12px 8px; border-top: 1px solid var(--border); }
    .logout-btn:hover { background: var(--red-bg) !important; color: var(--red) !important; }

    /* ─── Main area ─── */
    .main-area { flex: 1; display: flex; flex-direction: column; min-width: 0; overflow: hidden; }

    .top-header {
      height: var(--header-h); padding: 0 24px;
      display: flex; align-items: center; justify-content: space-between;
      background: var(--bg-sidebar); border-bottom: 1px solid var(--border);
      flex-shrink: 0;
    }
    .collapse-btn {
      background: var(--bg-card); border: 1px solid var(--border);
      color: var(--text-secondary); padding: 6px 10px;
      border-radius: var(--radius-sm); font-size: 0.9rem;
      cursor: pointer; transition: all var(--transition);
    }
    .collapse-btn:hover { color: var(--text-primary); background: var(--bg-card-hover); }

    .header-right { display: flex; align-items: center; gap: 16px; }
    .admin-badge { display: flex; align-items: center; gap: 10px; }
    .avatar {
      width: 34px; height: 34px; border-radius: 50%;
      background: linear-gradient(135deg, var(--accent), #c084fc);
      display: flex; align-items: center; justify-content: center;
      font-size: 0.8rem; font-weight: 700; color: #fff; flex-shrink: 0;
    }
    .admin-name { font-size: 0.875rem; font-weight: 500; }
    .role-chip {
      font-size: 0.65rem; padding: 2px 8px; border-radius: 99px;
      background: var(--accent-glow); color: var(--accent-light); font-weight: 600; letter-spacing: 0.5px;
    }

    .page-content { flex: 1; overflow-y: auto; padding: 28px 32px; }

    @media (max-width: 768px) {
      .sidebar { position: fixed; z-index: 100; height: 100vh; }
      .sidebar:not(.collapsed) { box-shadow: 8px 0 32px rgba(0,0,0,0.5); }
    }
  `]
})
export class LayoutComponent {
  auth = inject(AdminAuthService);
  collapsed = signal(false);
  initials = () => {
    const u = this.auth.user();
    if (!u) return 'A';
    return (u.firstName?.[0] ?? '') + (u.lastName?.[0] ?? '');
  };
}
