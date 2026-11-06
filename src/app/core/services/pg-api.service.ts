import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  Branch,
  Floor,
  Room,
  Bed,
  Guest,
  DashboardSummary,
  StaffMember,
  TenantCharge,
  TenantPayment,
  TenantLedgerSummary,
  Expense,
  ExpenseSummary,
  Complaint,
  Visitor,
  MonthlyClosing,
  FinancialProfitLoss
} from '../../models/pg.models';
import { HttpApiService } from './http-api.service';

@Injectable({
  providedIn: 'root'
})
export class PgApiService {
  private selectedBranchSubject = new BehaviorSubject<string | null>(null);
  selectedBranch$ = this.selectedBranchSubject.asObservable();

  constructor(private httpApi: HttpApiService) {}

  setSelectedBranch(branchId: string | null): void {
    this.selectedBranchSubject.next(branchId);
  }

  // --- Dashboard ---
  getDashboardSummary(ownerId: string): Observable<DashboardSummary> {
    return this.httpApi.get<DashboardSummary>(`dashboard/summary/${ownerId}`).pipe(
      catchError(() => {
        const fallback: DashboardSummary = {
          totalBranches: 0,
          totalFloors: 0,
          totalRooms: 0,
          totalBeds: 0,
          occupiedBeds: 0,
          availableBeds: 0,
          totalActiveGuests: 0,
          vacatingSoonCount: 0,
          totalMonthlyRevenuePotential: 0,
          advanceCollectedTotal: 0
        };
        return of(fallback);
      })
    );
  }

  // --- Branches ---
  getBranches(ownerId: string): Observable<Branch[]> {
    return this.httpApi.get<Branch[]>(`branch/owner/${ownerId}`).pipe(
      catchError(() => of([]))
    );
  }

  createBranch(dto: any): Observable<Branch> {
    return this.httpApi.post<Branch>('branch', dto);
  }

  deleteBranch(branchId: string): Observable<any> {
    return this.httpApi.delete(`branch/${branchId}`);
  }

  // --- Floors ---
  getFloors(branchId: string): Observable<Floor[]> {
    return this.httpApi.get<Floor[]>(`floor/branch/${branchId}`);
  }

  createFloor(dto: any): Observable<Floor> {
    return this.httpApi.post<Floor>('floor', dto);
  }

  // --- Rooms & Beds ---
  getRoomsByFloor(floorId: string): Observable<Room[]> {
    return this.httpApi.get<Room[]>(`room/floor/${floorId}`);
  }

  createRoom(dto: any): Observable<Room> {
    return this.httpApi.post<Room>('room', dto);
  }

  updateRoom(roomId: string, dto: any): Observable<Room> {
    return this.httpApi.put<Room>(`room/${roomId}`, dto);
  }

  updateOwnerProfile(ownerId: string, dto: any): Observable<any> {
    return this.httpApi.put(`auth/profile/${ownerId}`, dto);
  }

  addBed(dto: any): Observable<Bed> {
    return this.httpApi.post<Bed>('room/beds', dto);
  }

  getBeds(roomId: string): Observable<Bed[]> {
    return this.httpApi.get<Bed[]>(`room/${roomId}/beds`);
  }

  // --- Guests ---
  getGuests(ownerId: string, branchId?: string | null): Observable<Guest[]> {
    let endpoint = `guest/owner/${ownerId}`;
    if (branchId) endpoint += `?branchId=${branchId}`;
    return this.httpApi.get<Guest[]>(endpoint).pipe(
      catchError(() => of([]))
    );
  }

  checkInGuest(dto: any): Observable<Guest> {
    return this.httpApi.post<Guest>('guest', dto);
  }

  vacateGuest(guestId: string, settlementDto: any): Observable<any> {
    return this.httpApi.post(`guest/${guestId}/vacate`, settlementDto);
  }

  // --- Staff ---
  getStaff(ownerId: string, branchId?: string | null): Observable<StaffMember[]> {
    let endpoint = `staff/owner/${ownerId}`;
    if (branchId) endpoint += `?branchId=${branchId}`;
    return this.httpApi.get<StaffMember[]>(endpoint).pipe(catchError(() => of([])));
  }

