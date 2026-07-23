import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast" [class]="toast.type" (click)="toastService.remove(toast.id)">
          <span class="toast-icon">
            {{ toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️' }}
          </span>
          {{ toast.message }}
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 90px;
      right: 20px;
      z-index: var(--z-toast);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .toast {
      display: flex;
      align-items: center;
      gap: 10px;
      background: var(--color-espresso);
      color: var(--color-cream);
      padding: 14px 20px;
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg);
      font-size: 0.9rem;
      animation: slideIn 0.3s ease;
      max-width: 340px;
      cursor: pointer;
    }
    .toast.success { background: var(--color-success); }
    .toast.error { background: var(--color-error); }
    @keyframes slideIn {
      from { transform: translateX(120%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `]
})
export class ToastComponent {
  toastService = inject(ToastService);
}
