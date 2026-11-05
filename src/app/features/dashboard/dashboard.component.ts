import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PgApiService } from '../../core/services/pg-api.service';
import { AuthService } from '../../core/services/auth.service';
import { DashboardSummary, Branch, Guest, Owner, Floor, Room, Bed, TenantLedgerSummary, TenantPayment } from '../../models/pg.models';
import { InrCurrencyPipe } from '../../shared/pipes/inr-currency.pipe';
import { BedHistoryModalComponent } from '../../shared/components/bed-history-modal.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, InrCurrencyPipe, BedHistoryModalComponent],
  template: `
    <div class="dashboard-wrapper fade-in">
      <div class="view-header">
        <div>
          <h2>Property Executive Overview</h2>
          <p class="subtitle">Live multi-property occupancy, revenue capacity & payment collection</p>
        </div>
        <div class="header-buttons">
          <button class="btn btn-record-payment" (click)="openPaymentMatrixModal()">
            💳 Record Payment
          </button>
          <a routerLink="/branches" class="btn btn-secondary">+ Add Branch</a>
          <a routerLink="/guests" class="btn btn-primary">+ Register Resident</a>
        </div>
      </div>

      <!-- Property Selector Bar -->
      <div class="property-selector-card">
        <div class="selector-left">
          <span class="selector-icon">🏢</span>
          <div>
            <label class="selector-label">ACTIVE PROPERTY FILTER</label>
            <select [(ngModel)]="selectedBranchId" (change)="onPropertyChange()" class="property-dropdown">
              <option value="">All Managed Properties (Consolidated View)</option>
              <option *ngFor="let b of branches" [value]="b.branchId">
                {{ b.branchName }} ({{ b.branchCode }}) — {{ b.city }}
              </option>
            </select>
          </div>
        </div>
        <div class="selector-right">
          <div class="quota-pill">
            <span class="quota-label">Property Limit:</span>
            <strong>{{ branches.length }} / {{ currentOwner?.expectedBranches || 1 }} Active</strong>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading real-time property metrics...</p>
      </div>

      <!-- Authenticated Real-Time Dashboard View -->
      <div *ngIf="!loading && summary" class="dashboard-grid-container">
        <!-- KPI Grid -->
        <div class="kpi-grid">
          <div class="kpi-card highlight-blue">
            <div class="kpi-header">
              <span class="kpi-title">{{ selectedBranch ? 'Selected Property' : 'Total Properties' }}</span>
              <span class="kpi-icon">🏢</span>
            </div>
            <div class="kpi-value">{{ displayedBranchesCount }}</div>
            <div class="kpi-sub">{{ displayedFloorsCount }} Floors configured</div>
          </div>

          <div class="kpi-card highlight-green">
            <div class="kpi-header">
              <span class="kpi-title">Occupancy Rate</span>
              <span class="kpi-icon">🛏️</span>
            </div>
            <div class="kpi-value">
              {{ displayedTotalBeds > 0 ? ((displayedOccupiedBeds / displayedTotalBeds) * 100 | number:'1.0-0') : 0 }}%
            </div>
            <div class="kpi-sub">{{ displayedOccupiedBeds }} occupied / {{ displayedTotalBeds }} total beds</div>
          </div>

          <div class="kpi-card highlight-indigo">
            <div class="kpi-header">
              <span class="kpi-title">Active Residents</span>
              <span class="kpi-icon">👥</span>
            </div>
            <div class="kpi-value">{{ displayedResidentsCount }}</div>
            <div class="kpi-sub">{{ displayedAvailableBeds }} beds available right now</div>
          </div>

          <div class="kpi-card highlight-amber">
            <div class="kpi-header">
              <span class="kpi-title">Notice Period Alerts</span>
              <span class="kpi-icon">⚠️</span>
            </div>
            <div class="kpi-value">{{ displayedNoticeCount }}</div>
            <div class="kpi-sub">Vacating within 15-day reminder</div>
          </div>
        </div>

        <!-- Financial Capacity Banner -->
        <div class="finance-banner">
          <div class="finance-item">
            <span class="label">Monthly Rent Potential</span>
            <span class="amount">{{ displayedRevenuePotential | inrCurrency }}</span>
          </div>
          <div class="divider"></div>
          <div class="finance-item">
            <span class="label">Security Advance Held</span>
            <span class="amount text-emerald">{{ displayedAdvanceHeld | inrCurrency }}</span>
          </div>
        </div>

        <!-- Managed Branches Quick Cards -->
        <div class="content-card">
          <div class="card-header">
            <h3>{{ selectedBranch ? selectedBranch.branchName : 'Your Managed Properties' }} ({{ displayedBranches.length }})</h3>
            <div class="quick-card-actions">
              <button class="btn btn-sm btn-outline-payment" (click)="openPaymentMatrixModal()">💳 Direct Bed Payment</button>
              <a routerLink="/branches" class="btn btn-secondary btn-sm">Manage Floor Layouts →</a>
            </div>
          </div>
          <div class="branch-cards-grid">
            <div *ngFor="let branch of displayedBranches" class="branch-card">
              <div class="branch-card-header">
                <div>
                  <span class="branch-code">{{ branch.branchCode }}</span>
                  <h4>{{ branch.branchName }}</h4>
                  <p class="address">📍 {{ branch.addressLine }}, {{ branch.city }}</p>
                </div>
                <span class="floors-badge">{{ branch.totalFloors }} Floors</span>
              </div>
              <div class="branch-card-stats">
                <div>
                  <span class="stat-num">{{ getBranchRoomsCount(branch) }}</span>
                  <span class="stat-label">Rooms</span>
                </div>
                <div>
                  <span class="stat-num">{{ getBranchBedsCount(branch) }}</span>
                  <span class="stat-label">Beds</span>
                </div>
                <div>
                  <span class="stat-num text-emerald">{{ getBranchOccupiedCount(branch) }}</span>
                  <span class="stat-label">Occupied</span>
                </div>
              </div>
              <div class="branch-actions">
                <button class="btn btn-primary btn-sm w-full" (click)="openPaymentMatrixModal(branch.branchId)">
                  💳 Record Bed Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ==================================================================== -->
      <!-- MODAL 1: Floor & Room Matrix for Payment Collection                  -->
      <!-- ==================================================================== -->
      <div class="modal-backdrop" *ngIf="showMatrixModal">
        <div class="modal-content modal-content-large">
          <div class="modal-header">
            <div class="modal-header-text">
              <h3>Record Resident Payment — Select Bed</h3>
              <p class="modal-subtitle">Pick branch, floor and room to select an occupied resident's bed</p>
            </div>
            <button class="close-btn" (click)="showMatrixModal = false">✕</button>
          </div>
          <div class="modal-body">
            <!-- Search & Filters -->
            <div class="matrix-filter-bar">
              <div class="filter-group">
                <label>Branch Property:</label>
                <select [(ngModel)]="matrixBranchId" (change)="onMatrixBranchSelect()">
                  <option *ngFor="let b of branches" [value]="b.branchId">
                    {{ b.branchName }} ({{ b.branchCode }})
                  </option>
                </select>
              </div>
              <div class="filter-group flex-2">
                <label>Search Room or Bed:</label>
                <input type="text" [(ngModel)]="matrixSearchTerm" placeholder="Search by Room Number (e.g. 101) or Bed Code (e.g. BED-0001)..." />
              </div>
            </div>

            <!-- Floor Matrix View -->
            <div *ngIf="selectedMatrixBranch" class="matrix-floors-list">
              <div *ngFor="let floor of selectedMatrixBranch.floors" class="matrix-floor-card">
                <div class="matrix-floor-header">
                  <span class="floor-code-badge">{{ floor.floorCode }}</span>
                  <h4>{{ floor.floorName }}</h4>
                </div>

                <div class="matrix-rooms-grid">
                  <div *ngFor="let room of filterRooms(floor.rooms)" class="matrix-room-box">
                    <div class="matrix-room-top">
                      <strong>Room {{ room.roomNumber }} <span class="text-muted">({{ room.roomCode }})</span></strong>
                      <span class="badge badge-info">{{ room.roomType }}</span>
                    </div>

                    <div class="matrix-beds-container">
                      <div *ngFor="let bed of room.beds"
                           class="matrix-bed-pill"
                           [class.bed-occupied]="bed.isOccupied"
                           [class.bed-free]="!bed.isOccupied"
                           (click)="onBedClicked(bed, room, floor, selectedMatrixBranch)">
                        <div class="bed-pill-top">
                          <span class="bed-pill-num">{{ bed.bedNumber }}</span>
                          <span class="bed-pill-status">{{ bed.isOccupied ? 'Occupied' : 'Free' }}</span>
                        </div>
                        <div class="bed-pill-rent">{{ bed.bedRent | inrCurrency }}/mo</div>
                        <div class="bed-pill-actions">
                          <button *ngIf="bed.isOccupied" class="btn btn-record-bed-sm" (click)="$event.stopPropagation(); onBedClicked(bed, room, floor, selectedMatrixBranch)">
                            Pay 💳
                          </button>
                          <button class="btn btn-history-bed-sm" (click)="$event.stopPropagation(); openBedHistory(bed.bedId)" title="View Full Bed History">
                            History 📜
                          </button>
                        </div>
                        <span *ngIf="!bed.isOccupied" class="text-free-label">Unoccupied</span>
                      </div>
                    </div>
                  </div>

                  <div *ngIf="filterRooms(floor.rooms).length === 0" class="empty-rooms">
                    <p>No rooms matching search on this floor.</p>
                  </div>
                </div>
              </div>
            </div>

            <div *ngIf="!selectedMatrixBranch" class="empty-state">
              <p>No branch selected or branch has no floors configured.</p>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showMatrixModal = false">Close</button>
          </div>
        </div>
      </div>

      <!-- ==================================================================== -->
      <!-- MODAL 2: Bed Resident Payment Receipt & Prorated Calculation Form    -->
      <!-- ==================================================================== -->
      <div class="modal-backdrop" *ngIf="showPaymentModal">
        <div class="modal-content modal-content-payment">
          <div class="modal-header">
            <div class="modal-header-text">
              <h3>Record Resident Payment</h3>
              <p class="modal-subtitle">{{ activeBedInfo?.branchName }} • Room {{ activeBedInfo?.roomNumber }} • Bed {{ activeBedInfo?.bedNumber }} ({{ activeBedInfo?.bedCode }})</p>
            </div>
            <button class="close-btn" (click)="showPaymentModal = false">✕</button>
          </div>
          <div class="modal-body" *ngIf="loadingLedger">
            <div class="spinner"></div>
            <p class="text-center">Fetching resident details, prorated rent & advance balance...</p>
          </div>
          <div class="modal-body" *ngIf="!loadingLedger && activeLedger">
            <!-- Resident Profile Snapshot -->
            <div class="resident-summary-banner">
              <div class="resident-details">
                <span class="res-badge">{{ activeLedger.guestCode }}</span>
                <h4>{{ activeLedger.guestName }}</h4>
                <p>📞 {{ activeLedger.phoneNumber || 'N/A' }} • 🛏️ {{ activeLedger.roomBed }}</p>
                <p class="joining-line">📅 Joined on: <strong>{{ activeLedger.joiningDate | date:'mediumDate' }}</strong></p>
              </div>
              <div class="res-balances">
                <div class="balance-item">
                  <span class="lbl">Monthly Rent (30 Days)</span>
                  <span class="val">{{ (activeLedger.monthlyRent || activeBedInfo?.bedRent || 0) | inrCurrency }}</span>
                  <small class="rate-sub">₹{{ calculatedDailyRent }}/day</small>
                </div>
                <div class="balance-item">
                  <span class="lbl">Advance Required</span>
                  <span class="val text-blue">{{ (activeLedger.advanceAmount || 0) | inrCurrency }}</span>
                </div>
                <div class="balance-item">
                  <span class="lbl">Current Month Paid</span>
                  <span class="val text-emerald">{{ (activeLedger.currentMonthPaid || 0) | inrCurrency }}</span>
                </div>
                <div class="balance-item highlight-due">
                  <span class="lbl">Current Month Pending</span>
                  <span class="val text-danger">{{ (activeLedger.currentMonthPending || 0) | inrCurrency }}</span>
                </div>
              </div>
            </div>

            <!-- Month & Year Selection for which month we are paying -->
            <div class="month-selection-card">
              <div class="month-selection-header">
                <span>📅 Payment For Month & Year:</span>
                <span class="selected-month-badge">{{ formatMonthKey(paymentForm.paymentMonth) }}</span>
              </div>
              <div class="month-selection-row">
                <div class="form-group-compact">
                  <label>Select Month</label>
                  <select [ngModel]="selectedPaymentMonthNum" (ngModelChange)="onPaymentMonthOrYearChange($event, selectedPaymentYear)">
                    <option value="01">January</option>
                    <option value="02">February</option>
                    <option value="03">March</option>
                    <option value="04">April</option>
                    <option value="05">May</option>
                    <option value="06">June</option>
                    <option value="07">July</option>
                    <option value="08">August</option>
                    <option value="09">September</option>
                    <option value="10">October</option>
                    <option value="11">November</option>
                    <option value="12">December</option>
                  </select>
                </div>
                <div class="form-group-compact">
                  <label>Select Year</label>
                  <select [ngModel]="selectedPaymentYear" (ngModelChange)="onPaymentMonthOrYearChange(selectedPaymentMonthNum, $event)">
                    <option *ngFor="let yr of availablePaymentYears" [value]="yr">{{ yr }}</option>
                  </select>
                </div>
                <div class="month-status-pill" [class.already-paid]="isMonthAlreadyPaid">
                  <span *ngIf="isMonthAlreadyPaid">✅ Already Recorded: {{ getMonthPaidAmount(paymentForm.paymentMonth) | inrCurrency }} (Days Remaining: 0)</span>
                  <span *ngIf="!isMonthAlreadyPaid">⏳ No Payment for this month (Default Days: 30)</span>
                </div>
              </div>
            </div>

            <!-- Current Month Paid Transactions (if any exist for selected month) -->
            <div class="current-month-txns-card" *ngIf="selectedMonthPayments.length > 0">
              <div class="txns-header">
                <span>💳 Paid Transactions for {{ formatMonthKey(paymentForm.paymentMonth) }}:</span>
                <span class="txns-count">{{ selectedMonthPayments.length }} transaction(s)</span>
              </div>
              <div class="txns-list">
                <div class="txn-row" *ngFor="let p of selectedMonthPayments">
                  <span class="txn-code">{{ p.paymentCode }}</span>
                  <span class="txn-date">{{ p.paymentDate | date:'d MMM y, h:mm a' }}</span>
                  <span class="txn-mode">{{ p.paymentMode }}</span>
                  <strong class="txn-amount text-emerald">{{ p.amountPaid | inrCurrency }}</strong>
                </div>
              </div>
            </div>

            <!-- Dynamic 30-Days Calculation & Days Entry Box -->
            <div class="proration-formula-card">
              <div class="formula-header">
                <span>🗓️ Days-Based Calculation (₹{{ calculatedDailyRent }}/day):</span>
                <span class="formula-result">{{ calculatedExpectedRentForDays | inrCurrency }} (Rent) + {{ (activeLedger.advancePending || 0) | inrCurrency }} (Adv) = {{ calculatedSuggestedTotal | inrCurrency }}</span>
              </div>
              <div class="formula-details">
                Rate basis: {{ (activeLedger.monthlyRent || 0) | inrCurrency }} ÷ 30 days = <strong>₹{{ calculatedDailyRent }}/day</strong>.
                Formula: ({{ paymentForm.daysPaid || 0 }} days × ₹{{ calculatedDailyRent }}) + Pending Advance.
              </div>
              <div class="days-input-row">
                <label><strong>Days to Pay for {{ formatMonthKey(paymentForm.paymentMonth) }}:</strong></label>
                <input type="number" 
                       min="0" 
                       max="365" 
                       [(ngModel)]="paymentForm.daysPaid" 
                       (ngModelChange)="onDaysPaidChange()" 
                       class="days-input" />
                <span class="days-calc-preview">= {{ paymentForm.daysPaid }} × ₹{{ calculatedDailyRent }} = <strong>{{ calculatedExpectedRentForDays | inrCurrency }}</strong></span>
              </div>
            </div>

            <!-- Dues Breakdown Columns: Advance vs Room Rent -->
            <div class="dues-split-grid">
              <div class="dues-col advance-col">
                <div class="dues-title">Security Advance</div>
                <div class="dues-stat">
                  <span>Required:</span> <strong>{{ (activeLedger.advanceAmount || 0) | inrCurrency }}</strong>
                </div>
                <div class="dues-stat">
                  <span>Paid:</span> <strong class="text-emerald">{{ (activeLedger.advancePaid || 0) | inrCurrency }}</strong>
                </div>
                <div class="dues-stat due-highlight">
                  <span>Pending:</span> <strong [class.text-danger]="(activeLedger.advancePending || 0) > 0">{{ (activeLedger.advancePending || 0) | inrCurrency }}</strong>
                </div>
              </div>

              <div class="dues-col rent-col">
                <div class="dues-title">Current Month Room Rent</div>
                <div class="dues-stat">
                  <span>Calculated Rent:</span> <strong>{{ calculatedExpectedRentForDays | inrCurrency }}</strong>
                </div>
                <div class="dues-stat">
                  <span>Paid This Month:</span> <strong class="text-emerald">{{ (activeLedger.currentMonthPaid || 0) | inrCurrency }}</strong>
                </div>
                <div class="dues-stat due-highlight">
                  <span>Pending Balance:</span> <strong [class.text-danger]="(activeLedger.currentMonthPending || 0) > 0">{{ (activeLedger.currentMonthPending || 0) | inrCurrency }}</strong>
                </div>
              </div>
            </div>

            <!-- Payment Input Form -->
            <div class="payment-form">
              <div class="form-row-2">
                <div class="form-group">
                  <label>Amount to Pay Now (₹) *</label>
                  <input type="number" 
                         [(ngModel)]="paymentForm.amountPaid" 
                         (ngModelChange)="onPaymentAmountChange()" 
                         placeholder="e.g. 9000" />
                </div>
                <div class="form-group">
                  <label>Payment Mode *</label>
                  <select [(ngModel)]="paymentForm.paymentMode">
                    <option value="UPI">UPI / GPay / PhonePe</option>
                    <option value="Cash">Cash Handover</option>
                    <option value="Bank Transfer">Bank Transfer / IMPS</option>
                    <option value="Online">Online Portal</option>
                  </select>
                </div>
              </div>

              <!-- Live Waterfall Allocation Preview -->
              <div class="waterfall-preview-card">
                <div class="waterfall-header">
                  <strong>⚡ Live Payment Allocation Breakdown:</strong>
                  <span>Paying: <strong>{{ (paymentForm.amountPaid || 0) | inrCurrency }}</strong></span>
                </div>
                <div class="waterfall-row">
                  <span>1. Advance Covered First:</span>
                  <strong class="text-blue">+ {{ waterfallAdvanceCovered | inrCurrency }}</strong>
                  <small class="waterfall-sub">Remaining Advance Pending: {{ waterfallRemainingAdvancePending | inrCurrency }}</small>
                </div>
                <div class="waterfall-row">
                  <span>2. Remaining Applied to Room Rent:</span>
                  <strong class="text-emerald">+ {{ waterfallRentCovered | inrCurrency }}</strong>
                  <small class="waterfall-sub">Remaining Rent Pending: {{ waterfallRemainingRentPending | inrCurrency }}</small>
                </div>
                <div class="calc-divider"></div>
                <div class="waterfall-row total-pending-row">
                  <span>Pending in Current Month to carry forward:</span>
                  <strong [class.text-danger]="waterfallTotalRemainingPending > 0" [class.text-emerald]="waterfallTotalRemainingPending <= 0">
                    {{ waterfallTotalRemainingPending | inrCurrency }}
                  </strong>
                </div>
              </div>

              <div class="form-group">
                <label>Transaction / UTR Reference</label>
                <input type="text" [(ngModel)]="paymentForm.transactionReference" placeholder="e.g. UPI Ref: 32849182910" />
              </div>

              <div class="form-group">
                <label>Received By Staff / Owner</label>
                <input type="text" [(ngModel)]="paymentForm.receivedBy" placeholder="Staff or Owner Name" />
              </div>

              <div class="form-group">
                <label>Receipt Notes</label>
                <textarea [(ngModel)]="paymentForm.receiptNotes" rows="2" placeholder="e.g. Initial payment: Advance fully cleared, remaining applied to rent"></textarea>
              </div>
            </div>
          </div>

          <div class="modal-footer" *ngIf="!loadingLedger">
            <button class="btn btn-secondary" (click)="showPaymentModal = false">Cancel</button>
            <button class="btn btn-primary" (click)="submitPayment()" [disabled]="submittingPayment || (paymentForm.amountPaid || 0) <= 0">
              {{ submittingPayment ? 'Recording...' : 'Save & Record Payment' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Reusable Bed History Modal -->
      <app-bed-history-modal 
        [bedId]="selectedBedHistoryId" 
        [show]="showBedHistoryModal" 
        (closeEvent)="showBedHistoryModal = false">
      </app-bed-history-modal>
    </div>
  `,
  styles: [`
    .dashboard-wrapper { max-width: 1400px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.5rem; padding: 1.5rem; }
    .view-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }
    .view-header h2 { font-size: 1.6rem; font-weight: 800; color: #0f172a; margin: 0; }
    .subtitle { color: #64748b; font-size: 0.9rem; margin-top: 0.25rem; }
    .header-buttons { display: flex; gap: 0.75rem; align-items: center; }
    .btn { padding: 0.6rem 1.25rem; border-radius: 8px; font-weight: 600; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; font-size: 0.9rem; cursor: pointer; border: none; }
    .btn-primary { background: #2563eb; color: #ffffff; }
    .btn-secondary { background: #ffffff; color: #334155; border: 1px solid #cbd5e1; }
    .btn-outline { background: #f8fafc; color: #2563eb; border: 1px solid #bfdbfe; font-weight: 600; }
    .btn-sm { padding: 0.35rem 0.75rem; font-size: 0.8rem; }
    .w-full { width: 100%; }

    .btn-record-payment {
      background: linear-gradient(135deg, #059669 0%, #10b981 100%);
      color: #ffffff;
      font-weight: 700;
      box-shadow: 0 2px 6px rgba(16, 185, 129, 0.3);
      &:hover { background: #047857; }
    }
    .btn-outline-payment {
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
      font-weight: 700;
      cursor: pointer;
      &:hover { background: #d1fae5; }
    }

    .property-selector-card {
      background: #ffffff;
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: 12px;
      padding: 0.85rem 1.25rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    .selector-left {
      display: flex;
      align-items: center;
      gap: 1rem;
      .selector-icon { font-size: 1.75rem; }
      .selector-label { display: block; font-size: 0.7rem; font-weight: 800; color: #64748b; letter-spacing: 0.05em; margin-bottom: 0.2rem; }
      .property-dropdown {
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        padding: 0.45rem 0.85rem;
        font-weight: 600;
        font-size: 0.925rem;
        color: #0f172a;
        min-width: 320px;
        background: #f8fafc;
        &:focus { outline: none; border-color: #2563eb; }
      }
    }
    .selector-right {
      .quota-pill {
        background: #f1f5f9;
        border: 1px solid #e2e8f0;
        padding: 0.35rem 0.85rem;
        border-radius: 20px;
        font-size: 0.8rem;
        color: #334155;
        .quota-label { color: #64748b; margin-right: 0.3rem; }
      }
    }

    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.25rem; }
    .kpi-card { background: #ffffff; border-radius: 12px; padding: 1.25rem; border: 1px solid #e2e8f0; display: flex; flex-direction: column; gap: 0.5rem; }
    .kpi-header { display: flex; justify-content: space-between; align-items: center; }
    .kpi-title { font-size: 0.85rem; font-weight: 600; color: #64748b; }
    .kpi-icon { font-size: 1.25rem; }
    .kpi-value { font-size: 1.85rem; font-weight: 800; color: #0f172a; }
    .kpi-sub { font-size: 0.775rem; color: #94a3b8; }
    .highlight-blue { border-left: 4px solid #3b82f6; }
    .highlight-green { border-left: 4px solid #10b981; }
    .highlight-indigo { border-left: 4px solid #6366f1; }
    .highlight-amber { border-left: 4px solid #f59e0b; }

    .finance-banner {
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      color: #ffffff;
      border-radius: 12px;
      padding: 1.25rem 2rem;
      display: flex;
      align-items: center;
      gap: 3rem;
    }
    .finance-item { display: flex; flex-direction: column; gap: 0.25rem; }
    .finance-item .label { font-size: 0.8rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
    .finance-item .amount { font-size: 1.75rem; font-weight: 800; }
    .text-emerald { color: #34d399; }
    .text-danger { color: #ef4444; }
    .text-blue { color: #3b82f6; }
    .divider { width: 1px; height: 40px; background: #334155; }

    .content-card { background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 1.5rem; }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; }
    .card-header h3 { font-size: 1.15rem; font-weight: 700; margin: 0; }
    .quick-card-actions { display: flex; gap: 0.5rem; }
    .branch-cards-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.25rem; }
    .branch-card { border: 1px solid #e2e8f0; border-radius: 10px; padding: 1.25rem; display: flex; flex-direction: column; gap: 1rem; background: #f8fafc; }
    .branch-card-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .branch-code { font-size: 0.725rem; font-weight: 700; color: #2563eb; background: #eff6ff; padding: 0.2rem 0.5rem; border-radius: 4px; }
    .branch-card-header h4 { font-size: 1.05rem; font-weight: 700; margin: 0.35rem 0 0.15rem 0; }
    .address { font-size: 0.8rem; color: #64748b; margin: 0; }
    .floors-badge { font-size: 0.75rem; background: #e2e8f0; padding: 0.2rem 0.6rem; border-radius: 20px; font-weight: 600; }
    .branch-card-stats { display: flex; justify-content: space-around; background: #ffffff; padding: 0.75rem; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center; }
    .stat-num { font-size: 1.1rem; font-weight: 800; display: block; }
    .stat-label { font-size: 0.725rem; color: #64748b; }
    .branch-actions { display: flex; justify-content: flex-end; }

    /* Matrix Modal Styles */
    .modal-content-large {
      max-width: 900px;
      width: 95%;
      max-height: calc(100vh - 2.5rem);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .modal-content-payment {
      max-width: 680px;
      width: 95%;
      max-height: calc(100vh - 2.5rem);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .modal-header-text h3 { margin: 0; font-size: 1.25rem; font-weight: 800; }
    .modal-subtitle { font-size: 0.825rem; color: #64748b; margin: 0.2rem 0 0 0; }
    .matrix-filter-bar { display: flex; gap: 1rem; background: #f8fafc; padding: 1rem; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 1.25rem; }
    .filter-group { display: flex; flex-direction: column; gap: 0.3rem; flex: 1; }
    .flex-2 { flex: 2; }
    .filter-group label { font-size: 0.775rem; font-weight: 700; color: #475569; }
    .filter-group select, .filter-group input { padding: 0.5rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.875rem; }

    .matrix-floors-list { display: flex; flex-direction: column; gap: 1.25rem; }
    .matrix-floor-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem; background: #ffffff; }
    .matrix-floor-header { display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.75rem; border-bottom: 1px dashed #e2e8f0; padding-bottom: 0.5rem; }
    .floor-code-badge { background: #e0e7ff; color: #3730a3; font-weight: 700; font-size: 0.75rem; padding: 0.15rem 0.5rem; border-radius: 4px; }
    .matrix-floor-header h4 { margin: 0; font-size: 1rem; font-weight: 700; }

    .matrix-rooms-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.85rem; }
    .matrix-room-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 0.85rem; }
    .matrix-room-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.65rem; }
    .matrix-beds-container { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; }
    .matrix-bed-pill {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 0.5rem;
      background: #ffffff;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      transition: all 0.2s ease;
      &.bed-occupied {
        background: #fef2f2;
        border-color: #fca5a5;
        cursor: pointer;
        &:hover { background: #fee2e2; border-color: #ef4444; transform: translateY(-1px); box-shadow: 0 2px 4px rgba(239, 68, 68, 0.15); }
      }
      &.bed-free { background: #f8fafc; opacity: 0.75; cursor: not-allowed; }
    }
    .bed-pill-top { display: flex; justify-content: space-between; font-size: 0.75rem; font-weight: 700; }
    .bed-pill-status { font-size: 0.7rem; }
    .bed-occupied .bed-pill-status { color: #dc2626; }
    .bed-free .bed-pill-status { color: #059669; }
    .bed-pill-rent { font-size: 0.725rem; color: #64748b; }
    .bed-pill-actions { display: flex; gap: 0.3rem; margin-top: 0.25rem; }
    .btn-record-bed-sm {
      background: #059669;
      color: #ffffff;
      border: none;
      border-radius: 4px;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.2rem 0.45rem;
      cursor: pointer;
      flex: 1;
    }
    .btn-history-bed-sm {
      background: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
      border-radius: 4px;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.2rem 0.45rem;
      cursor: pointer;
      flex: 1;
      &:hover { background: #dbeafe; }
    }
    .text-free-label { font-size: 0.7rem; color: #94a3b8; font-style: italic; }
    .empty-rooms { grid-column: 1 / -1; text-align: center; color: #94a3b8; padding: 1rem; font-size: 0.85rem; }

    /* Payment Form Modal Styles */
    .resident-summary-banner {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 8px;
      padding: 0.85rem 1.25rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.85rem;
    }
    .resident-details {
      .res-badge { background: #3b82f6; color: #ffffff; font-size: 0.7rem; font-weight: 700; padding: 0.15rem 0.45rem; border-radius: 4px; }
      h4 { margin: 0.35rem 0 0.15rem 0; font-size: 1.15rem; font-weight: 800; color: #1e3a8a; }
      p { margin: 0; font-size: 0.8rem; color: #475569; }
      .joining-line { margin-top: 0.2rem; font-size: 0.75rem; color: #1e40af; }
    }
    .res-balances {
      display: flex;
      gap: 1rem;
      .balance-item {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        .lbl { font-size: 0.675rem; color: #64748b; font-weight: 600; text-transform: uppercase; }
        .val { font-size: 0.9rem; font-weight: 800; color: #0f172a; }
        .rate-sub { font-size: 0.68rem; color: #2563eb; font-weight: 700; }
        &.highlight-due .val { font-size: 1.15rem; }
      }
    }

    .month-selection-card {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 8px;
      padding: 0.65rem 0.85rem;
      margin-bottom: 0.85rem;
      .month-selection-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.8rem;
        font-weight: 700;
        color: #1e40af;
        margin-bottom: 0.5rem;
        .selected-month-badge {
          background: #2563eb;
          color: #ffffff;
          padding: 0.15rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 700;
        }
      }
      .month-selection-row {
        display: flex;
        gap: 0.75rem;
        align-items: flex-end;
        flex-wrap: wrap;
      }
      .form-group-compact {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        label { font-size: 0.7rem; font-weight: 700; color: #1e3a8a; text-transform: uppercase; }
        select {
          padding: 0.35rem 0.6rem;
          border-radius: 6px;
          border: 1px solid #93c5fd;
          background: #ffffff;
          font-size: 0.825rem;
          font-weight: 700;
          color: #0f172a;
          outline: none;
          &:focus { border-color: #2563eb; }
        }
      }
      .month-status-pill {
        flex: 1;
        font-size: 0.75rem;
        font-weight: 700;
        padding: 0.4rem 0.75rem;
        border-radius: 6px;
        background: #f1f5f9;
        color: #475569;
        border: 1px solid #cbd5e1;
        display: flex;
        align-items: center;
        &.already-paid {
          background: #ecfdf5;
          color: #065f46;
          border-color: #a7f3d0;
        }
      }
    }

    .current-month-txns-card {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      padding: 0.65rem 0.85rem;
      margin-bottom: 0.85rem;
      .txns-header {
        display: flex;
        justify-content: space-between;
        font-size: 0.775rem;
        font-weight: 700;
        color: #166534;
        margin-bottom: 0.35rem;
        .txns-count { font-size: 0.72rem; color: #15803d; }
      }
      .txns-list {
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
      }
      .txn-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #ffffff;
        border: 1px solid #dcfce7;
        padding: 0.3rem 0.6rem;
        border-radius: 4px;
        font-size: 0.75rem;
        .txn-code { font-weight: 700; color: #15803d; }
        .txn-date { color: #64748b; font-size: 0.7rem; }
        .txn-mode { background: #f1f5f9; padding: 0.1rem 0.35rem; border-radius: 3px; font-size: 0.68rem; }
      }
    }

    .proration-formula-card {
      background: #fdf4ff;
      border: 1px solid #f0abfc;
      border-radius: 8px;
      padding: 0.65rem 0.85rem;
      margin-bottom: 0.85rem;
      .formula-header {
        display: flex;
        justify-content: space-between;
        font-size: 0.8rem;
        font-weight: 700;
        color: #86198f;
        .formula-result { font-size: 0.95rem; font-weight: 800; }
      }
      .formula-details {
        font-size: 0.725rem;
        color: #a21caf;
        margin-top: 0.2rem;
        em { color: #701a75; }
      }
      .days-input-row {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-top: 0.5rem;
        padding-top: 0.5rem;
        border-top: 1px dashed #f5d0fe;
        font-size: 0.8rem;
        color: #701a75;
        .days-input {
          width: 80px;
          padding: 0.35rem 0.6rem;
          font-weight: 800;
          font-size: 0.95rem;
          text-align: center;
          border: 2px solid #d946ef;
          border-radius: 6px;
          outline: none;
          background: #ffffff;
          &:focus { border-color: #a21caf; box-shadow: 0 0 0 2px rgba(217, 70, 239, 0.2); }
        }
        .days-calc-preview { font-size: 0.8rem; color: #86198f; }
      }
    }

    .dues-split-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
      margin-bottom: 0.85rem;
    }
    .dues-col {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 0.65rem 0.85rem;
      background: #ffffff;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      font-size: 0.8rem;
      &.advance-col { border-left: 3px solid #3b82f6; }
      &.rent-col { border-left: 3px solid #10b981; }
      .dues-title { font-weight: 700; font-size: 0.825rem; margin-bottom: 0.2rem; }
      .dues-stat {
        display: flex;
        justify-content: space-between;
        color: #475569;
        &.due-highlight { border-top: 1px dashed #e2e8f0; padding-top: 0.25rem; font-weight: 700; }
      }
    }

    .waterfall-preview-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 0.75rem 1rem;
      margin-bottom: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      font-size: 0.825rem;
      .waterfall-header { display: flex; justify-content: space-between; margin-bottom: 0.2rem; color: #1e293b; }
      .waterfall-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        .waterfall-sub { width: 100%; font-size: 0.7rem; color: #64748b; margin-top: 0.1rem; }
      }
      .calc-divider { height: 1px; background: #e2e8f0; margin: 0.2rem 0; }
      .total-pending-row { font-size: 0.9rem; font-weight: 800; }
    }
    .form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

    .loading-state { text-align: center; padding: 3rem; color: #64748b; }
    .spinner { width: 36px; height: 36px; border: 3px solid #e2e8f0; border-top-color: #2563eb; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 1rem auto; }
    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 1024px) {
      .kpi-grid { grid-template-columns: repeat(2, 1fr); }
      .branch-cards-grid { grid-template-columns: 1fr; }
      .matrix-rooms-grid { grid-template-columns: 1fr; }
      .finance-banner { flex-direction: column; align-items: flex-start; gap: 1rem; .divider { display: none; } }
      .property-selector-card { flex-direction: column; align-items: flex-start; gap: 0.75rem; .property-dropdown { min-width: 100%; } }
      .resident-summary-banner { flex-direction: column; align-items: flex-start; gap: 1rem; .res-balances { width: 100%; justify-content: space-between; } }
      .dues-split-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class DashboardComponent implements OnInit {
  summary: DashboardSummary | null = null;
  branches: Branch[] = [];
  guests: Guest[] = [];
  currentOwner: Owner | null = null;
  loading = true;
  selectedBranchId: string = '';

  // --- Payment Matrix State ---
  showMatrixModal = false;
  matrixBranchId: string = '';
  matrixSearchTerm: string = '';

  // --- Bed History Modal State ---
  showBedHistoryModal = false;
  selectedBedHistoryId: string | null = null;

  // --- Record Payment Modal State ---
  showPaymentModal = false;
  loadingLedger = false;
  submittingPayment = false;
  activeLedger: TenantLedgerSummary | null = null;
  activeBedInfo: {
    bedId: string;
    bedCode: string;
    bedNumber: string;
    bedRent: number;
    roomId: string;
    roomNumber: string;
    branchId: string;
    branchName: string;
  } | null = null;

  paymentForm = {
    amountPaid: 0,
    paymentMode: 'UPI',
    transactionReference: '',
    receivedBy: '',
    receiptNotes: '',
    paymentMonth: new Date().toISOString().substring(0, 7),
    daysPaid: 30
  };

  selectedPaymentMonthNum: string = String(new Date().getMonth() + 1).padStart(2, '0');
  selectedPaymentYear: number = new Date().getFullYear();
  availablePaymentYears: number[] = [
    new Date().getFullYear() - 1,
    new Date().getFullYear(),
    new Date().getFullYear() + 1
  ];

  constructor(private api: PgApiService, private auth: AuthService) {}

  ngOnInit(): void {
    this.auth.currentUser$.subscribe(owner => {
      this.currentOwner = owner;
      if (owner) {
        this.loadDashboardData(owner.ownerId);
      }
    });
  }

  loadDashboardData(ownerId: string): void {
    this.loading = true;
    this.api.getDashboardSummary(ownerId).subscribe({
      next: (summary) => this.summary = summary,
      error: () => this.loading = false
    });

    this.api.getBranches(ownerId).subscribe({
      next: (branches) => {
        this.branches = branches;
        this.loading = false;
      },
      error: () => this.loading = false
    });

    this.api.getGuests(ownerId).subscribe({
      next: (guests) => this.guests = guests,
      error: () => {}
    });
  }

  onPropertyChange(): void {
    this.api.setSelectedBranch(this.selectedBranchId || null);
  }

  get selectedBranch(): Branch | undefined {
    if (!this.selectedBranchId) return undefined;
    return this.branches.find(b => b.branchId === this.selectedBranchId);
  }

  get displayedBranches(): Branch[] {
    if (!this.selectedBranchId) return this.branches;
    return this.branches.filter(b => b.branchId === this.selectedBranchId);
  }

  get displayedBranchesCount(): number {
    return this.displayedBranches.length;
  }

  get displayedFloorsCount(): number {
    return this.displayedBranches.reduce((acc, b) => acc + (b.floors?.length || b.totalFloors || 0), 0);
  }

  get displayedTotalBeds(): number {
    if (!this.selectedBranchId && this.summary) return this.summary.totalBeds;
    return this.displayedBranches.reduce((acc, b) => acc + this.getBranchBedsCount(b), 0);
  }

  get displayedOccupiedBeds(): number {
    if (!this.selectedBranchId && this.summary) return this.summary.occupiedBeds;
    return this.displayedBranches.reduce((acc, b) => acc + this.getBranchOccupiedCount(b), 0);
  }

  get displayedAvailableBeds(): number {
    return Math.max(0, this.displayedTotalBeds - this.displayedOccupiedBeds);
  }

  get displayedResidentsCount(): number {
    if (!this.selectedBranchId) return this.guests.filter(g => g.status === 'Active').length;
    return this.guests.filter(g => g.branchId === this.selectedBranchId && g.status === 'Active').length;
  }

  get displayedNoticeCount(): number {
    if (!this.selectedBranchId) return this.guests.filter(g => g.status === 'Notice_Period').length;
    return this.guests.filter(g => g.branchId === this.selectedBranchId && g.status === 'Notice_Period').length;
  }

  get displayedRevenuePotential(): number {
    if (!this.selectedBranchId && this.summary) return this.summary.totalMonthlyRevenuePotential;
    let total = 0;
    for (const b of this.displayedBranches) {
      if (b.floors) {
        for (const f of b.floors) {
          if (f.rooms) {
            for (const r of f.rooms) {
              if (r.beds) {
                for (const bed of r.beds) total += (bed.bedRent || 0);
              }
            }
          }
        }
      }
    }
    return total;
  }

  get displayedAdvanceHeld(): number {
    if (!this.selectedBranchId && this.summary) return this.summary.advanceCollectedTotal;
    return this.guests
      .filter(g => g.branchId === this.selectedBranchId && g.status === 'Active')
      .reduce((acc, g) => acc + (g.advanceAmount || 0), 0);
  }

  getBranchRoomsCount(branch: Branch): number {
    return branch.floors?.reduce((acc, f) => acc + (f.rooms?.length || 0), 0) || 0;
  }

  getBranchBedsCount(branch: Branch): number {
    let count = 0;
    branch.floors?.forEach(f => f.rooms?.forEach(r => count += (r.beds?.length || 0)));
    return count;
  }

  getBranchOccupiedCount(branch: Branch): number {
    let count = 0;
    branch.floors?.forEach(f => f.rooms?.forEach(r => r.beds?.forEach(b => {
      if (b.isOccupied) count++;
    })));
    return count;
  }

  // --- Payment Matrix Methods ---
  openPaymentMatrixModal(branchId?: string): void {
    if (branchId) {
      this.matrixBranchId = branchId;
    } else if (this.selectedBranchId) {
      this.matrixBranchId = this.selectedBranchId;
    } else if (this.branches.length > 0) {
      this.matrixBranchId = this.branches[0].branchId;
    }
    this.matrixSearchTerm = '';
    this.showMatrixModal = true;
  }

  onMatrixBranchSelect(): void {
    this.matrixSearchTerm = '';
  }

  get selectedMatrixBranch(): Branch | undefined {
    return this.branches.find(b => b.branchId === this.matrixBranchId);
  }

  filterRooms(rooms?: Room[]): Room[] {
    if (!rooms) return [];
    if (!this.matrixSearchTerm.trim()) return rooms;
    const term = this.matrixSearchTerm.toLowerCase().trim();
    return rooms.filter(r => 
      r.roomNumber.toLowerCase().includes(term) ||
      r.roomCode.toLowerCase().includes(term) ||
      r.beds?.some(b => b.bedNumber.toLowerCase().includes(term) || b.bedCode.toLowerCase().includes(term))
    );
  }

  onBedClicked(bed: Bed, room: Room, floor: Floor, branch: Branch): void {
    if (!bed.isOccupied) {
      alert(`Bed ${bed.bedNumber} is currently vacant. Payments can only be recorded for occupied beds.`);
      return;
    }

    this.activeBedInfo = {
      bedId: bed.bedId,
      bedCode: bed.bedCode,
      bedNumber: bed.bedNumber,
      bedRent: bed.bedRent,
      roomId: room.roomId,
      roomNumber: room.roomNumber,
      branchId: branch.branchId,
      branchName: branch.branchName
    };

    this.loadingLedger = true;
    this.showPaymentModal = true;

    this.api.getBedLedger(bed.bedId).subscribe({
      next: (ledger) => {
        this.activeLedger = ledger;
        this.loadingLedger = false;
        
        // Initialize month/year selection to current date
        const now = new Date();
        this.selectedPaymentYear = now.getFullYear();
        this.selectedPaymentMonthNum = String(now.getMonth() + 1).padStart(2, '0');
        const currentMonthKey = `${this.selectedPaymentYear}-${this.selectedPaymentMonthNum}`;

        // Calculate daily rate = Monthly Rent / 30
        const rent = ledger.monthlyRent || bed.bedRent || 0;
        const dailyRate = Math.round((rent / 30) * 100) / 100;

        // Check if payment already exists for this selected month
        const paymentsForMonth = (ledger.payments || []).filter(p => 
          p.paymentMonth === currentMonthKey || 
          p.paymentDate?.substring(0, 7) === currentMonthKey
        );
        const alreadyPaidThisMonth = paymentsForMonth.length > 0;

        // Requirement: "when we select the month, if already payment was recording then we need to remaning days 0, if not 30"
        let defaultDays = 30;
        if (alreadyPaidThisMonth) {
          defaultDays = 0;
        } else {
          // If joining month, days remaining in month
          const joining = ledger.joiningDate ? new Date(ledger.joiningDate) : new Date();
          const joinedThisMonth = joining.toISOString().substring(0, 7) === currentMonthKey;
          if (joinedThisMonth) {
            const daysInMonth = new Date(joining.getFullYear(), joining.getMonth() + 1, 0).getDate();
            defaultDays = Math.max(1, daysInMonth - joining.getDate() + 1);
          }
        }
        
        // Calculate expected rent for selected days
        const calculatedRentForDays = Math.round(defaultDays * dailyRate);
        const advPending = ledger.advancePending ?? (ledger.advanceAmount || 0);
        
        // Default amount paid
        const defaultAmount = alreadyPaidThisMonth
          ? ((ledger.currentMonthPending !== undefined && ledger.currentMonthPending > 0) ? ledger.currentMonthPending : 0)
          : (advPending > 0 ? (advPending + calculatedRentForDays) : calculatedRentForDays);

        this.paymentForm = {
          amountPaid: defaultAmount,
          paymentMode: 'UPI',
          transactionReference: '',
          receivedBy: this.currentOwner?.fullName || 'Property Owner',
          receiptNotes: `Payment for ${ledger.guestName} (${ledger.roomBed})`,
          paymentMonth: currentMonthKey,
          daysPaid: defaultDays
        };
      },
      error: () => {
        // Fallback: If not found via direct bed ledger, lookup active guest from list
        const guest = this.guests.find(g => g.bedId === bed.bedId && g.status === 'Active');
        if (guest && guest.guestId) {
          const guestId = guest.guestId;
          this.api.getGuestLedger(guestId).subscribe({
            next: (ledger) => {
              this.activeLedger = ledger;
              this.loadingLedger = false;

              const now = new Date();
              this.selectedPaymentYear = now.getFullYear();
              this.selectedPaymentMonthNum = String(now.getMonth() + 1).padStart(2, '0');
              const currentMonthKey = `${this.selectedPaymentYear}-${this.selectedPaymentMonthNum}`;

              const rent = ledger.monthlyRent || guest.monthlyRent || 0;
              const dailyRate = Math.round((rent / 30) * 100) / 100;

              const paymentsForMonth = (ledger.payments || []).filter(p => 
                p.paymentMonth === currentMonthKey || 
                p.paymentDate?.substring(0, 7) === currentMonthKey
              );
              const alreadyPaidThisMonth = paymentsForMonth.length > 0;

              let defaultDays = 30;
              if (alreadyPaidThisMonth) {
                defaultDays = 0;
              } else {
                const joining = ledger.joiningDate ? new Date(ledger.joiningDate) : new Date();
                const joinedThisMonth = joining.toISOString().substring(0, 7) === currentMonthKey;
                if (joinedThisMonth) {
                  const daysInMonth = new Date(joining.getFullYear(), joining.getMonth() + 1, 0).getDate();
                  defaultDays = Math.max(1, daysInMonth - joining.getDate() + 1);
                }
              }

              const calculatedRentForDays = Math.round(defaultDays * dailyRate);
              const advPending = ledger.advancePending ?? (ledger.advanceAmount || 0);
              const defaultAmount = alreadyPaidThisMonth
                ? ((ledger.currentMonthPending !== undefined && ledger.currentMonthPending > 0) ? ledger.currentMonthPending : 0)
                : (advPending > 0 ? (advPending + calculatedRentForDays) : calculatedRentForDays);

              this.paymentForm = {
                amountPaid: defaultAmount,
                paymentMode: 'UPI',
                transactionReference: '',
                receivedBy: this.currentOwner?.fullName || 'Property Owner',
                receiptNotes: `Payment for ${guest.fullName}`,
                paymentMonth: currentMonthKey,
                daysPaid: defaultDays
              };
            },
            error: () => {
              const now = new Date();
              this.selectedPaymentYear = now.getFullYear();
              this.selectedPaymentMonthNum = String(now.getMonth() + 1).padStart(2, '0');
              const currentMonthKey = `${this.selectedPaymentYear}-${this.selectedPaymentMonthNum}`;

              const joining = new Date(guest.joiningDate);
              const daysInMonth = new Date(joining.getFullYear(), joining.getMonth() + 1, 0).getDate();
              const remDays = Math.max(1, daysInMonth - joining.getDate() + 1);
              const dailyRate = Math.round((guest.monthlyRent / 30) * 100) / 100;
              const prorated = Math.round(dailyRate * remDays);
              const totalCharges = guest.advanceAmount + prorated;

              this.activeLedger = {
                guestId: guestId,
                guestName: guest.fullName,
                guestCode: guest.guestCode || '',
                phoneNumber: guest.phoneNumber,
                roomBed: `Room ${room.roomNumber} - Bed ${bed.bedNumber}`,
                joiningDate: guest.joiningDate.toString(),
                monthlyRent: guest.monthlyRent,
                advanceAmount: guest.advanceAmount,
                dailyRate: dailyRate,
                currentBillingMonth: currentMonthKey,
                currentMonthRentCharge: prorated,
                currentMonthPaid: 0,
                currentMonthPending: totalCharges,
                currentMonthPayments: [],
                proratedJoiningRent: prorated,
                proratedDaysInMonth: remDays,
                daysInJoiningMonth: daysInMonth,
                totalCharges: totalCharges,
                totalPaid: 0,
                outstandingBalance: totalCharges,
                advancePaid: 0,
                advancePending: guest.advanceAmount,
                rentPaid: 0,
                rentPending: prorated,
                charges: [],
                payments: []
              };
              this.loadingLedger = false;
              this.paymentForm.amountPaid = totalCharges;
              this.paymentForm.daysPaid = remDays;
              this.paymentForm.paymentMonth = currentMonthKey;
            }
          });
        } else {
          this.loadingLedger = false;
          alert('Could not find active resident details for this bed.');
          this.showPaymentModal = false;
        }
      }
    });
  }

  // --- Month/Year Selection Logic & Remaining Days Computation ---
  formatMonthKey(key?: string): string {
    if (!key) return '';
    const parts = key.split('-');
    if (parts.length !== 2) return key;
    const year = parts[0];
    const month = parseInt(parts[1], 10);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[month - 1] || month} ${year}`;
  }

  get selectedMonthPayments(): TenantPayment[] {
    if (!this.activeLedger || !this.paymentForm.paymentMonth) return [];
    const key = this.paymentForm.paymentMonth;
    return (this.activeLedger.payments || []).filter(p => 
      p.paymentMonth === key || 
      (p.paymentDate && p.paymentDate.substring(0, 7) === key)
    );
  }

  get isMonthAlreadyPaid(): boolean {
    return this.selectedMonthPayments.length > 0;
  }

  getMonthPaidAmount(monthKey?: string): number {
    if (!this.activeLedger || !monthKey) return 0;
    return (this.activeLedger.payments || [])
      .filter(p => p.paymentMonth === monthKey || (p.paymentDate && p.paymentDate.substring(0, 7) === monthKey))
      .reduce((sum, p) => sum + (p.amountPaid || 0), 0);
  }

  onPaymentMonthOrYearChange(monthNum: string, yearNum: number): void {
    this.selectedPaymentMonthNum = monthNum;
    this.selectedPaymentYear = Number(yearNum);
    const newMonthKey = `${this.selectedPaymentYear}-${this.selectedPaymentMonthNum}`;
    this.paymentForm.paymentMonth = newMonthKey;

    if (!this.activeLedger) return;

    // Requirement: "when we select the month, if already payment was recording then we need to remaning days 0, if not 30"
    const paymentsForSelected = (this.activeLedger.payments || []).filter(p =>
      p.paymentMonth === newMonthKey || 
      (p.paymentDate && p.paymentDate.substring(0, 7) === newMonthKey)
    );

    const alreadyPaid = paymentsForSelected.length > 0;
    if (alreadyPaid) {
      this.paymentForm.daysPaid = 0;
    } else {
      // If resident joined in this selected month, calculate remaining days from joining date
      const joining = this.activeLedger.joiningDate ? new Date(this.activeLedger.joiningDate) : new Date();
      const joinedInThisSelected = joining.toISOString().substring(0, 7) === newMonthKey;
      if (joinedInThisSelected) {
        const daysInMonth = new Date(this.selectedPaymentYear, parseInt(this.selectedPaymentMonthNum, 10), 0).getDate();
        this.paymentForm.daysPaid = Math.max(1, daysInMonth - joining.getDate() + 1);
      } else {
        this.paymentForm.daysPaid = 30;
      }
    }

    // Recalculate amount to pay
    const calculatedRent = Math.round((this.paymentForm.daysPaid || 0) * this.calculatedDailyRent);
    const advPending = this.activeLedger.advancePending ?? (this.activeLedger.advanceAmount || 0);

    if (alreadyPaid) {
      // If already recorded, check if there are remaining pending dues for this month or advance
      this.paymentForm.amountPaid = (this.activeLedger.currentMonthPending !== undefined && this.activeLedger.currentMonthPending > 0)
        ? this.activeLedger.currentMonthPending
        : 0;
    } else {
      this.paymentForm.amountPaid = advPending > 0 ? (advPending + calculatedRent) : calculatedRent;
    }
  }

  // --- Dynamic Calculation Helpers ---
  get calculatedDailyRent(): number {
    if (!this.activeLedger) return 0;
    const rent = this.activeLedger.monthlyRent || this.activeBedInfo?.bedRent || 0;
    return Math.round((rent / 30) * 100) / 100;
  }

  get calculatedExpectedRentForDays(): number {
    const days = this.paymentForm.daysPaid || 0;
    return Math.round(days * this.calculatedDailyRent);
  }

  get calculatedSuggestedTotal(): number {
    if (!this.activeLedger) return 0;
    const advPending = this.activeLedger.advancePending ?? (this.activeLedger.advanceAmount || 0);
    return advPending + this.calculatedExpectedRentForDays;
  }

  onDaysPaidChange(): void {
    // When owner modifies days, automatically update the amount to pay
    this.paymentForm.amountPaid = this.calculatedSuggestedTotal;
  }

  // --- Waterfall Allocation Calculation Preview ---
  get waterfallAdvanceCovered(): number {
    if (!this.activeLedger) return 0;
    const advPending = this.activeLedger.advancePending ?? (this.activeLedger.advanceAmount || 0);
    const paying = this.paymentForm.amountPaid || 0;
    return Math.min(advPending, paying);
  }

  get waterfallRemainingAdvancePending(): number {
    if (!this.activeLedger) return 0;
    const advPending = this.activeLedger.advancePending ?? (this.activeLedger.advanceAmount || 0);
    return Math.max(0, advPending - this.waterfallAdvanceCovered);
  }

  get waterfallRentCovered(): number {
    if (!this.activeLedger) return 0;
    const paying = this.paymentForm.amountPaid || 0;
    const remAfterAdvance = Math.max(0, paying - this.waterfallAdvanceCovered);
    const targetRent = this.calculatedExpectedRentForDays > 0 ? this.calculatedExpectedRentForDays : (this.activeLedger.rentPending ?? this.activeLedger.monthlyRent ?? 0);
    return Math.min(targetRent, remAfterAdvance);
  }

  get waterfallRemainingRentPending(): number {
    if (!this.activeLedger) return 0;
    const targetRent = this.calculatedExpectedRentForDays > 0 ? this.calculatedExpectedRentForDays : (this.activeLedger.rentPending ?? this.activeLedger.monthlyRent ?? 0);
    return Math.max(0, targetRent - this.waterfallRentCovered);
  }

  get waterfallTotalRemainingPending(): number {
    return this.waterfallRemainingAdvancePending + this.waterfallRemainingRentPending;
  }

  onPaymentAmountChange(): void {
    // Triggers calculation preview automatically
  }

  submitPayment(): void {
    if (!this.activeLedger || !this.currentOwner) return;
    if ((this.paymentForm.amountPaid || 0) <= 0) {
      alert('Please enter a valid payment amount greater than ₹0.');
      return;
    }

    this.submittingPayment = true;
    const payload = {
      guestId: this.activeLedger.guestId,
      ownerId: this.currentOwner.ownerId,
      branchId: this.activeBedInfo?.branchId || this.activeLedger.branchId || this.branches[0]?.branchId,
      amountPaid: this.paymentForm.amountPaid,
      paymentMode: this.paymentForm.paymentMode,
      transactionReference: this.paymentForm.transactionReference,
      receivedBy: this.paymentForm.receivedBy,
      receiptNotes: this.paymentForm.receiptNotes,
      paymentMonth: this.paymentForm.paymentMonth || new Date().toISOString().substring(0, 7),
      daysPaid: this.paymentForm.daysPaid || 30,
      advanceAllocated: this.waterfallAdvanceCovered,
      rentAllocated: this.waterfallRentCovered,
      pendingBalanceAfter: this.waterfallTotalRemainingPending
    };

    this.api.recordPayment(payload).subscribe({
      next: (payment) => {
        this.submittingPayment = false;
        this.showPaymentModal = false;
        alert(`Payment of ₹${payment.amountPaid} recorded successfully! Receipt Code: ${payment.paymentCode}\nAllocated: Advance ₹${this.waterfallAdvanceCovered}, Room Rent ₹${this.waterfallRentCovered}. Remaining Dues: ₹${this.waterfallTotalRemainingPending}`);
        if (this.currentOwner) {
          this.loadDashboardData(this.currentOwner.ownerId);
        }
      },
      error: (err) => {
        this.submittingPayment = false;
        alert(err?.error?.message || 'Failed to record payment in database.');
      }
    });
  }

  openBedHistory(bedId: string): void {
    this.selectedBedHistoryId = bedId;
    this.showBedHistoryModal = true;
  }
}
