import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { PgApiService } from '../../core/services/pg-api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Guest, Branch, Room } from '../../models/pg.models';
import { InrCurrencyPipe } from '../../shared/pipes/inr-currency.pipe';
import { StatusBadgePipe } from '../../shared/pipes/status-badge.pipe';

@Component({
  selector: 'app-guests',
  standalone: true,
  imports: [CommonModule, FormsModule, InrCurrencyPipe, StatusBadgePipe],
  template: `
    <div class="view-container fade-in">
      <div class="view-header">
        <div>
          <h2>Tenants & Resident Directory</h2>
          <p class="subtitle">Complete tenant profiling with auto-generated G-XXXX codes, advance records, proofs & checkout settlements</p>
        </div>
        <div class="header-buttons">
          <button class="btn btn-primary" (click)="openGuestModal()">+ Check-In New Resident</button>
        </div>
      </div>

      <!-- Search & Filters Toolbar -->
      <div class="table-toolbar">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input type="text" placeholder="Search by name, code, phone, room, occupation..." [(ngModel)]="searchTerm" />
        </div>
        <div class="filter-controls">
          <select [(ngModel)]="statusFilter">
            <option value="ALL">All Statuses</option>
            <option value="Active">Active Residents</option>
            <option value="Notice_Period">Notice Period</option>
            <option value="Vacated">Vacated / Historical</option>
          </select>
        </div>
      </div>

      <!-- Desktop / Tablet Table View -->
      <div class="table-wrapper desktop-only">
        <table class="data-table">
          <thead>
            <tr>
              <th>Resident Profile</th>
              <th>Property & Location</th>
              <th>Tenant Type & Rent</th>
              <th>Deposit Advance</th>
              <th>Joining & Vacate Notice</th>
              <th>Proof Document</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let g of filteredGuests">
              <td>
                <div class="resident-cell">
                  <strong>{{ g.fullName }} <small class="text-muted">({{ g.guestCode }})</small></strong>
                  <span class="sub-text">{{ g.phoneNumber }} • {{ g.gender }}, {{ g.age }} yrs</span>
                  <span class="sub-text text-indigo">💼 {{ g.occupation }} ({{ g.workplaceOrCollege }})</span>
                </div>
              </td>
              <td>
                <div class="location-cell">
                  <span class="branch-tag">{{ g.branchName || 'Main Property' }}</span>
                  <span class="room-bed-tag">Room <strong>{{ g.roomNumber }}</strong> | Bed <strong>{{ g.bedNumber }}</strong></span>
                </div>
              </td>
              <td>
                <span class="badge badge-info">{{ g.tenantType }}</span>
                <strong class="rent-text">{{ g.monthlyRent | inrCurrency }}/mo</strong>
              </td>
              <td>
                <strong class="advance-text">{{ g.advanceAmount | inrCurrency }}</strong>
                <span class="sub-text" *ngIf="g.status === 'Vacated'">Refunded: {{ g.vacatingReturnedAmount | inrCurrency }}</span>
              </td>
              <td>
                <div class="date-cell">
                  <span>Joined: {{ g.joiningDate | date:'mediumDate' }}</span>
                  <span class="vacate-notice" *ngIf="g.expectedVacatingDate">
                    Vacates: {{ g.expectedVacatingDate | date:'mediumDate' }}
                    <span class="reminder-pill">Notice: {{ g.daysBeforeVacateReminder }}d</span>
                  </span>
                </div>
              </td>
              <td>
                <div class="doc-cell" *ngIf="g.proofDocumentType">
                  <span class="doc-type">📄 {{ g.proofDocumentType }}</span>
                  <span class="doc-num">{{ g.proofDocumentNumber }}</span>
                </div>
                <span *ngIf="!g.proofDocumentType" class="sub-text text-muted">Pending</span>
              </td>
              <td>
                <span class="badge" [ngClass]="g.status | statusBadge">{{ g.status }}</span>
              </td>
              <td>
                <button *ngIf="g.status !== 'Vacated'" class="btn btn-danger btn-sm" (click)="openVacateModal(g)">
                  Vacate / Settle
                </button>
                <span *ngIf="g.status === 'Vacated'" class="badge badge-danger">Settled</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile Cards View (< 768px) -->
      <div class="mobile-cards-list mobile-only">
        <div *ngFor="let g of filteredGuests" class="mobile-resident-card">
          <div class="m-card-header">
            <div>
              <h4>{{ g.fullName }} <small>({{ g.guestCode }})</small></h4>
              <p class="m-phone">📞 {{ g.phoneNumber }}</p>
            </div>
            <span class="badge" [ngClass]="g.status | statusBadge">{{ g.status }}</span>
          </div>
          <div class="m-card-body">
            <div class="m-row"><span class="label">Location:</span> <span>{{ g.branchName }} (Room {{ g.roomNumber }} - Bed {{ g.bedNumber }})</span></div>
            <div class="m-row"><span class="label">Occupation:</span> <span>{{ g.occupation }} ({{ g.workplaceOrCollege }})</span></div>
            <div class="m-row"><span class="label">Rent / Advance:</span> <span>{{ g.monthlyRent | inrCurrency }} / Advance: {{ g.advanceAmount | inrCurrency }}</span></div>
            <div class="m-row" *ngIf="g.expectedVacatingDate"><span class="label">Vacating:</span> <span class="text-amber">{{ g.expectedVacatingDate | date:'mediumDate' }}</span></div>
          </div>
          <div class="m-card-footer" *ngIf="g.status !== 'Vacated'">
            <button class="btn btn-danger btn-sm full-w" (click)="openVacateModal(g)">Vacate & Refund Settlement</button>
          </div>
        </div>
      </div>

      <!-- Check-In Guest Modal -->
      <div class="modal-backdrop" *ngIf="showGuestModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Resident Check-In & Bed Assignment</h3>
            <button class="close-btn" (click)="showGuestModal = false">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-row-2">
              <div class="form-group">
                <label>Target Branch *</label>
                <select [(ngModel)]="newGuest.branchId">
                  <option *ngFor="let b of branches" [value]="b.branchId">{{ b.branchName }} ({{ b.branchCode }})</option>
                </select>
              </div>
              <div class="form-group">
                <label>Target Room *</label>
                <select [(ngModel)]="newGuest.roomId" (change)="onRoomSelected()">
                  <option value="">-- Choose Room --</option>
                  <option *ngFor="let r of getAvailableRooms()" [value]="r.roomId">{{ r.roomCode }} - Room {{ r.roomNumber }} ({{ r.roomType }})</option>
                </select>
              </div>
            </div>

            <div class="form-row-2">
              <div class="form-group">
                <label>Select Bed *</label>
                <select [(ngModel)]="newGuest.bedId">
                  <option value="">-- Choose Bed --</option>
                  <option *ngFor="let b of getAvailableBeds()" [value]="b.bedId">Bed {{ b.bedNumber }} (₹{{ b.bedRent }}/mo)</option>
                </select>
              </div>
              <div class="form-group">
                <label>Tenant Type *</label>
                <select [(ngModel)]="newGuest.tenantType">
                  <option value="Monthly">Monthly</option>
                  <option value="Daily">Daily</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div class="form-row-2">
              <div class="form-group"><label>Full Name *</label><input type="text" [(ngModel)]="newGuest.fullName" placeholder="Ramesh" /></div>
              <div class="form-group"><label>Email Address *</label><input type="email" [(ngModel)]="newGuest.email" placeholder="ramesh@example.com" /></div>
            </div>

            <div class="form-row-2">
              <div class="form-group"><label>Phone Number *</label><input type="text" [(ngModel)]="newGuest.phoneNumber" placeholder="+91 99887 76655" /></div>
              <div class="form-group"><label>Emergency Contact</label><input type="text" [(ngModel)]="newGuest.emergencyContact" /></div>
            </div>

            <div class="form-row-2">
              <div class="form-group"><label>Age</label><input type="number" [(ngModel)]="newGuest.age" /></div>
              <div class="form-group">
                <label>Gender</label>
                <select [(ngModel)]="newGuest.gender">
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div class="form-row-2">
              <div class="form-group"><label>Occupation</label><input type="text" [(ngModel)]="newGuest.occupation" /></div>
              <div class="form-group"><label>Workplace / College</label><input type="text" [(ngModel)]="newGuest.workplaceOrCollege" /></div>
            </div>

            <div class="form-row-3">
              <div class="form-group"><label>Advance Deposit (₹) *</label><input type="number" [(ngModel)]="newGuest.advanceAmount" /></div>
              <div class="form-group"><label>Monthly Rent (₹) *</label><input type="number" [(ngModel)]="newGuest.monthlyRent" /></div>
              <div class="form-group"><label>Notice Reminder (Days)</label><input type="number" [(ngModel)]="newGuest.daysBeforeVacateReminder" /></div>
            </div>

            <div class="form-row-2">
              <div class="form-group"><label>Joining Date</label><input type="date" [(ngModel)]="newGuest.joiningDate" /></div>
              <div class="form-group"><label>Expected Vacating Date</label><input type="date" [(ngModel)]="newGuest.expectedVacatingDate" /></div>
            </div>

            <div class="form-row-2">
              <div class="form-group">
                <label>Proof Document</label>
                <select [(ngModel)]="newGuest.proofDocumentType">
                  <option value="Aadhaar Card">Aadhaar Card</option>
                  <option value="Passport">Passport</option>
                  <option value="Driving License">Driving License</option>
                  <option value="Voter ID">Voter ID</option>
                </select>
              </div>
              <div class="form-group"><label>Document Number</label><input type="text" [(ngModel)]="newGuest.proofDocumentNumber" placeholder="XXXX-XXXX-XXXX" /></div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showGuestModal = false">Cancel</button>
            <button class="btn btn-primary" (click)="saveGuest()">Confirm Check-In</button>
          </div>
        </div>
      </div>

      <!-- Vacate Modal -->
      <div class="modal-backdrop" *ngIf="showVacateModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Vacate Resident & Settlement</h3>
            <button class="close-btn" (click)="showVacateModal = false">✕</button>
          </div>
          <div class="modal-body">
            <p><strong>Resident:</strong> {{ selectedGuest?.fullName }} ({{ selectedGuest?.guestCode }})</p>
            <p><strong>Advance Held:</strong> {{ selectedGuest?.advanceAmount | inrCurrency }}</p>
            <div class="form-row-2 mt-3">
              <div class="form-group"><label>Refund Returned (₹)</label><input type="number" [(ngModel)]="vacateForm.returnedAmount" /></div>
              <div class="form-group"><label>Deductions (₹)</label><input type="number" [(ngModel)]="vacateForm.deductionsAmount" /></div>
            </div>
            <div class="form-group">
              <label>Settlement Notes</label>
              <textarea rows="3" [(ngModel)]="vacateForm.settlementNotes"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showVacateModal = false">Cancel</button>
            <button class="btn btn-danger" (click)="confirmVacate()">Vacate & Free Bed</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .view-container { display: flex; flex-direction: column; gap: 1.5rem; }
    .view-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      h2 { font-size: 1.5rem; font-weight: 800; }
      .subtitle { font-size: 0.85rem; color: var(--text-muted); }
    }
    .table-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      .search-box {
        display: flex;
        align-items: center;
        background: #ffffff;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-sm);
        padding: 0.5rem 0.85rem;
        flex: 1;
        max-width: 450px;
        input { border: none; outline: none; width: 100%; font-size: 0.85rem; margin-left: 0.5rem; }
      }
      .filter-controls select { padding: 0.5rem 1rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color); background: #ffffff; }
    }
    .table-wrapper {
      background: #ffffff;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
      overflow-x: auto;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      th { background: #f8fafc; padding: 0.85rem 1rem; font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); border-bottom: 1px solid var(--border-color); text-align: left; }
      td { padding: 1rem; border-bottom: 1px solid var(--border-color); vertical-align: middle; }
      .resident-cell { display: flex; flex-direction: column; strong { font-size: 0.95rem; } .sub-text { font-size: 0.75rem; color: var(--text-muted); } .text-indigo { color: var(--primary); font-weight: 600; } }
      .location-cell { display: flex; flex-direction: column; .branch-tag { font-size: 0.75rem; font-weight: 600; color: var(--text-muted); } }
      .rent-text { display: block; margin-top: 0.25rem; }
      .advance-text { color: #059669; font-size: 0.95rem; }
      .date-cell { font-size: 0.75rem; color: var(--text-muted); .vacate-notice { color: #b45309; font-weight: 600; display: block; margin-top: 0.2rem; } .reminder-pill { background: #fef3c7; color: #92400e; padding: 0.1rem 0.3rem; border-radius: 4px; font-size: 0.65rem; } }
      .doc-cell { display: flex; flex-direction: column; font-size: 0.75rem; }
    }
    .mobile-resident-card {
      background: #ffffff;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
      padding: 1rem;
      margin-bottom: 1rem;
      .m-card-header { display: flex; justify-content: space-between; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem; }
      .m-card-body { padding: 0.75rem 0; display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.825rem; .m-row { display: flex; justify-content: space-between; .label { color: var(--text-muted); font-weight: 600; } } }
      .m-card-footer { border-top: 1px dashed var(--border-color); padding-top: 0.5rem; }
    }
    .form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-row-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; }
    @media (max-width: 767px) {
      .table-toolbar { flex-direction: column; align-items: stretch; }
      .form-row-2, .form-row-3 { grid-template-columns: 1fr; }
    }
  `]
})
export class GuestsComponent implements OnInit {
  guests: Guest[] = [];
  branches: Branch[] = [];
  searchTerm = '';
  statusFilter = 'ALL';

