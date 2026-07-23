import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-processing',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="container processing-page">
      @if (status === 'success') {
        <div class="status-card success">
          <div class="status-icon">🎉</div>
          <h2>Payment Successful!</h2>
          <p>Your order has been confirmed. You'll receive an email confirmation shortly.</p>
          <div class="actions">
            <a routerLink="/account/orders" class="btn btn-primary">View My Orders</a>
            <a routerLink="/products" class="btn btn-ghost">Continue Shopping</a>
          </div>
        </div>
      } @else if (status === 'failed') {
        <div class="status-card error">
          <div class="status-icon">❌</div>
          <h2>Payment Failed</h2>
          <p>Your payment was not successful. Please try again or choose a different payment method.</p>
          <div class="actions">
            <a routerLink="/cart" class="btn btn-primary">Back to Cart</a>
          </div>
        </div>
      } @else {
        <div class="status-card processing">
          <div class="status-icon rotating">⏳</div>
          <h2>Processing Payment...</h2>
          <p>Please wait while we verify your payment.</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .processing-page {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 60vh;
      padding: var(--space-3xl) 0;
    }
    .status-card {
      text-align: center;
      padding: var(--space-3xl);
      background: var(--color-white);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      max-width: 480px;
      width: 100%;
    }
    .status-icon { font-size: 4rem; margin-bottom: var(--space-lg); }
    .rotating { display: inline-block; animation: spin 1s linear infinite; }
    h2 { margin-bottom: var(--space-md); }
    p { color: var(--color-brown-light); margin-bottom: var(--space-xl); }
    .actions { display: flex; gap: var(--space-md); justify-content: center; }
  `]
})
export class ProcessingComponent implements OnInit {
  private route = inject(ActivatedRoute);
  status: 'processing' | 'success' | 'failed' = 'processing';

  ngOnInit() {
    const params = this.route.snapshot.queryParams;
    // EasyPaisa: responseCode=0000 | JazzCash: pp_ResponseCode=000
    const ep = params['responseCode'] || params['transactionStatus'];
    const jc = params['pp_ResponseCode'];

    if (ep === '0000' || ep === 'SUCCESS' || jc === '000') {
      this.status = 'success';
    } else if (ep || jc) {
      this.status = 'failed';
    }
  }
}
