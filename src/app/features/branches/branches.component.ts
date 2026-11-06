import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PgApiService } from '../../core/services/pg-api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Branch, Room, Owner, Floor } from '../../models/pg.models';
import { InrCurrencyPipe } from '../../shared/pipes/inr-currency.pipe';
import { BedHistoryModalComponent } from '../../shared/components/bed-history-modal.component';

@Component({
  selector: 'app-branches',
  standalone: true,
  imports: [CommonModule, FormsModule, InrCurrencyPipe, BedHistoryModalComponent],
  template: `
    <div class="view-container fade-in">
      <div class="view-header">
        <div>
          <h2>Branches, Floors & Room Matrix</h2>
          <p class="subtitle">Architecture with auto-generated code tracking (BR-XXXX, FL-XXXX, R-XXXX, BED-XXXX)</p>
        </div>
        <div class="header-buttons">
          <div class="quota-badge" [class.limit-reached]="branches.length >= (currentOwner?.expectedBranches || 1)">
            <span class="quota-text">Quota: <strong>{{ branches.length }} / {{ currentOwner?.expectedBranches || 1 }} Properties</strong></span>
            <button class="btn btn-xs btn-outline-info" (click)="openProfileModal()">Update Quota</button>
          </div>
          <button class="btn btn-primary" (click)="handleAddNewBranch()">+ Add New Branch</button>
        </div>
      </div>

      <!-- Limit Alert Banner -->
      <div class="quota-alert-banner" *ngIf="branches.length >= (currentOwner?.expectedBranches || 1)">
        <span class="alert-icon">⚠️</span>
        <div class="alert-text">
          <strong>Branch limit reached ({{ branches.length }}/{{ currentOwner?.expectedBranches || 1 }})!</strong>
          <span>To add more branches, please update your owner profile's <em>Expected Branches</em> field.</span>
        </div>
        <button class="btn btn-sm btn-primary" (click)="openProfileModal()">Update Expected Branches</button>
      </div>

      <div class="branches-container">
        <div *ngFor="let branch of branches" class="branch-card-deep">
          <div class="branch-deep-header">
            <div>
              <div class="title-row">
                <h3>{{ branch.branchName }}</h3>
                <span class="badge badge-info">{{ branch.branchCode }}</span>
              </div>
              <p class="sub-address">📍 {{ branch.addressLine }}, {{ branch.city }} • 📞 {{ branch.contactNumber }}</p>
            </div>
            <div class="branch-top-actions">
              <button class="btn btn-secondary btn-sm" (click)="openFloorModal(branch.branchId)">+ Add Floor</button>
              <button class="btn btn-primary btn-sm" (click)="openRoomModal(branch.branchId)">+ Add Room</button>
            </div>
          </div>

          <div class="floors-matrix">
            <div *ngFor="let floor of branch.floors" class="floor-block">
              <div class="floor-header">
                <div class="floor-title">
                  <span class="floor-badge">{{ floor.floorCode }}</span>
                  <h4>{{ floor.floorName }}</h4>
                </div>
                <button class="btn btn-secondary btn-sm" (click)="openRoomModal(branch.branchId, floor.floorId)">
                  + Add Room to Floor
                </button>
              </div>

              <div class="rooms-grid">
                <div *ngFor="let room of floor.rooms" class="room-card">
                  <div class="room-top">
                    <div>
                      <strong>{{ room.roomCode }} (Room {{ room.roomNumber }})</strong>
                      <span class="room-type-tag">{{ room.roomType }}</span>
                    </div>
                    <div class="room-actions">
                      <div class="room-rent">{{ room.roomRent | inrCurrency }} <small>/mo</small></div>
                      <button class="btn btn-edit-icon" (click)="openEditRoomModal(branch.branchId, room)" title="Edit Room">
                        ✏️ Edit
                      </button>
                    </div>
                  </div>

                  <div class="amenities-row">
                    <span class="amenity-badge" [class.active]="room.hasAc">
                      {{ room.hasAc ? '❄️ AC' : '💨 Non-AC' }}
                    </span>
                    <span class="amenity-badge" [class.active]="room.hasAttachedBathroom">
                      {{ room.hasAttachedBathroom ? '🚿 Attached Bath' : 'Common Bath' }}
                    </span>
                    <span class="amenity-badge active" *ngIf="room.hasBalcony">🌿 Balcony</span>
                  </div>

                  <div class="beds-section">
                    <span class="beds-label">Beds Inventory ({{ room.beds?.length || 0 }} total):</span>
                    <div class="beds-grid">
                      <div *ngFor="let bed of room.beds" 
                           class="bed-box" 
                           [class.occupied]="bed.isOccupied"
                           [class.available]="!bed.isOccupied">
                        <div class="bed-header">
                          <span class="bed-num" (click)="openBedHistory(bed.bedId)" style="cursor: pointer; text-decoration: underline;" title="Click to view full Bed History">
                            Bed {{ bed.bedNumber }} 🔍
                          </span>
                          <span class="bed-code" *ngIf="bed.bedCode">{{ bed.bedCode }}</span>
                          <span class="bed-status">{{ bed.isOccupied ? 'Occupied' : 'Free' }}</span>
                        </div>
                        <div class="bed-price">{{ bed.bedRent | inrCurrency }}/mo</div>
                        <div class="bed-btn-row">
                          <button class="btn btn-xs btn-outline-info" (click)="openBedHistory(bed.bedId)" title="View Bed History & Collections">
                            History 📜
                          </button>
                          <button *ngIf="!bed.isOccupied" 
                                  class="btn btn-xs btn-outline-book"
                                  (click)="assignBed(branch.branchId, room.roomId, bed.bedId)">
                            Book
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div *ngIf="!floor.rooms || floor.rooms.length === 0" class="empty-state">
                  <p>No rooms added on this floor yet.</p>
                  <button class="btn btn-secondary btn-sm" (click)="openRoomModal(branch.branchId, floor.floorId)">+ Add Room</button>
                </div>
              </div>
            </div>

            <div *ngIf="!branch.floors || branch.floors.length === 0" class="empty-state">
              <p>No floors configured for this branch.</p>
              <button class="btn btn-primary btn-sm" (click)="openFloorModal(branch.branchId)">+ Add Floor</button>
            </div>
          </div>
        </div>
      </div>

      <!-- ==================================================================== -->
      <!-- MODAL 1: Add New PG Branch                                           -->
      <!-- ==================================================================== -->
      <div class="modal-backdrop" *ngIf="showBranchModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Add New PG Branch</h3>
            <button class="close-btn" (click)="showBranchModal = false">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Branch Name *</label>
              <input type="text" [(ngModel)]="newBranch.branchName" placeholder="e.g. Sri Sai Luxury PG for Gents" />
            </div>
            <div class="form-group">
              <label>Contact Phone</label>
              <input type="text" [(ngModel)]="newBranch.contactNumber" placeholder="+91 98765 43210" />
            </div>
            <div class="form-group">
              <label>Address Line *</label>
              <input type="text" [(ngModel)]="newBranch.addressLine" placeholder="Plot No, Main Road" />
            </div>
            <div class="form-row-3">
              <div class="form-group"><label>City *</label><input type="text" [(ngModel)]="newBranch.city" /></div>
              <div class="form-group"><label>State *</label><input type="text" [(ngModel)]="newBranch.state" /></div>
              <div class="form-group"><label>Pincode</label><input type="text" [(ngModel)]="newBranch.pincode" /></div>
            </div>
            <div class="form-group">
              <label>Number of Floors (Auto-generates Floors without Rooms)</label>
              <input type="number" min="1" max="10" [(ngModel)]="newBranch.totalFloors" />
              <small class="form-help">Creates empty floors (Ground Floor, 1st Floor, etc.) with FL-XXXX codes. Rooms will NOT be auto-added and can be created per floor as needed.</small>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showBranchModal = false">Cancel</button>
            <button class="btn btn-primary" (click)="saveBranch()">Create Branch</button>
          </div>
        </div>
      </div>

      <!-- ==================================================================== -->
      <!-- MODAL 2: Add Floor to Branch                                         -->
      <!-- ==================================================================== -->
      <div class="modal-backdrop" *ngIf="showFloorModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Add Floor to Property</h3>
            <button class="close-btn" (click)="showFloorModal = false">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Target Branch</label>
              <select [(ngModel)]="newFloor.branchId" (change)="onFloorBranchChange()">
                <option *ngFor="let b of branches" [value]="b.branchId">
                  {{ b.branchName }} ({{ b.branchCode }})
                </option>
              </select>
            </div>
            <div class="form-row-2">
              <div class="form-group">
                <label>Floor Number *</label>
                <input type="number" min="0" max="20" [(ngModel)]="newFloor.floorNumber" placeholder="e.g. 1" />
              </div>
              <div class="form-group">
                <label>Floor Name *</label>
                <input type="text" [(ngModel)]="newFloor.floorName" placeholder="e.g. 1st Floor, Terrace Floor" />
              </div>
            </div>
            <div class="form-group">
              <label>Description / Notes</label>
              <input type="text" [(ngModel)]="newFloor.description" placeholder="e.g. East wing floor layout" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showFloorModal = false">Cancel</button>
            <button class="btn btn-primary" (click)="saveFloor()">Add Floor (Empty)</button>
          </div>
        </div>
      </div>

      <!-- ==================================================================== -->
      <!-- MODAL 3: Add Room to Floor                                           -->
      <!-- ==================================================================== -->
      <div class="modal-backdrop" *ngIf="showRoomModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Add Room to Floor</h3>
            <button class="close-btn" (click)="showRoomModal = false">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-row-2">
              <div class="form-group">
                <label>Select Floor *</label>
                <select [(ngModel)]="newRoom.floorId">
                  <option *ngFor="let fl of getFloorsForBranch(newRoom.branchId)" [value]="fl.floorId">
                    {{ fl.floorName }} ({{ fl.floorCode }})
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label>Room Number *</label>
                <input type="text" [(ngModel)]="newRoom.roomNumber" placeholder="e.g. 101, 201" />
              </div>
            </div>
            <div class="form-group">
              <label>Sharing (Auto-assigns Beds)</label>
              <select [(ngModel)]="newRoom.shareOption" (change)="onShareOptionChange(newRoom)">
                <option value="1">1 share (1 Bed)</option>
                <option value="2">2 share (2 Beds)</option>
                <option value="3">3 share (3 Beds)</option>
                <option value="4">4 share (4 Beds)</option>
                <option value="5">5 share (5 Beds)</option>
              </select>
            </div>
            <div class="form-row-3">
              <div class="form-group">
                <label>Total Beds</label>
                <input type="number" [ngModel]="newRoom.totalBeds" readonly class="input-readonly" />
              </div>
              <div class="form-group">
                <label>Bed Rent (₹) *</label>
                <input type="number" [(ngModel)]="newRoom.bedRent" (ngModelChange)="onRentCalculationChange(newRoom)" placeholder="8000" />
              </div>
              <div class="form-group">
                <label>Total Room Rent (₹) [Calculated]</label>
                <input type="number" [ngModel]="newRoom.roomRent" disabled class="input-disabled" title="Calculated as Total Beds × Bed Rent" />
                <small class="help-calc">= {{ newRoom.totalBeds }} beds × {{ newRoom.bedRent || 0 | inrCurrency }}</small>
              </div>
            </div>
            <div class="checkbox-group">
              <label><input type="checkbox" [(ngModel)]="newRoom.hasAttachedBathroom" /> Attached Bath</label>
              <label><input type="checkbox" [(ngModel)]="newRoom.hasAc" /> AC Installed</label>
              <label><input type="checkbox" [(ngModel)]="newRoom.hasBalcony" /> Balcony Attached</label>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showRoomModal = false">Cancel</button>
            <button class="btn btn-primary" (click)="saveRoom()">Save Room & Auto-Beds</button>
          </div>
        </div>
      </div>

      <!-- ==================================================================== -->
      <!-- MODAL 4: Edit Room                                                   -->
      <!-- ==================================================================== -->
      <div class="modal-backdrop" *ngIf="showEditRoomModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Edit Room ({{ editingRoom?.roomCode }})</h3>
            <button class="close-btn" (click)="showEditRoomModal = false">✕</button>
          </div>
          <div class="modal-body" *ngIf="editingRoom">
            <div class="form-row-2">
              <div class="form-group">
                <label>Room Number *</label>
                <input type="text" [(ngModel)]="editingRoom.roomNumber" placeholder="e.g. 101" />
              </div>
              <div class="form-group">
                <label>Sharing (Auto-syncs Beds)</label>
                <select [(ngModel)]="editingRoom.shareOption" (change)="onShareOptionChange(editingRoom)">
                  <option value="1">1 share (1 Bed)</option>
                  <option value="2">2 share (2 Beds)</option>
                  <option value="3">3 share (3 Beds)</option>
                  <option value="4">4 share (4 Beds)</option>
                  <option value="5">5 share (5 Beds)</option>
                </select>
              </div>
            </div>
            <div class="form-row-3">
              <div class="form-group">
                <label>Total Beds</label>
                <input type="number" [ngModel]="editingRoom.totalBeds" readonly class="input-readonly" />
              </div>
              <div class="form-group">
                <label>Bed Rent (₹) *</label>
                <input type="number" [(ngModel)]="editingRoom.bedRent" (ngModelChange)="onRentCalculationChange(editingRoom)" />
              </div>
              <div class="form-group">
                <label>Total Room Rent (₹) [Calculated]</label>
                <input type="number" [ngModel]="editingRoom.roomRent" disabled class="input-disabled" title="Calculated as Total Beds × Bed Rent" />
                <small class="help-calc">= {{ editingRoom.totalBeds }} beds × {{ editingRoom.bedRent || 0 | inrCurrency }}</small>
              </div>
            </div>
            <div class="checkbox-group">
              <label><input type="checkbox" [(ngModel)]="editingRoom.hasAttachedBathroom" /> Attached Bath</label>
              <label><input type="checkbox" [(ngModel)]="editingRoom.hasAc" /> AC Installed</label>
              <label><input type="checkbox" [(ngModel)]="editingRoom.hasBalcony" /> Balcony Attached</label>
            </div>
            <div class="info-note">
              ℹ️ Updating sharing from <strong>{{ editingRoomOriginalBeds }}</strong> to <strong>{{ editingRoom.totalBeds }}</strong> will automatically manage the bed codes (adding new sequential BED-XXXX codes or pruning unoccupied ones).
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showEditRoomModal = false">Cancel</button>
            <button class="btn btn-primary" (click)="saveEditedRoom()">Update Room</button>
          </div>
        </div>
      </div>

      <!-- ==================================================================== -->
      <!-- MODAL 5: Update Owner Profile (Expected Branches Quota)              -->
      <!-- ==================================================================== -->
      <div class="modal-backdrop" *ngIf="showProfileModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Update Owner Profile & Quota</h3>
            <button class="close-btn" (click)="showProfileModal = false">✕</button>
          </div>
          <div class="modal-body" *ngIf="ownerProfileForm">
            <div class="form-group">
              <label>Full Name *</label>
              <input type="text" [(ngModel)]="ownerProfileForm.fullName" />
            </div>
            <div class="form-group">
              <label>Phone Number *</label>
              <input type="text" [(ngModel)]="ownerProfileForm.phoneNumber" />
            </div>
            <div class="form-group">
              <label>Expected Branches Quota * (Currently: {{ branches.length }} added)</label>
              <input type="number" min="1" max="100" [(ngModel)]="ownerProfileForm.expectedBranches" />
              <small class="form-help">Increase this value to allow adding more properties/branches.</small>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showProfileModal = false">Cancel</button>
            <button class="btn btn-primary" (click)="saveOwnerProfile()">Save & Update Quota</button>
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
    .view-container { display: flex; flex-direction: column; gap: 1.5rem; }
    .view-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      h2 { font-size: 1.5rem; font-weight: 800; }
      .subtitle { font-size: 0.85rem; color: var(--text-muted); }
      .header-buttons { display: flex; align-items: center; gap: 1rem; }
    }
    .quota-badge {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: #f1f5f9;
      border: 1px solid var(--border-color);
      padding: 0.4rem 0.85rem;
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
      &.limit-reached {
        background: #fef2f2;
        border-color: #fecaca;
        color: #991b1b;
      }
    }
    .quota-alert-banner {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-left: 4px solid #f59e0b;
      padding: 0.85rem 1.25rem;
      border-radius: var(--radius-sm);
      .alert-icon { font-size: 1.5rem; }
      .alert-text {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
        font-size: 0.9rem;
        color: #92400e;
      }
    }
    .branches-container { display: flex; flex-direction: column; gap: 2rem; }
    .branch-card-deep {
      background: #ffffff;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
      overflow: hidden;
      .branch-deep-header {
        background: #f8fafc;
        padding: 1.25rem 1.5rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid var(--border-color);
        .title-row { display: flex; align-items: center; gap: 0.75rem; h3 { font-size: 1.25rem; font-weight: 700; } }
        .sub-address { font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem; }
        .branch-top-actions { display: flex; gap: 0.5rem; }
      }
    }
    .floors-matrix { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem; }
    .floor-block {
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      padding: 1.25rem;
      .floor-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px dashed var(--border-color);
        padding-bottom: 0.75rem;
        margin-bottom: 1rem;
        .floor-title {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          .floor-badge { background: var(--primary-light); color: var(--primary); font-size: 0.75rem; font-weight: 700; padding: 0.2rem 0.5rem; border-radius: 4px; }
          h4 { font-size: 1.05rem; font-weight: 700; }
        }
      }
    }
    .rooms-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
    }
    .room-card {
      background: var(--bg-main);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      .room-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        strong { font-size: 0.95rem; }
        .room-type-tag { font-size: 0.725rem; color: var(--text-muted); display: block; }
        .room-actions {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.35rem;
          .room-rent { font-size: 0.95rem; font-weight: 800; color: var(--primary); }
          .btn-edit-icon {
            background: #ffffff;
            border: 1px solid var(--border-color);
            border-radius: 4px;
            font-size: 0.725rem;
            padding: 0.15rem 0.45rem;
            cursor: pointer;
            color: #3b82f6;
            font-weight: 600;
            &:hover { background: #eff6ff; border-color: #3b82f6; }
          }
        }
      }
      .amenities-row {
        display: flex;
        gap: 0.4rem;
        flex-wrap: wrap;
        .amenity-badge {
          font-size: 0.7rem;
          padding: 0.15rem 0.4rem;
          background: #e2e8f0;
          border-radius: 4px;
          color: var(--text-muted);
          &.active { background: #e0e7ff; color: #3730a3; font-weight: 600; }
        }
      }
      .beds-section {
        .beds-label { font-size: 0.75rem; font-weight: 700; color: var(--text-muted); margin-bottom: 0.4rem; display: block; }
        .beds-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; }
        .bed-box {
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          padding: 0.5rem;
          background: #ffffff;
          text-align: center;
          .bed-header { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            font-size: 0.75rem; 
            font-weight: 700;
            gap: 0.25rem;
            flex-wrap: wrap;
          }
          .bed-code {
            font-family: monospace;
            font-size: 0.65rem;
            color: #2563eb;
            background: #eff6ff;
            padding: 0.1rem 0.35rem;
            border-radius: 3px;
          }
          .bed-price { font-size: 0.75rem; color: var(--text-muted); margin: 0.25rem 0; }
          &.occupied { background: #fef2f2; border-color: #fecaca; .bed-status { color: #dc2626; } }
          &.available { background: #ecfdf5; border-color: #a7f3d0; .bed-status { color: #059669; } }
          .btn-outline-book {
            flex: 1;
            padding: 0.2rem 0.4rem;
            font-size: 0.675rem;
            background: #ffffff;
            color: #059669;
            border: 1px solid #10b981;
            border-radius: 4px;
            cursor: pointer;
          }
          .bed-btn-row {
            display: flex;
            gap: 0.35rem;
            margin-top: 0.35rem;
            button { flex: 1; }
          }
        }
      }
    }
    .empty-state {
      grid-column: 1 / -1;
      text-align: center;
      padding: 1.5rem;
      color: var(--text-muted);
      font-size: 0.85rem;
      button { margin-top: 0.5rem; }
    }
    .form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-row-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; }
    .checkbox-group { display: flex; gap: 1rem; margin-top: 0.5rem; }
    .input-readonly { background: #f1f5f9; cursor: not-allowed; }
    .input-disabled { background: #f8fafc; border-color: #cbd5e1; color: #0f172a; font-weight: 700; cursor: not-allowed; }
    .help-calc { font-size: 0.72rem; color: #64748b; font-weight: 600; display: block; margin-top: 0.25rem; }
    .form-help { font-size: 0.75rem; color: var(--text-muted); display: block; margin-top: 0.25rem; }
    .info-note {
      font-size: 0.775rem;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      padding: 0.65rem 0.85rem;
      border-radius: 4px;
      color: #1e40af;
      margin-top: 0.5rem;
    }
    .btn-xs { font-size: 0.725rem; padding: 0.2rem 0.5rem; border-radius: 4px; }
    .btn-outline-info { background: transparent; border: 1px solid #3b82f6; color: #2563eb; cursor: pointer; }
    @media (max-width: 1023px) { .rooms-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 767px) {
      .rooms-grid { grid-template-columns: 1fr; }
      .form-row-2, .form-row-3 { grid-template-columns: 1fr; }
      .branch-deep-header { flex-direction: column; align-items: flex-start; gap: 0.75rem; button { width: 100%; } }
      .view-header { flex-direction: column; align-items: flex-start; gap: 1rem; }
    }
  `]
})
export class BranchesComponent implements OnInit {
  branches: Branch[] = [];
  currentOwner: Owner | null = null;

