/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { 
  LayoutDashboard, 
  ReceiptText, 
  Truck, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Package, 
  FileSpreadsheet, 
  Settings, 
  ShieldAlert, 
  Shield,
  LogOut, 
  Menu, 
  X,
  Smartphone,
  CheckCircle2,
  Lock,
  Download,
  Upload,
  RefreshCw,
  Sun,
  Moon
} from 'lucide-react';

import { CompanySettings, Contact, Product, Invoice, LedgerTransaction, UserProfile, BackupSettings } from './types';
import { 
  initialCompanySettings, 
  initialProducts, 
  initialContacts, 
  initialInvoices, 
  initialLedgerTransactions 
} from './initialData';

import SecurityScreen from './components/SecurityScreen';
import AdminLicenseSystem, { getOrCreateDeviceId } from './components/AdminLicenseSystem';
import DashboardView from './components/DashboardView';
import InvoicesView from './components/InvoicesView';
import ProductsView from './components/ProductsView';
import LedgerView from './components/LedgerView';
import ReportsView from './components/ReportsView';
import SettingsView from './components/SettingsView';
import AdminDashboard from './components/AdminDashboard';
import { ToastContainer, Toast } from './components/Toast';
import { useAuth } from './lib/AuthContext';
import { db } from './lib/firebase';
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth } from './lib/firebase';
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}
interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}
function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}