  showGuestModal = false;
  showVacateModal = false;
  selectedGuest: Guest | null = null;

  newGuest: any = {
    branchId: '',
    roomId: '',
    bedId: '',
    fullName: '',
    email: '',
    phoneNumber: '',
    emergencyContact: '',
    age: 24,
    gender: 'Male',
    occupation: 'Software Engineer',
    workplaceOrCollege: '',
    tenantType: 'Monthly',
    advanceAmount: 10000,
    monthlyRent: 8000,
    dailyRent: 0,
    joiningDate: new Date().toISOString().substring(0, 10),
    expectedVacatingDate: '',
    daysBeforeVacateReminder: 15,
    proofDocumentType: 'Aadhaar Card',
    proofDocumentNumber: ''
  };

  vacateForm = {
    returnedAmount: 0,
    deductionsAmount: 1500,
    settlementNotes: 'Vacate settlement after room inspection.'
  };

  constructor(private api: PgApiService, private auth: AuthService, private route: ActivatedRoute, private toast: ToastService) {}

  ngOnInit(): void {
    this.loadData();
    this.route.queryParams.subscribe(params => {
      if (params['bedId']) {
        this.openGuestModal(params['branchId'], params['roomId'], params['bedId']);
      }
    });
  }

  loadData(): void {
    const ownerId = this.auth.currentUserValue?.ownerId;
    if (!ownerId) return;
    this.api.getGuests(ownerId).subscribe(data => this.guests = data);
    this.api.getBranches(ownerId).subscribe(data => this.branches = data);
  }