  showBranchModal = false;
  showFloorModal = false;
  showRoomModal = false;
  showEditRoomModal = false;
  showProfileModal = false;

  // Bed History Modal
  showBedHistoryModal = false;
  selectedBedHistoryId: string | null = null;

  newBranch = {
    branchName: '',
    contactNumber: '',
    addressLine: '',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500081',
    totalFloors: 3
  };

  newFloor = {
    branchId: '',
    floorNumber: 1,
    floorName: '1st Floor',
    description: ''
  };

  newRoom = {
    branchId: '',
    floorId: '',
    roomNumber: '',
    shareOption: '2',
    roomType: 'Double Sharing',
    totalBeds: 2,
    bedRent: 8000,
    roomRent: 16000,
    dailyRate: 500,
    hasAttachedBathroom: true,
    hasAc: false,
    hasBalcony: false
  };

  editingRoom: any = null;
  editingRoomOriginalBeds = 2;

  ownerProfileForm: {
    fullName: string;
    phoneNumber: string;
    expectedBranches: number;
  } = {
    fullName: '',
    phoneNumber: '',
    expectedBranches: 1
  };

  constructor(private api: PgApiService, private auth: AuthService, private router: Router, private toast: ToastService) {}

  ngOnInit(): void {
    this.auth.currentUser$.subscribe(user => {
      this.currentOwner = user;
      if (user) {
        this.ownerProfileForm = {
          fullName: user.fullName || '',
          phoneNumber: user.phoneNumber || '',
          expectedBranches: user.expectedBranches || 1
        };
      }
    });
    this.loadBranches();
  }

