import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PgApiService } from '../../core/services/pg-api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ComponentCanDeactivate } from '../../core/guards/pending-changes.guard';
import { StaffMember, Branch } from '../../models/pg.models';
import { InrCurrencyPipe } from '../../shared/pipes/inr-currency.pipe';

@Component({
  selector: 'app-staff',
  standalone: true,
  imports: [CommonModule, FormsModule, InrCurrencyPipe],
  template: `
    <div class="staff-container">
      <header class="page-header">
        <div>
          <h2>Staff Management & Roles</h2>
          <p class="subtitle">Assign property managers, receptionists, wardens, and housekeeping staff.</p>
        </div>
        <button class="btn btn-primary" (click)="showModal = true">+ Add Staff Member</button>
      </header>

      <!-- Staff Grid -->
      <div class="staff-grid" *ngIf="staffList.length > 0; else noStaff">
        <div class="staff-card" *ngFor="let s of staffList">
          <div class="card-header">
            <span class="code-badge">{{ s.staffCode }}</span>
            <span class="badge role">{{ s.role }}</span>
          </div>

          <h3 class="name">{{ s.fullName }}</h3>
          <div class="contact-line">
            <span>{{ s.phoneNumber }}</span> • <span>{{ s.email }}</span>
          </div>

          <div class="details">
            <div><strong>Assigned Branch:</strong> {{ s.branchName || 'All Properties' }}</div>
            <div><strong>Monthly Salary:</strong> {{ s.salary | inrCurrency }}</div>
            <div><strong>Joined:</strong> {{ s.joiningDate | date:'mediumDate' }}</div>
          </div>

          <div class="card-footer">
            <span class="status-pill" [class.active]="s.isActive">{{ s.isActive ? 'Active Staff' : 'Inactive' }}</span>
            <button class="btn btn-sm" [class.btn-danger]="s.isActive" [class.btn-secondary]="!s.isActive" (click)="toggleStatus(s)">
              {{ s.isActive ? 'Deactivate' : 'Activate' }}
            </button>
          </div>
        </div>
      </div>

      <ng-template #noStaff>
        <div class="empty-state">No staff members configured. Add managers or reception staff.</div>
      </ng-template>

      <!-- Add Staff Modal -->
      <div class="modal-backdrop" *ngIf="showModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Add Staff Member</h3>
            <button class="close-btn" (click)="showModal = false">✕</button>
          </div>
          <form (ngSubmit)="submitStaff()" class="modal-form">
            <div class="modal-body">
              <div class="form-group">
                <label>Assigned Branch / Property</label>
                <select [(ngModel)]="newStaff.branchId" name="branchId">
                  <option value="">-- All Properties (Global) --</option>
                  <option *ngFor="let b of branches" [value]="b.branchId">{{ b.branchName }}</option>
                </select>
              </div>

              <div class="form-group">
                <label>Full Name *</label>
                <input type="text" [(ngModel)]="newStaff.fullName" name="fullName" placeholder="e.g. Suresh Kumar" required />
              </div>

              <div class="form-group">
                <label>Email Address *</label>
                <input type="email" [(ngModel)]="newStaff.email" name="email" placeholder="staff@pgmanagement.com" required />
              </div>

              <div class="form-group">
                <label>Phone Number *</label>
                <input type="text" [(ngModel)]="newStaff.phoneNumber" name="phoneNumber" placeholder="10-digit mobile" required />
              </div>

              <div class="form-group">
                <label>System Role *</label>
                <select [(ngModel)]="newStaff.role" name="role" required>
                  <option value="Manager">Property Manager (Ops & Expenses)</option>
                  <option value="Reception">Reception (Check-in, Visitors, Dues)</option>
                  <option value="Warden">Hostel Warden (Discipline & Complaints)</option>
                  <option value="Staff">General Staff</option>
                </select>
              </div>

              <div class="form-group">
                <label>Monthly Salary (₹)</label>
                <input type="number" [(ngModel)]="newStaff.salary" name="salary" min="0" placeholder="e.g. 18000" />
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showModal = false">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Staff</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .staff-container { padding: 1.5rem; max-width: 1400px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .page-header h2 { margin: 0; font-size: 1.6rem; color: #0f172a; }
    .subtitle { margin: 0.2rem 0 0; color: #64748b; font-size: 0.9rem; }
    .btn { padding: 0.6rem 1.2rem; border-radius: 8px; font-weight: 600; cursor: pointer; border: none; font-size: 0.9rem; }
    .btn-primary { background: #2563eb; color: #fff; }
    .btn-secondary { background: #e2e8f0; color: #1e293b; }
    .btn-danger { background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; }
    .btn-sm { padding: 0.35rem 0.75rem; font-size: 0.8rem; }
    .staff-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1rem; }
    .staff-card { background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 1.25rem; display: flex; flex-direction: column; }
    .card-header { display: flex; justify-content: space-between; margin-bottom: 0.75rem; }
    .code-badge { font-family: monospace; background: #f1f5f9; padding: 0.2rem 0.4rem; border-radius: 4px; font-size: 0.8rem; }
    .badge.role { background: #e0e7ff; color: #4338ca; padding: 0.2rem 0.5rem; border-radius: 6px; font-size: 0.75rem; font-weight: 600; }
    .name { margin: 0 0 0.25rem; font-size: 1.15rem; color: #0f172a; }
    .contact-line { font-size: 0.85rem; color: #64748b; margin-bottom: 1rem; }
    .details { font-size: 0.85rem; color: #334155; display: flex; flex-direction: column; gap: 0.35rem; border-top: 1px solid #f1f5f9; padding-top: 0.75rem; margin-bottom: 1rem; flex-grow: 1; }
    .card-footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f1f5f9; padding-top: 0.75rem; }
    .status-pill { font-size: 0.75rem; font-weight: 600; padding: 0.2rem 0.5rem; border-radius: 20px; background: #f1f5f9; color: #64748b; }
    .status-pill.active { background: #dcfce7; color: #15803d; }
    .empty-state { padding: 3rem; text-align: center; color: #94a3b8; font-weight: 500; }
    .modal-form { display: flex; flex-direction: column; flex: 1 1 auto; min-height: 0; overflow: hidden; }
  `]
})
export class StaffComponent implements OnInit, ComponentCanDeactivate {
  staffList: StaffMember[] = [];
  branches: Branch[] = [];
  showModal = false;

