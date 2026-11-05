import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="sidebar" [class.open]="isOpen">
      <div class="sidebar-header-mobile">
        <span class="mobile-title">Menu Navigation</span>
        <button class="close-btn" (click)="closeMenu.emit()">✕</button>
      </div>

      <nav class="nav-links">
        <div class="nav-group-label">OVERVIEW</div>
        <a class="nav-item" routerLink="/dashboard" routerLinkActive="active" (click)="closeMenu.emit()">
          <span class="icon">📊</span>
          <span class="label">Dashboard</span>
        </a>

        <div class="nav-group-label">OPERATIONS</div>
        <a class="nav-item" routerLink="/branches" routerLinkActive="active" (click)="closeMenu.emit()">
          <span class="icon">🏢</span>
          <span class="label">Properties & Beds</span>
          <span class="count-badge" *ngIf="branchesCount">{{ branchesCount }}</span>
        </a>

        <a class="nav-item" routerLink="/guests" routerLinkActive="active" (click)="closeMenu.emit()">
          <span class="icon">👥</span>
          <span class="label">Tenants & KYC</span>
          <span class="count-badge" *ngIf="guestsCount">{{ guestsCount }}</span>
        </a>

        <a class="nav-item" routerLink="/visitors" routerLinkActive="active" (click)="closeMenu.emit()">
          <span class="icon">🛂</span>
          <span class="label">Visitors</span>
        </a>

        <a class="nav-item" routerLink="/complaints" routerLinkActive="active" (click)="closeMenu.emit()">
          <span class="icon">🛠️</span>
          <span class="label">Complaints</span>
        </a>

        <div class="nav-group-label">FINANCE & STAFF</div>
        <a class="nav-item" routerLink="/analytics" routerLinkActive="active" (click)="closeMenu.emit()">
          <span class="icon">📈</span>
          <span class="label">Payment Analytics</span>
        </a>

        <a class="nav-item" routerLink="/ledger" routerLinkActive="active" (click)="closeMenu.emit()">
          <span class="icon">💰</span>
          <span class="label">Rent & Ledger</span>
        </a>

        <a class="nav-item" routerLink="/expenses" routerLinkActive="active" (click)="closeMenu.emit()">
          <span class="icon">📉</span>
          <span class="label">Expenses</span>
        </a>

        <a class="nav-item" routerLink="/reports" routerLinkActive="active" (click)="closeMenu.emit()">
          <span class="icon">📑</span>
          <span class="label">P&L & Closings</span>
        </a>

        <a class="nav-item" routerLink="/staff" routerLinkActive="active" (click)="closeMenu.emit()">
          <span class="icon">👔</span>
          <span class="label">Staff & Roles</span>
        </a>
      </nav>

      <div class="sidebar-footer">
        <div class="quota-box">
          <span class="quota-title">PROPERTIES QUOTA</span>
          <div class="quota-bar">
            <div class="quota-fill" [style.width.%]="(branchesCount / 5) * 100"></div>
          </div>
          <span class="quota-sub">{{ branchesCount }} Active</span>
        </div>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: var(--sidebar-w);
      background: #ffffff;
      border-right: 1px solid var(--border-color);
      padding: 1.25rem 0.85rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      flex-shrink: 0;
      height: 100%;
      overflow-y: auto;
      box-shadow: 1px 0 2px 0 rgba(0, 0, 0, 0.03);
    }
    .sidebar-header-mobile {
      display: none;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      .mobile-title { font-size: 1rem; font-weight: 700; }
      .close-btn { background: none; border: none; font-size: 1.25rem; cursor: pointer; }
    }
    .nav-links {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .nav-group-label {
      font-size: 0.675rem;
      font-weight: 700;
      color: #94a3b8;
      letter-spacing: 0.05em;
      padding: 0.5rem 0.75rem 0.2rem;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      padding: 0.55rem 0.85rem;
      border-radius: var(--radius-sm);
      color: var(--text-muted);
      font-size: 0.85rem;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s;
      .icon { font-size: 1.1rem; }
      .count-badge {
        margin-left: auto;
        background: var(--bg-main);
        padding: 0.15rem 0.45rem;
        border-radius: var(--radius-full);
        font-size: 0.7rem;
      }
      &:hover { background: #f1f5f9; color: var(--text-main); }
      &.active {
        background: var(--primary-light);
        color: var(--primary);
        font-weight: 700;
        .count-badge { background: #ffffff; color: var(--primary); font-weight: 700; }
      }
    }
    .quota-box {
      background: var(--bg-main);
      padding: 0.85rem;
      border-radius: var(--radius-md);
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      .quota-title { font-size: 0.65rem; font-weight: 800; color: var(--text-muted); letter-spacing: 0.05em; }
      .quota-bar { height: 6px; background: #e2e8f0; border-radius: var(--radius-full); overflow: hidden; }
      .quota-fill { height: 100%; background: var(--primary); border-radius: var(--radius-full); }
      .quota-sub { font-size: 0.75rem; font-weight: 600; color: var(--text-muted); }
    }
    @media (max-width: 1024px) {
      .sidebar {
        position: fixed;
        left: -100%;
        top: 0;
        bottom: 0;
        z-index: 1000;
        transition: left 0.3s ease;
        &.open { left: 0; }
      }
      .sidebar-header-mobile { display: flex; }
    }
  `]
})
export class SidebarComponent {
  @Input() isOpen = false;
  @Input() branchesCount = 0;
  @Input() guestsCount = 0;
  @Output() closeMenu = new EventEmitter<void>();
}
