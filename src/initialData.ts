/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CompanySettings, Contact, Product, Invoice, LedgerTransaction } from './types';

export const initialCompanySettings: CompanySettings = {
  companyName: "Rudra Enterprises Pvt Ltd",
  tagline: "Your Quality & Trust Partner",
  address: "Plot 42, Sector 18, Industrial Area, Gurugram, Haryana - 122015",
  phone: "+91 98765 43210",
  email: "billing@rudraenterprises.com",
  gstin: "06AAAAA1111A1Z1", // Haryana state code 06
  bankName: "State Bank of India",
  accountNumber: "30192837465",
  ifscCode: "SBIN0004312",
  upiId: "rudra@sbi",
  terms: "1. Goods once sold will not be taken back.\n2. Interest @ 18% p.a. will be charged if payment is not made within due date.\n3. All disputes are subject to Gurugram jurisdiction.",
  invoiceTemplate: "modern"
};

export const initialProducts: Product[] = [
  {
    id: "prod-1",
    name: "Syska Smart LED Bulb 12W",
    hsnCode: "8539",
    gstRate: 18,
    unit: "PCS",
    stockQuantity: 120,
    lowStockAlert: 20,
    purchaseRate: 180,
    salesRate: 299,
    category: "Electricals",
    group: "Lighting"
  },
  {
    id: "prod-2",
    name: "Havells Pedestal Fan V3",
    hsnCode: "8414",
    gstRate: 18,
    unit: "PCS",
    stockQuantity: 14, // triggers alert
    lowStockAlert: 15,
    purchaseRate: 1800,
    salesRate: 2499,
    category: "Appliances",
    group: "Home Comfort"
  },
  {
    id: "prod-3",
    name: "Finolex 2.5sqmm Wire 100m Bundle",
    hsnCode: "8544",
    gstRate: 28, // 28% GST wire
    unit: "BOX",
    stockQuantity: 45,
    lowStockAlert: 10,
    purchaseRate: 1100,
    salesRate: 1550,
    category: "Wires",
    group: "Infrastructure"
  },
  {
    id: "prod-4",
    name: "Anchor 6A 1-Way Switch",
    hsnCode: "8536",
    gstRate: 18,
    unit: "PCS",
    stockQuantity: 350,
    lowStockAlert: 50,
    purchaseRate: 15,
    salesRate: 28,
    category: "Electricals",
    group: "Switches"
  }
];

export const initialContacts: Contact[] = [
  // Customers
  {
    id: "c-1",
    name: "Sharma Electricals Delhi",
    mobile: "9911223344",
    email: "amit@sharmaelectricals.com",
    address: "Shop No. 12, Lajpat Nagar Market, New Delhi - 110024",
    gstin: "07BBBBB2222B2Z2", // Delhi state code 07 (Interstate from Haryana 06)
    type: 'customer',
    balance: 14500
  },
  {
    id: "c-2",
    name: "Verma Traders Gurugram",
    mobile: "9811445566",
    email: "info@vermatraders.in",
    address: "Main Market, Sector 14, Gurugram, Haryana - 122001",
    gstin: "06CCCCC3333C3Z3", // Haryana state code 06 (Intrastate)
    type: 'customer',
    balance: 0
  },
  {
    id: "c-3",
    name: "Gupta Cash Customer",
    mobile: "9212345678",
    address: "DLF Phase 3, Gurugram, Haryana",
    type: 'customer',
    balance: 1500
  },
  // Suppliers
  {
    id: "s-1",
    name: "Havells India Wholesale",
    mobile: "9899112222",
    email: "distributor@havells.com",
    address: "Industrial Complex, Faridabad, Haryana - 121004",
    gstin: "06DDDDD4444D4Z4", // Haryana
    type: 'supplier',
    balance: 28500
  },
  {
    id: "s-2",
    name: "Alpha Wire Manufacturers",
    mobile: "9560012345",
    email: "sales@alphawires.com",
    address: "Wazirpur Industrial Area, New Delhi - 110052",
    gstin: "07EEEEE5555E5Z5", // Delhi
    type: 'supplier',
    balance: 12000
  }
];

