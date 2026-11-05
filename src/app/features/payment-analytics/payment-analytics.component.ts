import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PgApiService } from '../../core/services/pg-api.service';
import { AuthService } from '../../core/services/auth.service';
import { Branch, Owner, PaymentAnalyticsOverview, HierarchyCollectionItem } from '../../models/pg.models';
import { InrCurrencyPipe } from '../../shared/pipes/inr-currency.pipe';
import { BedHistoryModalComponent } from '../../shared/components/bed-history-modal.component';

@Component({
  selector: 'app-payment-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, InrCurrencyPipe, BedHistoryModalComponent],
  template: `
    <div class="analytics-container fade-in">
      <!-- Header -->
      <div class="view-header">
        <div>
          <h2>Payment Collections & Revenue Analytics</h2>
          <p class="subtitle">Multi-tier collection insights (Hostel, Floor, Room, Bed) across history</p>
        </div>
        <div class="header-controls">
          <div class="control-group">
            <label>Branch Filter:</label>
            <select [(ngModel)]="selectedBranchId" (change)="onFilterChange()">
              <option value="">All Properties (Consolidated)</option>
              <option *ngFor="let b of branches" [value]="b.branchId">
                {{ b.branchName }} ({{ b.branchCode }})
              </option>
            </select>
          </div>
          <div class="control-group">
            <label>Year:</label>
            <select [(ngModel)]="selectedYear" (change)="onFilterChange()">
              <option *ngFor="let y of availableYears" [value]="y">{{ y }}</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Calculating lifetime collection metrics...</p>
      </div>

      <div *ngIf="!loading && overview" class="analytics-content">
        <!-- Top Metrics KPI Cards -->
        <div class="kpi-row">
          <div class="kpi-card highlight-green">
            <div class="kpi-meta">
              <span class="lbl">Current Month Collected</span>
              <span class="icon">📅</span>
            </div>
            <div class="val text-emerald">{{ overview.currentMonthTotal | inrCurrency }}</div>
            <div class="sub-text">
              <strong>{{ overview.currentMonthTransactionCount }}</strong> receipts in current month
            </div>
          </div>

          <div class="kpi-card highlight-blue">
            <div class="kpi-meta">
              <span class="lbl">Year {{ selectedYear }} Total Collections</span>
              <span class="icon">📈</span>
            </div>
            <div class="val text-blue">{{ overview.yearTotal | inrCurrency }}</div>
            <div class="sub-text">
              <strong>{{ overview.yearTransactionCount }}</strong> transactions across {{ selectedYear }}
            </div>
          </div>

          <div class="kpi-card highlight-indigo">
            <div class="kpi-meta">
              <span class="lbl">Lifetime Collections (Rent & Fees)</span>
              <span class="icon">💰</span>
            </div>
            <div class="val text-indigo">{{ overview.lifetimeTotalCollected | inrCurrency }}</div>
            <div class="sub-text">
              Pure room/bed rent collections (Excludes Security Advances)
            </div>
          </div>
        </div>

        <!-- Month-Wise Breakdown Bar Chart & Grid for the Selected Year -->
        <div class="chart-card">
          <div class="card-header">
            <h3>🗓️ Month-by-Month Collections in {{ selectedYear }}</h3>
            <span class="badge badge-info">{{ overview.monthlyTrends.length }} Active Months</span>
          </div>

          <div class="monthly-bars-container" *ngIf="overview.monthlyTrends.length > 0">
            <div *ngFor="let m of overview.monthlyTrends" class="month-bar-item">
              <div class="bar-value">{{ m.totalCollected | inrCurrency }}</div>
              <div class="bar-track">
                <div class="bar-fill" [style.height.%]="getBarHeight(m.totalCollected)"></div>
              </div>
              <div class="bar-label">{{ m.monthLabel }}</div>
              <div class="bar-txns">{{ m.totalTransactions }} txns</div>
            </div>
          </div>
          <div *ngIf="overview.monthlyTrends.length === 0" class="empty-chart">
            <p>No payments recorded in year {{ selectedYear }}.</p>
          </div>
        </div>

        <!-- Hierarchical Collection Drill-Down Matrix -->
        <div class="hierarchy-card">
          <div class="card-header-tabs">
            <div>
              <h3>🏢 Hierarchical Revenue Breakdown</h3>
              <p class="sub-help">Click any level to inspect total non-advance collections, occupied beds & guest turnover</p>
            </div>
            <div class="level-tabs">
              <button class="tab-btn" [class.active]="activeLevel === 'hostel'" (click)="setLevel('hostel')">🏢 Hostel-wise</button>
              <button class="tab-btn" [class.active]="activeLevel === 'floor'" (click)="setLevel('floor')">🏬 Floor-wise</button>
              <button class="tab-btn" [class.active]="activeLevel === 'room'" (click)="setLevel('room')">🚪 Room-wise</button>
              <button class="tab-btn" [class.active]="activeLevel === 'bed'" (click)="setLevel('bed')">🛏️ Bed-wise</button>
            </div>
          </div>

          <!-- Quick Hierarchy Search Filter -->
          <div class="hierarchy-search-bar">
            <input type="text" [(ngModel)]="hierarchySearch" placeholder="Search by name, code (e.g. BR-0001, R-101, BED-0045)..." />
            <span class="count-pill">{{ filteredHierarchyItems.length }} {{ activeLevel | titlecase }}s listed</span>
          </div>

          <!-- Hierarchy Table -->
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>{{ activeLevel | titlecase }} Name / Number</th>
                  <th *ngIf="activeLevel !== 'hostel'">Parent Scope</th>
                  <th>Beds (Occupied / Total)</th>
                  <th>Lifetime Guests</th>
                  <th>Current Month Collected</th>
                  <th>Total Amount Collected</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of filteredHierarchyItems">
                  <td><span class="code-badge">{{ item.code }}</span></td>
                  <td>
                    <strong>{{ item.name }}</strong>
                  </td>
                  <td *ngIf="activeLevel !== 'hostel'">
                    <span class="parent-tag">{{ item.parentName || '—' }}</span>
                  </td>
                  <td>
                    <span class="beds-pill">
                      <strong>{{ item.occupiedBeds }}</strong> / {{ item.totalBeds }}
                    </span>
                  </td>
                  <td>{{ item.lifetimeGuestsCount }} guests</td>
                  <td><strong class="text-emerald">{{ item.currentMonthAmountCollected | inrCurrency }}</strong></td>
                  <td><strong class="text-indigo amount-large">{{ item.totalAmountCollected | inrCurrency }}</strong></td>
                  <td>
                    <button *ngIf="activeLevel === 'bed'" class="btn btn-sm btn-outline-bed" (click)="openBedHistory(item.id)">
                      🛏️ Bed History
                    </button>
                    <button *ngIf="activeLevel === 'hostel'" class="btn btn-sm btn-outline-drill" (click)="drillDownToFloor(item.id)">
                      View Floors →
                    </button>
                    <button *ngIf="activeLevel === 'floor'" class="btn btn-sm btn-outline-drill" (click)="drillDownToRoom(item.id)">
                      View Rooms →
                    </button>
                    <button *ngIf="activeLevel === 'room'" class="btn btn-sm btn-outline-drill" (click)="drillDownToBed(item.id)">
                      View Beds →
                    </button>
                  </td>
                </tr>
                <tr *ngIf="filteredHierarchyItems.length === 0">
                  <td [attr.colspan]="activeLevel !== 'hostel' ? 8 : 7" class="text-center text-muted py-3">
                    No {{ activeLevel }} records found matching your filters.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Reusable Bed History Modal -->
    <app-bed-history-modal 
      [bedId]="selectedBedHistoryId" 
      [show]="showBedHistoryModal" 
      (closeEvent)="showBedHistoryModal = false">
    </app-bed-history-modal>
  `,
  styles: [`
    .analytics-container { max-width: 1400px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.5rem; padding: 1.5rem; }
    .view-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      h2 { font-size: 1.6rem; font-weight: 800; color: #0f172a; margin: 0; }
      .subtitle { color: #64748b; font-size: 0.9rem; margin-top: 0.25rem; }
      .header-controls { display: flex; gap: 1rem; }
    }
    .control-group {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      label { font-size: 0.75rem; font-weight: 700; color: #475569; }
      select {
        padding: 0.45rem 0.85rem;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        background: #ffffff;
        font-weight: 600;
        font-size: 0.875rem;
        min-width: 160px;
      }
    }
    .kpi-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.25rem; }
    .kpi-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.03);
      &.highlight-green { border-left: 4px solid #10b981; }
      &.highlight-blue { border-left: 4px solid #3b82f6; }
      &.highlight-indigo { border-left: 4px solid #6366f1; }
      .kpi-meta { display: flex; justify-content: space-between; align-items: center; .lbl { font-size: 0.8rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; } .icon { font-size: 1.3rem; } }
      .val { font-size: 1.85rem; font-weight: 800; line-height: 1.2; }
      .sub-text { font-size: 0.775rem; color: #64748b; margin-top: 0.2rem; }
    }
    .text-emerald { color: #059669; }
    .text-blue { color: #2563eb; }
    .text-indigo { color: #4f46e5; }

    /* Monthly Bars */
    .chart-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.5rem;
      .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; h3 { font-size: 1.15rem; font-weight: 800; margin: 0; } }
    }
    .monthly-bars-container {
      display: flex;
      gap: 1.25rem;
      align-items: flex-end;
      height: 220px;
      padding-top: 1rem;
      overflow-x: auto;
    }
    .month-bar-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.4rem;
      flex: 1;
      min-width: 65px;
      height: 100%;
      justify-content: flex-end;
      .bar-value { font-size: 0.7rem; font-weight: 800; color: #0f172a; white-space: nowrap; }
      .bar-track {
        width: 32px;
        height: 140px;
        background: #f1f5f9;
        border-radius: 6px;
        display: flex;
        align-items: flex-end;
        overflow: hidden;
      }
      .bar-fill {
        width: 100%;
        background: linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%);
        border-radius: 6px 6px 0 0;
        transition: height 0.3s ease;
      }
      .bar-label { font-size: 0.75rem; font-weight: 700; color: #334155; }
      .bar-txns { font-size: 0.675rem; color: #94a3b8; }
    }
    .empty-chart { text-align: center; padding: 2rem; color: #94a3b8; }

    /* Hierarchy Matrix */
    .hierarchy-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.5rem;
    }
    .card-header-tabs {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1.25rem;
      h3 { font-size: 1.15rem; font-weight: 800; margin: 0; }
      .sub-help { font-size: 0.8rem; color: #64748b; margin: 0.2rem 0 0 0; }
    }
    .level-tabs {
      display: flex;
      background: #f1f5f9;
      padding: 0.25rem;
      border-radius: 8px;
      gap: 0.25rem;
      .tab-btn {
        padding: 0.4rem 0.85rem;
        font-size: 0.8rem;
        font-weight: 700;
        border-radius: 6px;
        border: none;
        background: transparent;
        color: #475569;
        cursor: pointer;
        transition: all 0.2s;
        &.active { background: #ffffff; color: #2563eb; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
      }
    }
    .hierarchy-search-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      gap: 1rem;
      input {
        flex: 1;
        max-width: 400px;
        padding: 0.5rem 0.85rem;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        font-size: 0.85rem;
      }
      .count-pill { font-size: 0.775rem; font-weight: 700; color: #64748b; background: #f8fafc; padding: 0.3rem 0.7rem; border-radius: 20px; border: 1px solid #e2e8f0; }
    }

    .table-responsive { overflow-x: auto; }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
      th { background: #f8fafc; padding: 0.75rem 0.85rem; text-align: left; font-weight: 700; color: #475569; border-bottom: 1px solid #e2e8f0; font-size: 0.75rem; text-transform: uppercase; }
      td { padding: 0.75rem 0.85rem; border-bottom: 1px solid #f1f5f9; color: #1e293b; }
      .code-badge { font-family: monospace; font-size: 0.75rem; font-weight: 700; background: #eff6ff; color: #1d4ed8; padding: 0.2rem 0.5rem; border-radius: 4px; }
      .parent-tag { font-size: 0.775rem; color: #64748b; background: #f1f5f9; padding: 0.15rem 0.45rem; border-radius: 4px; }
      .beds-pill { font-size: 0.8rem; background: #f8fafc; border: 1px solid #e2e8f0; padding: 0.2rem 0.5rem; border-radius: 4px; }
      .amount-large { font-size: 0.95rem; }
      .btn-outline-bed {
        background: #ecfdf5;
        color: #065f46;
        border: 1px solid #a7f3d0;
        font-weight: 700;
        padding: 0.25rem 0.6rem;
        border-radius: 4px;
        cursor: pointer;
        &:hover { background: #d1fae5; }
      }
      .btn-outline-drill {
        background: #eff6ff;
        color: #1e40af;
        border: 1px solid #bfdbfe;
        font-weight: 700;
        padding: 0.25rem 0.6rem;
        border-radius: 4px;
        cursor: pointer;
        &:hover { background: #dbeafe; }
      }
    }
    .loading-state { text-align: center; padding: 4rem; color: #64748b; }
    .spinner { width: 36px; height: 36px; border: 3px solid #e2e8f0; border-top-color: #2563eb; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 1rem auto; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (max-width: 1024px) {
      .kpi-row { grid-template-columns: 1fr; }
    }
  `]
})
export class PaymentAnalyticsComponent implements OnInit {
  currentOwner: Owner | null = null;
  branches: Branch[] = [];
  selectedBranchId = '';
  selectedYear = 2026;
  availableYears = [2026, 2025, 2024];