  loadBranches(): void {
    const ownerId = this.auth.currentUserValue?.ownerId;
    if (!ownerId) return;
    this.api.getBranches(ownerId).subscribe(data => this.branches = data);
  }

  handleAddNewBranch(): void {
    const expected = this.currentOwner?.expectedBranches || 1;
    if (this.branches.length >= expected) {
      this.toast.error(`Branch limit reached (${this.branches.length}/${expected}). Please update your profile's Expected Branches to add more properties.`);
      this.openProfileModal();
      return;
    }
    this.openBranchModal();
  }

  openBranchModal(): void {
    this.newBranch = {
      branchName: '',
      contactNumber: this.auth.currentUserValue?.phoneNumber || '',
      addressLine: '',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500081',
      totalFloors: 3
    };
    this.showBranchModal = true;
  }

  saveBranch(): void {
    if (!this.newBranch.branchName || !this.newBranch.addressLine) {
      this.toast.warning('Please fill Branch Name and Address Line.');
      return;
    }

    const expected = this.currentOwner?.expectedBranches || 1;
    if (this.branches.length >= expected) {
      this.toast.error(`Cannot create branch: quota of ${expected} reached. Update your profile first.`);
      this.showBranchModal = false;
      this.openProfileModal();
      return;
    }

    const payload = {
      ...this.newBranch,
      ownerId: this.auth.currentUserValue?.ownerId
    };
    this.api.createBranch(payload).subscribe({
      next: () => {
        this.showBranchModal = false;
        this.loadBranches();
        this.toast.success('Branch and initial floors created successfully!');
      },
      error: (err) => {
        this.toast.error(err?.error?.message || err?.message || 'Error creating branch. Check your quota.');
      }
    });
  }

