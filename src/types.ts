/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CompanySettings {
  companyName: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  gstin: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  upiId: string;
  terms: string;
  logoUrl?: string; // base64 or URL
  invoiceTemplate: 'classic' | 'modern' | 'minimalist';
}

export interface BackupSettings {
  autoBackup: boolean;
  backupEmail: string;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPass: string;
}

export interface UserProfile {
  mobile: string;
  email: string;
  passwordHash: string;
  securityPin: string;
  isLoggedIn: boolean;
  securityLockType: 'none' | 'pin' | 'password' | 'pattern';
  biometricsEnabled?: boolean;
  aiEnabled?: boolean;
}

export interface Contact {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  address: string;
  gstin?: string;
  type: 'customer' | 'supplier';
  balance: number; // Positive is receivable for customers, payable for suppliers
}

export interface Product {
  id: string;
  name: string;
  hsnCode: string;
  gstRate: number; // e.g. 18 for 18%
  unit: string; // e.g. PCS, BOX, KGS, LTR
  stockQuantity: number;
  lowStockAlert: number;
  purchaseRate: number;
  salesRate: number;
  category?: string;
  group?: string;
}

export interface InvoiceItem {
  productId: string;
  productName: string;
  hsnCode: string;
  quantity: number;
  rate: number;
  discount: number; // percentage
  gstRate: number; // percentage
  cgst: number; // calculated rupees
  sgst: number; // calculated rupees
  igst: number; // calculated rupees
  total: number;
  productModel?: string;
  serialNumber?: string;
  description?: string;
  pcs?: number;
  unit?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  contactId: string; // Customer ID or Supplier ID
  contactName: string;
  contactMobile: string;
  contactAddress: string;
  contactGstin?: string;
  type: 'sale' | 'purchase';
  items: InvoiceItem[];
  subtotal: number;
  totalDiscount: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  grandTotal: number;
  paidAmount: number;
  balanceDue: number;
  paymentStatus: 'paid' | 'unpaid' | 'partial';
  notes?: string;
  stateOfSupply: string; // to determine CGST/SGST vs IGST
  changeLog?: InvoiceChangeLogEntry[];
}

export interface InvoiceChangeLogEntry {
  id: string;
  timestamp: number; // ms timestamp
  userEmail: string;
  userName?: string;
  action: 'created' | 'modified' | 'status_updated';
  details: string;
}

export interface LedgerTransaction {
  id: string;
  date: string;
  contactId: string;
  contactName: string;
  type: 'invoice' | 'payment_received' | 'payment_made'; // payment_received is credit/debit adjustment
  amount: number;
  referenceId: string; // Invoice ID or receipt voucher index
  notes?: string;
}