  createStaff(dto: any): Observable<StaffMember> {
    return this.httpApi.post<StaffMember>('staff', dto);
  }

  toggleStaffStatus(staffId: string, isActive: boolean): Observable<any> {
    return this.httpApi.patch(`staff/${staffId}/status`, isActive);
  }

  // --- Ledger & Charges ---
  addCharge(dto: any): Observable<TenantCharge> {
    return this.httpApi.post<TenantCharge>('ledger/charge', dto);
  }

  recordPayment(dto: any): Observable<TenantPayment> {
    return this.httpApi.post<TenantPayment>('ledger/payment', dto);
  }

  getGuestLedger(guestId: string): Observable<TenantLedgerSummary> {
    return this.httpApi.get<TenantLedgerSummary>(`ledger/guest/${guestId}`);
  }

  getBedLedger(bedId: string): Observable<TenantLedgerSummary> {
    return this.httpApi.get<TenantLedgerSummary>(`ledger/bed/${bedId}`);
  }

  getPendingDues(ownerId: string, branchId?: string | null): Observable<TenantCharge[]> {
    let endpoint = `ledger/dues/${ownerId}`;
    if (branchId) endpoint += `?branchId=${branchId}`;
    return this.httpApi.get<TenantCharge[]>(endpoint).pipe(catchError(() => of([])));
  }

  getRecentPayments(ownerId: string, branchId?: string | null): Observable<TenantPayment[]> {
    let endpoint = `ledger/payments/${ownerId}`;
    if (branchId) endpoint += `?branchId=${branchId}`;
    return this.httpApi.get<TenantPayment[]>(endpoint).pipe(catchError(() => of([])));
  }

  // --- Expenses ---
  getExpenses(ownerId: string, branchId?: string | null, category?: string | null): Observable<Expense[]> {
    let endpoint = `expense/owner/${ownerId}`;
    const params: string[] = [];
    if (branchId) params.push(`branchId=${branchId}`);
    if (category) params.push(`category=${encodeURIComponent(category)}`);
    if (params.length) endpoint += `?${params.join('&')}`;
    return this.httpApi.get<Expense[]>(endpoint).pipe(catchError(() => of([])));
  }

  getExpenseSummary(ownerId: string, branchId?: string | null, month?: string | null): Observable<ExpenseSummary> {
    let endpoint = `expense/summary/${ownerId}`;
    const params: string[] = [];
    if (branchId) params.push(`branchId=${branchId}`);
    if (month) params.push(`month=${month}`);
    if (params.length) endpoint += `?${params.join('&')}`;
    return this.httpApi.get<ExpenseSummary>(endpoint).pipe(catchError(() => of({ totalExpenses: 0, byCategory: {} })));
  }

  createExpense(dto: any): Observable<Expense> {
    return this.httpApi.post<Expense>('expense', dto);
  }

  deleteExpense(expenseId: string): Observable<any> {
    return this.httpApi.delete(`expense/${expenseId}`);
  }

  // --- Complaints ---
  getComplaints(ownerId: string, branchId?: string | null, status?: string | null): Observable<Complaint[]> {
    let endpoint = `complaint/owner/${ownerId}`;
    const params: string[] = [];
    if (branchId) params.push(`branchId=${branchId}`);
    if (status) params.push(`status=${encodeURIComponent(status)}`);
    if (params.length) endpoint += `?${params.join('&')}`;
    return this.httpApi.get<Complaint[]>(endpoint).pipe(catchError(() => of([])));
  }

  createComplaint(dto: any): Observable<Complaint> {
    return this.httpApi.post<Complaint>('complaint', dto);
  }

  updateComplaintStatus(complaintId: string, dto: any): Observable<any> {
    return this.httpApi.patch(`complaint/${complaintId}/status`, dto);
  }

