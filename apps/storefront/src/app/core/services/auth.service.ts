import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'bakery_token';
  private readonly USER_KEY = 'bakery_user';

  currentUser = signal<AuthUser | null>(this.loadUser());
  isLoggedIn = computed(() => !!this.currentUser());

  private api = environment.apiUrl;

  constructor(private http: HttpClient, private router: Router) {}

  register(data: { name: string; email: string; password: string; phone?: string }) {
    return this.http.post<{ accessToken: string; user: AuthUser }>(`${this.api}/auth/register`, data).pipe(
      tap((res) => this.setSession(res))
    );
  }

  login(data: { email: string; password: string }) {
    return this.http.post<{ accessToken: string; user: AuthUser }>(`${this.api}/auth/login`, data).pipe(
      tap((res) => this.setSession(res))
    );
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private setSession(res: { accessToken: string; user: AuthUser }) {
    localStorage.setItem(this.TOKEN_KEY, res.accessToken);
    localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
    this.currentUser.set(res.user);
  }

  private loadUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem(this.USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}