  // --- Add Floor Methods ---
  openFloorModal(branchId?: string): void {
    const defaultBranchId = branchId || (this.branches.length > 0 ? this.branches[0].branchId : '');
    const branch = this.branches.find(b => b.branchId === defaultBranchId);
    const existingFloorsCount = branch?.floors?.length || 0;
    const nextNum = existingFloorsCount;
    let name = `${nextNum}th Floor`;
    if (nextNum === 0) name = 'Ground Floor';
    else if (nextNum === 1) name = '1st Floor';
    else if (nextNum === 2) name = '2nd Floor';
    else if (nextNum === 3) name = '3rd Floor';

    this.newFloor = {
      branchId: defaultBranchId,
      floorNumber: nextNum,
      floorName: name,
      description: `${name} layout`
    };
    this.showFloorModal = true;
  }

  onFloorBranchChange(): void {
    const branch = this.branches.find(b => b.branchId === this.newFloor.branchId);
    const existingFloorsCount = branch?.floors?.length || 0;
    const nextNum = existingFloorsCount;
    let name = `${nextNum}th Floor`;
    if (nextNum === 0) name = 'Ground Floor';
    else if (nextNum === 1) name = '1st Floor';
    else if (nextNum === 2) name = '2nd Floor';
    else if (nextNum === 3) name = '3rd Floor';

    this.newFloor.floorNumber = nextNum;
    this.newFloor.floorName = name;
  }

