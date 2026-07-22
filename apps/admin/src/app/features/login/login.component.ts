import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminAuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="login-page">
      <div class="login-card">
        <div class="login-logo">🎂</div>
        <h1>Bakery Admin</h1>
        <p class="login-sub">Sign in to manage your bakery</p>

        <form [formGroup]="form" (ngSubmit)="submit()" class="login-form">
          <div class="form-group">
            <label class="form-label">Email</label>
            <input class="form-control" type="email" formControlName="email" placeholder="admin@bakery.com" />
          </div>
          <div class="form-group">
            <label class="form-label">Password</label>
            <input class="form-control" type="password" formControlName="password" placeholder="••••••••" />
          </div>

          @if (error()) {
            <div class="error-msg">⚠️ {{ error() }}</div>
          }

          <button type="submit" class="btn btn-primary login-btn" [disabled]="loading()">
            {{ loading() ? 'Signing in...' : 'Sign In →' }}
          </button>
        </form>
      </div>

      <!-- Background decoration -->
      <div class="bg-decoration">
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      background: var(--bg-dark); position: relative; overflow: hidden;
    }
    .login-card {
      background: var(--bg-card); border: 1px solid var(--border);
      border-radius: var(--radius-xl); padding: 48px 40px;
      width: 100%; max-width: 420px; text-align: center;
      position: relative; z-index: 1;
      box-shadow: 0 24px 80px rgba(0,0,0,0.5), var(--shadow-glow);
    }
    .login-logo { font-size: 3rem; margin-bottom: 12px; }
    h1 { font-size: 1.6rem; font-weight: 700; margin-bottom: 6px; }
    .login-sub { color: var(--text-muted); margin-bottom: 32px; font-size: 0.9rem; }

    .login-form { display: flex; flex-direction: column; gap: 16px; text-align: left; }
    .login-btn { width: 100%; justify-content: center; padding: 12px; font-size: 1rem; margin-top: 8px; }

    .error-msg {
      background: var(--red-bg); border: 1px solid rgba(239,68,68,0.2);
      color: var(--red); padding: 10px 14px; border-radius: var(--radius-sm);
      font-size: 0.85rem;
    }

    .bg-decoration { position: absolute; inset: 0; pointer-events: none; }
    .orb {
      position: absolute; border-radius: 50%;
      filter: blur(80px); opacity: 0.15;
    }
    .orb-1 { width: 400px; height: 400px; background: var(--accent); top: -100px; right: -100px; }
    .orb-2 { width: 350px; height: 350px; background: #c084fc; bottom: -100px; left: -100px; }
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AdminAuthService);
  private router = inject(Router);

  loading = signal(false);
  error = signal('');

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  submit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');
    const { email, password } = this.form.value;
    this.auth.login(email!, password!).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (e) => {
        this.error.set(e?.error?.message || e?.message || 'Invalid credentials');
        this.loading.set(false);
      }
    });
  }
}
