export interface Owner {
  ownerId: string; // UUID v7
  ownerCode: string; // PO-0001
  fullName: string;
  email: string;
  phoneNumber: string;
  expectedBranches: number;
  role?: string;
  branchIds?: string[];
  token?: string;
  refreshToken?: string;
}

export interface Bed {
  bedId: string; // UUID v7
  roomId: string;
  floorId: string;
  branchId: string;
  bedCode: string; // BED-0001
  bedNumber: string;
  bedRent: number;
  dailyRate: number;
  isOccupied: boolean;
  status: 'Available' | 'Occupied' | 'Maintenance' | 'Reserved';
}

export interface Room {
  roomId: string; // UUID v7
  floorId: string;
  branchId: string;
  roomCode: string; // R-0001
  roomNumber: string;
  roomType: string;
  totalBeds: number;
  roomRent: number;
  hasAttachedBathroom: boolean;
  hasAc: boolean;
  hasBalcony: boolean;
  isActive: boolean;
  beds?: Bed[];
}

export interface Floor {
  floorId: string; // UUID v7
  branchId: string;
  floorCode: string; // FL-0001
  floorNumber: number;
  floorName: string;
  description?: string;
  rooms?: Room[];
}

export interface Branch {
  branchId: string; // UUID v7
  ownerId: string;
  branchCode: string; // BR-0001
  branchName: string;
  contactNumber?: string;
  addressLine: string;
  city: string;
  state: string;
  pincode?: string;
  totalFloors: number;
  floors?: Floor[];
}

export interface Guest {
  guestId?: string; // UUID v7
  guestCode?: string; // G-0001
  ownerId: string;
  branchId: string;
  branchName?: string;
  floorId: string;
  floorName?: string;
  roomId: string;
  roomNumber?: string;
  bedId: string;
  bedNumber?: string;
  fullName: string;
  email?: string;
  phoneNumber: string;
  emergencyContact?: string;
  age?: number;
  gender?: string;
  occupation?: string;
  workplaceOrCollege?: string;
  tenantType: 'Monthly' | 'Daily' | 'Other';
  advanceAmount: number;
  monthlyRent: number;
  dailyRent: number;
  joiningDate: string;
  expectedVacatingDate?: string;
  actualVacatingDate?: string;
  daysBeforeVacateReminder: number;
  vacateNoticeServed: boolean;
  vacatingReturnedAmount?: number;
  deductionsAmount?: number;
  settlementNotes?: string;
  proofDocumentType?: string;
  proofDocumentNumber?: string;
  proofDocumentUrl?: string;
  status: 'Active' | 'Notice_Period' | 'Vacated';
}

export interface DashboardSummary {
  totalBranches: number;
  totalFloors: number;
  totalRooms: number;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  totalActiveGuests: number;
  vacatingSoonCount: number;
  totalMonthlyRevenuePotential: number;
  advanceCollectedTotal: number;
}

// ==================== NEW MODULES (MVP DOC) ====================

export interface StaffMember {
  staffId: string;
  staffCode: string; // ST-0001
  ownerId: string;
  branchId?: string;
  branchName?: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: 'Manager' | 'Reception' | 'Staff' | 'Warden';
  salary: number;
  joiningDate: string;
  isActive: boolean;
}

export interface TenantCharge {
  chargeId: string;
  chargeCode: string; // CHG-0001
  ownerId: string;
  guestId: string;
  guestName?: string;
  roomNumber?: string;
  bedNumber?: string;
  branchId: string;
  branchName?: string;
  chargeType: 'Rent' | 'Electricity' | 'Food' | 'Laundry' | 'Deposit' | 'Maintenance' | 'Other';
  billingMonth: string; // YYYY-MM
  amount: number;
  dueDate: string;
  isPaid: boolean;
  description?: string;
  createdAt: string;
}

export interface TenantPayment {
  paymentId: string;
  paymentCode: string; // PAY-0001
  chargeId?: string;
  guestId: string;
  guestName?: string;
  branchId: string;
  amountPaid: number;
  paymentMode: 'UPI' | 'Cash' | 'Bank Transfer' | 'Online';
  transactionReference?: string;
  paymentDate: string;
  receivedBy?: string;
  receiptNotes?: string;
  paymentMonth?: string;
  daysPaid?: number;
  advanceAllocated?: number;
  rentAllocated?: number;
  pendingBalanceAfter?: number;
}

