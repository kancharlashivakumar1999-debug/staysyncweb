import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PgApiService } from '../../core/services/pg-api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ComponentCanDeactivate } from '../../core/guards/pending-changes.guard';
import { Complaint, Branch, Guest } from '../../models/pg.models';

@Component({
  selector: 'app-complaints',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="complaints-container">
      <header class="page-header">
        <div>
          <h2>Complaints & Maintenance Workflow</h2>
          <p class="subtitle">UC-05: Create, assign, prioritize, track SLA, and resolve tenant issues.</p>
        </div>
        <button class="btn btn-primary" (click)="showModal = true">+ Raise Complaint</button>
      </header>

      <!-- Filter Bar -->
      <div class="filter-bar">
        <button [class.active]="filterStatus === ''" (click)="setFilter('')">All ({{ complaints.length }})</button>
        <button [class.active]="filterStatus === 'New'" (click)="setFilter('New')">New</button>
        <button [class.active]="filterStatus === 'Assigned'" (click)="setFilter('Assigned')">Assigned</button>
        <button [class.active]="filterStatus === 'In Progress'" (click)="setFilter('In Progress')">In Progress</button>
        <button [class.active]="filterStatus === 'Resolved'" (click)="setFilter('Resolved')">Resolved</button>
        <button [class.active]="filterStatus === 'Closed'" (click)="setFilter('Closed')">Closed</button>
      </div>

      <!-- Complaints Cards Grid -->
      <div class="cards-grid" *ngIf="filteredComplaints.length > 0; else noComplaints">
        <div class="complaint-card" *ngFor="let c of filteredComplaints" [class.emergency]="c.priority === 'Emergency'">
          <div class="card-header">
            <span class="code-badge">{{ c.complaintCode }}</span>
            <span class="priority-badge" [ngClass]="c.priority.toLowerCase()">{{ c.priority }}</span>
          </div>

          <h3 class="card-title">{{ c.title }}</h3>
          <p class="card-desc">{{ c.description }}</p>

          <div class="card-meta">
            <div><strong>Category:</strong> {{ c.category }}</div>
            <div><strong>Property:</strong> {{ c.branchName || 'PG' }}</div>
            <div *ngIf="c.guestName"><strong>Tenant:</strong> {{ c.guestName }} (Room {{ c.roomNumber }})</div>
            <div><strong>Logged:</strong> {{ c.createdAt | date:'short' }}</div>
            <div *ngIf="c.assignedTo"><strong>Assigned:</strong> {{ c.assignedTo }}</div>
          </div>

          <div class="card-footer">
            <span class="status-pill" [ngClass]="c.status.toLowerCase().replace(' ', '-')">{{ c.status }}</span>
            <button class="btn btn-sm btn-outline" (click)="openUpdateModal(c)">Update Status</button>
          </div>
        </div>
      </div>

      <ng-template #noComplaints>
        <div class="empty-state">No complaints matching the selected filter.</div>
      </ng-template>

      <!-- New Complaint Modal -->
      <div class="modal-backdrop" *ngIf="showModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Raise New Complaint</h3>
            <button class="close-btn" (click)="showModal = false">✕</button>
          </div>
          <form (ngSubmit)="submitComplaint()" class="modal-form">
            <div class="modal-body">
              <div class="form-group">
                <label>Select Property *</label>
                <select [(ngModel)]="newComplaint.branchId" name="branchId" required>
                  <option *ngFor="let b of branches" [value]="b.branchId">{{ b.branchName }}</option>
                </select>
              </div>

              <div class="form-group">
                <label>Select Tenant (Optional)</label>
                <select [(ngModel)]="newComplaint.guestId" name="guestId" (change)="onGuestSelected(newComplaint.guestId)">
                  <option value="">-- Non-tenant / Common Area --</option>
                  <option *ngFor="let g of guests" [value]="g.guestId">{{ g.fullName }} (Room {{ g.roomNumber }})</option>
                </select>
              </div>

              <div class="form-group">
                <label>Category *</label>
                <select [(ngModel)]="newComplaint.category" name="category" required>
                  <option value="Plumbing">Plumbing (Tap, Flush, Leakage)</option>
                  <option value="Electrical">Electrical (Fan, Light, Switch)</option>
                  <option value="WiFi / Internet">WiFi / Internet Issue</option>
                  <option value="Food / Mess">Food & Mess Quality</option>
                  <option value="Cleaning">Housekeeping / Cleaning</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div class="form-group">
                <label>Priority *</label>
                <select [(ngModel)]="newComplaint.priority" name="priority" required>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Emergency">Emergency</option>
                </select>
              </div>

              <div class="form-group">
                <label>Issue Title *</label>
                <input type="text" [(ngModel)]="newComplaint.title" name="title" placeholder="e.g. Washroom geyser not turning on" required />
              </div>

              <div class="form-group">
                <label>Detailed Description *</label>
                <textarea [(ngModel)]="newComplaint.description" name="description" rows="3" required></textarea>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showModal = false">Cancel</button>
              <button type="submit" class="btn btn-primary">Submit Ticket</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Update Status Modal -->
      <div class="modal-backdrop" *ngIf="showUpdateModal">
        <div class="modal-content">
          <div class="modal-header">
            <div>
              <h3>Update Complaint Status</h3>
              <p class="modal-subtitle">{{ selectedComplaint?.complaintCode }} • {{ selectedComplaint?.title }}</p>
            </div>
            <button class="close-btn" (click)="showUpdateModal = false">✕</button>
          </div>
          <form (ngSubmit)="submitStatusUpdate()" class="modal-form">
            <div class="modal-body">
              <div class="form-group">
                <label>Status *</label>
                <select [(ngModel)]="statusUpdate.status" name="status" required>
                  <option value="New">New</option>
                  <option value="Assigned">Assigned</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div class="form-group">
                <label>Assign To (Staff / Electrician / Plumber)</label>
                <input type="text" [(ngModel)]="statusUpdate.assignedTo" name="assignedTo" placeholder="e.g. Raju Electrician" />
              </div>

              <div class="form-group">
                <label>Resolution Notes / Remarks</label>
                <textarea [(ngModel)]="statusUpdate.resolutionNotes" name="resolutionNotes" rows="3" placeholder="Work done or reason for closure"></textarea>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showUpdateModal = false">Cancel</button>
              <button type="submit" class="btn btn-primary">Update Ticket</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .complaints-container { padding: 1.5rem; max-width: 1400px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .page-header h2 { margin: 0; font-size: 1.6rem; color: #0f172a; }
    .subtitle { margin: 0.2rem 0 0; color: #64748b; font-size: 0.9rem; }
    .modal-subtitle { font-size: 0.8rem; color: #64748b; margin: 0.2rem 0 0 0; }
    .btn { padding: 0.6rem 1.2rem; border-radius: 8px; font-weight: 600; cursor: pointer; border: none; font-size: 0.9rem; }
    .btn-primary { background: #2563eb; color: #fff; }
    .btn-secondary { background: #e2e8f0; color: #1e293b; }
    .btn-outline { background: #fff; border: 1px solid #cbd5e1; color: #334155; }
    .btn-sm { padding: 0.35rem 0.75rem; font-size: 0.8rem; }
    .filter-bar { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; overflow-x: auto; }
    .filter-bar button { padding: 0.4rem 0.8rem; border-radius: 20px; border: 1px solid #e2e8f0; background: #fff; font-weight: 600; color: #64748b; cursor: pointer; font-size: 0.85rem; }
    .filter-bar button.active { background: #2563eb; color: #fff; border-color: #2563eb; }
    .cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1rem; }
    .complaint-card { background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 1.25rem; display: flex; flex-direction: column; }
    .complaint-card.emergency { border-left: 4px solid #ef4444; }
    .card-header { display: flex; justify-content: space-between; margin-bottom: 0.75rem; }
    .code-badge { font-family: monospace; background: #f1f5f9; padding: 0.2rem 0.4rem; border-radius: 4px; font-size: 0.8rem; }
    .priority-badge { font-size: 0.75rem; font-weight: 700; padding: 0.2rem 0.5rem; border-radius: 6px; text-transform: uppercase; }
    .priority-badge.emergency { background: #fee2e2; color: #dc2626; }
    .priority-badge.high { background: #ffedd5; color: #c2410c; }
    .priority-badge.medium { background: #fef9c3; color: #854d0e; }
    .priority-badge.low { background: #f1f5f9; color: #475569; }
    .card-title { margin: 0 0 0.5rem; font-size: 1.1rem; color: #0f172a; }
    .card-desc { color: #64748b; font-size: 0.85rem; margin: 0 0 1rem; line-height: 1.4; flex-grow: 1; }
    .card-meta { font-size: 0.8rem; color: #475569; display: flex; flex-direction: column; gap: 0.25rem; border-top: 1px solid #f1f5f9; padding-top: 0.75rem; margin-bottom: 1rem; }
    .card-footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f1f5f9; padding-top: 0.75rem; }
    .status-pill { padding: 0.25rem 0.6rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600; }
    .status-pill.new { background: #e0f2fe; color: #0369a1; }
    .status-pill.assigned { background: #ede9fe; color: #6d28d9; }
    .status-pill.in-progress { background: #fef3c7; color: #d97706; }
    .status-pill.resolved { background: #dcfce7; color: #15803d; }
    .status-pill.closed { background: #f1f5f9; color: #64748b; }
    .empty-state { padding: 3rem; text-align: center; color: #94a3b8; font-weight: 500; }
    .modal-form { display: flex; flex-direction: column; flex: 1 1 auto; min-height: 0; overflow: hidden; }
  `]
})
export class ComplaintsComponent implements OnInit, ComponentCanDeactivate {
  complaints: Complaint[] = [];
  branches: Branch[] = [];
  guests: Guest[] = [];
  filterStatus = '';

  showModal = false;
  showUpdateModal = false;
  selectedComplaint: Complaint | null = null;

  newComplaint = {
    branchId: '',
    guestId: '',
    roomId: '',
    category: 'Plumbing',
    title: '',
    description: '',
    priority: 'Medium'
  };

  statusUpdate = {
    status: 'In Progress',
    assignedTo: '',
    resolutionNotes: ''
  };

  constructor(private api: PgApiService, private auth: AuthService, private toast: ToastService) {}

  ngOnInit(): void {
    this.loadData();
  }

  canDeactivate(): boolean {
    if (this.showModal) {
      const isDirty = !!this.newComplaint.title.trim() || !!this.newComplaint.description.trim();
      return !isDirty;
    }
    return true;
  }

  loadData(): void {
    const owner = this.auth.currentUserValue;
    if (!owner) return;

    this.api.getComplaints(owner.ownerId).subscribe({
      next: c => this.complaints = c,
      error: () => this.toast.error('Failed to load complaints.')
    });
    this.api.getBranches(owner.ownerId).subscribe(b => {
      this.branches = b;
      if (b.length > 0 && !this.newComplaint.branchId) {
        this.newComplaint.branchId = b[0].branchId;
      }
    });
    this.api.getGuests(owner.ownerId).subscribe(g => this.guests = g);
  }

  get filteredComplaints(): Complaint[] {
    if (!this.filterStatus) return this.complaints;
    return this.complaints.filter(c => c.status === this.filterStatus);
  }

  setFilter(status: string): void {
    this.filterStatus = status;
  }

  onGuestSelected(guestId: string): void {
    const g = this.guests.find(x => x.guestId === guestId);
    if (g) {
      this.newComplaint.branchId = g.branchId;
      this.newComplaint.roomId = g.roomId;
    }
  }

  openUpdateModal(c: Complaint): void {
    this.selectedComplaint = c;
    this.statusUpdate = {
      status: c.status,
      assignedTo: c.assignedTo || '',
      resolutionNotes: c.resolutionNotes || ''
    };
    this.showUpdateModal = true;
  }

  submitComplaint(): void {
    const owner = this.auth.currentUserValue;
    if (!owner) return;

    if (!this.newComplaint.title.trim() || !this.newComplaint.description.trim()) {
      this.toast.warning('Please provide both complaint title and description.');
      return;
    }

    const payload = {
      ...this.newComplaint,
      ownerId: owner.ownerId,
      guestId: this.newComplaint.guestId || null,
      roomId: this.newComplaint.roomId || null
    };

    this.api.createComplaint(payload).subscribe({
      next: () => {
        this.showModal = false;
        this.newComplaint.title = '';
        this.newComplaint.description = '';
        this.loadData();
        this.toast.success('Complaint ticket logged successfully!');
      },
      error: (err) => this.toast.error(err?.error?.message || 'Failed to raise complaint.')
    });
  }

  submitStatusUpdate(): void {
    if (!this.selectedComplaint) return;

    this.api.updateComplaintStatus(this.selectedComplaint.complaintId, this.statusUpdate).subscribe({
      next: () => {
        this.showUpdateModal = false;
        this.loadData();
        this.toast.success('Complaint status updated successfully!');
      },
      error: (err) => this.toast.error(err?.error?.message || 'Failed to update complaint status.')
    });
  }
}
