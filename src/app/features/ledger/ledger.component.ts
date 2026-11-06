import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PgApiService } from '../../core/services/pg-api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { TenantCharge, TenantPayment, Branch, Guest } from '../../models/pg.models';
import { InrCurrencyPipe } from '../../shared/pipes/inr-currency.pipe';

@Component({
  selector: 'app-ledger',
  standalone: true,
  imports: [CommonModule, FormsModule, InrCurrencyPipe],
  template: `
    <div class="ledger-container">
      <header class="page-header">
        <div>
          <h2>Rent & Collections Ledger</h2>
          <p class="subtitle">UC-03: Recurring rent charges, partial payments, receipts, and tenant balances.</p>
        </div>
        <div class="actions">
          <button class="btn btn-email" (click)="sendRentRemindersEmail()" [disabled]="sendingReminders">
            <span>✉️</span> {{ sendingReminders ? 'Sending...' : 'Email Reminders (1st–5th)' }}
          </button>
          <button class="btn btn-whatsapp" (click)="sendRentReminders()" [disabled]="sendingReminders">
            <span>💬</span> WhatsApp Reminders
          </button>
          <button class="btn btn-secondary" (click)="openChargeModal()">+ Add Charge</button>
          <button class="btn btn-primary" (click)="openPaymentModal()">Record Payment</button>
        </div>
      </header>

      <!-- KPI Summary -->
      <div class="kpi-grid">
        <div class="kpi-card danger">
          <span class="label">Total Pending Dues</span>
          <span class="value">{{ totalPendingDues | inrCurrency }}</span>
          <span class="subtext">{{ pendingCharges.length }} overdue / unpaid items</span>
        </div>
        <div class="kpi-card success">
          <span class="label">Total Collections Tracked</span>
          <span class="value">{{ totalCollected | inrCurrency }}</span>
          <span class="subtext">{{ recentPayments.length }} payments recorded</span>
        </div>
      </div>

      <!-- Tab selection -->
      <div class="tabs">
        <button [class.active]="activeTab === 'dues'" (click)="activeTab = 'dues'">Pending Dues ({{ pendingCharges.length }})</button>
        <button [class.active]="activeTab === 'payments'" (click)="activeTab = 'payments'">Payment Receipts ({{ recentPayments.length }})</button>
      </div>

      <!-- Dues Table -->
      <div class="table-container" *ngIf="activeTab === 'dues'">
        <table *ngIf="pendingCharges.length > 0; else noDues">
          <thead>
            <tr>
              <th>Charge Code</th>
              <th>Tenant</th>
              <th>Branch / Bed</th>
              <th>Charge Type</th>
              <th>Billing Month</th>
              <th>Due Date</th>
              <th>Amount</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let c of pendingCharges">
              <td><span class="code-badge">{{ c.chargeCode }}</span></td>
              <td><strong>{{ c.guestName }}</strong></td>
              <td>{{ c.branchName || 'Property' }} • Room {{ c.roomNumber }} / Bed {{ c.bedNumber }}</td>
              <td><span class="badge info">{{ c.chargeType }}</span></td>
              <td>{{ c.billingMonth }}</td>
              <td>{{ c.dueDate | date:'mediumDate' }}</td>
              <td class="amount danger">{{ c.amount | inrCurrency }}</td>
              <td>
                <button class="btn btn-sm btn-primary" (click)="quickPay(c)">Pay</button>
              </td>
            </tr>
          </tbody>
        </table>
        <ng-template #noDues>
          <div class="empty-state">No pending dues! All tenant accounts are settled.</div>
        </ng-template>
      </div>

      <!-- Payments Table -->
      <div class="table-container" *ngIf="activeTab === 'payments'">
        <table *ngIf="recentPayments.length > 0; else noPayments">
          <thead>
            <tr>
              <th>Receipt / Pay Code</th>
              <th>Tenant</th>
              <th>Date</th>
              <th>Mode</th>
              <th>Transaction Ref</th>
              <th>Received By</th>
              <th>Amount Paid</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of recentPayments">
              <td><span class="code-badge">{{ p.paymentCode }}</span></td>
              <td><strong>{{ p.guestName }}</strong></td>
              <td>{{ p.paymentDate | date:'medium' }}</td>
              <td><span class="badge success">{{ p.paymentMode }}</span></td>
              <td><code>{{ p.transactionReference || 'N/A' }}</code></td>
              <td>{{ p.receivedBy || 'Staff' }}</td>
              <td class="amount success">+ {{ p.amountPaid | inrCurrency }}</td>
            </tr>
          </tbody>
        </table>
        <ng-template #noPayments>
          <div class="empty-state">No payment receipts logged yet.</div>
        </ng-template>
      </div>

      <!-- Add Charge Modal -->
      <div class="modal-backdrop" *ngIf="showChargeModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Create Tenant Charge</h3>
            <button class="close-btn" (click)="showChargeModal = false">✕</button>
          </div>
          <form (ngSubmit)="submitCharge()" class="modal-form">
            <div class="modal-body">
              <div class="form-group">
                <label>Select Tenant *</label>
                <select [(ngModel)]="newCharge.guestId" name="guestId" required (change)="onTenantSelected(newCharge.guestId)">
                  <option value="">-- Select Guest --</option>
                  <option *ngFor="let g of guests" [value]="g.guestId">{{ g.fullName }} ({{ g.guestCode }})</option>
                </select>
              </div>

              <div class="form-group">
                <label>Charge Type *</label>
                <select [(ngModel)]="newCharge.chargeType" name="chargeType" required>
                  <option value="Rent">Rent</option>
                  <option value="Electricity">Electricity</option>
                  <option value="Food">Food / Mess</option>
                  <option value="Laundry">Laundry</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Deposit">Deposit</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div class="form-group">
                <label>Billing Month (YYYY-MM) *</label>
                <input type="text" [(ngModel)]="newCharge.billingMonth" name="billingMonth" placeholder="e.g. 2026-10" required />
              </div>

              <div class="form-group">
                <label>Amount (₹) *</label>
                <input type="number" [(ngModel)]="newCharge.amount" name="amount" min="1" required />
              </div>

              <div class="form-group">
                <label>Due Date *</label>
                <input type="date" [(ngModel)]="newCharge.dueDate" name="dueDate" required />
              </div>

              <div class="form-group">
                <label>Description / Notes</label>
                <input type="text" [(ngModel)]="newCharge.description" name="description" placeholder="e.g. October monthly rent" />
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showChargeModal = false">Cancel</button>
              <button type="submit" class="btn btn-primary">Create Charge</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Record Payment Modal -->
      <div class="modal-backdrop" *ngIf="showPaymentModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Record Tenant Payment</h3>
            <button class="close-btn" (click)="showPaymentModal = false">✕</button>
          </div>
          <form (ngSubmit)="submitPayment()" class="modal-form">
            <div class="modal-body">
              <div class="form-group">
                <label>Select Tenant *</label>
                <select [(ngModel)]="newPayment.guestId" name="guestId" required (change)="onTenantSelectedForPayment(newPayment.guestId)">
                  <option value="">-- Select Guest --</option>
                  <option *ngFor="let g of guests" [value]="g.guestId">{{ g.fullName }} ({{ g.guestCode }})</option>
                </select>
              </div>

              <div class="form-group">
                <label>Amount Paid (₹) *</label>
                <input type="number" [(ngModel)]="newPayment.amountPaid" name="amountPaid" min="1" required />
              </div>

              <div class="form-group">
                <label>Payment Mode *</label>
                <select [(ngModel)]="newPayment.paymentMode" name="paymentMode" required>
                  <option value="UPI">UPI / QR Code</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                  <option value="Online">Online Gateway</option>
                </select>
              </div>

              <div class="form-group">
                <label>Transaction ID / UPI Ref</label>
                <input type="text" [(ngModel)]="newPayment.transactionReference" name="transactionReference" placeholder="e.g. UPI-984210" />
              </div>

              <div class="form-group">
                <label>Received By</label>
                <input type="text" [(ngModel)]="newPayment.receivedBy" name="receivedBy" placeholder="Staff or Manager name" />
              </div>

              <div class="form-group">
                <label>Receipt Notes</label>
                <input type="text" [(ngModel)]="newPayment.receiptNotes" name="receiptNotes" placeholder="Remarks" />
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showPaymentModal = false">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Receipt</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ledger-container { padding: 1.5rem; max-width: 1400px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .page-header h2 { margin: 0; font-size: 1.6rem; color: #0f172a; }
    .subtitle { margin: 0.2rem 0 0; color: #64748b; font-size: 0.9rem; }
    .actions { display: flex; gap: 0.75rem; }
    .btn { padding: 0.6rem 1.2rem; border-radius: 8px; font-weight: 600; cursor: pointer; border: none; font-size: 0.9rem; }
    .btn-primary { background: #2563eb; color: #fff; }
    .btn-secondary { background: #e2e8f0; color: #1e293b; }
    .btn-sm { padding: 0.35rem 0.75rem; font-size: 0.8rem; }
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
    .kpi-card { background: #fff; border-radius: 12px; padding: 1.25rem; border: 1px solid #e2e8f0; display: flex; flex-direction: column; }
    .kpi-card.danger { border-left: 4px solid #ef4444; }
    .kpi-card.success { border-left: 4px solid #10b981; }
    .kpi-card .label { font-size: 0.85rem; color: #64748b; text-transform: uppercase; font-weight: 600; }
    .kpi-card .value { font-size: 1.8rem; font-weight: 700; color: #0f172a; margin: 0.4rem 0; }
    .kpi-card .subtext { font-size: 0.8rem; color: #94a3b8; }
    .tabs { display: flex; gap: 0.5rem; border-bottom: 2px solid #e2e8f0; margin-bottom: 1rem; }
    .tabs button { background: none; border: none; padding: 0.6rem 1.2rem; font-weight: 600; color: #64748b; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -2px; }
    .tabs button.active { color: #2563eb; border-bottom-color: #2563eb; }
    .table-container { background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem; }
    th { background: #f8fafc; padding: 0.75rem 1rem; font-weight: 600; color: #475569; border-bottom: 1px solid #e2e8f0; }
    td { padding: 0.75rem 1rem; border-bottom: 1px solid #f1f5f9; color: #1e293b; }
    .code-badge { font-family: monospace; background: #f1f5f9; padding: 0.2rem 0.4rem; border-radius: 4px; font-weight: 600; font-size: 0.8rem; color: #334155; }
    .badge { padding: 0.2rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
    .badge.info { background: #e0f2fe; color: #0369a1; }
    .badge.success { background: #dcfce7; color: #15803d; }
    .amount { font-weight: 700; }
    .amount.danger { color: #dc2626; }
    .amount.success { color: #16a34a; }
    .empty-state { padding: 3rem; text-align: center; color: #94a3b8; font-weight: 500; }
    .modal-form { display: flex; flex-direction: column; flex: 1 1 auto; min-height: 0; overflow: hidden; }
    .btn-email { background: #ea4335; color: #fff; display: inline-flex; align-items: center; gap: 0.4rem; }
    .btn-email:hover { background: #d93025; }
    .btn-whatsapp { background: #25D366; color: #fff; display: inline-flex; align-items: center; gap: 0.4rem; }
    .btn-whatsapp:hover { background: #20ba5a; }
  `]
})
export class LedgerComponent implements OnInit {
  activeTab: 'dues' | 'payments' = 'dues';
  pendingCharges: TenantCharge[] = [];
  recentPayments: TenantPayment[] = [];
  guests: Guest[] = [];
  branches: Branch[] = [];

