import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import {
  ContainerComponent, RowComponent, ColComponent, CardComponent, CardBodyComponent, CardGroupComponent,
  FormDirective, InputGroupComponent, InputGroupTextDirective, FormControlDirective,
  ButtonDirective, AlertComponent
} from '@coreui/angular';
import { IconDirective } from '@coreui/icons-angular';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    ContainerComponent, RowComponent, ColComponent, CardComponent, CardBodyComponent, CardGroupComponent,
    FormDirective, InputGroupComponent, InputGroupTextDirective, FormControlDirective,
    ButtonDirective, AlertComponent, IconDirective
  ],
  template: `
    <div class="bg-body-tertiary min-vh-100 d-flex align-items-center">
      <c-container>
        <c-row class="justify-content-center">
          <c-col [md]="8" [lg]="6" [xl]="5">
            <c-card-group>
              <c-card class="p-4 shadow-sm">
                <c-card-body>
                  <!-- Logo -->
                  <div class="text-center mb-4">
                    <div class="d-inline-flex align-items-center justify-content-center rounded-3 mb-3"
                         style="width: 56px; height: 56px; background: var(--cui-primary);">
                      <svg class="text-white" width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                    </div>
                    <h1 class="h4">Drug Portfolio Dashboard</h1>
                    <p class="text-body-secondary">Clinical R&D Portfolio Management</p>
                  </div>

                  @if (error()) {
                    <c-alert color="danger" class="mb-3">{{ error() }}</c-alert>
                  }

                  <form cForm #loginForm="ngForm" (ngSubmit)="onLogin(loginForm)">
                    <c-input-group class="mb-1">
                      <span cInputGroupText>
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                        </svg>
                      </span>
                      <input cFormControl type="text" placeholder="Username"
                             [(ngModel)]="username" name="username" #usernameField="ngModel" required autocomplete="username" />
                    </c-input-group>
                    @if (usernameField.invalid && usernameField.touched) {
                      <div class="text-danger small mb-2">Username is required</div>
                    } @else {
                      <div class="mb-3"></div>
                    }

                    <c-input-group class="mb-1">
                      <span cInputGroupText>
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                        </svg>
                      </span>
                      <input cFormControl type="password" placeholder="Password"
                             [(ngModel)]="password" name="password" #passwordField="ngModel" required autocomplete="current-password" />
                    </c-input-group>
                    @if (passwordField.invalid && passwordField.touched) {
                      <div class="text-danger small mb-3">Password is required</div>
                    } @else {
                      <div class="mb-4"></div>
                    }

                    <c-row>
                      <c-col [xs]="12">
                        <button cButton color="primary" class="w-100 mb-3" type="submit" [disabled]="loading()">
                          @if (loading()) {
                            <span class="spinner-border spinner-border-sm me-2"></span> Signing in...
                          } @else {
                            Sign In
                          }
                        </button>
                      </c-col>
                    </c-row>
                  </form>

                  <!-- Demo credentials -->
                  <hr />
                  <p class="text-body-secondary small mb-2">Demo credentials:</p>
                  <div class="d-flex flex-wrap gap-2">
                    <button cButton color="light" size="sm" (click)="fillCredentials('admin', 'admin123')">
                      <strong>Admin</strong>
                    </button>
                    <button cButton color="light" size="sm" (click)="fillCredentials('pm_jones', 'pass123')">
                      <strong>Manager</strong>
                    </button>
                    <button cButton color="light" size="sm" (click)="fillCredentials('viewer', 'view123')">
                      <strong>Viewer</strong>
                    </button>
                  </div>
                </c-card-body>
              </c-card>
            </c-card-group>
          </c-col>
        </c-row>
      </c-container>
    </div>
  `
})
export class LoginComponent {
  username = '';
  password = '';
  loading = signal(false);
  error = signal('');

  constructor(private auth: AuthService, private router: Router) {
    if (auth.isLoggedIn()) {
      router.navigate(['/dashboard']);
    }
  }

  fillCredentials(u: string, p: string) {
    this.username = u;
    this.password = p;
  }

  onLogin(form: NgForm) {
    if (form.invalid) {
      Object.values(form.controls).forEach(c => c.markAsTouched());
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.auth.login({ username: this.username, password: this.password }).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.error || 'Login failed');
      }
    });
  }
}