  loading = true;
  overview: PaymentAnalyticsOverview | null = null;

  activeLevel: 'hostel' | 'floor' | 'room' | 'bed' = 'hostel';
  hierarchyItems: HierarchyCollectionItem[] = [];
  hierarchySearch = '';

  // Bed History Modal
  showBedHistoryModal = false;
  selectedBedHistoryId: string | null = null;

  constructor(private api: PgApiService, private auth: AuthService) {}

  ngOnInit(): void {
    this.auth.currentUser$.subscribe(owner => {
      this.currentOwner = owner;
      if (owner) {
        this.loadBranches(owner.ownerId);
        this.loadOverview();
        this.loadHierarchy();
      }
    });
  }

  loadBranches(ownerId: string): void {
    this.api.getBranches(ownerId).subscribe(b => this.branches = b);
  }

  loadOverview(): void {
    const ownerId = this.currentOwner?.ownerId;
    if (!ownerId) return;

    this.loading = true;
    this.api.getPaymentAnalyticsOverview(ownerId, this.selectedBranchId || null, this.selectedYear).subscribe({
      next: (data) => {
        this.overview = data;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  loadHierarchy(parentId?: string | null): void {
    const ownerId = this.currentOwner?.ownerId;
    if (!ownerId) return;

    this.api.getPaymentHierarchy(ownerId, this.activeLevel, this.selectedBranchId || null, parentId).subscribe({
      next: (data) => this.hierarchyItems = data
    });
  }

  onFilterChange(): void {
    this.loadOverview();
    this.loadHierarchy();
  }

  setLevel(level: 'hostel' | 'floor' | 'room' | 'bed', parentId?: string | null): void {
    this.activeLevel = level;
    this.loadHierarchy(parentId);
  }

  drillDownToFloor(branchId: string): void {
    this.selectedBranchId = branchId;
    this.setLevel('floor', branchId);
  }

  drillDownToRoom(floorId: string): void {
    this.setLevel('room', floorId);
  }

  drillDownToBed(roomId: string): void {
    this.setLevel('bed', roomId);
  }

  get filteredHierarchyItems(): HierarchyCollectionItem[] {
    if (!this.hierarchySearch.trim()) return this.hierarchyItems;
    const term = this.hierarchySearch.toLowerCase().trim();
    return this.hierarchyItems.filter(i => 
      i.code.toLowerCase().includes(term) ||
      i.name.toLowerCase().includes(term) ||
      (i.parentName && i.parentName.toLowerCase().includes(term))
    );
  }

  getBarHeight(collected: number): number {
    if (!this.overview?.monthlyTrends || this.overview.monthlyTrends.length === 0) return 0;
    const maxVal = Math.max(...this.overview.monthlyTrends.map(t => t.totalCollected), 1);
    return Math.max(8, Math.round((collected / maxVal) * 100));
  }

  openBedHistory(bedId: string): void {
    this.selectedBedHistoryId = bedId;
    this.showBedHistoryModal = true;
  }
}
