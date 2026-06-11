export interface Admin {
  id: string;
  email: string;
  name: string;
  role: 'superadmin' | 'admin';
  tenantId: number | null;
}

export interface Sponsored {
  _id: string;
  fullName: string;
  idNumber: string;
  phone?: string;
  sponsorshipStartDate: string;
  annualAmount: number;
  status: 'active' | 'inactive';
  notes?: string;
  nextRenewalDate?: string;
  totalPaidThisYear?: number;
  remaining?: number;
  isPaidThisYear?: boolean;
  payments?: Payment[];
  documents?: Document[];
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  _id: string;
  sponsored: string | Sponsored;
  amount: number;
  paymentDate: string;
  year: number;
  notes?: string;
  createdAt: string;
}

export interface Document {
  _id: string;
  sponsoredId: string;
  filename: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  category: 'id' | 'photo' | 'contract' | 'receipt' | 'other';
  description?: string;
  url: string;
  createdAt: string;
}

export interface DashboardStats {
  totalSponsored: number;
  activeSponsored: number;
  totalCollectedThisYear: number;
  totalExpected: number;
  overdueCount: number;
  upcomingRenewalCount: number;
}

export interface DashboardData {
  stats: DashboardStats;
  overdueList: OverdueItem[];
  upcomingRenewalList: UpcomingRenewalItem[];
}

export interface OverdueItem {
  _id: string;
  fullName: string;
  idNumber: string;
  annualAmount: number;
  totalPaid: number;
  remaining: number;
  renewalDate: string;
}

export interface UpcomingRenewalItem {
  _id: string;
  fullName: string;
  idNumber: string;
  annualAmount: number;
  renewalDate: string;
  daysUntilRenewal: number;
}
