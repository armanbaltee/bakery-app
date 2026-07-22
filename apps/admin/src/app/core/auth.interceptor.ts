import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { AdminAuthService } from './auth.service';

export const adminAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AdminAuthService);
  const token = auth.getToken();
  if (token) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
  return next(req);
};
