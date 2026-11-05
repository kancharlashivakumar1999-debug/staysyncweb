import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Owner, Branch } from '../../models/pg.models';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="top-nav">
      <div class="nav-brand">
        <div class="logo-box">
          <span class="logo-icon">🏢</span>
        </div>
        <div class="brand-text">
          <h1>PG-Manager Pro</h1>
          <span class="brand-tagline">Multi-Branch Hostel & Tenant Ops</span>
        </div>
      </div>

      <div class="nav-actions">
        <div class="branch-selector" *ngIf="branches.length > 0">
          <span class="select-label">Active PG:</span>
          <select [value]="selectedBranchId" (change)="onBranchSelect($event)">
            <option [value]="null">All Properties ({{ branches.length }})</option>
            <option *ngFor="let b of branches" [value]="b.branchId">
              {{ b.branchName }} ({{ b.branchCode }})
            </option>
          </select>
        </div>

        <div class="owner-chip" *ngIf="owner">
          <div class="avatar">{{ owner.fullName.charAt(0) || 'O' }}</div>
          <div class="owner-meta">
            <span class="owner-name">{{ owner.fullName }} ({{ owner.ownerCode }})</span>
            <span class="owner-role">Owner • {{ owner.expectedBranches }} Properties Quota</span>
          </div>
        </div>

        <button *ngIf="owner" class="btn btn-secondary btn-sm logout-btn" (click)="logout.emit()">
          Logout
        </button>

        <button class="mobile-menu-btn" (click)="toggleMenu.emit()" aria-label="Toggle Navigation">
          <span class="bar"></span>
          <span class="bar"></span>
          <span class="bar"></span>
        </button>
      </div>
    </header>
  `,
  styles: [`
    .top-nav {
      height: 64px;
      background: #ffffff;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 1.5rem;
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: var(--shadow-sm);
    }
    .nav-brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      .logo-box {
        width: 38px;
        height: 38px;
        background: linear-gradient(135deg, #4f46e5, #0ea5e9);
        border-radius: var(--radius-md);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 10px rgba(79, 70, 229, 0.3);
        .logo-icon { font-size: 1.25rem; }
      }
      .brand-text h1 {
        font-size: 1.1rem;
        font-weight: 800;
        color: var(--text-main);
        line-height: 1.2;
      }
      .brand-text .brand-tagline {
        font-size: 0.725rem;
        color: var(--text-muted);
        font-weight: 500;
      }
    }
    .nav-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .branch-selector {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      .select-label { font-size: 0.8rem; font-weight: 600; color: var(--text-muted); }
      select {
        padding: 0.4rem 0.75rem;
        border-radius: var(--radius-sm);
        border: 1px solid var(--border-color);
        font-size: 0.825rem;
        font-weight: 600;
        background: #ffffff;
      }
    }
    .owner-chip {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      padding: 0.3rem 0.75rem;
      background: var(--bg-main);
      border-radius: var(--radius-full);
      border: 1px solid var(--border-color);
      .avatar {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background: var(--primary);
        color: white;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.85rem;
      }
      .owner-meta {
        display: flex;
        flex-direction: column;
        .owner-name { font-size: 0.8rem; font-weight: 700; }
        .owner-role { font-size: 0.68rem; color: var(--text-muted); }
      }
    }
    .logout-btn { padding: 0.35rem 0.75rem; font-size: 0.75rem; }
    .mobile-menu-btn {
      display: none;
      flex-direction: column;
      justify-content: space-around;
      width: 32px;
      height: 32px;
      background: transparent;
      border: none;
      cursor: pointer;
      .bar { width: 100%; height: 2.5px; background: var(--text-main); border-radius: 2px; }
    }
    @media (max-width: 767px) {
      .top-nav { padding: 0 1rem; height: 56px; }
      .brand-text .brand-tagline, .branch-selector, .owner-chip .owner-meta, .logout-btn { display: none; }
      .mobile-menu-btn { display: flex; }
    }
  `]
})
export class NavbarComponent {
  @Input() owner: Owner | null = null;
  @Input() branches: Branch[] = [];
  @Input() selectedBranchId: string | null = null;
  @Output() branchChange = new EventEmitter<string | null>();
  @Output() toggleMenu = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();

  onBranchSelect(event: any): void {
    const val = event.target.value;
    this.branchChange.emit(val === 'null' || !val ? null : String(val));
  }
}
