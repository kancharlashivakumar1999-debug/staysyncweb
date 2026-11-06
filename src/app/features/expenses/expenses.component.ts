import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PgApiService } from '../../core/services/pg-api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ComponentCanDeactivate } from '../../core/guards/pending-changes.guard';
import { Expense, ExpenseSummary, Branch } from '../../models/pg.models';
import { InrCurrencyPipe } from '../../shared/pipes/inr-currency.pipe';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [CommonModule, FormsModule, InrCurrencyPipe],
  template: `
    <div class="expenses-container">
      <header class="page-header">
        <div>
          <h2>Property Operating Expenses</h2>
          <p class="subtitle">UC-04: Utilities, maintenance, staff salary, mess supplies, and vendor payouts.</p>
        </div>
        <button class="btn btn-primary" (click)="showModal = true">+ Record Expense</button>
      </header>

      <!-- KPI Summary -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <span class="label">Total Monthly Expenses</span>
          <span class="value">{{ summary.totalExpenses | inrCurrency }}</span>
          <span class="subtext">{{ expenses.length }} transactions recorded</span>
        </div>
        <div class="category-pills">
          <span class="cat-pill" *ngFor="let item of summary.byCategory | keyvalue">
            {{ item.key }}: <strong>{{ item.value | inrCurrency }}</strong>
          </span>
        </div>
      </div>

      <!-- Expense List Table -->
      <div class="table-container">
        <table *ngIf="expenses.length > 0; else noExpenses">
          <thead>
            <tr>
              <th>Code</th>
              <th>Date</th>
              <th>Property</th>
              <th>Category</th>
              <th>Title / Description</th>
              <th>Vendor</th>
              <th>Mode</th>
              <th>Amount</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let e of expenses">
              <td><span class="code-badge">{{ e.expenseCode }}</span></td>
              <td>{{ e.expenseDate | date:'mediumDate' }}</td>
              <td>{{ e.branchName || 'Property' }}</td>
              <td><span class="badge category">{{ e.category }}</span></td>
              <td>
                <strong>{{ e.title }}</strong>
                <div class="notes" *ngIf="e.notes">{{ e.notes }}</div>
              </td>
              <td>{{ e.vendorName || '-' }}</td>
              <td><span class="badge mode">{{ e.paymentMode }}</span></td>
              <td class="amount danger">- {{ e.amount | inrCurrency }}</td>
              <td>
                <button class="btn btn-sm btn-danger" (click)="deleteExpense(e.expenseId)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
        <ng-template #noExpenses>
          <div class="empty-state">No expenses logged for this period.</div>
        </ng-template>
      </div>

      <!-- Add Expense Modal -->
      <div class="modal-backdrop" *ngIf="showModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Record Property Expense</h3>
            <button class="close-btn" (click)="showModal = false">✕</button>
          </div>
          <form (ngSubmit)="submitExpense()" class="modal-form">
            <div class="modal-body">
              <div class="form-group">
                <label>Select Property / Branch *</label>
                <select [(ngModel)]="newExpense.branchId" name="branchId" required>
                  <option value="">-- Choose Branch --</option>
                  <option *ngFor="let b of branches" [value]="b.branchId">{{ b.branchName }} ({{ b.branchCode }})</option>
                </select>
              </div>

              <div class="form-group">
                <label>Expense Category *</label>
                <select [(ngModel)]="newExpense.category" name="category" required>
                  <option value="Utilities">Utilities (Electricity / Water)</option>
                  <option value="Maintenance">Maintenance & Repairs</option>
                  <option value="Food Supplies">Food & Mess Supplies</option>
                  <option value="Staff Salary">Staff Salary / Wages</option>
                  <option value="Internet">Internet / WiFi</option>
                  <option value="Cleaning">Cleaning & Housekeeping</option>
                  <option value="Other">Other Expenses</option>
                </select>
              </div>

              <div class="form-group">
                <label>Expense Title / Description *</label>
                <input type="text" [(ngModel)]="newExpense.title" name="title" placeholder="e.g. EB Bill - October 2026" required />
              </div>

              <div class="form-group">
                <label>Amount (₹) *</label>
                <input type="number" [(ngModel)]="newExpense.amount" name="amount" min="1" required />
              </div>

              <div class="form-group">
                <label>Expense Date *</label>
                <input type="date" [(ngModel)]="newExpense.expenseDate" name="expenseDate" required />
              </div>

              <div class="form-group">
                <label>Vendor / Supplier Name</label>
                <input type="text" [(ngModel)]="newExpense.vendorName" name="vendorName" placeholder="e.g. State Electricity Board / Metro Cash" />
              </div>

              <div class="form-group">
                <label>Payment Mode *</label>
                <select [(ngModel)]="newExpense.paymentMode" name="paymentMode" required>
                  <option value="UPI">UPI / QR Code</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>

              <div class="form-group">
                <label>Notes / Remarks</label>
                <input type="text" [(ngModel)]="newExpense.notes" name="notes" placeholder="Optional notes" />
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showModal = false">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Expense</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .expenses-container { padding: 1.5rem; max-width: 1400px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .page-header h2 { margin: 0; font-size: 1.6rem; color: #0f172a; }
    .subtitle { margin: 0.2rem 0 0; color: #64748b; font-size: 0.9rem; }
    .btn { padding: 0.6rem 1.2rem; border-radius: 8px; font-weight: 600; cursor: pointer; border: none; font-size: 0.9rem; }
    .btn-primary { background: #2563eb; color: #fff; }
    .btn-secondary { background: #e2e8f0; color: #1e293b; }
    .btn-danger { background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; }
    .btn-sm { padding: 0.35rem 0.75rem; font-size: 0.8rem; }
    .kpi-grid { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem; }
    .kpi-card { background: #fff; border-radius: 12px; padding: 1.25rem; border: 1px solid #e2e8f0; border-left: 4px solid #f97316; }
    .kpi-card .label { font-size: 0.85rem; color: #64748b; text-transform: uppercase; font-weight: 600; }
    .kpi-card .value { font-size: 2rem; font-weight: 700; color: #0f172a; margin: 0.4rem 0; }
    .kpi-card .subtext { font-size: 0.8rem; color: #94a3b8; }
    .category-pills { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .cat-pill { background: #fff; border: 1px solid #e2e8f0; padding: 0.4rem 0.8rem; border-radius: 20px; font-size: 0.85rem; color: #475569; }
    .table-container { background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem; }
    th { background: #f8fafc; padding: 0.75rem 1rem; font-weight: 600; color: #475569; border-bottom: 1px solid #e2e8f0; }
    td { padding: 0.75rem 1rem; border-bottom: 1px solid #f1f5f9; color: #1e293b; }
    .code-badge { font-family: monospace; background: #f1f5f9; padding: 0.2rem 0.4rem; border-radius: 4px; font-weight: 600; font-size: 0.8rem; }
    .badge { padding: 0.2rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
    .badge.category { background: #fed7aa; color: #c2410c; }
    .badge.mode { background: #f1f5f9; color: #475569; }
    .notes { font-size: 0.75rem; color: #94a3b8; margin-top: 0.2rem; }
    .amount { font-weight: 700; }
    .amount.danger { color: #dc2626; }
    .empty-state { padding: 3rem; text-align: center; color: #94a3b8; font-weight: 500; }
    .modal-form { display: flex; flex-direction: column; flex: 1 1 auto; min-height: 0; overflow: hidden; }
  `]
})
export class ExpensesComponent implements OnInit, ComponentCanDeactivate {
  expenses: Expense[] = [];
  branches: Branch[] = [];
  summary: ExpenseSummary = { totalExpenses: 0, byCategory: {} };
  showModal = false;

