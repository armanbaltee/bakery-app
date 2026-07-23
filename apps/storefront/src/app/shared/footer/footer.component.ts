import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="footer">
      <div class="container">
        <div class="footer-grid">
          <div class="footer-brand">
            <div class="brand-logo">🎂 La Boulangerie</div>
            <p>Handcrafted baked goods made with love and the finest ingredients. Order online for same-day delivery.</p>
          </div>

          <div class="footer-col">
            <h4>Shop</h4>
            <ul>
              <li><a routerLink="/products">All Products</a></li>
              <li><a routerLink="/products" [queryParams]="{bestSeller:'true'}">Best Sellers</a></li>
              <li><a routerLink="/products" [queryParams]="{featured:'true'}">Featured</a></li>
            </ul>
          </div>

          <div class="footer-col">
            <h4>Account</h4>
            <ul>
              <li><a routerLink="/account/login">Sign In</a></li>
              <li><a routerLink="/account/register">Register</a></li>
              <li><a routerLink="/account/orders">My Orders</a></li>
            </ul>
          </div>

          <div class="footer-col">
            <h4>Contact</h4>
            <p>📞 +92-300-BAKERY</p>
            <p>✉️ hello&#64;laboulangerie.pk</p>
            <p>📍 Lahore, Pakistan</p>
          </div>
        </div>

        <div class="footer-bottom">
          <p>© {{ year }} La Boulangerie. All rights reserved.</p>
          <p>Made with ❤️ and flour</p>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .footer {
      background: var(--color-espresso);
      color: var(--color-blush-light);
      padding: var(--space-3xl) 0 var(--space-lg);
      margin-top: var(--space-3xl);
    }
    .footer-grid {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr;
      gap: var(--space-2xl);
      margin-bottom: var(--space-2xl);
    }
    .brand-logo {
      font-family: var(--font-heading);
      font-size: 1.4rem;
      color: var(--color-cream);
      margin-bottom: var(--space-md);
    }
    .footer-brand p { font-size: 0.9rem; line-height: 1.7; opacity: 0.8; }
    .footer-col h4 {
      font-family: var(--font-heading);
      color: var(--color-cream);
      margin-bottom: var(--space-md);
      font-size: 1rem;
    }
    .footer-col ul { list-style: none; display: flex; flex-direction: column; gap: 8px; }
    .footer-col ul li a, .footer-col p {
      font-size: 0.875rem;
      opacity: 0.75;
      transition: opacity var(--transition-fast);
    }
    .footer-col ul li a:hover { opacity: 1; color: var(--color-blush); }
    .footer-col p { margin-bottom: 6px; }
    .footer-bottom {
      border-top: 1px solid rgba(255,255,255,0.1);
      padding-top: var(--space-lg);
      display: flex;
      justify-content: space-between;
      font-size: 0.8rem;
      opacity: 0.6;
    }
    @media (max-width: 768px) {
      .footer-grid { grid-template-columns: 1fr 1fr; }
      .footer-brand { grid-column: 1 / -1; }
      .footer-bottom { flex-direction: column; gap: 4px; text-align: center; }
    }
    @media (max-width: 480px) {
      .footer-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class FooterComponent {
  year = new Date().getFullYear();
}