  saveFloor(): void {
    if (!this.newFloor.branchId || !this.newFloor.floorName) {
      this.toast.warning('Please select a Branch and provide a Floor Name.');
      return;
    }

    this.api.createFloor(this.newFloor).subscribe({
      next: () => {
        this.showFloorModal = false;
        this.loadBranches();
        this.toast.success('Floor created successfully!');
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Failed to add floor.');
      }
    });
  }

  getFloorsForBranch(branchId: string): Floor[] {
    const b = this.branches.find(x => x.branchId === branchId);
    return b?.floors || [];
  }

  // --- Sharing & Rent Calculation ---
  onShareOptionChange(model: any): void {
    const shareNum = parseInt(model.shareOption, 10) || 1;
    model.totalBeds = shareNum;

    switch (shareNum) {
      case 1:
        model.roomType = '1 share';
        break;
      case 2:
        model.roomType = '2 share';
        break;
      case 3:
        model.roomType = '3 share';
        break;
      case 4:
        model.roomType = '4 share';
        break;
      case 5:
        model.roomType = '5 share';
        break;
      default:
        model.roomType = `${shareNum} share`;
        break;
    }

    this.onRentCalculationChange(model);
  }

  onRentCalculationChange(model: any): void {
    const beds = model.totalBeds || 0;
    const bedRent = model.bedRent || 0;
    model.roomRent = beds * bedRent;
  }