  newStaff = {
    branchId: '',
    fullName: '',
    email: '',
    phoneNumber: '',
    role: 'Reception',
    salary: 15000
  };

  constructor(private api: PgApiService, private auth: AuthService, private toast: ToastService) {}

  ngOnInit(): void {
    this.loadData();
  }

  canDeactivate(): boolean {
    if (this.showModal) {
      const isDirty = !!this.newStaff.fullName.trim() || !!this.newStaff.phoneNumber.trim() || !!this.newStaff.email.trim();
      return !isDirty;
    }
    return true;
  }

  loadData(): void {
    const owner = this.auth.currentUserValue;
    if (!owner) return;

    this.api.getStaff(owner.ownerId).subscribe({
      next: s => this.staffList = s,
      error: () => this.toast.error('Failed to load staff list.')
    });
    this.api.getBranches(owner.ownerId).subscribe(b => this.branches = b);
  }

  submitStaff(): void {
    const owner = this.auth.currentUserValue;
    if (!owner) return;

    if (!this.newStaff.fullName.trim() || !this.newStaff.phoneNumber.trim()) {
      this.toast.warning('Please enter staff name and phone number.');
      return;
    }

    const payload = {
      ...this.newStaff,
      ownerId: owner.ownerId,
      branchId: this.newStaff.branchId || null
    };

    this.api.createStaff(payload).subscribe({
      next: () => {
        this.showModal = false;
        this.newStaff.fullName = '';
        this.newStaff.email = '';
        this.newStaff.phoneNumber = '';
        this.loadData();
        this.toast.success('Staff member registered successfully!');
      },
      error: (err) => this.toast.error(err?.error?.message || 'Failed to add staff member.')
    });
  }

  toggleStatus(staff: StaffMember): void {
    this.api.toggleStaffStatus(staff.staffId, !staff.isActive).subscribe({
      next: () => {
        this.loadData();
        this.toast.info(`Staff member marked as ${!staff.isActive ? 'Active' : 'Inactive'}.`);
      },
      error: () => this.toast.error('Failed to change staff status.')
    });
  }
}
