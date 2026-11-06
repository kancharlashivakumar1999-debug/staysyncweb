import { Routes } from '@angular/router';
import { authGuard, publicGuard } from './core/guards/auth.guard';
import { pendingChangesGuard } from './core/guards/pending-changes.guard';

export const routes: Routes = [
  // Default entry route points to Login page
  { path: '', redirectTo: 'auth/login', pathMatch: 'full' },

  // Public Routes (Protected by publicGuard so logged-in users don't see login/register again)
  {
    path: 'auth/login',
    canActivate: [publicGuard],
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'auth/register',
    canActivate: [publicGuard],
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
  },

  // Protected Routes (Protected by authGuard - must be logged in to access)
  {
    path: 'dashboard',
    canActivate: [authGuard],
    canDeactivate: [pendingChangesGuard],
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'branches',
    canActivate: [authGuard],
    canDeactivate: [pendingChangesGuard],
    loadComponent: () => import('./features/branches/branches.component').then(m => m.BranchesComponent)
  },
  {
    path: 'guests',
    canActivate: [authGuard],
    canDeactivate: [pendingChangesGuard],
    loadComponent: () => import('./features/guests/guests.component').then(m => m.GuestsComponent)
  },
  {
    path: 'ledger',
    canActivate: [authGuard],
    canDeactivate: [pendingChangesGuard],
    loadComponent: () => import('./features/ledger/ledger.component').then(m => m.LedgerComponent)
  },
  {
    path: 'expenses',
    canActivate: [authGuard],
    canDeactivate: [pendingChangesGuard],
    loadComponent: () => import('./features/expenses/expenses.component').then(m => m.ExpensesComponent)
  },
  {
    path: 'complaints',
    canActivate: [authGuard],
    loadComponent: () => import('./features/complaints/complaints.component').then(m => m.ComplaintsComponent)
  },
  {
    path: 'visitors',
    canActivate: [authGuard],
    loadComponent: () => import('./features/visitors/visitors.component').then(m => m.VisitorsComponent)
  },
  {
    path: 'reports',
    canActivate: [authGuard],
    loadComponent: () => import('./features/reports/reports.component').then(m => m.ReportsComponent)
  },
  {
    path: 'analytics',
    canActivate: [authGuard],
    loadComponent: () => import('./features/payment-analytics/payment-analytics.component').then(m => m.PaymentAnalyticsComponent)
  },
  {
    path: 'staff',
    canActivate: [authGuard],
    loadComponent: () => import('./features/staff/staff.component').then(m => m.StaffComponent)
  },

  // Fallback Wildcard
  { path: '**', redirectTo: 'auth/login' }
];
