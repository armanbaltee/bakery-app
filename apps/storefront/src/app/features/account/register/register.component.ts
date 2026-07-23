import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { ToastService } from '../../../core/services/toast.service';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const pass = control.get('password');
  const confirm = control.get('confirmPassword');
  if (!pass || !confirm) return null;
  return pass.value === confirm.value ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RouterLink, CommonModule, ReactiveFormsModule],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-header">
          <div class="auth-logo">🧁</div>
          <h2>Create Account</h2>
          <p>Join us and enjoy fresh bakes delivered to your door</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Full Name</label>
              <input
                class="form-control"
                [class.error]="submitted && f['name'].errors"
                type="text"
                formControlName="name"
                placeholder="Jane Doe"
              />
              @if (submitted && f['name'].errors?.['required']) {
                <span class="form-error">Name is required</span>
              }
            </div>
            <div class="form-group">
              <label class="form-label">Phone Number</label>
              <input
                class="form-control"
                type="tel"
                formControlName="phone"
                placeholder="03XX-XXXXXXX"
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Email Address</label>
            <input
              class="form-control"
              [class.error]="submitted && f['email'].errors"
              type="email"
              formControlName="email"
              placeholder="you@example.com"
            />
            @if (submitted && f['email'].errors?.['required']) {
              <span class="form-error">Email is required</span>
            }
            @if (submitted && f['email'].errors?.['email']) {
              <span class="form-error">Please enter a valid email</span>
            }
          </div>

          <div class="form-group">
            <label class="form-label">Password</label>
            <div class="password-field">
              <input
                class="form-control"
                [class.error]="submitted && f['password'].errors"
                [type]="showPass ? 'text' : 'password'"
                formControlName="password"
                placeholder="Min 6 characters"
              />
              <button type="button" class="show-pass" (click)="showPass = !showPass">
                {{ showPass ? '🙈' : '👁' }}
              </button>
            </div>
            @if (submitted && f['password'].errors?.['required']) {
              <span class="form-error">Password is required</span>
            }
            @if (submitted && f['password'].errors?.['minlength']) {
              <span class="form-error">Password must be at least 6 characters</span>
            }
          </div>

          <div class="form-group">
            <label class="form-label">Confirm Password</label>
            <div class="password-field">
              <input
                class="form-control"
                [class.error]="submitted && (f['confirmPassword'].errors || form.errors?.['passwordMismatch'])"
                [type]="showConfirmPass ? 'text' : 'password'"
                formControlName="confirmPassword"
                placeholder="Re-enter your password"
              />
              <button type="button" class="show-pass" (click)="showConfirmPass = !showConfirmPass">
                {{ showConfirmPass ? '🙈' : '👁' }}
              </button>
            </div>
            @if (submitted && form.errors?.['passwordMismatch']) {
              <span class="form-error">Passwords do not match</span>
            }
          </div>

          @if (error) {
            <div class="alert-error">{{ error }}</div>
          }

          <button type="submit" class="btn btn-primary" style="width:100%" [disabled]="loading">
            {{ loading ? 'Creating Account...' : 'Create Account' }}
          </button>
        </form>

        <div class="auth-footer">
          Already have an account? <a routerLink="/account/login">Sign In</a>
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
      padding: var(--space-2xl) var(--space-md);
    }
    .auth-card {
      background: var(--color-white);
      border-radius: var(--radius-lg);
      padding: var(--space-3xl);
      width: 100%;
      max-width: 520px;
      box-shadow: var(--shadow-lg);
      animation: fadeInUp 0.4s ease forwards;
    }
    .auth-header { text-align: center; margin-bottom: var(--space-2xl); }
    .auth-logo { font-size: 3rem; margin-bottom: var(--space-md); }
    .auth-header h2 { margin-bottom: 8px; }
    .auth-header p { color: var(--color-brown-light); }
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-md);
    }
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
    @media (max-width: 480px) {
      .auth-card { padding: var(--space-xl); }
      .form-row { grid-template-columns: 1fr; }
    }
  `]
})
export class RegisterComponent {
  private auth = inject(AuthService);
  private cart = inject(CartService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  form = this.fb.group(
    {
      name: ['', Validators.required],
      phone: [''],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordMatchValidator }
  );

  loading = false;
  error = '';
  showPass = false;
  showConfirmPass = false;
  submitted = false;

  get f() {
    return this.form.controls;
  }

  onSubmit() {
    this.submitted = true;
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';

    const { name, email, password, phone } = this.form.value;
    this.auth.register({ name: name!, email: email!, password: password!, phone: phone || undefined }).subscribe({
      next: () => {
        this.toast.success('Account created! Welcome to Bakery!');
        this.cart.loadCart().subscribe();
        this.router.navigate(['/']);
      },
      error: (e) => {
        this.error = e.error?.message || 'Registration failed. Please try again.';
        this.loading = false;
      },
    });
  }
}