  openRoomModal(branchId: string, floorId?: string): void {
    const branch = this.branches.find(b => b.branchId === branchId);
    const targetFloorId = floorId || (branch?.floors?.[0]?.floorId ?? '');
    this.newRoom = {
      branchId,
      floorId: targetFloorId,
      roomNumber: '',
      shareOption: '2',
      roomType: '2 share',
      totalBeds: 2,
      bedRent: 8000,
      roomRent: 16000,
      dailyRate: 500,
      hasAttachedBathroom: true,
      hasAc: false,
      hasBalcony: false
    };
    this.showRoomModal = true;
  }

  saveRoom(): void {
    if (!this.newRoom.roomNumber) {
      this.toast.warning('Please enter a Room Number.');
      return;
    }
    if (!this.newRoom.floorId) {
      this.toast.warning('Please select a Floor first.');
      return;
    }
    // Room Rent is strictly calculated as totalBeds * bedRent
    this.newRoom.roomRent = (this.newRoom.totalBeds || 0) * (this.newRoom.bedRent || 0);

    this.api.createRoom(this.newRoom).subscribe({
      next: () => {
        this.showRoomModal = false;
        this.loadBranches();
        this.toast.success('Room and beds created successfully!');
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Failed to add room.');
      }
    });
  }

  openEditRoomModal(branchId: string, room: Room): void {
    let share = '2';
    if (room.roomType?.includes('1') || room.totalBeds === 1) share = '1';
    else if (room.roomType?.includes('2') || room.totalBeds === 2) share = '2';
    else if (room.roomType?.includes('3') || room.totalBeds === 3) share = '3';
    else if (room.roomType?.includes('4') || room.totalBeds === 4) share = '4';
    else if (room.roomType?.includes('5') || room.totalBeds === 5) share = '5';

    const bedRent = room.beds && room.beds.length > 0 
      ? room.beds[0].bedRent 
      : (room.totalBeds > 0 ? Math.round(room.roomRent / room.totalBeds) : 8000);

    this.editingRoomOriginalBeds = room.totalBeds || 1;
    this.editingRoom = {
      roomId: room.roomId,
      branchId,
      floorId: room.floorId,
      roomCode: room.roomCode,
      roomNumber: room.roomNumber,
      shareOption: share,
      roomType: room.roomType || `${share} share`,
      totalBeds: room.totalBeds || parseInt(share, 10),
      bedRent: bedRent,
      roomRent: (room.totalBeds || parseInt(share, 10)) * bedRent,
      dailyRate: 500,
      hasAttachedBathroom: room.hasAttachedBathroom,
      hasAc: room.hasAc,
      hasBalcony: room.hasBalcony,
      isActive: room.isActive ?? true
    };

    this.showEditRoomModal = true;
  }

