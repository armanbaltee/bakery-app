import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService, AuthUser } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { environment } from '../../../../environments/environment';

interface Address {
  id: string;
  label: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  contactPhone: string;
  isDefault: boolean;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  addresses: Address[];
  createdAt: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="profile-page">
      <div class="container">

        <!-- Page Header -->
        <div class="page-header fade-in-up">
          <div class="header-left">
            <h1>My Account</h1>
            <p>Manage your profile and delivery addresses</p>
          </div>
          <div class="user-avatar">
            <span>{{ getInitials(user()?.name) }}</span>
          </div>
        </div>

        <div class="profile-layout">

          <!-- Left: Profile Info -->
          <div class="profile-section card">
            <div class="section-title">
              <span class="section-icon">👤</span>
              <h3>Personal Information</h3>
            </div>

            @if (loadingProfile()) {
              <div class="loading-overlay"><div class="spinner"></div></div>
            } @else {
              <form [formGroup]="profileForm" (ngSubmit)="saveProfile()">
                <div class="form-group">
                  <label class="form-label">Full Name</label>
                  <input class="form-control" type="text" formControlName="name" placeholder="Your name" />
                </div>
                <div class="form-group">
                  <label class="form-label">Email Address</label>
                  <input class="form-control" type="email" formControlName="email" placeholder="you@example.com" />
                </div>
                <div class="form-group">
                  <label class="form-label">Phone Number</label>
                  <input class="form-control" type="tel" formControlName="phone" placeholder="03XX-XXXXXXX" />
                </div>

                <div class="form-actions">
                  <button type="submit" class="btn btn-primary" [disabled]="savingProfile()">
                    {{ savingProfile() ? 'Saving...' : 'Save Changes' }}
                  </button>
                  <a routerLink="/account/orders" class="btn btn-secondary">My Orders</a>
                </div>
              </form>

              <div class="account-meta">
                <span class="meta-item">
                  <span class="meta-icon">📅</span>
                  Member since {{ profile()?.createdAt | date:'MMMM yyyy' }}
                </span>
                <span class="meta-item">
                  <span class="meta-icon">🏷️</span>
                  {{ profile()?.role | titlecase }}
                </span>
              </div>
            }
          </div>

          <!-- Right: Addresses -->
          <div class="addresses-section">
            <div class="card">
              <div class="section-title">
                <span class="section-icon">📍</span>
                <h3>Delivery Addresses</h3>
                <button class="btn btn-sm btn-primary" (click)="openAddressForm()">+ Add New</button>
              </div>

              @if (loadingProfile()) {
                <div class="loading-overlay"><div class="spinner"></div></div>
              } @else if (!profile()?.addresses?.length) {
                <div class="empty-state">
                  <div class="empty-icon">📭</div>
                  <p>No addresses saved yet.</p>
                  <button class="btn btn-primary btn-sm" (click)="openAddressForm()">Add Address</button>
                </div>
              } @else {
                <div class="addresses-list">
                  @for (addr of profile()?.addresses; track addr.id) {
                    <div class="address-card" [class.default]="addr.isDefault">
                      @if (addr.isDefault) {
                        <span class="badge badge-brown default-badge">Default</span>
                      }
                      <p class="addr-label">{{ addr.label || 'Home' }}</p>
                      <p class="addr-text">{{ addr.street }}</p>
                      <p class="addr-text">{{ addr.city }}, {{ addr.province }} {{ addr.postalCode }}</p>
                      <p class="addr-phone">📞 {{ addr.contactPhone }}</p>
                      <button class="delete-btn" (click)="deleteAddress(addr.id)" title="Remove address">✕</button>
                    </div>
                  }
                </div>
              }
            </div>