export const initialInvoices: Invoice[] = [
  {
    id: "inv-s1",
    invoiceNumber: "INV-2026-001",
    date: "2026-06-10",
    dueDate: "2026-07-10",
    contactId: "c-1",
    contactName: "Sharma Electricals Delhi",
    contactMobile: "9911223344",
    contactAddress: "Shop No. 12, Lajpat Nagar Market, New Delhi - 110024",
    contactGstin: "07BBBBB2222B2Z2",
    type: 'sale',
    stateOfSupply: "Delhi", // Inter-state (Haryana to Delhi)
    items: [
      {
        productId: "prod-1",
        productName: "Syska Smart LED Bulb 12W",
        hsnCode: "8539",
        quantity: 50,
        rate: 299,
        discount: 10, // 10% off
        gstRate: 18,
        cgst: 0,
        sgst: 0,
        igst: 2421.9, // computed
        total: 15876.9
      },
      {
        productId: "prod-2",
        productName: "Havells Pedestal Fan V3",
        hsnCode: "8414",
        quantity: 2,
        rate: 2499,
        discount: 0,
        gstRate: 18,
        cgst: 0,
        sgst: 0,
        igst: 899.64,
        total: 5897.64
      }
    ],
    subtotal: 18453.5,
    totalDiscount: 1495,
    totalCgst: 0,
    totalSgst: 0,
    totalIgst: 3321.54,
    grandTotal: 21775.04,
    paidAmount: 7275.04,
    balanceDue: 14500, // Matched with contact balance
    paymentStatus: 'partial',
    notes: 'Thanks for your support! 50% paid on delivery.'
  },
  {
    id: "inv-s2",
    invoiceNumber: "INV-2026-002",
    date: "2026-06-11",
    dueDate: "2026-06-11",
    contactId: "c-3",
    contactName: "Gupta Cash Customer",
    contactMobile: "9212345678",
    contactAddress: "DLF Phase 3, Gurugram, Haryana",
    type: 'sale',
    stateOfSupply: "Haryana", // Intra-state (Haryana to Haryana)
    items: [
      {
        productId: "prod-4",
        productName: "Anchor 6A 1-Way Switch",
        hsnCode: "8536",
        quantity: 100,
        rate: 28,
        discount: 5,
        gstRate: 18,
        cgst: 239.4, // (2800 - 140) * 0.09 = 239.4
        sgst: 239.4, // (2800 - 140) * 0.09 = 239.4
        igst: 0,
        total: 3138.8
      }
    ],
    subtotal: 2660,
    totalDiscount: 140,
    totalCgst: 239.4,
    totalSgst: 239.4,
    totalIgst: 0,
    grandTotal: 3138.8,
    paidAmount: 1638.8,
    balanceDue: 1500,
    paymentStatus: 'partial',
    notes: 'Paid partially in cash.'
  },
  {
    id: "inv-p1",
    invoiceNumber: "BILL-HVL-992",
    date: "2026-06-08",
    dueDate: "2026-06-25",
    contactId: "s-1",
    contactName: "Havells India Wholesale",
    contactMobile: "9899112222",
    contactAddress: "Industrial Complex, Faridabad, Haryana - 121004",
    contactGstin: "06DDDDD4444D4Z4",
    type: 'purchase',
    stateOfSupply: "Haryana", // Intra-state
    items: [
      {
        productId: "prod-2",
        productName: "Havells Pedestal Fan V3",
        hsnCode: "8414",
        quantity: 15,
        rate: 1800,
        discount: 5, // 5% discount
        gstRate: 18,
        cgst: 2308.5,
        sgst: 2308.5,
        igst: 0,
        total: 30267
      }
    ],
    subtotal: 25650,
    totalDiscount: 1350,
    totalCgst: 2308.5,
    totalSgst: 2308.5,
    totalIgst: 0,
    grandTotal: 30267,
    paidAmount: 1767,
    balanceDue: 28500,
    paymentStatus: 'partial',
    notes: 'Bulk stock procurement. Material received in excellent condition.'
  }
];

export const initialLedgerTransactions: LedgerTransaction[] = [
  {
    id: "tx-1",
    date: "2026-06-10",
    contactId: "c-1",
    contactName: "Sharma Electricals Delhi",
    type: "invoice",
    amount: 21775.04,
    referenceId: "inv-s1",
    notes: "Sales invoice INV-2026-001 created"
  },
  {
    id: "tx-2",
    date: "2026-06-10",
    contactId: "c-1",
    contactName: "Sharma Electricals Delhi",
    type: "payment_received",
    amount: 7275.04,
    referenceId: "inv-s1",
    notes: "Payment received towards INV-2026-001"
  },
  {
    id: "tx-3",
    date: "2026-06-11",
    contactId: "c-3",
    contactName: "Gupta Cash Customer",
    type: "invoice",
    amount: 3138.8,
    referenceId: "inv-s2",
    notes: "Sales invoice INV-2026-002 created"
  },
  {
    id: "tx-4",
    date: "2026-06-11",
    contactId: "c-3",
    contactName: "Gupta Cash Customer",
    type: "payment_received",
    amount: 1638.8,
    referenceId: "inv-s2",
    notes: "Cash payment for invoice INV-2026-002"
  },
  {
    id: "tx-5",
    date: "2026-06-08",
    contactId: "s-1",
    contactName: "Havells India Wholesale",
    type: "invoice",
    amount: 30267,
    referenceId: "inv-p1",
    notes: "Purchase bill BILL-HVL-992 created"
  },
  {
    id: "tx-6",
    date: "2026-06-08",
    contactId: "s-1",
    contactName: "Havells India Wholesale",
    type: "payment_made",
    amount: 1767,
    referenceId: "inv-p1",
    notes: "Advance payment paid for BILL-HVL-992"
  }
];
