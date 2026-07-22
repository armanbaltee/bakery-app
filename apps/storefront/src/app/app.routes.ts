import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', loadChildren: () => import('./features/home/home.routes').then(m => m.HOME_ROUTES) },
  { path: 'products', loadChildren: () => import('./features/products/products.routes').then(m => m.PRODUCT_ROUTES) },
  { path: 'cart', loadChildren: () => import('./features/cart/cart.routes').then(m => m.CART_ROUTES) },
  { path: 'checkout', loadChildren: () => import('./features/checkout/checkout.routes').then(m => m.CHECKOUT_ROUTES), canActivate: [authGuard] },
  { path: 'account', loadChildren: () => import('./features/account/account.routes').then(m => m.ACCOUNT_ROUTES) },
  { path: '**', redirectTo: '' },
];