  get filteredGuests(): Guest[] {
    return this.guests.filter(g => {
      const match = (g.fullName + (g.guestCode || '') + g.phoneNumber + (g.roomNumber || '') + (g.occupation || '')).toLowerCase().includes(this.searchTerm.toLowerCase());
      const statusMatch = this.statusFilter === 'ALL' || g.status === this.statusFilter;
      return match && statusMatch;
    });
  }

  openGuestModal(branchId?: string, roomId?: string, bedId?: string): void {
    this.newGuest = {
      branchId: branchId || this.branches[0]?.branchId || '',
      roomId: roomId || '',
      bedId: bedId || '',
      fullName: '',
      email: '',
      phoneNumber: '',
      emergencyContact: '',
      age: 24,
      gender: 'Male',
      occupation: 'Software Engineer',
      workplaceOrCollege: '',
      tenantType: 'Monthly',
      advanceAmount: 10000,
      monthlyRent: 8000,
      dailyRent: 0,
      joiningDate: new Date().toISOString().substring(0, 10),
      expectedVacatingDate: '',
      daysBeforeVacateReminder: 15,
      proofDocumentType: 'Aadhaar Card',
      proofDocumentNumber: ''
    };
    this.showGuestModal = true;
  }

  getAvailableRooms(): Room[] {
    const branch = this.branches.find(b => b.branchId === this.newGuest.branchId);
    const rooms: Room[] = [];
    branch?.floors?.forEach(f => f.rooms?.forEach(r => rooms.push(r)));
    return rooms;
  }