export interface TenantLedgerSummary {
  guestId: string;
  guestName: string;
  guestCode: string;
  phoneNumber?: string;
  roomBed: string;
  branchId?: string;
  roomId?: string;
  bedId?: string;
  joiningDate?: string;
  monthlyRent?: number;
  advanceAmount?: number;
  proratedJoiningRent?: number;
  proratedDaysInMonth?: number;
  daysInJoiningMonth?: number;
  totalCharges: number;
  totalPaid: number;
  outstandingBalance: number;
  advancePaid?: number;
  advancePending?: number;
  rentPaid?: number;
  rentPending?: number;
  dailyRate?: number;
  currentBillingMonth?: string;
  currentMonthRentCharge?: number;
  currentMonthPaid?: number;
  currentMonthPending?: number;
  currentMonthPayments?: TenantPayment[];
  charges: TenantCharge[];
  payments: TenantPayment[];
}

export interface Expense {
  expenseId: string;
  expenseCode: string; // EXP-0001
  ownerId: string;
  branchId: string;
  branchName?: string;
  category: 'Utilities' | 'Maintenance' | 'Food Supplies' | 'Staff Salary' | 'Internet' | 'Cleaning' | 'Other';
  title: string;
  amount: number;
  expenseDate: string;
  vendorName?: string;
  paymentMode: string;
  receiptUrl?: string;
  notes?: string;
  createdAt?: string;
}

export interface ExpenseSummary {
  totalExpenses: number;
  byCategory: Record<string, number>;
}

export interface Complaint {
  complaintId: string;
  complaintCode: string; // CMP-0001
  ownerId: string;
  branchId: string;
  branchName?: string;
  guestId?: string;
  guestName?: string;
  roomId?: string;
  roomNumber?: string;
  category: 'Plumbing' | 'Electrical' | 'WiFi / Internet' | 'Food / Mess' | 'Cleaning' | 'Other';
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Emergency';
  status: 'New' | 'Assigned' | 'In Progress' | 'Resolved' | 'Closed';
  assignedTo?: string;
  resolutionNotes?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Visitor {
  visitorId: string;
  visitorCode: string; // VIS-0001
  ownerId: string;
  branchId: string;
  branchName?: string;
  guestId: string;
  guestName?: string;
  roomNumber?: string;
  visitorName: string;
  visitorPhone: string;
  relationToGuest?: string;
  purposeOfVisit: string;
  vehicleNumber?: string;
  checkInTime: string;
  checkOutTime?: string;
  idProofType?: string;
  idProofNumber?: string;
}

export interface MonthlyClosing {
  closingId: string;
  closingCode: string; // MCL-0001
  ownerId: string;
  branchId: string;
  branchName?: string;
  closingMonth: string;
  totalRentCollected: number;
  totalOtherIncome: number;
  totalExpenses: number;
  netOperatingIncome: number;
  totalOutstandingDues: number;
  activeTenantsCount: number;
  occupancyRate: number;
  closedBy?: string;
  closedAt: string;
  notes?: string;
}

export interface FinancialProfitLoss {
  month: string;
  totalIncome: number;
  rentCollected: number;
  utilitiesCollected: number;
  totalExpenses: number;
  netProfit: number;
  totalOutstandingDues: number;
  occupancyPercentage: number;
}

// ==================== PAYMENT ANALYTICS & BED HISTORY ====================

export interface MonthlyCollectionTrend {
  monthKey: string;
  monthLabel: string;
  monthNumber: number;
  yearNumber: number;
  totalCollected: number;
  totalTransactions: number;
}

export interface PaymentAnalyticsOverview {
  currentMonthTotal: number;
  currentMonthTransactionCount: number;
  yearTotal: number;
  yearTransactionCount: number;
  lifetimeTotalCollected: number;
  monthlyTrends: MonthlyCollectionTrend[];
}

export interface HierarchyCollectionItem {
  id: string;
  code: string;
  name: string;
  level: 'Hostel' | 'Floor' | 'Room' | 'Bed';
  parentId?: string;
  parentName?: string;
  totalBeds: number;
  occupiedBeds: number;
  lifetimeGuestsCount: number;
  totalAmountCollected: number;
  currentMonthAmountCollected: number;
}

export interface BedGuestStayHistory {
  guestId: string;
  guestCode: string;
  fullName: string;
  phoneNumber: string;
  status: string;
  isCurrentGuest: boolean;
  joiningDate: string;
  vacatingDate?: string;
  monthlyRentAtStay: number;
  advanceAmount: number;
  rentCollectedFromGuest: number;
}

export interface BedLifetimeHistory {
  bedId: string;
  bedCode: string;
  bedNumber: string;
  bedRent: number;
  isOccupied: boolean;
  status: string;
  roomId: string;
  roomNumber: string;
  roomCode: string;
  floorId: string;
  floorName: string;
  branchId: string;
  branchName: string;
  totalAmountCollectedTillNow: number;
  totalGuestsStayed: number;
  guestsHistory: BedGuestStayHistory[];
  paymentLogs: TenantPayment[];
}