  newExpense = {
    branchId: '',
    category: 'Utilities',
    title: '',
    amount: 0,
    expenseDate: new Date().toISOString().substring(0, 10),
    vendorName: '',
    paymentMode: 'UPI',
    notes: ''
  };

  constructor(private api: PgApiService, private auth: AuthService, private toast: ToastService) {}

  ngOnInit(): void {
    this.loadData();
  }

  canDeactivate(): boolean {
    if (this.showModal) {
      const isDirty = this.newExpense.amount > 0 || 
                      !!this.newExpense.title.trim() || 
                      !!this.newExpense.vendorName.trim();
      return !isDirty;
    }
    return true;
  }

  loadData(): void {
    const owner = this.auth.currentUserValue;
    if (!owner) return;

    this.api.getExpenses(owner.ownerId).subscribe({
      next: e => this.expenses = e,
      error: () => this.toast.error('Failed to load expenses.')
    });
    this.api.getExpenseSummary(owner.ownerId).subscribe({
      next: s => this.summary = s,
      error: () => {}
    });
    this.api.getBranches(owner.ownerId).subscribe(b => {
      this.branches = b;
      if (b.length > 0 && !this.newExpense.branchId) {
        this.newExpense.branchId = b[0].branchId;
      }
    });
  }

  submitExpense(): void {
    const owner = this.auth.currentUserValue;
    if (!owner) return;

    if (!this.newExpense.title.trim() || this.newExpense.amount <= 0) {
      this.toast.warning('Please enter expense title and a valid amount.');
      return;
    }

    const payload = { ...this.newExpense, ownerId: owner.ownerId };
    this.api.createExpense(payload).subscribe({
      next: () => {
        this.showModal = false;
        this.newExpense.title = '';
        this.newExpense.amount = 0;
        this.newExpense.vendorName = '';
        this.newExpense.notes = '';
        this.loadData();
        this.toast.success('Expense recorded successfully!');
      },
      error: (err) => this.toast.error(err?.error?.message || 'Failed to record expense.')
    });
  }

  deleteExpense(expenseId: string): void {
    if (!confirm('Are you sure you want to delete this expense record?')) return;
    this.api.deleteExpense(expenseId).subscribe({
      next: () => {
        this.loadData();
        this.toast.success('Expense deleted.');
      },
      error: () => this.toast.error('Failed to delete expense.')
    });
  }
}