  // --- Visitors ---
  getVisitors(ownerId: string, branchId?: string | null, guestId?: string | null): Observable<Visitor[]> {
    let endpoint = `visitor/owner/${ownerId}`;
    const params: string[] = [];
    if (branchId) params.push(`branchId=${branchId}`);
    if (guestId) params.push(`guestId=${guestId}`);
    if (params.length) endpoint += `?${params.join('&')}`;
    return this.httpApi.get<Visitor[]>(endpoint).pipe(catchError(() => of([])));
  }

  logVisitor(dto: any): Observable<Visitor> {
    return this.httpApi.post<Visitor>('visitor', dto);
  }

  checkOutVisitor(visitorId: string): Observable<any> {
    return this.httpApi.post(`visitor/${visitorId}/checkout`, {});
  }

  // --- Monthly Closing & Reports ---
  getMonthlyPL(ownerId: string, branchId?: string | null, month?: string): Observable<FinancialProfitLoss> {
    let endpoint = `report/pl/${ownerId}?month=${month || ''}`;
    if (branchId) endpoint += `&branchId=${branchId}`;
    return this.httpApi.get<FinancialProfitLoss>(endpoint).pipe(
      catchError(() => of({
        month: month || '',
        totalIncome: 0,
        rentCollected: 0,
        utilitiesCollected: 0,
        totalExpenses: 0,
        netProfit: 0,
        totalOutstandingDues: 0,
        occupancyPercentage: 0
      }))
    );
  }

  getClosingHistory(ownerId: string, branchId?: string | null): Observable<MonthlyClosing[]> {
    let endpoint = `report/closing-history/${ownerId}`;
    if (branchId) endpoint += `?branchId=${branchId}`;
    return this.httpApi.get<MonthlyClosing[]>(endpoint).pipe(catchError(() => of([])));
  }

  closeMonth(dto: any): Observable<MonthlyClosing> {
    return this.httpApi.post<MonthlyClosing>('report/close-month', dto);
  }

  // --- Payment Analytics & Bed History Explorer ---
  getPaymentAnalyticsOverview(ownerId: string, branchId?: string | null, year?: number): Observable<any> {
    let endpoint = `paymentanalytics/overview/${ownerId}`;
    const params: string[] = [];
    if (branchId) params.push(`branchId=${branchId}`);
    if (year) params.push(`year=${year}`);
    if (params.length > 0) endpoint += `?${params.join('&')}`;
    return this.httpApi.get<any>(endpoint);
  }

  getPaymentHierarchy(ownerId: string, level: string, branchId?: string | null, parentId?: string | null): Observable<any[]> {
    let endpoint = `paymentanalytics/hierarchy/${ownerId}?level=${level}`;
    if (branchId) endpoint += `&branchId=${branchId}`;
    if (parentId) endpoint += `&parentId=${parentId}`;
    return this.httpApi.get<any[]>(endpoint).pipe(catchError(() => of([])));
  }

  getBedLifetimeHistory(bedId: string): Observable<any> {
    return this.httpApi.get<any>(`paymentanalytics/bed-history/${bedId}`);
  }

  // --- WhatsApp & Notification Services ---
  sendWhatsAppDueReminders(ownerId: string, branchId?: string | null, forceSend: boolean = false): Observable<any> {
    let endpoint = `notification/whatsapp/due-reminders?ownerId=${ownerId}&forceSend=${forceSend}`;
    if (branchId) endpoint += `&branchId=${branchId}`;
    return this.httpApi.post<any>(endpoint, {});
  }

  sendEmailDueReminders(ownerId: string, branchId?: string | null, forceSend: boolean = false): Observable<any> {
    let endpoint = `notification/email/due-reminders?ownerId=${ownerId}&forceSend=${forceSend}`;
    if (branchId) endpoint += `&branchId=${branchId}`;
    return this.httpApi.post<any>(endpoint, {});
  }

  sendCustomWhatsAppMessage(dto: { phoneNumber: string; message: string; type?: string; recipientName?: string }): Observable<any> {
    return this.httpApi.post<any>('notification/whatsapp/send', dto);
  }
}