  getAvailableBeds(): any[] {
    const rooms = this.getAvailableRooms();
    const room = rooms.find(r => r.roomId === this.newGuest.roomId);
    return room?.beds?.filter(b => !b.isOccupied) || [];
  }

  onRoomSelected(): void {
    const beds = this.getAvailableBeds();
    if (beds.length > 0) {
      this.newGuest.bedId = beds[0].bedId;
      this.newGuest.monthlyRent = beds[0].bedRent;
    } else {
      this.newGuest.bedId = '';
    }
  }

  saveGuest(): void {
    if (!this.newGuest.fullName || !this.newGuest.email || !this.newGuest.phoneNumber || !this.newGuest.bedId) {
      this.toast.warning('Please fill Name, Email, Phone and select an available Bed.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.newGuest.email.trim())) {
      this.toast.warning('Please enter a valid email address.');
      return;
    }

    const payload = {
      ...this.newGuest,
      email: this.newGuest.email.trim(),
      ownerId: this.auth.currentUserValue?.ownerId
    };
    this.api.checkInGuest(payload).subscribe({
      next: () => {
        this.showGuestModal = false;
        this.loadData();
        this.toast.success('Resident checked in successfully!');
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Failed to check-in resident.');
      }
    });
  }

  openVacateModal(guest: Guest): void {
    this.selectedGuest = guest;
    this.vacateForm = {
      returnedAmount: Math.max(0, (guest.advanceAmount || 0) - 1500),
      deductionsAmount: 1500,
      settlementNotes: 'Advance settlement refund processed.'
    };
    this.showVacateModal = true;
  }

  confirmVacate(): void {
    if (!this.selectedGuest?.guestId) return;
    this.api.vacateGuest(this.selectedGuest.guestId, this.vacateForm).subscribe(() => {
      this.showVacateModal = false;
      this.loadData();
    });
  }
}