  totalPendingDues: number = 0;
  totalCollected: number = 0;
  sendingReminders: boolean = false;

  showChargeModal = false;
  showPaymentModal = false;

  newCharge = {
    guestId: '',
    branchId: '',
    chargeType: 'Rent',
    billingMonth: new Date().toISOString().substring(0, 7),
    amount: 0,
    dueDate: new Date().toISOString().substring(0, 10),
    description: ''
  };

  newPayment = {
    chargeId: '',
    guestId: '',
    branchId: '',
    amountPaid: 0,
    paymentMode: 'UPI',
    transactionReference: '',
    receivedBy: 'Manager',
    receiptNotes: ''
  };

  constructor(
    private api: PgApiService,
    private auth: AuthService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  sendRentReminders(force: boolean = false): void {
    const owner = this.auth.currentUserValue;
    if (!owner) return;

    this.sendingReminders = true;
    this.api.sendWhatsAppDueReminders(owner.ownerId, null, force).subscribe({
      next: (res: any) => {
        this.sendingReminders = false;
        if (res.remindersSent > 0) {
          this.toast.success(`Dispatched ${res.remindersSent} WhatsApp rent reminders!`, 'WhatsApp Reminders Sent');
        } else {
          this.toast.info(res.message || 'No due reminders were dispatched.', 'WhatsApp Service');
        }
      },
      error: (err) => {
        this.sendingReminders = false;
        this.toast.error(err.error?.message || 'Failed to dispatch WhatsApp reminders.', 'Error');
      }
    });
  }

  sendRentRemindersEmail(force: boolean = false): void {
    const owner = this.auth.currentUserValue;
    if (!owner) return;

    this.sendingReminders = true;
    this.api.sendEmailDueReminders(owner.ownerId, null, force).subscribe({
      next: (res: any) => {
        this.sendingReminders = false;
        if (res.remindersSent > 0) {
          this.toast.success(`Dispatched ${res.remindersSent} Email rent reminders!`, 'Gmail Reminders Sent');
        } else {
          this.toast.info(res.message || 'No due reminders were dispatched.', 'Gmail Service');
        }
      },
      error: (err) => {
        this.sendingReminders = false;
        this.toast.error(err.error?.message || 'Failed to dispatch Email reminders.', 'Error');
      }
    });
  }

  loadData(): void {
    const owner = this.auth.currentUserValue;
    if (!owner) return;

    this.api.getPendingDues(owner.ownerId).subscribe(charges => {
      this.pendingCharges = charges;
      this.totalPendingDues = charges.reduce((acc, c) => acc + c.amount, 0);
    });

    this.api.getRecentPayments(owner.ownerId).subscribe(payments => {
      this.recentPayments = payments;
      this.totalCollected = payments.reduce((acc, p) => acc + p.amountPaid, 0);
    });

    this.api.getGuests(owner.ownerId).subscribe(g => this.guests = g);
    this.api.getBranches(owner.ownerId).subscribe(b => this.branches = b);
  }

  openChargeModal(): void {
    this.showChargeModal = true;
  }

  openPaymentModal(): void {
    this.showPaymentModal = true;
  }

  onTenantSelected(guestId: string): void {
    const g = this.guests.find(x => x.guestId === guestId);
    if (g) {
      this.newCharge.branchId = g.branchId;
      this.newCharge.amount = g.monthlyRent || 0;
    }
  }

  onTenantSelectedForPayment(guestId: string): void {
    const g = this.guests.find(x => x.guestId === guestId);
    if (g) {
      this.newPayment.branchId = g.branchId;
      const charge = this.pendingCharges.find(c => c.guestId === guestId);
      if (charge) {
        this.newPayment.chargeId = charge.chargeId;
        this.newPayment.amountPaid = charge.amount;
      }
    }
  }

  quickPay(charge: TenantCharge): void {
    this.newPayment.chargeId = charge.chargeId;
    this.newPayment.guestId = charge.guestId;
    this.newPayment.branchId = charge.branchId;
    this.newPayment.amountPaid = charge.amount;
    this.showPaymentModal = true;
  }

  submitCharge(): void {
    const owner = this.auth.currentUserValue;
    if (!owner) return;

    const payload = { ...this.newCharge, ownerId: owner.ownerId };
    this.api.addCharge(payload).subscribe(() => {
      this.showChargeModal = false;
      this.loadData();
    });
  }

  submitPayment(): void {
    const owner = this.auth.currentUserValue;
    if (!owner) return;

    const payload = { ...this.newPayment, ownerId: owner.ownerId };
    this.api.recordPayment(payload).subscribe(() => {
      this.showPaymentModal = false;
      this.loadData();
    });
  }
}