export default function App() {
  const { user, signOut } = useAuth();
  // Mobile drawer states
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Core Persistent State
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('vyapar_user_profile');
    const baseProfile = saved ? JSON.parse(saved) : {
      mobile: '9876543210',
      email: 'billing@rudraenterprises.com',
      passwordHash: 'admin123',
      securityPin: '1234',
      isLoggedIn: false,
      securityLockType: 'password',
      biometricsEnabled: false,
      aiEnabled: true
    };

    // Ensure properties are set on older saved profiles
    if (baseProfile && baseProfile.aiEnabled === undefined) {
      baseProfile.aiEnabled = true;
    }
    if (baseProfile && baseProfile.biometricsEnabled === undefined) {
      baseProfile.biometricsEnabled = false;
    }

    // Mandatory security enhancement: Require security verification on every single app launch/reload
    return {
      ...baseProfile,
      isLoggedIn: false
    };
  });

  const [companySettings, setCompanySettings] = useState<CompanySettings>(() => {
    const saved = localStorage.getItem('vyapar_company_settings');
    return saved ? JSON.parse(saved) : initialCompanySettings;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('vyapar_products');
    const rawList: Product[] = saved ? JSON.parse(saved) : initialProducts;
    const seen = new Set<string>();
    return rawList.filter(p => {
      if (!p || !p.id || seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  });

  const [contacts, setContacts] = useState<Contact[]>(() => {
    const saved = localStorage.getItem('vyapar_contacts');
    const rawList: Contact[] = saved ? JSON.parse(saved) : initialContacts;
    const seen = new Set<string>();
    return rawList.filter(c => {
      if (!c || !c.id || seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('vyapar_invoices');
    const rawList: Invoice[] = saved ? JSON.parse(saved) : initialInvoices;
    const seen = new Set<string>();
    return rawList.filter(inv => {
      if (!inv || !inv.id || seen.has(inv.id)) return false;
      seen.add(inv.id);
      return true;
    });
  });

  const [transactions, setTransactions] = useState<LedgerTransaction[]>(() => {
    const saved = localStorage.getItem('vyapar_transactions');
    return saved ? JSON.parse(saved) : initialLedgerTransactions;
  });

  const [backupSettings, setBackupSettings] = useState<BackupSettings>(() => {
    const saved = localStorage.getItem('vyapar_backup_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (!parsed.frequency) {
        parsed.frequency = 'Daily';
      }
      return parsed;
    }
    return {
      autoBackup: true,
      backupEmail: 'dip47068@gmail.com',
      frequency: 'Daily',
      smtpHost: '',
      smtpPort: 587,
      smtpSecure: false,
      smtpUser: '',
      smtpPass: ''
    };
  });

  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    return (localStorage.getItem('vyapar_theme') as 'light' | 'dark' | 'system') || 'system';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    const applyTheme = (themeValue: 'light' | 'dark' | 'system') => {
      let actualTheme = themeValue;
      if (themeValue === 'system') {
        actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }

      if (actualTheme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme(theme);
    localStorage.setItem('vyapar_theme', theme);

    // Listen for system theme changes if in 'system' mode
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('system');
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  // Navigation Panel routing
  const [activeView, setActiveView] = useState<'dashboard' | 'sales' | 'purchases' | 'debit' | 'credit' | 'products' | 'reports' | 'settings' | 'admin'>('dashboard');

  // Trigger quick invoice states from other views
  const [invoiceModeType, setInvoiceModeType] = useState<'sale' | 'purchase'>('sale');

  // Toast notifications state
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (title: string, message: string, type: 'success' | 'warning' | 'info') => {
    const newToast: Toast = {
      id: `toast-${Date.now()}-${Math.random()}`,
      title,
      message,
      type
    };
    setToasts(prev => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const [isLicenseVerified, setIsLicenseVerified] = useState(false);
  const [licenseError, setLicenseError] = useState('');
  
  // App Gateway Controls
  const [appControls, setAppControls] = useState<{maintenanceMode: boolean, maintenanceMessage: string, allowLogins: boolean, allowRegistrations: boolean} | null>(null);
  const [isAppLoading, setIsAppLoading] = useState(true);

  // Sync Global App Controls
  useEffect(() => {
    const docRef = doc(db, 'admin_config', 'settings');
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.appControls) {
          setAppControls(data.appControls);
        } else {
          setAppControls({ maintenanceMode: false, maintenanceMessage: '', allowLogins: true, allowRegistrations: true });
        }
      }
      setIsAppLoading(false);
    }, (err) => {
      console.warn("Failed to fetch app controls", err);
      setIsAppLoading(false); // offline fallback
    });
    return () => unsubscribe();
  }, []);

  // Real-time License Verification & Device Locking
  useEffect(() => {
    if (localStorage.getItem('vyapar_show_admin_login') === 'true') {
      setIsLicenseVerified(false);
      return;
    }

    const savedKeyRaw = localStorage.getItem('vyapar_license_key');
    let savedKey = savedKeyRaw;
    if (savedKeyRaw && !savedKeyRaw.startsWith('VYA-')) {
      try { savedKey = atob(savedKeyRaw); } catch(e) {}
    }
    if (savedKey && savedKey.startsWith('VYA-') && savedKeyRaw === savedKey) {
       localStorage.setItem('vyapar_license_key', btoa(savedKey));
    }

    if (!savedKey) {
      setIsLicenseVerified(false);
      return;
    }

    const deviceId = getOrCreateDeviceId();
    const docRef = doc(db, 'licenses', savedKey);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const expiryDateTimeStr = `${data.expiryDate}T${data.expiryTime || '23:59'}`;
        const expiryTime = new Date(expiryDateTimeStr).getTime();
        const isExpired = Date.now() > expiryTime;
        const isDisabled = data.status === 'disabled';
        const isWrongDevice = data.deviceId && data.deviceId !== deviceId;

        if (isDisabled || isExpired || isWrongDevice) {
          setIsLicenseVerified(false);
          if (isDisabled) setLicenseError('Your license has been disabled by the administrator.');
          else if (isExpired) setLicenseError('Your license has expired. Please renew to continue.');
          else if (isWrongDevice) setLicenseError('This license is bound to another device.');
          
          // If disabled, we clear cache to prevent offline bypass
          if (isDisabled) localStorage.removeItem('vyapar_license_cache');
        } else if (data.deviceId === deviceId) {
          setIsLicenseVerified(true);
          setLicenseError('');
          // Refresh secure cache
          const cachePayload = {
            key: savedKey,
            deviceId: deviceId,
            expiry: data.expiryDate,
            expiryTime: data.expiryTime,
            lastCheck: Date.now()
          };
          localStorage.setItem('vyapar_license_cache', btoa(JSON.stringify(cachePayload)));
        } else if (!data.deviceId) {
          // Valid key but not yet bound, let AdminLicenseSystem handle it
          setIsLicenseVerified(false);
        }
      } else {
        // License key was deleted remotely
        setIsLicenseVerified(false);
        localStorage.removeItem('vyapar_license_key');
        localStorage.removeItem('vyapar_license_cache');
      }
    }, (error) => {
      console.warn("License listener failed, checking offline fallback:", error);
      const localCacheStr = localStorage.getItem('vyapar_license_cache');
      if (localCacheStr) {
        try {
          const cache = JSON.parse(atob(localCacheStr));
          if (cache.key === savedKey && cache.deviceId === deviceId) {
            const expiryDateTimeStr = `${cache.expiry}T${cache.expiryTime || '23:59'}`;
            if (Date.now() <= new Date(expiryDateTimeStr).getTime()) {
              const diffTime = Date.now() - cache.lastCheck;
              const graceLimit = 3 * 24 * 60 * 60 * 1000;
              if (diffTime < graceLimit) setIsLicenseVerified(true);
            }
          }
        } catch (e) {}
      }
    });

    return () => unsubscribe();
  }, []);

  // FireStore Sync
  const [hasLoadedFromFirebase, setHasLoadedFromFirebase] = useState(false);

  useEffect(() => {
    if (user) {
      const docRef = doc(db, 'users', user.uid);
      const unsubscribe = onSnapshot(docRef, (docSnap) => {
        // If there are pending local writes, ignore the snapshot to avoid
        // over-writing with stale/incomplete data during active modifications
        if (docSnap.metadata.hasPendingWrites) {
          return;
        }
        
        try {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.companySettings) setCompanySettings(data.companySettings);
            if (data.products) {
              const seen = new Set<string>();
              setProducts((data.products as Product[]).filter(p => {
                if (!p || !p.id || seen.has(p.id)) return false;
                seen.add(p.id);
                return true;
              }));
            }
            if (data.contacts) {
              const seen = new Set<string>();
              setContacts((data.contacts as Contact[]).filter(c => {
                if (!c || !c.id || seen.has(c.id)) return false;
                seen.add(c.id);
                return true;
              }));
            }
            if (data.invoices) {
              const seen = new Set<string>();
              setInvoices((data.invoices as Invoice[]).filter(inv => {
                if (!inv || !inv.id || seen.has(inv.id)) return false;
                seen.add(inv.id);
                return true;
              }));
            }
            if (data.transactions) setTransactions(data.transactions);
            if (data.backupSettings) setBackupSettings(data.backupSettings);
            if (data.userProfile) setUserProfile({ ...data.userProfile, isLoggedIn: true, email: user.email });
          }
        } catch (e) {
          console.error("Error processing real-time snapshot update", e);
        } finally {
          setHasLoadedFromFirebase(true);
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
        setHasLoadedFromFirebase(true); // fall back to local storage
      });

      return () => unsubscribe();
    } else {
      setHasLoadedFromFirebase(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && hasLoadedFromFirebase) {
      const saveData = async () => {
        try {
          const docRef = doc(db, 'users', user.uid);
          await setDoc(docRef, {
            companySettings,
            products,
            contacts,
            invoices,
            transactions,
            backupSettings,
            userProfile
          });
        } catch (e) {
          console.error("Error saving to Firebase", e);
        }
      }
      // debounce save slightly
      const timeout = setTimeout(saveData, 1000);
      return () => clearTimeout(timeout);
    }
  }, [user, hasLoadedFromFirebase, companySettings, products, contacts, invoices, transactions, backupSettings, userProfile]);

  // Write changes to localStorage
  useEffect(() => {
    localStorage.setItem('vyapar_user_profile', JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    localStorage.setItem('vyapar_company_settings', JSON.stringify(companySettings));
  }, [companySettings]);

  useEffect(() => {
    localStorage.setItem('vyapar_backup_settings', JSON.stringify(backupSettings));
  }, [backupSettings]);

  useEffect(() => {
    localStorage.setItem('vyapar_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('vyapar_contacts', JSON.stringify(contacts));
  }, [contacts]);

  useEffect(() => {
    localStorage.setItem('vyapar_invoices', JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem('vyapar_transactions', JSON.stringify(transactions));
  }, [transactions]);

  // Automated Email Backup Handlers & Sync Systems
  const handleTriggerEmailBackup = async (isBackground = false) => {
    try {
      const payload = {
        products,
        contacts,
        invoices,
        transactions,
        companySettings,
        userProfile,
        timestamp: new Date().toISOString()
      };

      // Generate a PDF backup document
      let pdfBase64 = "";
      try {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text("D Billify - Database Daily Backup", 14, 20);
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
        doc.text(`Company: ${companySettings.companyName || 'Store Name'}`, 14, 34);
        
        let yPos = 45;
        doc.setFontSize(12);
        doc.text("Database Summary:", 14, yPos);
        yPos += 10;
        doc.setFontSize(10);
        doc.text(`Total Products: ${products.length}`, 14, yPos);
        yPos += 8;
        doc.text(`Total Contacts: ${contacts.length}`, 14, yPos);
        yPos += 8;
        doc.text(`Total Invoices: ${invoices.length}`, 14, yPos);
        yPos += 8;
        doc.text(`Total Ledger Transactions: ${transactions.length}`, 14, yPos);
        
        yPos += 15;
        doc.setFontSize(12);
        doc.text("Recent Invoices (Up to 10):", 14, yPos);
        yPos += 10;
        doc.setFontSize(9);
        const recentInvoices = [...invoices].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);
        
        if (recentInvoices.length === 0) {
          doc.text("No invoices recorded yet.", 14, yPos);
        } else {
          recentInvoices.forEach(inv => {
            if (yPos > 270) {
              doc.addPage();
              yPos = 20;
            }
            doc.text(`${inv.date} | ${inv.invoiceNumber} | ${inv.contactName || inv.customerName || 'N/A'} | Total: ₹${(inv.grandTotal || inv.totalAmount || 0).toFixed(2)}`, 14, yPos);
            yPos += 8;
          });
        }
        
        pdfBase64 = doc.output('datauristring');
      } catch (pdfErr) {
        console.error("Error generating PDF backup:", pdfErr);
      }

      try {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `D_Billify_Backup_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
      } catch (dlErr) {
        console.error("Error triggering direct download", dlErr);
      }

      const response = await fetch('/api/backup/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          backupSettings,
          companyName: companySettings.companyName,
          databaseContent: payload,
          pdfBase64
        })
      });

      const data = await response.json();
      if (response.ok) {
        if (!isBackground) {
          showToast("Backup Successful", `Ledger packet mailed to ${backupSettings.backupEmail || 'dip47068@gmail.com'}!`, "success");
        } else {
          console.log("Automatic background email backup dispatched successfully.");
        }
        return { success: true, message: data.message || "Backup dispatched successfully.", mode: data.mode, backupFilename: data.filename };
      } else {
        if (!isBackground) {
          showToast("Sync Error", data.error || "Failed to dispatch backup email.", "warning");
        }
        return { success: false, message: data.error || "Failed to dispatch backup email.", mode: "error" };
      }
    } catch (err: any) {
      console.error(err);
      if (!isBackground) {
        showToast("Sync Network Error", err.message || "Failed to connect to backend backup service.", "warning");
      }
      return { success: false, message: err.message || "Network error.", mode: "error" };
    }
  };

  const handleRestoreBackup = (backupJsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(backupJsonStr);
      if (parsed && typeof parsed === 'object') {
        let restoredAny = false;
        if (Array.isArray(parsed.products)) {
          const seen = new Set<string>();
          const dedupedProducts = parsed.products.filter((p: any) => p && p.id && !seen.has(p.id) && seen.add(p.id));
          setProducts(dedupedProducts);
          localStorage.setItem('vyapar_products', JSON.stringify(dedupedProducts));
          restoredAny = true;
        }
        if (Array.isArray(parsed.contacts)) {
          const seen = new Set<string>();
          const dedupedContacts = parsed.contacts.filter((c: any) => c && c.id && !seen.has(c.id) && seen.add(c.id));
          setContacts(dedupedContacts);
          localStorage.setItem('vyapar_contacts', JSON.stringify(dedupedContacts));
          restoredAny = true;
        }
        if (Array.isArray(parsed.invoices)) {
          const seen = new Set<string>();
          const dedupedInvoices = parsed.invoices.filter((inv: any) => inv && inv.id && !seen.has(inv.id) && seen.add(inv.id));
          setInvoices(dedupedInvoices);
          localStorage.setItem('vyapar_invoices', JSON.stringify(dedupedInvoices));
          restoredAny = true;
        }
        if (Array.isArray(parsed.transactions)) {
          setTransactions(parsed.transactions);
          localStorage.setItem('vyapar_transactions', JSON.stringify(parsed.transactions));
          restoredAny = true;
        }
        if (parsed.companySettings && typeof parsed.companySettings === 'object') {
          setCompanySettings(parsed.companySettings);
          localStorage.setItem('vyapar_company_settings', JSON.stringify(parsed.companySettings));
          restoredAny = true;
        }
        if (parsed.userProfile && typeof parsed.userProfile === 'object') {
          setUserProfile(parsed.userProfile);
          localStorage.setItem('vyapar_user_profile', JSON.stringify(parsed.userProfile));
          restoredAny = true;
        }
        if (restoredAny) {
          showToast("Restore Successful", "Ledger records and profiles have been updated successfully!", "success");
          return true;
        }
      }
      return false;
    } catch (err) {
      console.error("Error restoring backup:", err);
      return false;
    }
  };

  const isBackupMounted = React.useRef(false);
  useEffect(() => {
    if (!isBackupMounted.current) {
      isBackupMounted.current = true;
      return;
    }
    if (backupSettings.autoBackup) {
      const lastBackupStr = localStorage.getItem('vyapar_last_backup_date');
      const todayStr = new Date().toDateString();
      const frequency = backupSettings.frequency || 'Daily';
      
      let shouldBackup = false;
      if (!lastBackupStr) {
        shouldBackup = true;
      } else {
        const lastBackupDate = new Date(lastBackupStr);
        const todayDate = new Date();
        const diffTime = todayDate.getTime() - lastBackupDate.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        
        if (frequency === 'Daily') {
          shouldBackup = lastBackupStr !== todayStr;
        } else if (frequency === 'Weekly') {
          shouldBackup = diffDays >= 7;
        } else if (frequency === 'Monthly') {
          shouldBackup = diffDays >= 30;
        }
      }
      
      if (shouldBackup) {
        const timer = setTimeout(() => {
          handleTriggerEmailBackup(true).then(() => {
            localStorage.setItem('vyapar_last_backup_date', todayStr);
          });
        }, 15000); // 15-second debounce
        return () => clearTimeout(timer);
      }
    }
  }, [products, contacts, invoices, transactions, backupSettings]);

  // Core callback modifiers
  const handleLoginSuccess = (profile: UserProfile) => {
    setUserProfile(profile);
  };

  const handleLogout = async () => {
    await signOut();
    setUserProfile(prev => ({ ...prev, isLoggedIn: false }));
    setActiveView('dashboard');
  };

  const handleSaveInvoice = (newInvoice: Invoice) => {
    // 1. Check if invoice already exists (is an edit)
    const existIdx = invoices.findIndex(inv => inv.id === newInvoice.id);
    const oldInvoice = existIdx > -1 ? invoices[existIdx] : null;

    let updatedInvoices = [...invoices];
    if (existIdx > -1) {
      updatedInvoices[existIdx] = newInvoice;
    } else {
      updatedInvoices.push(newInvoice);
    }
    setInvoices(updatedInvoices);

    // 2. Adjust products stock levels
    let intermediateProducts = [...products];
    // First, revert old stock change if editing
    if (oldInvoice) {
      intermediateProducts = intermediateProducts.map(prod => {
        const oldItem = oldInvoice.items.find(i => i.productId === prod.id);
        if (oldItem) {
          const qtyAdj = oldInvoice.type === 'sale' ? oldItem.quantity : -oldItem.quantity;
          return {
            ...prod,
            stockQuantity: Math.max(0, prod.stockQuantity + qtyAdj)
          };
        }
        return prod;
      });
    }
    // Apply new stock change
    const updatedProducts = intermediateProducts.map(prod => {
      const newItem = newInvoice.items.find(i => i.productId === prod.id);
      if (newItem) {
        const qtyAdj = newInvoice.type === 'sale' ? -newItem.quantity : newItem.quantity;
        return {
          ...prod,
          stockQuantity: Math.max(0, prod.stockQuantity + qtyAdj)
        };
      }
      return prod;
    });
    setProducts(updatedProducts);

    // 3. Adjust contact balance
    let intermediateContacts = [...contacts];
    // Revert old outstanding balance first if editing
    if (oldInvoice && oldInvoice.contactId) {
      intermediateContacts = intermediateContacts.map(c => {
        if (c.id === oldInvoice.contactId) {
          const oldOutstanding = oldInvoice.grandTotal - oldInvoice.paidAmount;
          return {
            ...c,
            balance: parseFloat((c.balance - oldOutstanding).toFixed(2))
          };
        }
        return c;
      });
    }

    // Ensure contact exists in the contacts list to track ledger
    if (newInvoice.contactId) {
      const contactExists = intermediateContacts.some(c => c.id === newInvoice.contactId);
      if (!contactExists) {
        // Automatically register the customer/supplier in the ledger if not already present
        const newContact: Contact = {
          id: newInvoice.contactId,
          name: newInvoice.contactName,
          mobile: newInvoice.contactMobile || '9876543210',
          address: newInvoice.contactAddress || 'Local Address',
          gstin: newInvoice.contactGstin,
          type: newInvoice.type === 'sale' ? 'customer' : 'supplier',
          balance: 0
        };
        intermediateContacts.push(newContact);
      }

      // Apply new outstanding balance
      intermediateContacts = intermediateContacts.map(c => {
        if (c.id === newInvoice.contactId) {
          const netOutstandingAdd = newInvoice.grandTotal - newInvoice.paidAmount;
          return {
            ...c,
            balance: parseFloat((c.balance + netOutstandingAdd).toFixed(2))
          };
        }
        return c;
      });
    }
    setContacts(intermediateContacts);

    // 4. Create/update ledger transactions
    // Remove previous transactions for this invoice
    let cleanTransactions = transactions.filter(tx => tx.referenceId !== newInvoice.id);

    const newTx: LedgerTransaction = {
      id: `tx-sys-${Date.now()}`,
      date: newInvoice.date,
      contactId: newInvoice.contactId,
      contactName: newInvoice.contactName,
      type: 'invoice',
      amount: newInvoice.grandTotal,
      referenceId: newInvoice.id,
      notes: `${newInvoice.type === 'sale' ? 'Sales bill' : 'Purchase bill'} generated (${newInvoice.invoiceNumber})`
    };

    let updatedTx = [...cleanTransactions, newTx];
    
    // If there was any partial or full immediate payment, log a settlement voucher too
    if (newInvoice.paidAmount > 0) {
      const payTx: LedgerTransaction = {
        id: `tx-sys-pay-${Date.now()}`,
        date: newInvoice.date,
        contactId: newInvoice.contactId,
        contactName: newInvoice.contactName,
        type: newInvoice.type === 'sale' ? 'payment_received' : 'payment_made',
        amount: newInvoice.paidAmount,
        referenceId: newInvoice.id,
        notes: `Settlement payment received with status: ${newInvoice.paymentStatus}`
      };
      updatedTx.push(payTx);
    }
    setTransactions(updatedTx);

    // Toast and Low Stock Triggers
    const isEdit = existIdx > -1;
    showToast(
      isEdit ? "Invoice Updated" : "Invoice Generated",
      `Invoice ${newInvoice.invoiceNumber} for ₹${newInvoice.grandTotal.toLocaleString('en-IN')} has been ${isEdit ? 'updated' : 'successfully generated'}.`,
      "success"
    );

    if (newInvoice.paidAmount > 0) {
      showToast(
        "Payment Recorded",
        `Settlement payment of ₹${newInvoice.paidAmount.toLocaleString('en-IN')} recorded for Invoice ${newInvoice.invoiceNumber}.`,
        "success"
      );
    }

    // Check if any product stock fell below threshold
    products.forEach(oldProd => {
      const newProd = updatedProducts.find(p => p.id === oldProd.id);
      if (newProd) {
        if (oldProd.stockQuantity > oldProd.lowStockAlert && newProd.stockQuantity <= newProd.lowStockAlert) {
          showToast(
            "Low Stock Warning",
            `Stock for "${newProd.name}" has fallen below threshold (${newProd.stockQuantity} ${newProd.unit} remaining).`,
            "warning"
          );
        }
      }
    });
  };

  const handleDeleteInvoice = (id: string) => {
    const invoiceToDelete = invoices.find(inv => inv.id === id);
    if (invoiceToDelete) {
      // Revert product stock adjustments
      const updatedProducts = products.map(prod => {
        const item = invoiceToDelete.items.find(i => i.productId === prod.id);
        if (item) {
          const qtyAdj = invoiceToDelete.type === 'sale' ? item.quantity : -item.quantity;
          return {
            ...prod,
            stockQuantity: Math.max(0, prod.stockQuantity + qtyAdj)
          };
        }
        return prod;
      });
      setProducts(updatedProducts);

      // Revert contact balance adjustments
      if (invoiceToDelete.contactId) {
        const updatedContacts = contacts.map(c => {
          if (c.id === invoiceToDelete.contactId) {
            const oldOutstanding = invoiceToDelete.grandTotal - invoiceToDelete.paidAmount;
            return {
              ...c,
              balance: parseFloat((c.balance - oldOutstanding).toFixed(2))
            };
          }
          return c;
        });
        setContacts(updatedContacts);
      }
      
      showToast("Invoice Deleted", `Invoice ${invoiceToDelete.invoiceNumber} has been permanently removed.`, "success");
    }

    setInvoices(invoices.filter(inv => inv.id !== id));
    setTransactions(transactions.filter(tx => tx.referenceId !== id));
  };

  const handleAddProduct = (newProd: Product) => {
    setProducts([...products, newProd]);
  };

  const handleUpdateStock = (id: string, amount: number) => {
    const oldProd = products.find(p => p.id === id);
    const updatedProducts = products.map(p => {
      if (p.id === id) {
        return { ...p, stockQuantity: Math.max(0, p.stockQuantity + amount) };
      }
      return p;
    });
    setProducts(updatedProducts);

    if (oldProd) {
      const newProd = updatedProducts.find(p => p.id === id);
      if (newProd && oldProd.stockQuantity > oldProd.lowStockAlert && newProd.stockQuantity <= newProd.lowStockAlert) {
        showToast(
          "Low Stock Warning",
          `Stock for "${newProd.name}" has fallen below threshold (${newProd.stockQuantity} ${newProd.unit} remaining).`,
          "warning"
        );
      }
    }
  };

  const handleDeleteProduct = (id: string) => {
    const productToDelete = products.find(p => p.id === id);
    setProducts(products.filter(p => p.id !== id));
    if (productToDelete) {
      showToast("Product Deleted", `Product "${productToDelete.name}" has been removed from inventory.`, "success");
    }
  };

  const handleUpdateProduct = (updatedProd: Product) => {
    const oldProd = products.find(p => p.id === updatedProd.id);
    setProducts(products.map(p => p.id === updatedProd.id ? updatedProd : p));

    if (oldProd && oldProd.stockQuantity > oldProd.lowStockAlert && updatedProd.stockQuantity <= updatedProd.lowStockAlert) {
      showToast(
        "Low Stock Warning",
        `Stock for "${updatedProd.name}" has fallen below threshold (${updatedProd.stockQuantity} ${updatedProd.unit} remaining).`,
        "warning"
      );
    }
  };

  const handleAddTransaction = (newTx: LedgerTransaction) => {
    setTransactions([...transactions, newTx]);
    if (newTx.type === 'payment_received' || newTx.type === 'payment_made') {
      showToast(
        "Payment Recorded",
        `Payment of ₹${newTx.amount.toLocaleString('en-IN')} ${newTx.type === 'payment_received' ? 'received from' : 'made to'} ${newTx.contactName} has been recorded in ledger.`,
        "success"
      );
    }
  };

  const handleUpdateTransaction = (updatedTx: LedgerTransaction) => {
    setTransactions(transactions.map(tx => tx.id === updatedTx.id ? updatedTx : tx));
  };

  const handleDeleteTransaction = (id: string) => {
    const transactionToDelete = transactions.find(tx => tx.id === id);
    setTransactions(transactions.filter(tx => tx.id !== id));
    if (transactionToDelete) {
      showToast("Transaction Deleted", "Ledger transaction record has been removed.", "success");
    }
  };

  const handleAddContact = (newContact: Contact) => {
    setContacts([...contacts, newContact]);
  };

  const handleUpdateContact = (updatedContact: Contact) => {
    setContacts(contacts.map(c => c.id === updatedContact.id ? updatedContact : c));
  };

  const handleDeleteContact = (id: string) => {
    setContacts(contacts.filter(c => c.id !== id));
    setTransactions(transactions.filter(tx => tx.contactId !== id));
  };

  const handleUpdateContactBalance = (id: string, newBalance: number) => {
    setContacts(contacts.map(c => {
      if (c.id === id) {
        return { ...c, balance: parseFloat(newBalance.toFixed(2)) };
      }
      return c;
    }));
  };

  const handleQuickInvoiceTrigger = (type: 'sale' | 'purchase') => {
    setInvoiceModeType(type);
    setActiveView(type === 'sale' ? 'sales' : 'purchases');
  };

  // Recover default sample databases
  const handleClearRestoreDatabase = () => {
    setCompanySettings(initialCompanySettings);
    setProducts(initialProducts);
    setContacts(initialContacts);
    setInvoices(initialInvoices);
    setTransactions(initialLedgerTransactions);
    setActiveView('dashboard');
    localStorage.removeItem('vyapar_company_settings');
    localStorage.removeItem('vyapar_products');
    localStorage.removeItem('vyapar_contacts');
    localStorage.removeItem('vyapar_invoices');
    localStorage.removeItem('vyapar_transactions');
  };

  // Export full JSON database local backup
  const handleBackupExport = () => {
    const backupObj = {
      companySettings,
      products,
      contacts,
      invoices,
      transactions
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupObj, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `D_Billify_Backup_2026.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    alert("D Billify Local Database Backup exported. Restore at any time!");
  };

  // License System gate
  if (!isLicenseVerified) {
    return <AdminLicenseSystem onVerificationSuccess={() => setIsLicenseVerified(true)} initialError={licenseError} />;
  }

  // Lockscreen gate
  if (!userProfile.isLoggedIn) {
    return <SecurityScreen userProfile={userProfile} onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className={`min-h-screen flex font-sans antialiased transition-colors duration-200 ${theme === 'dark' ? 'bg-slate-950 text-slate-100 dark' : 'bg-slate-100 text-slate-800'}`}>
      
      {/* Sidebar navigation panel - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 text-white shrink-0 shadow-lg border-r border-slate-850">
        {/* Brand identifier */}
        <div className="p-6 border-b border-slate-850 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-orange-500 flex items-center justify-center font-black text-white">
              DB
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tight uppercase">D Billify</h1>
              <p className="text-[9px] text-orange-400 font-bold uppercase tracking-wider">GST Compliance App</p>
              <div className="mt-1.5 text-[10px] text-slate-400 font-bold font-mono tracking-wider">
                MOB- 7439954312
              </div>
            </div>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="System Live"></span>
        </div>

        {/* Current user mini layout */}
        <div className="p-4 mx-3 my-4 bg-slate-850/60 rounded-xl border border-slate-750 flex items-center justify-between text-xs">
          <div className="overflow-hidden">
            <p className="font-bold text-slate-200 truncate">{companySettings.companyName || 'Store Name'}</p>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">{companySettings.phone || userProfile.mobile}</p>
          </div>
          <button 
            id="btn-sidebar-lock"
            onClick={handleLogout} 
            className="p-1.5 hover:bg-slate-750 hover:text-red-400 rounded-lg transition-all text-slate-400"
            title="Lock system screen"
          >
            <Lock className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          <button
            id="nv-dashboard"
            onClick={() => setActiveView('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeView === 'dashboard' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <LayoutDashboard className="h-4.5 w-4.5" /> Dashboard
          </button>

          <button
            id="nv-sales"
            onClick={() => setActiveView('sales')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeView === 'sales' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <ReceiptText className="h-4.5 w-4.5" /> Sales Registry
          </button>

          <button
            id="nv-purchases"
            onClick={() => setActiveView('purchases')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeView === 'purchases' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Truck className="h-4.5 w-4.5" /> Purchase Registry
          </button>

          <div className="pt-2">
            <p className="text-[9px] uppercase tracking-wider text-slate-500 font-extrabold px-4 mb-1">Financial Ledgers</p>
            <button
              id="nv-debit"
              onClick={() => setActiveView('debit')}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeView === 'debit' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <ArrowUpRight className="h-4.5 w-4.5 text-orange-400" /> Customers Due Ledger
            </button>

            <button
              id="nv-credit"
              onClick={() => setActiveView('credit')}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeView === 'credit' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <ArrowDownLeft className="h-4.5 w-4.5 text-blue-400" /> Suppliers Ledger
            </button>
          </div>

          <div className="pt-2">
            <p className="text-[9px] uppercase tracking-wider text-slate-500 font-extrabold px-4 mb-1">Store Inventory</p>
            <button
              id="nv-products"
              onClick={() => setActiveView('products')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeView === 'products' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Package className="h-4.5 w-4.5" /> Product Registry
            </button>
          </div>

          <div className="pt-2">
            <p className="text-[9px] uppercase tracking-wider text-slate-500 font-extrabold px-4 mb-1">compliance audits</p>
            <button
              id="nv-reports"
              onClick={() => setActiveView('reports')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeView === 'reports' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <FileSpreadsheet className="h-4.5 w-4.5" /> GSTR-1 & Audit Reports
            </button>
          </div>
        </nav>

        {/* Global Utilities backup & settings */}
        <div className="p-4 border-t border-slate-850 space-y-2">
          <button
            id="nv-settings"
            onClick={() => setActiveView('settings')}
            className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeView === 'settings' ? 'bg-orange-550 text-orange-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Settings className="h-4 w-4" /> Company Setup
          </button>

          <button
            id="nv-admin"
            onClick={() => setActiveView('admin')}
            className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeView === 'admin' ? 'bg-orange-550 text-orange-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Shield className="h-4 w-4 text-orange-500" /> Admin Controls
          </button>
          
          <div className="flex flex-col gap-1.5 text-[9px] font-bold">
            <div className="flex gap-1.5">
              <button 
                id="sidebar-export"
                onClick={handleBackupExport} 
                className="flex-1 py-1 px-2 border border-slate-750 rounded-md hover:bg-slate-800 text-slate-400 font-bold text-center inline-flex items-center justify-center gap-1 cursor-pointer"
              >
                <Download className="h-2.5 w-2.5" /> Export
              </button>
              <button 
                id="sidebar-import-trigger"
                onClick={() => document.getElementById('sidebar-import-file')?.click()} 
                className="flex-1 py-1 px-2 border border-slate-750 rounded-md hover:bg-slate-800 text-slate-400 font-bold text-center inline-flex items-center justify-center gap-1 cursor-pointer"
              >
                <Upload className="h-2.5 w-2.5" /> Import
              </button>
              <input 
                type="file" 
                id="sidebar-import-file" 
                accept=".json" 
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const content = event.target?.result as string;
                      const success = handleRestoreBackup(content);
                      if (success) {
                        alert("Database restored successfully! The application will refresh.");
                        window.location.reload();
                      } else {
                        alert("The backup file format was invalid or missing required keys.");
                      }
                    };
                    reader.readAsText(file);
                  }
                }}
                className="hidden" 
              />
            </div>
            <button 
              id="sidebar-logout"
              onClick={handleLogout} 
              className="w-full py-1 px-2 border border-slate-750 text-red-400 bg-red-950/20 hover:bg-red-950/40 rounded-md block text-center cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Workspace Frame container */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top bar header - Mobile Drawer and notification info */}
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 h-16 flex items-center justify-between px-6 shrink-0 z-20 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              id="mobile-drawer-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400 lg:hidden focus:outline-none transition-all"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            
            <div className="flex flex-col">
              <div className="text-slate-900 dark:text-white font-black text-base tracking-tight flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-orange-500" />
                <span>{companySettings.companyName || 'D Billify Registry'}</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="px-1.5 py-0.5 rounded bg-orange-50 dark:bg-orange-950/30 text-orange-650 dark:text-orange-400 text-[9px] uppercase font-black tracking-widest border border-orange-100 dark:border-orange-900/30">
                  GSTIN: {companySettings.gstin || 'UNREGISTERED'}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/30 text-emerald-650 dark:text-emerald-400 text-[9px] uppercase font-black tracking-widest border border-emerald-100 dark:border-emerald-900/30 flex items-center gap-1">
                  <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
                  SECURE NODE
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold">
            {/* clock and profile info */}
            <div className="hidden lg:flex items-center gap-2.5 font-mono text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner">
              <Smartphone className="h-3.5 w-3.5 text-orange-500" />
              <span className="text-[10px] font-bold tracking-tight">DEVICE: {getOrCreateDeviceId().substring(0, 12)}...</span>
            </div>
            
            {/* database status indicator */}
            <div className="hidden sm:flex items-center gap-1.5 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30 hover:bg-blue-50 dark:hover:bg-blue-950/50 border border-blue-100 dark:border-blue-900/30 px-3 py-1.5 rounded-xl transition-all cursor-default shadow-sm">
              <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
              <span className="text-[10px] font-black uppercase tracking-wider">Cloud Sync Active</span>
            </div>

            {/* global theme toggle */}
            <button
              id="header-theme-toggle"
              onClick={() => setTheme(prev => {
                if (prev === 'light') return 'dark';
                if (prev === 'dark') return 'system';
                return 'light';
              })}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 shadow-sm min-w-[44px]"
              title={`Theme: ${theme.toUpperCase()}`}
            >
              {theme === 'light' && <Moon className="h-4.5 w-4.5 text-slate-650" />}
              {theme === 'dark' && <Sun className="h-4.5 w-4.5 text-amber-500 animate-spin-slow" />}
              {theme === 'system' && <Settings className="h-4.5 w-4.5 text-blue-500" />}
              <span className="text-[10px] font-black uppercase tracking-tighter hidden xl:inline">
                {theme}
              </span>
            </button>
          </div>
        </header>

        {/* Mobile Sidebar overlay Drawer */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 lg:hidden transition-opacity" onClick={() => setSidebarOpen(false)}>
            <aside className="w-64 bg-slate-900 text-white min-h-screen p-5 flex flex-col justify-between" onClick={(e) => e.stopPropagation()}>
              <div className="space-y-6">
                <div className="pb-3 border-b border-slate-800">
                  <div className="flex items-center justify-between">
                    <h2 className="font-extrabold uppercase text-xs tracking-widest text-orange-400">D Billify Drawer</h2>
                    <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-white">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="mt-2 text-[10px] text-slate-400 font-bold font-mono tracking-wider">
                    MOB- 7439954312
                  </div>
                </div>

                <nav className="space-y-1.5">
                  {[
                    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                    { id: 'sales', label: 'Sales Registry', icon: ReceiptText },
                    { id: 'purchases', label: 'Purchase Registry', icon: Truck },
                    { id: 'debit', label: 'Debit Ledger', icon: ArrowUpRight },
                    { id: 'credit', label: 'Credit Ledger', icon: ArrowDownLeft },
                    { id: 'products', label: 'Product Inventory', icon: Package },
                    { id: 'reports', label: 'Compliance Reports', icon: FileSpreadsheet },
                    { id: 'settings', label: 'Settings', icon: Settings },
                    { id: 'admin', label: 'Admin Controls', icon: Shield },
                  ].map(item => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveView(item.id as any);
                          setSidebarOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                          activeView === item.id ? 'bg-orange-500 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <Icon className="h-4.5 w-4.5" /> {item.label}
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="pt-4 border-t border-slate-850 space-y-2 text-center text-xs text-slate-400">
                <p>Logged in support active</p>
                <button 
                  onClick={handleLogout} 
                  className="w-full bg-red-650 hover:bg-red-655 text-white bg-slate-800 py-2 rounded-xl text-xs font-bold transition-all"
                >
                  Sign Out of Device
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* Dynamic Inner Panel routing container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-20 max-w-7xl w-full mx-auto">
          {activeView === 'dashboard' && (
            <DashboardView 
              invoices={invoices} 
              contacts={contacts} 
              products={products} 
              userProfile={userProfile}
              onNavigate={setActiveView}
              onQuickInvoice={handleQuickInvoiceTrigger}
            />
          )}

          {activeView === 'sales' && (
            <InvoicesView 
              invoices={invoices} 
              contacts={contacts} 
              products={products} 
              companySettings={companySettings}
              onSaveInvoice={handleSaveInvoice}
              onDeleteInvoice={handleDeleteInvoice}
              activeTab="sale"
            />
          )}

          {activeView === 'purchases' && (
            <InvoicesView 
              invoices={invoices} 
              contacts={contacts} 
              products={products} 
              companySettings={companySettings}
              onSaveInvoice={handleSaveInvoice}
              onDeleteInvoice={handleDeleteInvoice}
              activeTab="purchase"
            />
          )}

          {activeView === 'debit' && (
            <LedgerView 
              contacts={contacts} 
              transactions={transactions} 
              onAddTransaction={handleAddTransaction}
              onUpdateTransaction={handleUpdateTransaction}
              onDeleteTransaction={handleDeleteTransaction}
              onAddContact={handleAddContact}
              onUpdateContact={handleUpdateContact}
              onDeleteContact={handleDeleteContact}
              onUpdateContactBalance={handleUpdateContactBalance}
              initialType="customer"
            />
          )}

          {activeView === 'credit' && (
            <LedgerView 
              contacts={contacts} 
              transactions={transactions} 
              onAddTransaction={handleAddTransaction}
              onUpdateTransaction={handleUpdateTransaction}
              onDeleteTransaction={handleDeleteTransaction}
              onAddContact={handleAddContact}
              onUpdateContact={handleUpdateContact}
              onDeleteContact={handleDeleteContact}
              onUpdateContactBalance={handleUpdateContactBalance}
              initialType="supplier"
            />
          )}

          {activeView === 'products' && (
            <ProductsView 
              products={products} 
              onAddProduct={handleAddProduct}
              onUpdateStock={handleUpdateStock}
              onDeleteProduct={handleDeleteProduct}
              onUpdateProduct={handleUpdateProduct}
            />
          )}

          {activeView === 'reports' && (
            <ReportsView 
              invoices={invoices} 
              products={products} 
              contacts={contacts} 
            />
          )}

          {activeView === 'settings' && (
            <SettingsView 
              companySettings={companySettings} 
              onUpdateSettings={setCompanySettings} 
              onClearDatabase={handleClearRestoreDatabase}
              userProfile={userProfile}
              onUpdateUserProfile={setUserProfile}
              backupSettings={backupSettings}
              onUpdateBackupSettings={setBackupSettings}
              onTriggerEmailBackup={() => handleTriggerEmailBackup(false)}
              onRestoreBackup={handleRestoreBackup}
              theme={theme}
              onThemeChange={setTheme}
            />
          )}

          {activeView === 'admin' && (
            <AdminDashboard />
          )}
        </main>
      </div>

      {/* Toast Notifications System */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}
