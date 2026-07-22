import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';

const API = 'http://localhost:3000/api';

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private _user = signal<AdminUser | null>(null);
  private _token = signal<string | null>(null);

  user = this._user.asReadonly();
  isLoggedIn = () => !!this._token();

  constructor(private http: HttpClient, private router: Router) {
    const stored = localStorage.getItem('admin_token');
    const user = localStorage.getItem('admin_user');
    if (stored && user) {
      this._token.set(stored);
      this._user.set(JSON.parse(user));
    }
  }

  getToken() { return this._token(); }

  login(email: string, password: string) {
    return this.http.post<{ accessToken: string; user: AdminUser }>(
      `${API}/auth/admin/login`, { email, password }
    ).pipe(tap(res => {
      if (res.user.role !== 'ADMIN' && res.user.role !== 'STAFF') {
        throw new Error('Access denied');
      }
      this._token.set(res.accessToken);
      this._user.set(res.user);
      localStorage.setItem('admin_token', res.accessToken);
      localStorage.setItem('admin_user', JSON.stringify(res.user));
    }));
  }

  logout() {
    this._token.set(null);
    this._user.set(null);
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    this.router.navigate(['/login']);
  }
}
