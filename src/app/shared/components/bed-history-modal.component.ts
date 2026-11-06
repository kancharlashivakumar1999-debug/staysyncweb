import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PgApiService } from '../../core/services/pg-api.service';
import { BedLifetimeHistory, BedGuestStayHistory } from '../../models/pg.models';
import { InrCurrencyPipe } from '../pipes/inr-currency.pipe';

@Component({
  selector: 'app-bed-history-modal',
  standalone: true,
  imports: [CommonModule, InrCurrencyPipe],
  template: `
    <div class="modal-backdrop" *ngIf="show">
      <div class="modal-content bed-history-modal">
        <div class="modal-header">
          <div class="header-titles">
            <div class="title-top">
              <span class="bed-tag">Bed</span>
              <h3>Bed {{ history?.bedNumber }} Lifetime History & Collections</h3>
            </div>
            <p class="subtitle">
              🏢 {{ history?.branchName }} • 🏬 {{ history?.floorName }} • 🚪 Room {{ history?.roomNumber }} ({{ history?.roomCode }})
            </p>
          </div>
          <button class="close-btn" (click)="close()">✕</button>
        </div>

        <div class="modal-body" *ngIf="loading">
          <div class="loading-box">
            <div class="spinner"></div>
            <p>Fetching bed history, guest records and lifetime rent collection...</p>
          </div>
        </div>

        <div class="modal-body" *ngIf="!loading && history">
          <!-- Summary Metrics Cards -->
          <div class="bed-summary-grid">
            <div class="summary-card highlight-emerald">
              <span class="card-label">Total Amount Collected Till Now</span>
              <div class="card-val text-emerald">{{ history.totalAmountCollectedTillNow | inrCurrency }}</div>
              <small class="card-sub text-muted">⚠️ Pure Rent & Dues Only (Excludes Security Advances)</small>
            </div>

            <div class="summary-card">
              <span class="card-label">Current Bed Status</span>
              <div class="status-wrap">
                <span class="badge" [class.badge-danger]="history.isOccupied" [class.badge-success]="!history.isOccupied">
                  {{ history.isOccupied ? '🔴 Occupied' : '🟢 Available' }}
                </span>
                <span class="rent-tag">{{ history.bedRent | inrCurrency }}<small>/mo</small></span>
              </div>
              <small class="card-sub" *ngIf="currentGuest">
                Resident: <strong>{{ currentGuest.fullName }}</strong> ({{ currentGuest.guestCode }})
              </small>
              <small class="card-sub" *ngIf="!currentGuest">No active resident right now.</small>
            </div>

            <div class="summary-card highlight-indigo">
              <span class="card-label">Occupancy Turnovers</span>
              <div class="card-val text-indigo">{{ history.totalGuestsStayed }}</div>
              <small class="card-sub">Total residents stayed across lifetime</small>
            </div>
          </div>

          <!-- Section 1: Guest Stay History (Current at Top, Descending Order) -->
          <div class="section-block">
            <div class="section-header">
              <h4>👥 Resident Stay History (Current Resident at Top • Descending)</h4>
              <span class="section-badge">{{ history.guestsHistory.length }} Records</span>
            </div>

            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Resident</th>
                    <th>Contact</th>
                    <th>Stay Period</th>
                    <th>Rent At Stay</th>
                    <th>Advance</th>
                    <th>Total Rent Collected</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let g of history.guestsHistory" [class.row-current]="g.isCurrentGuest">
                    <td>
                      <div class="guest-cell">
                        <strong>{{ g.fullName }}</strong>
                        <span class="guest-code">{{ g.guestCode }}</span>
                        <span class="current-pill" *ngIf="g.isCurrentGuest">Current Resident</span>
                      </div>
                    </td>
                    <td>{{ g.phoneNumber || 'N/A' }}</td>
                    <td>
                      <div class="dates-cell">
                        <span>From: {{ g.joiningDate | date:'mediumDate' }}</span>
                        <span class="vacate-date">
                          To: {{ g.vacatingDate ? (g.vacatingDate | date:'mediumDate') : 'Present' }}
                        </span>
                      </div>
                    </td>
                    <td>{{ g.monthlyRentAtStay | inrCurrency }}/mo</td>
                    <td>{{ g.advanceAmount | inrCurrency }}</td>
                    <td>
                      <strong class="text-emerald">{{ g.rentCollectedFromGuest | inrCurrency }}</strong>
                    </td>
                    <td>
                      <span class="badge" [class.badge-success]="g.status === 'Active'" [class.badge-warning]="g.status === 'Notice_Period'" [class.badge-danger]="g.status === 'Vacated'">
                        {{ g.status }}
                      </span>
                    </td>
                  </tr>
                  <tr *ngIf="history.guestsHistory.length === 0">
                    <td colspan="7" class="text-center text-muted">No resident stays recorded yet for this bed.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Section 2: Payment Receipt Log for this Bed -->
          <div class="section-block">
            <div class="section-header">
              <h4>🧾 Bed Payment Transaction Log (Pure Rent & Fees)</h4>
              <span class="section-badge">{{ history.paymentLogs.length }} Receipts</span>
            </div>

            <div class="table-responsive" *ngIf="history.paymentLogs.length > 0">
              <table class="data-table log-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Receipt Code</th>
                    <th>Resident</th>
                    <th>Amount Paid</th>
                    <th>Mode</th>
                    <th>Transaction / Ref</th>
                    <th>Received By</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let p of history.paymentLogs">
                    <td>{{ p.paymentDate | date:'mediumDate' }}</td>
                    <td><span class="code-pill">{{ p.paymentCode }}</span></td>
                    <td>{{ p.guestName }}</td>
                    <td><strong class="text-emerald">{{ p.amountPaid | inrCurrency }}</strong></td>
                    <td><span class="mode-pill">{{ p.paymentMode }}</span></td>
                    <td>{{ p.transactionReference || '—' }}</td>
                    <td>{{ p.receivedBy || 'Owner' }}</td>
                    <td class="text-notes">{{ p.receiptNotes || '—' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p *ngIf="history.paymentLogs.length === 0" class="text-muted text-center py-2">No payment transactions recorded for this bed yet.</p>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="close()">Close Window</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .bed-history-modal { max-width: 950px; width: 95%; max-height: 90vh; }
    .header-titles {
      .title-top {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        .bed-tag { background: #3b82f6; color: #ffffff; font-size: 0.75rem; font-weight: 800; padding: 0.2rem 0.5rem; border-radius: 4px; }
        h3 { margin: 0; font-size: 1.25rem; font-weight: 800; color: #0f172a; }
      }
      .subtitle { margin: 0.35rem 0 0 0; font-size: 0.85rem; color: #64748b; }
    }
    .bed-summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .summary-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 1rem 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      &.highlight-emerald { border-left: 4px solid #10b981; background: #ecfdf5; }
      &.highlight-indigo { border-left: 4px solid #6366f1; background: #eef2ff; }
      .card-label { font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
      .card-val { font-size: 1.6rem; font-weight: 800; line-height: 1.2; }
      .card-sub { font-size: 0.75rem; color: #475569; }
      .status-wrap { display: flex; align-items: center; gap: 0.75rem; margin: 0.2rem 0; }
      .rent-tag { font-weight: 800; font-size: 1.1rem; color: #0f172a; }
    }
    .section-block {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1.25rem;
      background: #ffffff;
      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.85rem;
        border-bottom: 1px dashed #e2e8f0;
        padding-bottom: 0.5rem;
        h4 { margin: 0; font-size: 0.95rem; font-weight: 800; color: #1e293b; }
        .section-badge { background: #f1f5f9; padding: 0.15rem 0.5rem; border-radius: 12px; font-size: 0.725rem; font-weight: 700; color: #475569; }
      }
    }
    .table-responsive { overflow-x: auto; }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.825rem;
      th { background: #f8fafc; padding: 0.6rem 0.75rem; text-align: left; font-weight: 700; color: #475569; border-bottom: 1px solid #e2e8f0; font-size: 0.75rem; text-transform: uppercase; }
      td { padding: 0.65rem 0.75rem; border-bottom: 1px solid #f1f5f9; color: #334155; }
      .row-current { background: #eff6ff; font-weight: 600; td { border-bottom-color: #bfdbfe; } }
      .guest-cell {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
        .guest-code { font-size: 0.7rem; color: #64748b; }
        .current-pill { font-size: 0.65rem; background: #2563eb; color: #ffffff; padding: 0.1rem 0.35rem; border-radius: 4px; display: inline-block; width: fit-content; font-weight: 700; margin-top: 0.15rem; }
      }
      .dates-cell { display: flex; flex-direction: column; gap: 0.15rem; font-size: 0.75rem; .vacate-date { color: #64748b; } }
      .code-pill { font-family: monospace; font-size: 0.75rem; background: #f1f5f9; padding: 0.15rem 0.4rem; border-radius: 4px; font-weight: 700; }
      .mode-pill { background: #e0e7ff; color: #3730a3; padding: 0.15rem 0.45rem; border-radius: 4px; font-size: 0.7rem; font-weight: 700; }
      .text-notes { font-size: 0.75rem; color: #64748b; max-width: 180px; }
    }
    .loading-box { text-align: center; padding: 3rem 1rem; color: #64748b; }
    .spinner { width: 36px; height: 36px; border: 3px solid #e2e8f0; border-top-color: #2563eb; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 1rem auto; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (max-width: 850px) {
      .bed-summary-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class BedHistoryModalComponent implements OnChanges {
  @Input() bedId: string | null = null;
  @Input() show: boolean = false;
  @Output() closeEvent = new EventEmitter<void>();

  loading = false;
  history: BedLifetimeHistory | null = null;

  constructor(private api: PgApiService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['show'] && this.show && this.bedId) {
      this.fetchBedHistory(this.bedId);
    }
  }

  fetchBedHistory(bedId: string): void {
    this.loading = true;
    this.history = null;
    this.api.getBedLifetimeHistory(bedId).subscribe({
      next: (data) => {
        this.history = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  get currentGuest() {
    return this.history?.guestsHistory.find(g => g.isCurrentGuest || g.status === 'Active');
  }

  close(): void {
    this.closeEvent.emit();
  }
}
