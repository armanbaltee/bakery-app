import { Routes } from '@angular/router';

export const CHECKOUT_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./checkout.component').then(m => m.CheckoutComponent) },
  { path: 'processing', loadComponent: () => import('./processing/processing.component').then(m => m.ProcessingComponent) },
];
