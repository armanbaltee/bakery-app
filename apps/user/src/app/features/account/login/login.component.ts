import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, CommonModule, ReactiveFormsModule],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-header">
          <div class="auth-logo">🎂</div>
          <h2>Welcome Back</h2>
          <p>Sign in to your account to continue</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label class="form-label">Email Address</label>
            <input class="form-control" type="email" formControlName="email" placeholder="you@example.com" />
          </div>
          <div class="form-group">
            <label class="form-label">Password</label>
            <div class="password-field">
              <input class="form-control" [type]="showPass ? 'text' : 'password'" formControlName="password" placeholder="••••••••" />
              <button type="button" class="show-pass" (click)="showPass = !showPass">{{ showPass ? '🙈' : '👁' }}</button>
            </div>
          </div>

          @if (error) {
            <div class="alert-error">{{ error }}</div>
          }

          <button type="submit" class="btn btn-primary" style="width:100%" [disabled]="form.invalid || loading">
            {{ loading ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>

        <div class="auth-footer">
          Don't have an account? <a routerLink="/account/register">Register</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: 80vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-2xl);
    }
    .auth-card {
      background: var(--color-white);
      border-radius: var(--radius-lg);
      padding: var(--space-3xl);
      width: 100%;
      max-width: 440px;
      box-shadow: var(--shadow-lg);
    }
    .auth-header { text-align: center; margin-bottom: var(--space-2xl); }
    .auth-logo { font-size: 3rem; margin-bottom: var(--space-md); }
    .auth-header h2 { margin-bottom: 8px; }
    .auth-header p { color: var(--color-brown-light); }
    .password-field { position: relative; }
    .show-pass {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1rem;
    }
    .alert-error {
      background: #FDEAEA;
      color: var(--color-error);
      padding: 12px 16px;
      border-radius: var(--radius-sm);
      font-size: 0.875rem;
      margin-bottom: var(--space-md);
    }
    .auth-footer { text-align: center; margin-top: var(--space-xl); font-size: 0.875rem; color: var(--color-brown-light); }
    .auth-footer a { color: var(--color-brown); font-weight: 600; }
  `]
})
export class LoginComponent {
  private auth = inject(AuthService);
  private cart = inject(CartService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  loading = false;
  error = '';
  showPass = false;

  onSubmit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    this.auth.login(this.form.value as { email: string; password: string }).subscribe({
      next: () => {
        this.toast.success('Welcome back!');
        this.cart.loadCart().subscribe();
        this.router.navigate(['/']);
      },
      error: (e) => {
        this.error = e.error?.message || 'Invalid email or password';
        this.loading = false;
      },
    });
  }
}