  saveEditedRoom(): void {
    if (!this.editingRoom.roomNumber) {
      this.toast.warning('Please enter a Room Number.');
      return;
    }
    // Recompute read-only room rent
    this.editingRoom.roomRent = (this.editingRoom.totalBeds || 0) * (this.editingRoom.bedRent || 0);

    const payload = {
      roomNumber: this.editingRoom.roomNumber,
      roomType: this.editingRoom.roomType,
      totalBeds: this.editingRoom.totalBeds,
      roomRent: this.editingRoom.roomRent,
      bedRent: this.editingRoom.bedRent,
      dailyRate: this.editingRoom.dailyRate || 500,
      hasAttachedBathroom: this.editingRoom.hasAttachedBathroom,
      hasAc: this.editingRoom.hasAc,
      hasBalcony: this.editingRoom.hasBalcony,
      isActive: this.editingRoom.isActive
    };

    this.api.updateRoom(this.editingRoom.roomId, payload).subscribe({
      next: () => {
        this.showEditRoomModal = false;
        this.loadBranches();
        this.toast.success('Room updated successfully!');
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Failed to update room.');
      }
    });
  }

  // --- Owner Profile / Expected Branches Quota ---
  openProfileModal(): void {
    if (this.currentOwner) {
      this.ownerProfileForm = {
        fullName: this.currentOwner.fullName,
        phoneNumber: this.currentOwner.phoneNumber,
        expectedBranches: this.currentOwner.expectedBranches || 1
      };
    }
    this.showProfileModal = true;
  }

