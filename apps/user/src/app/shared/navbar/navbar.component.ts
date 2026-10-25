import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  template: `
    <nav class="navbar" [class.scrolled]="scrolled()">
      <div class="container navbar-inner">

        <!-- Logo -->
        <a routerLink="/" class="logo">
          <span class="logo-icon">🎂</span>
          <span class="logo-text">La Boulangerie</span>
        </a>

        <!-- Nav Links (desktop) -->
        <ul class="nav-links">
          <li><a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">Home</a></li>
          <li><a routerLink="/products" routerLinkActive="active">Shop</a></li>
          <li><a routerLink="/products" [queryParams]="{categoryId: 'cakes'}" routerLinkActive="active">Cakes</a></li>
        </ul>

        <!-- Right actions -->
        <div class="nav-actions">
          <!-- Cart -->
          <a routerLink="/cart" class="cart-btn">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            @if (cartCount() > 0) {
              <span class="cart-badge">{{ cartCount() }}</span>
            }
          </a>

          <!-- Auth -->
          @if (auth.isLoggedIn()) {
            <div class="user-menu">
              <button class="user-btn" (click)="toggleMenu()">
                <div class="avatar">{{ auth.currentUser()!.name[0].toUpperCase() }}</div>
              </button>
              @if (menuOpen()) {
                <div class="dropdown">
                  <a routerLink="/account/profile" (click)="closeMenu()">My Profile</a>
                  <a routerLink="/account/orders" (click)="closeMenu()">My Orders</a>
                  <hr>
                  <button (click)="logout()">Sign Out</button>
                </div>
              }
            </div>
          } @else {
            <a routerLink="/account/login" class="btn btn-primary btn-sm">Sign In</a>
          }

          <!-- Mobile hamburger -->
          <button class="hamburger" (click)="toggleMobile()">
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>

      <!-- Mobile Nav -->
      @if (mobileOpen()) {
        <div class="mobile-nav">
          <a routerLink="/" (click)="closeMobile()">Home</a>
          <a routerLink="/products" (click)="closeMobile()">Shop</a>
          <a routerLink="/cart" (click)="closeMobile()">Cart ({{ cartCount() }})</a>
          @if (auth.isLoggedIn()) {
            <a routerLink="/account/profile" (click)="closeMobile()">My Profile</a>
            <a routerLink="/account/orders" (click)="closeMobile()">My Orders</a>
            <button (click)="logout()">Sign Out</button>
          } @else {
            <a routerLink="/account/login" (click)="closeMobile()">Sign In</a>
            <a routerLink="/account/register" (click)="closeMobile()">Register</a>
          }
        </div>
      }
    </nav>
  `,
  styles: [`
    .navbar {
      position: sticky;
      top: 0;
      z-index: var(--z-sticky);
      background: rgba(253,246,236,0.95);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--color-cream-dark);
      transition: box-shadow var(--transition-base);
    }
    .navbar.scrolled { box-shadow: var(--shadow-md); }

    .navbar-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 72px;
      gap: var(--space-lg);
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 10px;
      font-family: var(--font-heading);
      font-size: 1.4rem;
      font-weight: 700;
      color: var(--color-espresso);
      white-space: nowrap;
    }
    .logo-icon { font-size: 1.6rem; }

    .nav-links {
      display: flex;
      list-style: none;
      gap: var(--space-xl);
    }
    .nav-links a {
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--color-brown-light);
      position: relative;
      padding-bottom: 4px;
      transition: color var(--transition-fast);
    }
    .nav-links a::after {
      content: '';
      position: absolute;
      bottom: 0; left: 0;
      width: 0; height: 2px;
      background: var(--color-brown);
      transition: width var(--transition-base);
      border-radius: 2px;
    }
    .nav-links a:hover, .nav-links a.active {
      color: var(--color-brown);
    }
    .nav-links a:hover::after, .nav-links a.active::after { width: 100%; }

    .nav-actions {
      display: flex;
      align-items: center;
      gap: var(--space-md);
    }

    .cart-btn {
      position: relative;
      color: var(--color-espresso);
      transition: color var(--transition-fast);
      display: flex;
      align-items: center;
    }
    .cart-btn:hover { color: var(--color-brown); }
    .cart-badge {
      position: absolute;
      top: -8px; right: -8px;
      background: var(--color-brown);
      color: #fff;
      font-size: 0.65rem;
      font-weight: 700;
      width: 18px; height: 18px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .user-menu { position: relative; }
    .user-btn { background: none; border: none; cursor: pointer; }
    .avatar {
      width: 36px; height: 36px;
      background: var(--color-brown);
      color: #fff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.9rem;
    }

    .dropdown {
      position: absolute;
      top: calc(100% + 10px);
      right: 0;
      background: #fff;
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg);
      padding: 8px;
      min-width: 180px;
      animation: fadeInUp 0.2s ease;
    }
    .dropdown a, .dropdown button {
      display: block;
      width: 100%;
      padding: 10px 14px;
      font-size: 0.9rem;
      color: var(--color-espresso);
      border-radius: var(--radius-sm);
      text-align: left;
      transition: background var(--transition-fast);
      cursor: pointer;
      font-family: var(--font-body);
    }
    .dropdown a:hover, .dropdown button:hover {
      background: var(--color-cream);
      color: var(--color-brown);
    }
    .dropdown hr { border: none; border-top: 1px solid var(--color-cream-dark); margin: 4px 0; }

    .hamburger {
      display: none;
      flex-direction: column;
      gap: 5px;
      padding: 6px;
      background: none;
      border: none;
      cursor: pointer;
    }
    .hamburger span {
      display: block;
      width: 22px; height: 2px;
      background: var(--color-espresso);
      border-radius: 2px;
      transition: background var(--transition-fast);
    }

    .mobile-nav {
      border-top: 1px solid var(--color-cream-dark);
      padding: var(--space-md);
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .mobile-nav a, .mobile-nav button {
      display: block;
      padding: 12px 16px;
      font-size: 0.95rem;
      color: var(--color-espresso);
      border-radius: var(--radius-sm);
      transition: background var(--transition-fast);
      text-align: left;
      width: 100%;
      font-family: var(--font-body);
      cursor: pointer;
    }
    .mobile-nav a:hover, .mobile-nav button:hover {
      background: var(--color-cream-dark);
      color: var(--color-brown);
    }

    @media (max-width: 768px) {
      .nav-links { display: none; }
      .hamburger { display: flex; }
    }
  `]
})
export class NavbarComponent {
  auth = inject(AuthService);
  private cartService = inject(CartService);

  cartCount = this.cartService.itemCount;
  scrolled = signal(false);
  menuOpen = signal(false);
  mobileOpen = signal(false);

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', () => {
        this.scrolled.set(window.scrollY > 20);
      });
    }
  }

  toggleMenu() { this.menuOpen.update((v) => !v); }
  closeMenu() { this.menuOpen.set(false); }
  toggleMobile() { this.mobileOpen.update((v) => !v); }
  closeMobile() { this.mobileOpen.set(false); }

  logout() {
    this.auth.logout();
    this.closeMenu();
    this.closeMobile();
  }
}
