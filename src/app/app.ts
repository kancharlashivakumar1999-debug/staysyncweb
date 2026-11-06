import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar.component';
import { SidebarComponent } from './shared/components/sidebar.component';
import { ToasterComponent } from './shared/components/toaster.component';
import { AuthService } from './core/services/auth.service';
import { PgApiService } from './core/services/pg-api.service';
import { Owner, Branch } from './models/pg.models';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent, SidebarComponent, ToasterComponent],
  template: `
    <app-toaster></app-toaster>
    <div class="app-shell" [class.auth-shell]="isAuthRoute">
      <!-- Sticky Top Navbar -->
      <app-navbar 
        *ngIf="!isAuthRoute"
        [owner]="currentOwner"
        [branches]="branches"
        [selectedBranchId]="selectedBranchId"
        (branchChange)="onBranchChange($event)"
        (toggleMenu)="mobileMenuOpen = !mobileMenuOpen"
        (logout)="onLogout()">
      </app-navbar>

      <!-- Main Layout Body -->
      <div class="main-body" *ngIf="!isAuthRoute">
        <app-sidebar 
          [isOpen]="mobileMenuOpen"
          [branchesCount]="branches.length"
          (closeMenu)="mobileMenuOpen = false">
        </app-sidebar>

        <main class="content-viewport">
          <router-outlet></router-outlet>
        </main>
      </div>

      <div *ngIf="isAuthRoute" class="auth-viewport">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [`
    .app-shell {
      display: flex;
      flex-direction: column;
      height: 100vh;
      width: 100vw;
      overflow: hidden;
      background-color: var(--bg-main);
    }
    .auth-shell {
      height: 100%;
      overflow-y: auto;
    }
    .auth-viewport {
      height: 100vh;
      overflow-y: auto;
    }
    .main-body {
      display: flex;
      flex: 1;
      height: calc(100vh - 64px);
      overflow: hidden;
    }
    .content-viewport {
      flex: 1;
      height: 100%;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 1.5rem 2rem;
      background-color: var(--bg-main);
    }
    @media (max-width: 1023px) {
      .content-viewport { padding: 1.25rem; }
    }
    @media (max-width: 767px) {
      .main-body { height: calc(100vh - 56px); }
      .content-viewport { padding: 1rem; }
    }
  `]
})
export class App implements OnInit {
  currentOwner: Owner | null = null;
  branches: Branch[] = [];
  selectedBranchId: string | null = null;
  mobileMenuOpen = false;

  constructor(
    private authService: AuthService,
    private apiService: PgApiService,
    public router: Router
  ) {}

  get isAuthRoute(): boolean {
    return this.router.url.includes('/auth/');
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(owner => {
      this.currentOwner = owner;
      if (owner) {
        this.apiService.getBranches(owner.ownerId).subscribe({
          next: branches => this.branches = branches,
          error: () => this.branches = []
        });
      } else {
        this.branches = [];
      }
    });
  }

  onBranchChange(branchId: string | null): void {
    this.selectedBranchId = branchId;
    this.apiService.setSelectedBranch(branchId);
  }

  onLogout(): void {
    this.authService.logout();
  }
}
