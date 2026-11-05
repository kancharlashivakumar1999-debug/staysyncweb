import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-brand">
          <div class="brand-badge">🏢</div>
          <h2>Owner Sign In</h2>
          <p class="auth-sub">Enter credentials to authenticate into PG Management</p>
        </div>

        <form (ngSubmit)="onLogin()" class="auth-form">
          <div *ngIf="errorMessage" class="alert alert-danger">{{ errorMessage }}</div>

          <div class="form-group">
            <label>Owner Email Address</label>
            <input 
              type="email" 
              [(ngModel)]="email" 
              name="email" 
              required 
              placeholder="owner@pgmanagement.com" 
              [disabled]="loading"
            />
          </div>

          <div class="form-group">
            <label>Password</label>
            <input 
              type="password" 
              [(ngModel)]="password" 
              name="password" 
              required 
              placeholder="Enter your password" 
              [disabled]="loading"
            />
          </div>

          <button type="submit" class="btn btn-primary full-w" [disabled]="loading">
            {{ loading ? 'Verifying Credentials...' : 'Sign In' }}
          </button>
        </form>

        <div class="auth-footer">
          <p>Need a new property owner account? <a routerLink="/auth/register">Register Property</a></p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0f172a, #1e1b4b);
      padding: 1.5rem;
    }
    .auth-card {
      background: #ffffff;
      border-radius: var(--radius-lg);
      padding: 2.5rem;
      width: 100%;
      max-width: 440px;
      box-shadow: var(--shadow-xl);
    }
    .auth-brand {
      text-align: center;
      margin-bottom: 2rem;
      .brand-badge {
        font-size: 2.5rem;
        margin-bottom: 0.5rem;
      }
      h2 { font-size: 1.5rem; font-weight: 800; color: var(--text-main); }
      .auth-sub { font-size: 0.85rem; color: var(--text-muted); margin-top: 0.25rem; }
    }
    .alert-danger {
      background: #fef2f2;
      color: #991b1b;
      padding: 0.75rem 1rem;
      border-radius: var(--radius-sm);
      margin-bottom: 1.25rem;
      font-size: 0.825rem;
      border: 1px solid #fecaca;
      font-weight: 600;
    }
    .auth-footer {
      text-align: center;
      margin-top: 1.5rem;
      font-size: 0.85rem;
      color: var(--text-muted);
      a { color: var(--primary); font-weight: 700; text-decoration: none; }
    }
  `]
})
export class LoginComponent {
  email = '';
  password = '';
  loading = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  onLogin(): void {
    if (!this.email || !this.password) {
      this.errorMessage = 'Please enter both email and password.';
      return;
    }
    this.loading = true;
    this.errorMessage = '';

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: () => {
        this.loading = false;
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.loading = false;
        // Strictly block user on wrong credentials
        if (err?.status === 401) {
          this.errorMessage = 'Invalid email or password. Access denied.';
        } else if (err?.error?.message) {
          this.errorMessage = err.error.message;
        } else {
          this.errorMessage = 'Unable to connect to the authentication service. Please try again.';
        }
      }
    });
  }
}