  saveOwnerProfile(): void {
    const ownerId = this.currentOwner?.ownerId;
    if (!ownerId) return;

    if (!this.ownerProfileForm.fullName || !this.ownerProfileForm.phoneNumber) {
      this.toast.warning('Please fill Full Name and Phone Number.');
      return;
    }

    if (!this.ownerProfileForm.expectedBranches || this.ownerProfileForm.expectedBranches < 1) {
      this.toast.warning('Expected Branches must be at least 1.');
      return;
    }

    this.api.updateOwnerProfile(ownerId, this.ownerProfileForm).subscribe({
      next: (updated) => {
        if (this.currentOwner) {
          const merged = { ...this.currentOwner, ...updated };
          localStorage.setItem('pg_current_user', JSON.stringify(merged));
          // Refresh local state
          this.currentOwner = merged;
        }
        this.showProfileModal = false;
        this.toast.success('Owner profile and branch quota updated successfully!');
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Failed to update profile.');
      }
    });
  }

  openBedHistory(bedId: string): void {
    this.selectedBedHistoryId = bedId;
    this.showBedHistoryModal = true;
  }

  assignBed(branchId: string, roomId: string, bedId: string): void {
    this.router.navigate(['/guests'], { queryParams: { branchId, roomId, bedId } });
  }
}