            <!-- Add Address Form -->
            @if (showAddressForm()) {
              <div class="card address-form-card">
                <div class="section-title">
                  <span class="section-icon">➕</span>
                  <h3>New Address</h3>
                  <button class="btn btn-ghost btn-sm" (click)="showAddressForm.set(false)">✕ Cancel</button>
                </div>
                <form [formGroup]="addressForm" (ngSubmit)="saveAddress()">
                  <div class="form-row">
                    <div class="form-group">
                      <label class="form-label">Label (e.g. Home, Work)</label>
                      <input class="form-control" type="text" formControlName="label" placeholder="Home" />
                    </div>
                    <div class="form-group">
                      <label class="form-label">Contact Phone</label>
                      <input class="form-control" type="tel" formControlName="contactPhone" placeholder="03XX-XXXXXXX" />
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Street Address</label>
                    <input class="form-control" type="text" formControlName="street" placeholder="House # / Street / Area" />
                  </div>
                  <div class="form-row">
                    <div class="form-group">
                      <label class="form-label">City</label>
                      <input class="form-control" type="text" formControlName="city" placeholder="Lahore" />
                    </div>
                    <div class="form-group">
                      <label class="form-label">Province</label>
                      <input class="form-control" type="text" formControlName="province" placeholder="Punjab" />
                    </div>
                    <div class="form-group">
                      <label class="form-label">Postal Code</label>
                      <input class="form-control" type="text" formControlName="postalCode" placeholder="54000" />
                    </div>
                  </div>
                  <button type="submit" class="btn btn-primary" [disabled]="savingAddress()">
                    {{ savingAddress() ? 'Saving...' : 'Save Address' }}
                  </button>
                </form>
              </div>
            }
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    .profile-page {
      padding: var(--space-3xl) 0;
      min-height: 80vh;
      animation: fadeInUp 0.4s ease forwards;
    }
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--space-2xl);
    }
    .page-header h1 { margin-bottom: 4px; }
    .page-header p { color: var(--color-brown-light); }
    .user-avatar {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--color-brown), var(--color-blush));
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      font-weight: 700;
      color: white;
      font-family: var(--font-heading);
      box-shadow: var(--shadow-md);
    }
    .profile-layout {
      display: grid;
      grid-template-columns: 420px 1fr;
      gap: var(--space-xl);
      align-items: start;
    }
    .card { padding: var(--space-xl); border-radius: var(--radius-md); background: var(--color-white); box-shadow: var(--shadow-sm); }
    .section-title {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      margin-bottom: var(--space-xl);
    }
    .section-title h3 { flex: 1; margin: 0; font-size: 1.1rem; }
    .section-icon { font-size: 1.3rem; }
    .form-actions {
      display: flex;
      gap: var(--space-md);
      flex-wrap: wrap;
      margin-top: var(--space-lg);
    }
    .account-meta {
      display: flex;
      gap: var(--space-lg);
      flex-wrap: wrap;
      margin-top: var(--space-xl);
      padding-top: var(--space-xl);
      border-top: 1px solid var(--color-cream-dark);
    }
    .meta-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.85rem;
      color: var(--color-brown-light);
    }
    .addresses-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-md);
    }
    .address-card {
      background: var(--color-cream);
      border-radius: var(--radius-md);
      padding: var(--space-lg);
      border: 2px solid transparent;
      position: relative;
      transition: border-color var(--transition-base);
    }
    .address-card.default { border-color: var(--color-blush); }
    .default-badge { position: absolute; top: 12px; right: 12px; }
    .addr-label { font-weight: 600; font-size: 0.9rem; color: var(--color-brown); margin-bottom: 4px; }
    .addr-text { font-size: 0.9rem; color: var(--color-espresso); margin-bottom: 2px; }
    .addr-phone { font-size: 0.85rem; color: var(--color-brown-light); margin-top: 6px; }
    .delete-btn {
      position: absolute;
      bottom: 12px;
      right: 12px;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--color-cream-dark);
      border: none;
      cursor: pointer;
      font-size: 0.75rem;
      color: var(--color-error);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background var(--transition-fast);
    }
    .delete-btn:hover { background: #FDEAEA; }
    .empty-state {
      text-align: center;
      padding: var(--space-2xl) 0;
    }
    .empty-icon { font-size: 3rem; margin-bottom: var(--space-md); }
    .empty-state p { color: var(--color-brown-light); margin-bottom: var(--space-lg); }
    .address-form-card { margin-top: var(--space-lg); }
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-md);
    }
    @media (max-width: 1024px) {
      .profile-layout { grid-template-columns: 1fr; }
    }
    @media (max-width: 480px) {
      .form-row { grid-template-columns: 1fr; }
      .page-header { flex-direction: column; align-items: flex-start; gap: var(--space-md); }
    }
  `]
})
export class ProfileComponent implements OnInit {
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);

  private api = environment.apiUrl;

  user = this.auth.currentUser;
  profile = signal<UserProfile | null>(null);
  loadingProfile = signal(true);
  savingProfile = signal(false);
  savingAddress = signal(false);
  showAddressForm = signal(false);

  profileForm = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
  });

  addressForm = this.fb.group({
    label: ['Home'],
    street: ['', Validators.required],
    city: ['', Validators.required],
    province: ['', Validators.required],
    postalCode: ['', Validators.required],
    contactPhone: ['', Validators.required],
    isDefault: [false],
  });

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    this.loadingProfile.set(true);
    this.http.get<UserProfile>(`${this.api}/users/profile`).subscribe({
      next: (p) => {
        this.profile.set(p);
        this.profileForm.patchValue({ name: p.name, email: p.email, phone: p.phone });
        this.loadingProfile.set(false);
      },
      error: () => {
        this.toast.error('Failed to load profile');
        this.loadingProfile.set(false);
      }
    });
  }

  saveProfile() {
    if (this.profileForm.invalid) return;
    this.savingProfile.set(true);
    this.http.put<AuthUser>(`${this.api}/users/profile`, this.profileForm.value).subscribe({
      next: (updated) => {
        this.auth.currentUser.set(updated);
        this.toast.success('Profile updated!');
        this.savingProfile.set(false);
      },
      error: () => {
        this.toast.error('Failed to update profile');
        this.savingProfile.set(false);
      }
    });
  }

  openAddressForm() {
    this.addressForm.reset({ label: 'Home', isDefault: false });
    this.showAddressForm.set(true);
  }

  saveAddress() {
    if (this.addressForm.invalid) return;
    this.savingAddress.set(true);
    this.http.post<UserProfile>(`${this.api}/users/addresses`, this.addressForm.value).subscribe({
      next: () => {
        this.toast.success('Address saved!');
        this.savingAddress.set(false);
        this.showAddressForm.set(false);
        this.loadProfile();
      },
      error: () => {
        this.toast.error('Failed to save address');
        this.savingAddress.set(false);
      }
    });
  }

  deleteAddress(id: string) {
    this.http.delete(`${this.api}/users/addresses/${id}`).subscribe({
      next: () => {
        this.toast.success('Address removed');
        this.loadProfile();
      },
      error: () => this.toast.error('Failed to remove address')
    });
  }

  getInitials(name?: string | null): string {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
}
