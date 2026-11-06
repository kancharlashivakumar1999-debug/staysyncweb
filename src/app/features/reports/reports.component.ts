import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PgApiService } from '../../core/services/pg-api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { MonthlyClosing, FinancialProfitLoss, Branch } from '../../models/pg.models';
import { InrCurrencyPipe } from '../../shared/pipes/inr-currency.pipe';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, InrCurrencyPipe],
  template: `
    <div class="reports-container">
      <header class="page-header">
        <div>
          <h2>Monthly Closing & P&L Statement</h2>
          <p class="subtitle">UC-07: Summarize monthly collections, operating expenses, dues, and lock books.</p>
        </div>
        <button class="btn btn-primary" (click)="showClosingModal = true">Close Current Month</button>
      </header>

      <!-- Month Selector Bar -->
      <div class="filter-card">
        <div class="filter-group">
          <label>Selected Month:</label>
          <input type="month" [(ngModel)]="selectedMonth" (change)="onFilterChange()" />
        </div>

        <div class="filter-group">
          <label>Filter Property:</label>
          <select [(ngModel)]="selectedBranchId" (change)="onFilterChange()">
            <option value="">All Properties (Consolidated)</option>
            <option *ngFor="let b of branches" [value]="b.branchId">
              {{ b.branchName }} ({{ b.branchCode }})
            </option>
          </select>
        </div>
      </div>

      <!-- Financial P&L Cards -->
      <div class="pnl-grid" *ngIf="plReport">
        <div class="pnl-card income">
          <span class="label">Gross Income Collected</span>
          <span class="value">{{ plReport.totalIncome | inrCurrency }}</span>
          <div class="breakdown">
            <span>Rent: <strong>{{ plReport.rentCollected | inrCurrency }}</strong></span>
            <span>Utilities/Other: <strong>{{ plReport.utilitiesCollected | inrCurrency }}</strong></span>
          </div>
        </div>

        <div class="pnl-card expense">
          <span class="label">Total Operating Expenses</span>
          <span class="value">{{ plReport.totalExpenses | inrCurrency }}</span>
          <span class="subtext">EB, mess, staff, maintenance & upkeep</span>
        </div>

        <div class="pnl-card net" [class.profit]="plReport.netProfit >= 0" [class.loss]="plReport.netProfit < 0">
          <span class="label">Net Operating Profit</span>
          <span class="value">{{ plReport.netProfit | inrCurrency }}</span>
          <span class="subtext">After all expense deductions</span>
        </div>

        <div class="pnl-card dues">
          <span class="label">Uncollected Dues</span>
          <span class="value">{{ plReport.totalOutstandingDues | inrCurrency }}</span>
          <span class="subtext">Occupancy rate: <strong>{{ plReport.occupancyPercentage }}%</strong></span>
        </div>
      </div>

      <!-- Closing Ledger Records -->
      <div class="section-title">
        <h3>Historical Monthly Closings</h3>
      </div>

      <div class="table-container">
        <table *ngIf="closings.length > 0; else noClosings">
          <thead>
            <tr>
              <th>Closing Code</th>
              <th>Month</th>
              <th>Property</th>
              <th>Rent Income</th>
              <th>Expenses</th>
              <th>Net Profit</th>
              <th>Unpaid Dues</th>
              <th>Occupancy</th>
              <th>Closed By / Date</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let c of closings">
              <td><span class="code-badge">{{ c.closingCode }}</span></td>
              <td><strong>{{ c.closingMonth }}</strong></td>
              <td>{{ c.branchName || 'All Properties' }}</td>
              <td class="amount success">{{ c.totalRentCollected | inrCurrency }}</td>
              <td class="amount danger">- {{ c.totalExpenses | inrCurrency }}</td>
              <td class="amount" [class.success]="c.netOperatingIncome >= 0" [class.danger]="c.netOperatingIncome < 0">
                {{ c.netOperatingIncome | inrCurrency }}
              </td>
              <td class="amount text-muted">{{ c.totalOutstandingDues | inrCurrency }}</td>
              <td><strong>{{ c.occupancyRate }}%</strong></td>
              <td>
                <div>{{ c.closedBy || 'Owner' }}</div>
                <small class="text-muted">{{ c.closedAt | date:'mediumDate' }}</small>
              </td>
            </tr>
          </tbody>
        </table>
        <ng-template #noClosings>
          <div class="empty-state">No official monthly closings locked yet. Click "Close Current Month" to snapshot.</div>
        </ng-template>
      </div>

      <!-- Close Month Modal -->
      <div class="modal-backdrop" *ngIf="showClosingModal">
        <div class="modal">
          <h3>Lock & Close Monthly Books</h3>
          <p class="subtitle">This will snapshot rent, expenses, and occupancy for the chosen month.</p>
          <form (ngSubmit)="submitClosing()">
            <label>Select Property *</label>
            <select [(ngModel)]="closingForm.branchId" name="branchId" required>
              <option *ngFor="let b of branches" [value]="b.branchId">{{ b.branchName }}</option>
            </select>

            <label>Closing Month (YYYY-MM) *</label>
            <input type="text" [(ngModel)]="closingForm.closingMonth" name="closingMonth" placeholder="e.g. 2026-10" required />

            <label>Closed By</label>
            <input type="text" [(ngModel)]="closingForm.closedBy" name="closedBy" placeholder="e.g. Ramesh Kumar (Owner)" />

            <label>Notes / Auditing Remarks</label>
            <textarea [(ngModel)]="closingForm.notes" name="notes" rows="3" placeholder="End of month financial comments"></textarea>

            <div class="modal-actions">
              <button type="button" class="btn btn-secondary" (click)="showClosingModal = false">Cancel</button>
              <button type="submit" class="btn btn-primary">Confirm & Lock Month</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .reports-container { padding: 1.5rem; max-width: 1400px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .page-header h2 { margin: 0; font-size: 1.6rem; color: #0f172a; }
    .subtitle { margin: 0.2rem 0 0; color: #64748b; font-size: 0.9rem; }
    .btn { padding: 0.6rem 1.2rem; border-radius: 8px; font-weight: 600; cursor: pointer; border: none; font-size: 0.9rem; }
    .btn-primary { background: #2563eb; color: #fff; }
    .btn-secondary { background: #e2e8f0; color: #1e293b; }
    .filter-card { 
      background: #fff; 
      border-radius: 12px; 
      border: 1px solid #e2e8f0; 
      padding: 1rem 1.25rem; 
      display: flex; 
      gap: 1.5rem; 
      align-items: center; 
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }
    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      flex: 1 1 200px;
    }
    .filter-group label { font-size: 0.775rem; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.04em; }
    .filter-group input, .filter-group select { 
      padding: 0.5rem 0.85rem; 
      border: 1px solid #cbd5e1; 
      border-radius: 6px; 
      font-size: 0.9rem; 
      font-weight: 600;
      color: #0f172a;
      background: #ffffff;
      width: 100%;
    }
    .pnl-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
    .pnl-card { background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 1.25rem; display: flex; flex-direction: column; }
    .pnl-card.income { border-left: 4px solid #10b981; }
    .pnl-card.expense { border-left: 4px solid #ef4444; }
    .pnl-card.net.profit { border-left: 4px solid #3b82f6; }
    .pnl-card.net.loss { border-left: 4px solid #dc2626; }
    .pnl-card.dues { border-left: 4px solid #f59e0b; }
    .pnl-card .label { font-size: 0.8rem; font-weight: 600; text-transform: uppercase; color: #64748b; }
    .pnl-card .value { font-size: 1.9rem; font-weight: 700; color: #0f172a; margin: 0.4rem 0; }
    .breakdown { display: flex; flex-direction: column; gap: 0.2rem; font-size: 0.8rem; color: #64748b; }
    .subtext { font-size: 0.8rem; color: #94a3b8; }
    .section-title h3 { margin: 0 0 1rem; font-size: 1.2rem; color: #0f172a; }
    .table-container { background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem; }
    th { background: #f8fafc; padding: 0.75rem 1rem; font-weight: 600; color: #475569; border-bottom: 1px solid #e2e8f0; }
    td { padding: 0.75rem 1rem; border-bottom: 1px solid #f1f5f9; color: #1e293b; }
    .code-badge { font-family: monospace; background: #f1f5f9; padding: 0.2rem 0.4rem; border-radius: 4px; font-size: 0.8rem; }
    .amount { font-weight: 700; }
    .amount.success { color: #16a34a; }
    .amount.danger { color: #dc2626; }
    .text-muted { color: #94a3b8; font-size: 0.8rem; }
    .empty-state { padding: 3rem; text-align: center; color: #94a3b8; font-weight: 500; }
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal { background: #fff; padding: 1.5rem; border-radius: 12px; width: 100%; max-width: 480px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
    .modal h3 { margin: 0 0 0.5rem; font-size: 1.25rem; }
    .modal form { display: flex; flex-direction: column; gap: 0.75rem; margin-top: 1rem; }
    .modal label { font-size: 0.8rem; font-weight: 600; color: #475569; }
    .modal input, .modal select, .modal textarea { padding: 0.55rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.9rem; font-family: inherit; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1rem; }
    @media (max-width: 1024px) {
      .filter-card { gap: 1rem; }
      .filter-group { flex: 1 1 180px; }
    }
    @media (max-width: 640px) {
      .reports-container { padding: 1rem 0.5rem; }
      .filter-card { flex-direction: column; align-items: stretch; padding: 1rem; }
      .filter-group { width: 100%; flex: 1 1 auto; }
      .pnl-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class ReportsComponent implements OnInit {
  selectedMonth: string = new Date().toISOString().substring(0, 7);
  selectedBranchId: string = '';
  branches: Branch[] = [];
  closings: MonthlyClosing[] = [];
  plReport: FinancialProfitLoss | null = null;

  showClosingModal = false;
  closingForm = {
    branchId: '',
    closingMonth: new Date().toISOString().substring(0, 7),
    closedBy: 'Owner',
    notes: ''
  };

  constructor(private api: PgApiService, private auth: AuthService, private toast: ToastService) {}

  ngOnInit(): void {
    const owner = this.auth.currentUserValue;
    if (!owner) return;

    this.api.getBranches(owner.ownerId).subscribe(b => {
      this.branches = b;
      if (b.length > 0) this.closingForm.branchId = b[0].branchId;
    });

    this.loadPLReport();
    this.loadClosings();
  }

  onFilterChange(): void {
    this.loadPLReport();
    this.loadClosings();
  }

  loadPLReport(): void {
    const owner = this.auth.currentUserValue;
    if (!owner) return;

    this.api.getMonthlyPL(owner.ownerId, this.selectedBranchId || null, this.selectedMonth).subscribe({
      next: res => this.plReport = res,
      error: () => this.toast.error('Failed to load P&L statement.')
    });
  }

  loadClosings(): void {
    const owner = this.auth.currentUserValue;
    if (!owner) return;

    this.api.getClosingHistory(owner.ownerId, this.selectedBranchId || null).subscribe({
      next: res => this.closings = res,
      error: () => this.toast.error('Failed to load closing history.')
    });
  }

  submitClosing(): void {
    const owner = this.auth.currentUserValue;
    if (!owner) return;

    const payload = { ...this.closingForm, ownerId: owner.ownerId };
    this.api.closeMonth(payload).subscribe({
      next: () => {
        this.showClosingModal = false;
        this.loadClosings();
        this.toast.success(`Month ${this.closingForm.closingMonth} closed successfully!`);
      },
      error: (err) => this.toast.error(err?.error?.message || 'Failed to close month.')
    });
  }
}
