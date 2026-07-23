import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CartService } from '../../core/services/cart.service';
import { ToastService } from '../../core/services/toast.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [RouterLink, CommonModule, ReactiveFormsModule],
  template: `
    <div class="container checkout-page">
      <h1>Checkout</h1>

      <div class="checkout-layout">
        <!-- Form -->
        <div class="checkout-form">
          <form [formGroup]="form" (ngSubmit)="placeOrder()">
            <!-- Delivery Address -->
            <div class="form-section">
              <h3>📍 Delivery Address</h3>
              <div class="grid-2">
                <div class="form-group">
                  <label class="form-label">Street Address *</label>
                  <input class="form-control" formControlName="street" placeholder="House #, Street, Area" />
                </div>
                <div class="form-group">
                  <label class="form-label">City *</label>
                  <input class="form-control" formControlName="city" placeholder="Lahore" />
                </div>
              </div>
              <div class="grid-2">
                <div class="form-group">
                  <label class="form-label">Province</label>
                  <input class="form-control" formControlName="province" placeholder="Punjab" />
                </div>
                <div class="form-group">
                  <label class="form-label">Contact Phone *</label>
                  <input class="form-control" formControlName="contactPhone" placeholder="+92-300-XXXXXXX" />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Order Notes</label>
                <textarea class="form-control" formControlName="notes" rows="3" placeholder="Special instructions..."></textarea>
              </div>
            </div>

            <!-- Payment Method -->
            <div class="form-section">
              <h3>💳 Payment Method</h3>
              <div class="payment-methods">
                <label class="payment-option" [class.selected]="form.value.paymentMethod === 'EASYPAISA'">
                  <input type="radio" formControlName="paymentMethod" value="EASYPAISA" />
                  <div class="payment-icon">📱</div>
                  <div>
                    <strong>EasyPaisa</strong>
                    <p>Mobile wallet payment</p>
                  </div>
                </label>
                <label class="payment-option" [class.selected]="form.value.paymentMethod === 'JAZZCASH'">
                  <input type="radio" formControlName="paymentMethod" value="JAZZCASH" />
                  <div class="payment-icon">🎯</div>
                  <div>
                    <strong>JazzCash</strong>
                    <p>Mobile wallet payment</p>
                  </div>
                </label>
                <label class="payment-option" [class.selected]="form.value.paymentMethod === 'COD'">
                  <input type="radio" formControlName="paymentMethod" value="COD" />
                  <div class="payment-icon">💵</div>
                  <div>
                    <strong>Cash on Delivery</strong>
                    <p>Pay when delivered</p>
                  </div>
                </label>
              </div>
            </div>

            <button type="submit" class="btn btn-primary btn-lg" [disabled]="form.invalid || placing">
              {{ placing ? 'Placing Order...' : 'Place Order →' }}
            </button>
          </form>
        </div>

        <!-- Order Summary -->
        <div class="order-summary">
          <div class="summary-card">
            <h3>Order Summary</h3>
            @for (item of cart.cart()?.items; track item.id) {
              <div class="summary-item">
                <span>{{ item.product.name }} × {{ item.quantity }}</span>
                <span>PKR {{ (item.unitPrice * item.quantity) | number:'1.0-0' }}</span>
              </div>
            }
            <div class="summary-divider"></div>
            <div class="summary-row">
              <span>Subtotal</span>
              <span>PKR {{ cart.total() | number:'1.0-0' }}</span>
            </div>
            <div class="summary-row">
              <span>Delivery</span>
              <span>PKR 150</span>
            </div>
            <div class="summary-divider"></div>
            <div class="summary-row total">
              <span>Total</span>
              <span>PKR {{ (cart.total() + 150) | number:'1.0-0' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .checkout-page { padding-top: var(--space-2xl); padding-bottom: var(--space-3xl); }
    h1 { margin-bottom: var(--space-2xl); }

    .checkout-layout {
      display: grid;
      grid-template-columns: 1fr 360px;
      gap: var(--space-2xl);
    }

    .form-section {
      background: var(--color-white);
      border-radius: var(--radius-md);
      padding: var(--space-xl);
      box-shadow: var(--shadow-sm);
      margin-bottom: var(--space-lg);
    }
    .form-section h3 { margin-bottom: var(--space-lg); font-size: 1.1rem; }

    .payment-methods { display: flex; flex-direction: column; gap: var(--space-md); }
    .payment-option {
      display: flex;
      align-items: center;
      gap: var(--space-md);
      padding: var(--space-lg);
      border: 2px solid var(--color-cream-dark);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all var(--transition-base);
    }
    .payment-option input { display: none; }
    .payment-option.selected { border-color: var(--color-brown); background: var(--color-blush-light); }
    .payment-icon { font-size: 2rem; }
    .payment-option strong { display: block; font-size: 0.95rem; }
    .payment-option p { font-size: 0.8rem; color: var(--color-brown-light); margin: 0; }

    .summary-card {
      background: var(--color-white);
      border-radius: var(--radius-md);
      padding: var(--space-xl);
      box-shadow: var(--shadow-md);
      position: sticky;
      top: 90px;
    }
    .summary-card h3 { margin-bottom: var(--space-lg); }
    .summary-item {
      display: flex;
      justify-content: space-between;
      font-size: 0.875rem;
      margin-bottom: 8px;
      color: var(--color-brown-light);
    }
    .summary-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 0.9rem; }
    .summary-row.total { font-weight: 700; font-size: 1.1rem; }
    .summary-divider { border-top: 1px solid var(--color-cream-dark); margin: 12px 0; }

    @media (max-width: 768px) {
      .checkout-layout { grid-template-columns: 1fr; }
      .order-summary { order: -1; }
    }
  `]
})
export class CheckoutComponent implements OnInit {
  cart = inject(CartService);
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);
  private toast = inject(ToastService);

  placing = false;
  api = environment.apiUrl;

  form = this.fb.group({
    street: ['', Validators.required],
    city: ['', Validators.required],
    province: [''],
    postalCode: [''],
    contactPhone: ['', Validators.required],
    notes: [''],
    paymentMethod: ['EASYPAISA', Validators.required],
  });

  ngOnInit() {
    if (!this.cart.cart()) {
      this.cart.loadCart().subscribe();
    }
  }

  placeOrder() {
    if (this.form.invalid) return;
    this.placing = true;
    const { street, city, province, postalCode, contactPhone, notes, paymentMethod } = this.form.value;

    const body = {
      paymentMethod,
      deliveryAddress: { street, city, province, postalCode, contactPhone },
      notes,
    };

    this.http.post<{ id: string }>(`${this.api}/orders`, body).subscribe({
      next: (order) => {
        if (paymentMethod === 'COD') {
          this.toast.success('Order placed! We\'ll confirm shortly.');
          this.cart.clearLocal();
          this.router.navigate(['/account/orders']);
          return;
        }
        // Initiate gateway payment
        const endpoint = paymentMethod === 'EASYPAISA' ? 'easypaisa' : 'jazzcash';
        this.http.post<{ redirectUrl?: string; formData?: { action: string; fields: Record<string,string> } }>(
          `${this.api}/payments/${endpoint}/initiate/${order.id}`, {}
        ).subscribe({
          next: (res) => {
            this.placing = false;
            this.cart.clearLocal();
            if (res.redirectUrl) {
              window.location.href = res.redirectUrl;
            } else if (res.formData) {
              this.submitForm(res.formData.action, res.formData.fields);
            }
          },
          error: () => {
            this.toast.error('Payment initiation failed');
            this.placing = false;
          },
        });
      },
      error: () => {
        this.toast.error('Failed to place order');
        this.placing = false;
      },
    });
  }

  private submitForm(action: string, fields: Record<string, string>) {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = action;
    Object.entries(fields).forEach(([k, v]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = k;
      input.value = v;
      form.appendChild(input);
    });
    document.body.appendChild(form);
    form.submit();
  }
}
