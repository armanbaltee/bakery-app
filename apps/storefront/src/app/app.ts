import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { FooterComponent } from './shared/footer/footer.component';
import { ToastComponent } from './shared/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent, ToastComponent],
  template: `
    <app-navbar />
    <main class="main-content">
      <router-outlet />
    </main>
    <app-footer />
    <app-toast />
  `,
  styles: [`
    .main-content {
      min-height: calc(100vh - 80px);
    }
  `]
})
export class AppComponent {}
