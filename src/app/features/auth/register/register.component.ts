import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-brand">
          <div class="brand-badge">🏢</div>
          <h2>Register PG Owner</h2>
          <p class="auth-sub">Create your owner master profile to manage branches & beds</p>
        </div>

        <form (ngSubmit)="onRegister()" class="auth-form">
          <div *ngIf="errorMessage" class="alert alert-danger">{{ errorMessage }}</div>

          <div class="form-group">
            <label>Full Name *</label>
            <input type="text" [(ngModel)]="owner.fullName" name="fullName" required placeholder="e.g. Ramesh Kumar" />
          </div>

          <div class="form-group">
            <label>Email Address *</label>
            <input type="email" [(ngModel)]="owner.email" name="email" required placeholder="owner@pgmanagement.com" />
          </div>

          <div class="form-row-2">
            <div class="form-group">
              <label>Phone Number *</label>
              <input type="text" [(ngModel)]="owner.phoneNumber" name="phoneNumber" required placeholder="+91 98765 43210" />
            </div>
            <div class="form-group">
              <label>Expected Branches</label>
              <input type="number" min="1" max="20" [(ngModel)]="owner.expectedBranches" name="expectedBranches" />
            </div>
          </div>

          <div class="form-group">
            <label>Master Password *</label>
            <input type="password" [(ngModel)]="owner.password" name="password" required minlength="6" placeholder="••••••••" />
          </div>

          <button type="submit" class="btn btn-primary full-w" [disabled]="loading">
            {{ loading ? 'Creating Account...' : 'Complete Registration' }}
          </button>
        </form>

        <div class="auth-footer">
          <p>Already registered? <a routerLink="/auth/login">Log In</a></p>
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
      max-width: 520px;
      box-shadow: var(--shadow-xl);
    }
    .auth-brand {
      text-align: center;
      margin-bottom: 2rem;
      .brand-badge { font-size: 2.5rem; margin-bottom: 0.5rem; }
      h2 { font-size: 1.5rem; font-weight: 800; color: var(--text-main); }
      .auth-sub { font-size: 0.85rem; color: var(--text-muted); margin-top: 0.25rem; }
    }
    .alert-danger {
      background: #fef2f2;
      color: #991b1b;
      padding: 0.75rem;
      border-radius: var(--radius-sm);
      margin-bottom: 1rem;
      font-size: 0.825rem;
    }
    .form-row-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
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
export class RegisterComponent {
  owner = {
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    expectedBranches: 2
  };
  loading = false;
  errorMessage = '';

  constructor(private authService: AuthService, private router: Router) {}

  onRegister(): void {
    if (!this.owner.fullName || !this.owner.email || !this.owner.password || !this.owner.phoneNumber) {
      this.errorMessage = 'Please complete all required fields.';
      return;
    }
    this.loading = true;
    this.errorMessage = '';

    this.authService.register(this.owner).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.message || 'Registration failed.';
      }
    });
  }
}
