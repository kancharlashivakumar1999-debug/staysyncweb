import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PgApiService } from '../../core/services/pg-api.service';
import { AuthService } from '../../core/services/auth.service';
import { Visitor, Branch, Guest } from '../../models/pg.models';

@Component({
  selector: 'app-visitors',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="visitors-container">
      <header class="page-header">
        <div>
          <h2>Visitor Entry & Security Register</h2>
          <p class="subtitle">UC-06: Maintain daily guest check-ins, tenant visited, timings, and vehicles.</p>
        </div>
        <button class="btn btn-primary" (click)="showModal = true">+ Log Visitor</button>
      </header>

      <!-- Visitors Table -->
      <div class="table-container">
        <table *ngIf="visitors.length > 0; else noVisitors">
          <thead>
            <tr>
              <th>Visitor Code</th>
              <th>Visitor Name</th>
              <th>Phone</th>
              <th>Tenant Visited</th>
              <th>Relation</th>
              <th>Purpose</th>
              <th>Check-in</th>
              <th>Check-out</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let v of visitors">
              <td><span class="code-badge">{{ v.visitorCode }}</span></td>
              <td><strong>{{ v.visitorName }}</strong></td>
              <td>{{ v.visitorPhone }}</td>
              <td>{{ v.guestName }} (Room {{ v.roomNumber }})</td>
              <td><span class="badge info">{{ v.relationToGuest || 'Friend' }}</span></td>
              <td>{{ v.purposeOfVisit }}</td>
              <td>{{ v.checkInTime | date:'short' }}</td>
              <td>
                <span *ngIf="v.checkOutTime">{{ v.checkOutTime | date:'shortTime' }}</span>
                <span *ngIf="!v.checkOutTime" class="badge active">In Premises</span>
              </td>
              <td>
                <button *ngIf="!v.checkOutTime" class="btn btn-sm btn-secondary" (click)="checkOut(v.visitorId)">Check Out</button>
                <span *ngIf="v.checkOutTime" class="text-muted">Completed</span>
              </td>
            </tr>
          </tbody>
        </table>
        <ng-template #noVisitors>
          <div class="empty-state">No visitors logged today.</div>
        </ng-template>
      </div>

      <!-- Log Visitor Modal -->
      <div class="modal-backdrop" *ngIf="showModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Log New Visitor</h3>
            <button class="close-btn" (click)="showModal = false">✕</button>
          </div>
          <form (ngSubmit)="submitVisitor()" class="modal-form">
            <div class="modal-body">
              <div class="form-group">
                <label>Select Tenant Visited *</label>
                <select [(ngModel)]="newVisitor.guestId" name="guestId" required (change)="onTenantSelected(newVisitor.guestId)">
                  <option value="">-- Choose Tenant --</option>
                  <option *ngFor="let g of guests" [value]="g.guestId">{{ g.fullName }} (Room {{ g.roomNumber }})</option>
                </select>
              </div>

              <div class="form-group">
                <label>Visitor Full Name *</label>
                <input type="text" [(ngModel)]="newVisitor.visitorName" name="visitorName" placeholder="e.g. Ramesh Verma" required />
              </div>

              <div class="form-group">
                <label>Visitor Phone Number *</label>
                <input type="text" [(ngModel)]="newVisitor.visitorPhone" name="visitorPhone" placeholder="10-digit mobile" required />
              </div>

              <div class="form-group">
                <label>Relation to Tenant</label>
                <select [(ngModel)]="newVisitor.relationToGuest" name="relationToGuest">
                  <option value="Friend">Friend</option>
                  <option value="Parent">Parent / Guardian</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Colleague">Colleague</option>
                  <option value="Delivery">Delivery / Courier</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div class="form-group">
                <label>Purpose of Visit *</label>
                <input type="text" [(ngModel)]="newVisitor.purposeOfVisit" name="purposeOfVisit" placeholder="e.g. Personal visit / books handover" required />
              </div>

              <div class="form-group">
                <label>Vehicle Number (Optional)</label>
                <input type="text" [(ngModel)]="newVisitor.vehicleNumber" name="vehicleNumber" placeholder="e.g. TS09AB1234" />
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showModal = false">Cancel</button>
              <button type="submit" class="btn btn-primary">Log Entry</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .visitors-container { padding: 1.5rem; max-width: 1400px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .page-header h2 { margin: 0; font-size: 1.6rem; color: #0f172a; }
    .subtitle { margin: 0.2rem 0 0; color: #64748b; font-size: 0.9rem; }
    .btn { padding: 0.6rem 1.2rem; border-radius: 8px; font-weight: 600; cursor: pointer; border: none; font-size: 0.9rem; }
    .btn-primary { background: #2563eb; color: #fff; }
    .btn-secondary { background: #e2e8f0; color: #1e293b; }
    .btn-sm { padding: 0.35rem 0.75rem; font-size: 0.8rem; }
    .table-container { background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem; }
    th { background: #f8fafc; padding: 0.75rem 1rem; font-weight: 600; color: #475569; border-bottom: 1px solid #e2e8f0; }
    td { padding: 0.75rem 1rem; border-bottom: 1px solid #f1f5f9; color: #1e293b; }
    .code-badge { font-family: monospace; background: #f1f5f9; padding: 0.2rem 0.4rem; border-radius: 4px; font-weight: 600; font-size: 0.8rem; }
    .badge { padding: 0.2rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
    .badge.info { background: #e0f2fe; color: #0369a1; }
    .badge.active { background: #fef3c7; color: #b45309; }
    .text-muted { color: #94a3b8; font-size: 0.8rem; }
    .empty-state { padding: 3rem; text-align: center; color: #94a3b8; font-weight: 500; }
    .modal-form { display: flex; flex-direction: column; flex: 1 1 auto; min-height: 0; overflow: hidden; }
  `]
})
export class VisitorsComponent implements OnInit {
  visitors: Visitor[] = [];
  guests: Guest[] = [];
  branches: Branch[] = [];
  showModal = false;

  newVisitor = {
    branchId: '',
    guestId: '',
    visitorName: '',
    visitorPhone: '',
    relationToGuest: 'Friend',
    purposeOfVisit: '',
    vehicleNumber: ''
  };

  constructor(private api: PgApiService, private auth: AuthService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    const owner = this.auth.currentUserValue;
    if (!owner) return;

    this.api.getVisitors(owner.ownerId).subscribe(v => this.visitors = v);
    this.api.getGuests(owner.ownerId).subscribe(g => this.guests = g);
    this.api.getBranches(owner.ownerId).subscribe(b => this.branches = b);
  }

  onTenantSelected(guestId: string): void {
    const g = this.guests.find(x => x.guestId === guestId);
    if (g) this.newVisitor.branchId = g.branchId;
  }

  submitVisitor(): void {
    const owner = this.auth.currentUserValue;
    if (!owner) return;

    const payload = { ...this.newVisitor, ownerId: owner.ownerId };
    this.api.logVisitor(payload).subscribe(() => {
      this.showModal = false;
      this.loadData();
    });
  }

  checkOut(visitorId: string): void {
    this.api.checkOutVisitor(visitorId).subscribe(() => this.loadData());
  }
}
