import { Route } from '@angular/router';
import { adminGuard } from './core/auth.guard';
import { LayoutComponent } from './shared/layout/layout.component';
import { LoginComponent } from './features/login/login.component';

export const appRoutes: Route[] = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [adminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'orders', loadComponent: () => import('./features/orders/orders.component').then(m => m.OrdersComponent) },
      { path: 'products', loadComponent: () => import('./features/products/products.component').then(m => m.ProductsComponent) },
      { path: 'categories', loadComponent: () => import('./features/categories/categories.component').then(m => m.CategoriesComponent) },
      { path: 'users', loadComponent: () => import('./features/users/users.component').then(m => m.UsersComponent) },
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
