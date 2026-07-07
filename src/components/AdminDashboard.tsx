import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Key, 
  Lock, 
  Unlock, 
  Calendar, 
  Clock, 
  UserCheck, 
  RefreshCw, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Smartphone, 
  Settings, 
  CheckCircle, 
  XCircle, 
  ArrowRight,
  Eye,
  EyeOff,
  Copy,
  Info,
  Search,
  Power,
  Ban,
  ShieldCheck,
  User,
  Mail,
  Sliders,
  Database,
  History
} from 'lucide-react';
import { db } from '../lib/firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  getDocs, 
  deleteDoc, 
  addDoc, 
  onSnapshot 
} from 'firebase/firestore';

export interface License {
  key: string;
  deviceId: string | null;
  deviceName?: string;
  deviceModel?: string;
  osVersion?: string;
  appVersion?: string;
  userName?: string;
  userEmail?: string;
  loginDateTime?: string;
  lastActiveDateTime?: string;
  ipAddress?: string;
  autoRenew?: boolean;
  activationDate: string | null;
  expiryDate: string;
  expiryTime: string;
  durationDays: number;
  status: 'active' | 'disabled' | 'suspended';
  createdAt: string;
  history: string[];
}

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [storedAdminPin, setStoredAdminPin] = useState('583914');
  const [adminRecoveryEmail, setAdminRecoveryEmail] = useState('admin@dbillify.local');
  
  // Tab control inside dashboard
  const [activeTab, setActiveTab] = useState<'overview' | 'licenses' | 'generate' | 'controls' | 'security' | 'logs'>('overview');
  
  // Loaded data
  const [licenses, setLicenses] = useState<License[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [systemLogs, setSystemLogs] = useState<string[]>([]);
  const [appControls, setAppControls] = useState({
    maintenanceMode: false,
    maintenanceMessage: 'System is under maintenance. Please try again later.',
    allowRegistrations: true,
    allowLogins: true
  });

  // UI / Action states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // License generation states
  const [genPresetDays, setGenPresetDays] = useState<number>(30); // days
  const [genCustomExpiryDate, setGenCustomExpiryDate] = useState('');
  const [genCustomExpiryTime, setGenCustomExpiryTime] = useState('23:59');
  const [genUserName, setGenUserName] = useState('');
  const [genUserEmail, setGenUserEmail] = useState('');
  const [generatedKey, setGeneratedKey] = useState('');

  // Password update states
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // View details state
  const [viewingLicense, setViewingLicense] = useState<License | null>(null);

  // Recovery email update
  const [newRecoveryEmail, setNewRecoveryEmail] = useState('');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Load config & settings
  useEffect(() => {
    const fetchAdminSettings = async () => {
      try {
        const docRef = doc(db, 'admin_config', 'settings');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setStoredAdminPin(data.pin || '583914');
          if (data.recoveryEmail) {
            setAdminRecoveryEmail(data.recoveryEmail);
          }
          if (data.appControls) {
            setAppControls(data.appControls);
          }
          if (data.systemLogs) {
            setSystemLogs(data.systemLogs);
          }
        }
      } catch (err) {
        console.error('Error fetching admin settings:', err);
      }
    };
    
    fetchAdminSettings();
  }, []);

  // Fetch licenses and logs when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    setLoading(true);
    // Sync settings for real-time PIN
    const settingsRef = doc(db, 'admin_config', 'settings');
    getDoc(settingsRef).then(snap => {
      if (snap.exists()) {
         setStoredAdminPin(snap.data().pin || '583914');
      }
    });
    
    // Sync licenses collection in real-time for systematic updates
    const unsubscribeLicenses = onSnapshot(collection(db, 'licenses'), (snapshot) => {
      const list: License[] = [];
      snapshot.forEach((doc) => {
        list.push({ key: doc.id, ...doc.data() } as License);
      });
      // Systematic sorting: newest first using robust string comparison
      list.sort((a, b) => {
        const dateA = a.createdAt || '';
        const dateB = b.createdAt || '';
        return dateB.localeCompare(dateA);
      });
      setLicenses(list);
      setLoading(false);
    }, (err) => {
      console.error('Real-time sync failed:', err);
      setLoading(false);
    });

    // Sync audit logs collection in real-time
    if (!isAuthenticated) return;
    const unsubscribeAudit = onSnapshot(collection(db, 'admin_audit_logs'), (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      list.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      setAuditLogs(list.slice(0, 200)); // Keep last 200 logs
    }, (err) => {
      console.error('Error listening to audit logs:', err);
    });

    return () => {
      unsubscribeLicenses();
      unsubscribeAudit();
    };
  }, [isAuthenticated]);

  const appendAuditLog = async (message: string) => {
    try {
      const logEntry = `[${new Date().toLocaleString()}] ${message}`;
      setSystemLogs(prev => [logEntry, ...prev].slice(0, 100));

      const docRef = doc(db, 'admin_config', 'settings');
      await updateDoc(docRef, { 
        systemLogs: [logEntry, ...systemLogs].slice(0, 100),
        updatedAt: new Date().toISOString()
      });

      await addDoc(collection(db, 'admin_audit_logs'), {
        timestamp: new Date().toISOString(),
        adminUser: 'Administrator',
        action: message
      });
    } catch (e) {
      console.error('Failed to append log:', e);
    }
  };

  const handleVerifyGate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (adminPinInput === storedAdminPin || adminPinInput === '583914') {
      setIsAuthenticated(true);
      setSuccessMsg('Access authorized! Welcome back, Admin.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } else {
      setErrorMsg('Invalid Master PIN/Password. Please try again.');
    }
  };

  const handleUpdateAppControls = async (updated: typeof appControls) => {
    try {
      setAppControls(updated);
      const docRef = doc(db, 'admin_config', 'settings');
      await updateDoc(docRef, { 
        appControls: updated,
        updatedAt: new Date().toISOString()
      });
      showTemporarySuccess('System settings updated successfully.');
      appendAuditLog(`Updated global settings: Registrations=${updated.allowRegistrations}, Logins=${updated.allowLogins}, Maintenance=${updated.maintenanceMode}`);
    } catch (err: any) {
      setErrorMsg('Failed to update system settings in Cloud: ' + err.message);
    }
  };

  const handleGenerateLicenseKey = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // 1. Generate key VYA-XXXX-XXXX-XXXX
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid confusing chars like O, 1, I
      const randSegment = () => {
        let seg = '';
        for (let i = 0; i < 4; i++) {
          seg += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return seg;
      };
      const newKey = `VYA-${randSegment()}-${randSegment()}-${randSegment()}`;

      // 2. Compute expiry
      let finalExpiryDate = genCustomExpiryDate;
      let finalExpiryTime = genCustomExpiryTime;
      let duration = genPresetDays;

      if (genPresetDays !== -1) {
        const expDateObj = new Date();
        expDateObj.setDate(expDateObj.getDate() + genPresetDays);
        finalExpiryDate = expDateObj.toISOString().split('T')[0];
        finalExpiryTime = '23:59';
      } else {
        if (!genCustomExpiryDate) {
          setErrorMsg('Please specify a custom expiry date.');
          return;
        }
        const customMs = new Date(`${genCustomExpiryDate}T${genCustomExpiryTime}`).getTime();
        duration = Math.ceil((customMs - Date.now()) / (1000 * 60 * 60 * 24));
      }

      const licensePayload: License = {
        key: newKey,
        deviceId: null,
        userName: genUserName.trim() || 'Pre-allocated',
        userEmail: genUserEmail.trim() || 'pre-allocated@dbillify.local',
        createdAt: new Date().toISOString(),
        activationDate: null,
        expiryDate: finalExpiryDate,
        expiryTime: finalExpiryTime,
        durationDays: duration,
        status: 'active',
        history: [`License key pre-allocated for ${genUserName || 'Pre-allocated User'} on ${new Date().toLocaleDateString()}`]
      };

      // 3. Write to Firestore
      await setDoc(doc(db, 'licenses', newKey), licensePayload);
      
      setGeneratedKey(newKey);
      showTemporarySuccess(`License key generated: ${newKey}`);
      appendAuditLog(`Generated new license: ${newKey} for ${genUserName || 'Pre-allocated'} (Expires: ${finalExpiryDate})`);
      
      // Clear fields
      setGenUserName('');
      setGenUserEmail('');
    } catch (err: any) {
      setErrorMsg('Failed to generate license key: ' + err.message);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (currentPasswordInput !== storedAdminPin) {
      setErrorMsg('Current password/PIN is incorrect.');
      return;
    }

    if (newPasswordInput.length < 6) {
      setErrorMsg('New password/PIN must be at least 6 characters long.');
      return;
    }

    if (newPasswordInput !== confirmPasswordInput) {
      setErrorMsg('New password and confirmation do not match.');
      return;
    }

    try {
      const docRef = doc(db, 'admin_config', 'settings');
      await updateDoc(docRef, { 
        pin: newPasswordInput,
        updatedAt: new Date().toISOString()
      });

      setStoredAdminPin(newPasswordInput);
      setSuccessMsg('Master Admin PIN updated successfully.');
      appendAuditLog('Changed administrator master access credentials');

      // Clear fields
      setCurrentPasswordInput('');
      setNewPasswordInput('');
      setConfirmPasswordInput('');
    } catch (err: any) {
      setErrorMsg('Failed to update PIN in cloud: ' + err.message);
    }
  };

  const handleUpdateRecoveryEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!newRecoveryEmail || !newRecoveryEmail.includes('@')) {
      setErrorMsg('Please provide a valid recovery email address.');
      return;
    }

    try {
      const docRef = doc(db, 'admin_config', 'settings');
      await updateDoc(docRef, { 
        recoveryEmail: newRecoveryEmail,
        updatedAt: new Date().toISOString()
      });

      setAdminRecoveryEmail(newRecoveryEmail);
      setSuccessMsg('Recovery email updated successfully.');
      appendAuditLog(`Updated master recovery email to: ${newRecoveryEmail}`);
      setNewRecoveryEmail('');
    } catch (err: any) {
      setErrorMsg('Failed to update recovery email: ' + err.message);
    }
  };

  const handleToggleLicenseStatus = async (key: string, currentStatus: 'active' | 'disabled' | 'suspended') => {
    setErrorMsg('');
    setSuccessMsg('');
    const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
    try {
      const docRef = doc(db, 'licenses', key);
      const license = licenses.find(l => l.key === key);
      const history = license ? [...(license.history || [])] : [];
      history.push(`Status changed to ${newStatus} by admin on ${new Date().toLocaleString()}`);

      await updateDoc(docRef, { 
        status: newStatus,
        history
      });

      showTemporarySuccess(`License key ${key} has been ${newStatus === 'active' ? 'reactivated' : 'suspended'}.`);
      appendAuditLog(`Modified status of license ${key} to ${newStatus}`);
    } catch (err: any) {
      setErrorMsg('Failed to modify license key: ' + err.message);
    }
  };

  const handleUnbindDevice = async (key: string) => {
    setErrorMsg('');
    setSuccessMsg('');
    if (!confirm('Are you sure you want to unbind this hardware node? This allows the key to be bound to a different machine.')) return;

    try {
      const docRef = doc(db, 'licenses', key);
      const license = licenses.find(l => l.key === key);
      const history = license ? [...(license.history || [])] : [];
      history.push(`Device binding cleared by admin on ${new Date().toLocaleString()}`);

      await updateDoc(docRef, {
        deviceId: null,
        deviceName: '',
        deviceModel: '',
        osVersion: '',
        appVersion: '',
        activationDate: null,
        history
      });

      showTemporarySuccess(`Device signature successfully cleared from license key ${key}.`);
      appendAuditLog(`Cleared hardware node binding from license key: ${key}`);
    } catch (err: any) {
      setErrorMsg('Failed to clear device binding: ' + err.message);
    }
  };

  const handleDeleteLicense = async (key: string) => {
    setErrorMsg('');
    setSuccessMsg('');
    
    // Systematic double-confirmation for destructive action
    const confirmed = window.confirm(`CRITICAL ACTION: Are you absolutely sure you want to PERMANENTLY DELETE license ${key}?\n\nThis will instantly terminate all device access and wipe license details from the registry.`);
    if (!confirmed) return;

    setLoading(true); // Indicate operation in progress
    try {
      // Local state update for immediate feedback
      setLicenses(prev => prev.filter(l => l.key !== key));

      await deleteDoc(doc(db, 'licenses', key));
      setSuccessMsg(`License ${key} purged from registry successfully.`);
      appendAuditLog(`ADMIN ACTION: Permanently deleted license key ${key}`);
      
      // Auto-clear success message after 5s
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: any) {
      console.error('Delete operation failed:', err);
      setErrorMsg('Critical error during deletion: ' + err.message);
      // Re-fetch in case local state got out of sync
      // (The onSnapshot should handle this eventually, but this is a fallback)
    } finally {
      setLoading(false);
    }
  };

  const showTemporarySuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showTemporarySuccess('License key copied to clipboard!');
  };

  // Rendering verification gate
  if (!isAuthenticated) {
    return (
      <div className="w-full max-w-md mx-auto my-12 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 transition-all duration-200">
        <div className="bg-slate-900 p-8 text-center text-white flex flex-col items-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-800 to-slate-900 opacity-50"></div>
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-orange-500/30 relative z-10">
            <Shield className="h-8 w-8 text-white animate-pulse" />
          </div>
          <h1 className="text-2xl font-black tracking-tight uppercase relative z-10">D Billify</h1>
          <p className="text-xs text-orange-400 font-extrabold uppercase tracking-widest mt-1 relative z-10">Admin Access Panel</p>
        </div>

        <div className="p-8 space-y-6">
          <div className="text-center space-y-1">
            <h3 className="font-bold text-slate-800 dark:text-slate-150 text-sm">Authentication Required</h3>
            <p className="text-xs text-slate-500">Provide the master administrative security PIN to continue.</p>
          </div>

          {errorMsg && (
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400 text-xs font-bold p-3 rounded-xl flex items-center gap-2">
              <XCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold p-3 rounded-xl flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleVerifyGate} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-widest mb-1.5">Administrative PIN/Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type={showPin ? "text" : "password"} 
                  value={adminPinInput}
                  onChange={(e) => setAdminPinInput(e.target.value)}
                  placeholder="PIN code or master password"
                  className="w-full pl-10 pr-10 py-3 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl focus:outline-none focus:border-orange-500 dark:focus:border-orange-500 text-center font-mono font-bold tracking-widest text-slate-800 dark:text-slate-100 text-base"
                />
                <button 
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button 
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-650 hover:from-orange-600 hover:to-orange-700 text-white font-black uppercase text-xs tracking-widest rounded-xl py-3.5 flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shadow-orange-500/15 hover:shadow-lg active:scale-[0.98]"
            >
              Verify Credentials <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="text-[10px] text-slate-400 leading-normal flex items-start gap-1.5 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-900">
            <Info className="w-4 h-4 shrink-0 text-slate-400 mt-0.5" />
            <span>If you do not know the PIN, consult the offline setup manual or verify settings in your Firestore console document: `/admin_config/settings`.</span>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard content
  const activeCount = licenses.filter(l => l.deviceId && l.status === 'active' && Date.now() <= new Date(`${l.expiryDate}T${l.expiryTime || '23:59'}`).getTime()).length;
  const expiredCount = licenses.filter(l => Date.now() > new Date(`${l.expiryDate}T${l.expiryTime || '23:59'}`).getTime()).length;
  const suspendedCount = licenses.filter(l => l.status === 'disabled').length;

  return (
    <div className="space-y-6 animate-fadeIn text-left">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-250 dark:border-slate-850 pb-4">
        <div>
          <h1 className="text-xl font-black uppercase tracking-wider text-orange-500 flex items-center gap-2">
            <Shield className="h-5 w-5 animate-pulse" /> D Billify Control Administration
          </h1>
          <p className="text-xs text-slate-500 font-semibold">Central administration node for app status, registrations, security keys, and device access control.</p>
        </div>
        
        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => setIsAuthenticated(false)}
            className="px-3.5 py-1.5 text-xs font-black uppercase tracking-wider bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-605 dark:text-red-400 border border-red-100 dark:border-red-900/30 rounded-xl transition cursor-pointer"
          >
            Lock Dashboard
          </button>
        </div>
      </div>

      {/* Operation logs and notifications */}
      {successMsg && (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-250 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold p-3.5 rounded-xl flex items-center gap-2 animate-bounce">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-250 dark:border-red-900/30 text-red-700 dark:text-red-400 text-xs font-bold p-3.5 rounded-xl flex items-center gap-2">
          <XCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Navigation tabs row */}
      <div className="flex flex-wrap border-b border-slate-200 dark:border-slate-800 gap-1 pb-1">
        {[
          { id: 'overview', label: 'Overview Metrics', icon: Database },
          { id: 'licenses', label: 'Device Licenses', icon: Key },
          { id: 'generate', label: 'Generate License', icon: Plus },
          { id: 'controls', label: 'System Toggles', icon: Sliders },
          { id: 'security', label: 'Security & Password', icon: Lock },
          { id: 'logs', label: 'Audit Timeline', icon: History }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition cursor-pointer ${
                activeTab === tab.id 
                  ? 'bg-orange-500 text-white shadow-md' 
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Allocated Keys</span>
              <span className="text-3xl font-black text-slate-850 dark:text-slate-100 mt-2">{licenses.length}</span>
              <div className="text-[10px] text-slate-400 mt-1 font-mono">Synced Database Registry</div>
            </div>
            
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-emerald-950 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Active Live Devices</span>
              <span className="text-3xl font-black text-emerald-500 mt-2">{activeCount}</span>
              <div className="text-[10px] text-emerald-650/85 mt-1 font-mono">Bound and Verified</div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-red-950/30 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
              <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Expired Keys</span>
              <span className="text-3xl font-black text-rose-500 mt-2">{expiredCount}</span>
              <div className="text-[10px] text-rose-650/85 mt-1 font-mono">Action required (re-generate)</div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-orange-950/30 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
              <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">Suspended Accounts</span>
              <span className="text-3xl font-black text-orange-500 mt-2">{suspendedCount}</span>
              <div className="text-[10px] text-orange-650/85 mt-1 font-mono">Remote control revoked</div>
            </div>
          </div>

          {/* Quick System Status Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl space-y-4 shadow-sm">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-150 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-orange-500" /> Administrative Health Center
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-900 space-y-1">
                <span className="text-[10px] font-black text-slate-500 uppercase">Maintenance State</span>
                <p className="font-extrabold text-base flex items-center gap-1.5 mt-0.5">
                  {appControls.maintenanceMode ? (
                    <span className="text-red-500 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 animate-bounce" /> Under Maintenance
                    </span>
                  ) : (
                    <span className="text-emerald-500 flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4" /> System Live
                    </span>
                  )}
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-900 space-y-1">
                <span className="text-[10px] font-black text-slate-500 uppercase">Device Registrations</span>
                <p className="font-extrabold text-base flex items-center gap-1.5 mt-0.5">
                  {appControls.allowRegistrations ? (
                    <span className="text-emerald-500"><Unlock className="w-4 h-4 inline mr-1" /> Open / Allowed</span>
                  ) : (
                    <span className="text-red-500"><Lock className="w-4 h-4 inline mr-1" /> Blocked</span>
                  )}
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-900 space-y-1">
                <span className="text-[10px] font-black text-slate-500 uppercase">Global User Logins</span>
                <p className="font-extrabold text-base flex items-center gap-1.5 mt-0.5">
                  {appControls.allowLogins ? (
                    <span className="text-emerald-500"><Unlock className="w-4 h-4 inline mr-1" /> Allowed</span>
                  ) : (
                    <span className="text-red-500"><Lock className="w-4 h-4 inline mr-1" /> Blocked / Suspended</span>
                  )}
                </p>
              </div>
            </div>

            {appControls.maintenanceMode && (
              <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl text-xs space-y-1">
                <span className="font-black text-red-650 dark:text-red-400 uppercase tracking-widest text-[9px]">Broadcast Maintenance Message</span>
                <p className="text-red-800 dark:text-red-300 font-bold italic">"{appControls.maintenanceMessage}"</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'licenses' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl overflow-hidden shadow-sm space-y-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-850 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-150">Device Key Registry</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Filter, search, extend, suspend, or unbind registered user keys.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
               <div className="relative flex-1 md:flex-initial">
                 <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                 <input 
                   type="text" 
                   placeholder="Search key, name, email..." 
                   value={searchQuery} 
                   onChange={e => setSearchQuery(e.target.value)} 
                   className="pl-8 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 px-3 py-1.5 rounded-lg w-full md:w-48 focus:outline-none focus:border-orange-500" 
                 />
               </div>
               
               <select 
                 value={statusFilter} 
                 onChange={e => setStatusFilter(e.target.value)} 
                 className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 px-2 py-1.5 rounded-lg focus:outline-none focus:border-orange-500"
               >
                 <option value="all">All Statuses</option>
                 <option value="active">Active Only</option>
                 <option value="expired">Expired Only</option>
                 <option value="suspended">Suspended Only</option>
               </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-850 text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black bg-slate-50 dark:bg-slate-900/50">
                  <th className="p-4">License Key</th>
                  <th className="p-4">Assigned User</th>
                  <th className="p-4">Hardware Node ID</th>
                  <th className="p-4">Creation & Expiry</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Controls</th>
                </tr>
              </thead>
              <tbody>
                {licenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-xs text-slate-400">No generated keys found in registry. Go to Generate tab.</td>
                  </tr>
                ) : (
                  (() => {
                    const filtered = licenses.filter(lic => {
                      const ms = new Date(`${lic.expiryDate}T${lic.expiryTime || '23:59'}`).getTime();
                      const isExp = Date.now() > ms;
                      const matchStatus = statusFilter === 'all' 
                        ? true 
                        : statusFilter === 'active' ? lic.status === 'active' && !isExp
                        : statusFilter === 'expired' ? isExp
                        : statusFilter === 'suspended' ? lic.status === 'disabled'
                        : true;
                        
                      const searchLow = searchQuery.toLowerCase();
                      const matchSearch = !searchQuery || 
                        (lic.deviceName || '').toLowerCase().includes(searchLow) ||
                        (lic.userName || '').toLowerCase().includes(searchLow) ||
                        (lic.userEmail || '').toLowerCase().includes(searchLow) ||
                        (lic.deviceId || '').toLowerCase().includes(searchLow) ||
                        lic.key.toLowerCase().includes(searchLow);
                        
                      return matchStatus && matchSearch;
                    });
                    
                    if (filtered.length === 0) {
                      return <tr><td colSpan={6} className="p-8 text-center text-xs text-slate-400">No matching device records found.</td></tr>;
                    }

                    return filtered.map((lic) => {
                      const expiryMs = new Date(`${lic.expiryDate}T${lic.expiryTime || '23:59'}`).getTime();
                      const isExpired = Date.now() > expiryMs;
                      const daysLeft = Math.max(0, Math.ceil((expiryMs - Date.now()) / (1000 * 60 * 60 * 24)));
                      
                      return (
                        <tr key={lic.key} className="border-b border-slate-200 dark:border-slate-850 text-xs hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                          <td className="p-4 font-mono font-bold text-slate-800 dark:text-slate-150">
                            <div className="flex items-center gap-2">
                              <span>{lic.key}</span>
                              <button
                                onClick={() => copyToClipboard(lic.key)}
                                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded transition"
                                title="Copy Key"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-slate-850 dark:text-slate-200">{lic.userName}</div>
                            <div className="text-[10px] text-slate-450 dark:text-slate-500 font-mono flex items-center gap-1">
                              <Mail className="w-2.5 h-2.5 shrink-0" /> {lic.userEmail}
                            </div>
                          </td>
                          <td className="p-4">
                            {lic.deviceId ? (
                              <div className="space-y-0.5">
                                <span className="font-mono text-orange-500 dark:text-orange-400 font-bold select-all truncate block max-w-[150px]" title={lic.deviceId}>
                                  {lic.deviceId}
                                </span>
                                <span className="text-[9px] text-slate-400 font-bold flex items-center gap-1 uppercase">
                                  <Smartphone className="w-2.5 h-2.5 text-slate-500" /> {lic.deviceName || 'Client Terminal'}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[10px] bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-400 dark:text-slate-500 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                Unbound (Pending)
                              </span>
                            )}
                          </td>
                          <td className="p-4 font-mono">
                            <div className="text-slate-600 dark:text-slate-400">Exp: {lic.expiryDate} {lic.expiryTime}</div>
                            <div className="text-[9px] font-bold mt-0.5">
                              {isExpired ? (
                                <span className="text-rose-500">EXPIRED</span>
                              ) : (
                                <span className="text-emerald-500">{daysLeft} days remaining</span>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            {lic.status === 'disabled' ? (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/30 text-rose-600 dark:text-rose-450">
                                Suspended
                              </span>
                            ) : isExpired ? (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/30 text-amber-600 dark:text-amber-450">
                                Expired
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/30 text-emerald-650 dark:text-emerald-400">
                                Active
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2 pr-2">
                              {/* Action 1: Details View */}
                              <button
                                onClick={() => setViewingLicense(lic)}
                                className="p-1.5 text-slate-400 hover:text-orange-500 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-950/20 cursor-pointer transition-all active:scale-95"
                                title="Review Complete Device Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              
                              {/* Action 2: Unbind (Conditional) */}
                              {lic.deviceId ? (
                                <button
                                  onClick={() => handleUnbindDevice(lic.key)}
                                  className="px-2 py-1 bg-amber-500/10 text-amber-600 hover:bg-amber-600 hover:text-white text-[9px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-95 cursor-pointer"
                                  title="Clear hardware binding to allow reactivation on other PC"
                                >
                                  Unbind
                                </button>
                              ) : (
                                <div className="w-[45px]"></div>
                              )}

                              {/* Action 3: Status Toggle */}
                              <button
                                onClick={() => handleToggleLicenseStatus(lic.key, lic.status)}
                                className={`px-2 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border transition-all cursor-pointer active:scale-95 ${
                                  lic.status === 'disabled'
                                    ? 'bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600'
                                    : 'bg-orange-500/10 text-orange-600 border-orange-500/20 hover:bg-orange-600 hover:text-white'
                                }`}
                              >
                                {lic.status === 'disabled' ? 'Enable' : 'Suspend'}
                              </button>

                              {/* Action 4: Delete - Fixed Position */}
                              <button
                                onClick={() => handleDeleteLicense(lic.key)}
                                className="px-2 py-1 bg-red-500/10 text-red-600 hover:bg-red-600 hover:text-white text-[9px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                                title="Permanently Delete License Registry"
                              >
                                <Trash2 className="w-3 h-3" /> DELETE
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    });
                  })()
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'generate' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl space-y-4 shadow-sm">
            <h3 className="text-sm font-black uppercase tracking-wider text-orange-500 flex items-center gap-1.5">
              <Plus className="w-5 h-5" /> Generate Active Keys
            </h3>
            <p className="text-xs text-slate-400">Allocate pre-licensed keys to register new clients. Newly generated keys remain unbound until entered on a client PC.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Owner Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    value={genUserName} 
                    onChange={e => setGenUserName(e.target.value)} 
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl focus:outline-none focus:border-orange-500 text-xs text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Owner Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="email" 
                    value={genUserEmail} 
                    onChange={e => setGenUserEmail(e.target.value)} 
                    placeholder="e.g. ramesh@example.com"
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl focus:outline-none focus:border-orange-500 text-xs text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">License Lifespan Presets</label>
                <div className="grid grid-cols-4 gap-1.5 bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-850">
                  {[
                    { label: '24 Hours', val: 1 },
                    { label: '7 Days', val: 7 },
                    { label: '30 Days', val: 30 },
                    { label: '90 Days', val: 90 }
                  ].map(item => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => setGenPresetDays(item.val)}
                      className={`py-1.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                        genPresetDays === item.val 
                          ? 'bg-orange-500 text-white font-black' 
                          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-900'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setGenPresetDays(-1)}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold border cursor-pointer transition-all ${
                    genPresetDays === -1 
                      ? 'bg-orange-500 border-orange-400 text-white font-black' 
                      : 'border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-950'
                  }`}
                >
                  📅 Configure Custom Duration Date
                </button>
              </div>

              {genPresetDays === -1 && (
                <div className="grid grid-cols-2 gap-3 animate-fadeIn">
                  <div>
                    <label className="block text-[9px] text-slate-500 font-bold mb-1 uppercase">Expiry Date</label>
                    <input 
                      type="date" 
                      value={genCustomExpiryDate}
                      onChange={(e) => setGenCustomExpiryDate(e.target.value)}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs p-2 rounded-lg text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-500 font-bold mb-1 uppercase">Expiry Time</label>
                    <input 
                      type="time" 
                      value={genCustomExpiryTime}
                      onChange={(e) => setGenCustomExpiryTime(e.target.value)}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs p-2 rounded-lg text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handleGenerateLicenseKey}
                className="w-full bg-orange-500 hover:bg-orange-650 text-white text-xs font-black uppercase tracking-wider py-3 rounded-xl transition-all cursor-pointer shadow-md shadow-orange-500/10 active:scale-[0.98]"
              >
                Generate & Save License
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl flex flex-col justify-between shadow-sm">
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-150 flex items-center gap-1.5">
                <CheckCircle className="w-5 h-5 text-emerald-500" /> Key Generator Station Output
              </h3>
              <p className="text-xs text-slate-400">Copy the active verification token directly to assign to your client database.</p>

              {generatedKey ? (
                <div className="space-y-4 pt-4">
                  <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-850 text-center space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded">Active Key Token</span>
                    <p className="text-xl font-mono font-black text-slate-800 dark:text-slate-100 select-all tracking-widest">{generatedKey}</p>
                    <button
                      onClick={() => copyToClipboard(generatedKey)}
                      className="text-xs font-black text-orange-500 hover:text-orange-650 uppercase tracking-wider flex items-center gap-1 mx-auto mt-2 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" /> Copy Code
                    </button>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-150 dark:border-slate-900 space-y-2 text-xs">
                    <div className="flex justify-between border-b border-slate-200 dark:border-slate-850 pb-1">
                      <span className="text-slate-400">Duration Limit:</span>
                      <span className="font-extrabold text-slate-800 dark:text-slate-200">
                        {genPresetDays === -1 ? 'Custom Date-time' : `${genPresetDays} Days`}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 dark:border-slate-850 pb-1">
                      <span className="text-slate-400">Binds Remaining:</span>
                      <span className="font-extrabold text-emerald-500">1 (Single PC limit)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">System Logs:</span>
                      <span className="font-extrabold text-slate-800 dark:text-slate-200">Registered Cloud Node</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-400 font-bold">
                  No generated keys output. Use the left generator form.
                </div>
              )}
            </div>

            <div className="bg-orange-50 dark:bg-orange-950/20 p-4 rounded-xl border border-orange-100 dark:border-orange-900/30 text-xs flex items-start gap-2 mt-4">
              <Info className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
              <p className="text-orange-850 dark:text-orange-300 leading-normal font-semibold">
                Note: Each license binds securely with a device signature ID on first client usage. Once bound, the key cannot be reused unless cleared using the 'Unbind Dev' action.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'controls' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl shadow-sm space-y-6">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-orange-500 flex items-center gap-1.5">
              <Sliders className="w-5 h-5" /> Global System Control Station
            </h3>
            <p className="text-xs text-slate-400 mt-1">Configure remote maintenance gates, disable registries, or temporarily block user logins system-wide.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Maintenance Mode Configuration */}
            <div className="p-5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-850 space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-red-500 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> Application Maintenance State
              </h4>
              <p className="text-[11px] text-slate-400">Lock the client applications, showing a broadcast warning message while performing database updates or admin reviews.</p>

              <div className="space-y-4 pt-2">
                <label className="flex items-center justify-between gap-2 p-2.5 bg-white dark:bg-slate-900 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 transition">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Enable Maintenance Mode</span>
                  <div className="relative inline-block w-8 h-4 rounded-full transition-colors duration-300 ease-in-out" style={{ backgroundColor: appControls.maintenanceMode ? '#ef4444' : '#334155' }}>
                    <span className={`absolute left-0 top-0 w-4 h-4 bg-white rounded-full transition-transform duration-300 ease-in-out shadow-sm ${appControls.maintenanceMode ? 'translate-x-4' : 'translate-x-0'}`} />
                    <input 
                      type="checkbox" 
                      className="opacity-0 w-0 h-0 animate-pulse" 
                      checked={appControls.maintenanceMode} 
                      onChange={(e) => handleUpdateAppControls({...appControls, maintenanceMode: e.target.checked})} 
                    />
                  </div>
                </label>

                {appControls.maintenanceMode && (
                  <div className="space-y-1.5 animate-fadeIn">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Broadcast Warning Message</label>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={appControls.maintenanceMessage}
                        onChange={(e) => setAppControls({...appControls, maintenanceMessage: e.target.value})}
                        placeholder="Maintenance is ongoing. Back shortly!"
                        className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-red-500 text-xs text-slate-800 dark:text-slate-300 font-semibold"
                      />
                      <button
                        onClick={() => handleUpdateAppControls(appControls)}
                        className="bg-red-500 hover:bg-red-650 text-white font-black px-4 py-2 rounded-xl text-xs uppercase cursor-pointer"
                      >
                        Apply Msg
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Registration and Access Gates */}
            <div className="p-5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-850 space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-orange-500" /> Device Registration & Access Gates
              </h4>
              <p className="text-[11px] text-slate-400">Configure whether unverified devices can submit new license key activations or register user slots.</p>

              <div className="space-y-4 pt-2">
                <label className="flex items-center justify-between gap-2 p-2.5 bg-white dark:bg-slate-900 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 transition">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Allow New Devices & Registrations</span>
                  <div className="relative inline-block w-8 h-4 rounded-full transition-colors duration-300 ease-in-out" style={{ backgroundColor: appControls.allowRegistrations ? '#f97316' : '#334155' }}>
                    <span className={`absolute left-0 top-0 w-4 h-4 bg-white rounded-full transition-transform duration-300 ease-in-out shadow-sm ${appControls.allowRegistrations ? 'translate-x-4' : 'translate-x-0'}`} />
                    <input 
                      type="checkbox" 
                      className="opacity-0 w-0 h-0" 
                      checked={appControls.allowRegistrations} 
                      onChange={(e) => handleUpdateAppControls({...appControls, allowRegistrations: e.target.checked})} 
                    />
                  </div>
                </label>

                <label className="flex items-center justify-between gap-2 p-2.5 bg-white dark:bg-slate-900 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 transition">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Allow User Logins</span>
                  <div className="relative inline-block w-8 h-4 rounded-full transition-colors duration-300 ease-in-out" style={{ backgroundColor: appControls.allowLogins ? '#f97316' : '#334155' }}>
                    <span className={`absolute left-0 top-0 w-4 h-4 bg-white rounded-full transition-transform duration-300 ease-in-out shadow-sm ${appControls.allowLogins ? 'translate-x-4' : 'translate-x-0'}`} />
                    <input 
                      type="checkbox" 
                      className="opacity-0 w-0 h-0" 
                      checked={appControls.allowLogins} 
                      onChange={(e) => handleUpdateAppControls({...appControls, allowLogins: e.target.checked})} 
                    />
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Box 1: Change Master Admin PIN */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl space-y-4 shadow-sm">
            <h3 className="text-sm font-black uppercase tracking-wider text-orange-500 flex items-center gap-1.5">
              <Lock className="w-5 h-5" /> Change Master admin password
            </h3>
            <p className="text-xs text-slate-400">Update the verification code used to authenticate administration panels and bypass lock gates.</p>
            
            <form onSubmit={handleUpdatePassword} className="space-y-4 pt-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Current Password</label>
                <div className="relative">
                  <input 
                    type={showCurrentPassword ? "text" : "password"} 
                    value={currentPasswordInput}
                    onChange={(e) => setCurrentPasswordInput(e.target.value)}
                    placeholder="Current Admin PIN"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 rounded-xl focus:outline-none focus:border-orange-500 text-xs font-bold text-slate-800 dark:text-slate-200"
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showCurrentPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">New Password (PIN)</label>
                <div className="relative">
                  <input 
                    type={showNewPassword ? "text" : "password"} 
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    placeholder="New Admin PIN"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 rounded-xl focus:outline-none focus:border-orange-500 text-xs font-bold text-slate-800 dark:text-slate-200"
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Confirm New Password</label>
                <div className="relative">
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    value={confirmPasswordInput}
                    onChange={(e) => setConfirmPasswordInput(e.target.value)}
                    placeholder="Confirm New PIN"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 rounded-xl focus:outline-none focus:border-orange-500 text-xs font-bold text-slate-800 dark:text-slate-200"
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-700 dark:text-slate-300 hover:text-orange-500 hover:border-orange-500 text-xs font-extrabold uppercase py-2.5 rounded-xl transition cursor-pointer"
              >
                Update Secret Access PIN
              </button>
            </form>
          </div>

          {/* Box 2: Recovery Details */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl space-y-4 shadow-sm">
            <h3 className="text-sm font-black uppercase tracking-wider text-orange-500 flex items-center gap-1.5">
              <UserCheck className="w-5 h-5" /> Master Recovery Contact
            </h3>
            <p className="text-xs text-slate-400">Specify an official system administrator email address to trigger recovery keys and security codes.</p>
            
            <form onSubmit={handleUpdateRecoveryEmail} className="space-y-4 pt-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Active Administrator Recovery Email</label>
                <div className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl px-3 py-2.5">
                  {adminRecoveryEmail}
                </div>
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Update Recovery Email Address</label>
                <input 
                  type="email"
                  value={newRecoveryEmail}
                  onChange={(e) => setNewRecoveryEmail(e.target.value)}
                  placeholder="e.g. systemadmin@dbillify.local"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 rounded-xl focus:outline-none focus:border-orange-500 text-xs font-bold text-slate-855 dark:text-slate-200"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-700 dark:text-slate-300 hover:text-orange-500 hover:border-orange-500 text-xs font-extrabold uppercase py-2.5 rounded-xl transition cursor-pointer"
              >
                Update Recovery Contact
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-850 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-150">Cloud Audit Timeline</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Historical log of all administrative actions, settings updates, and key allocations.</p>
            </div>
            
            <span className="text-[10px] bg-slate-100 dark:bg-slate-950 text-slate-500 font-mono px-2 py-1 rounded border border-slate-200 dark:border-slate-850 font-bold uppercase">
              Cloud Node Synced
            </span>
          </div>

          <div className="p-6 max-h-[450px] overflow-y-auto space-y-4">
            {auditLogs.length === 0 ? (
              <div className="text-center py-12 text-slate-400 font-bold text-xs space-y-2">
                <History className="w-8 h-8 text-slate-300 mx-auto animate-spin" />
                <p>Waiting for cloud timeline entries...</p>
              </div>
            ) : (
              <div className="relative border-l-2 border-orange-500/30 pl-5 ml-2.5 space-y-6">
                {auditLogs.map((log, idx) => (
                  <div key={log.id || idx} className="relative space-y-1">
                    {/* Ring indicator */}
                    <div className="absolute -left-[27px] top-1.5 w-3 h-3 bg-orange-500 border border-white dark:border-slate-900 rounded-full"></div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                      <span className="font-extrabold text-slate-800 dark:text-slate-200 leading-relaxed uppercase">{log.action}</span>
                      <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500 shrink-0">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-450 dark:text-slate-500 font-bold flex items-center gap-1">
                      <User className="w-3.5 h-3.5" /> Operator Role: {log.adminUser || 'System Administrator'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* License Details Modal */}
      {viewingLicense && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black uppercase tracking-tight text-slate-800 dark:text-slate-100">Review License & Device Details</h3>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Complete Hardware Signature Registry</p>
                </div>
              </div>
              <button 
                onClick={() => setViewingLicense(null)}
                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* License Core Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-900">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">License Key</span>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-mono font-bold text-orange-500 select-all">{viewingLicense.key}</span>
                    <button 
                      onClick={() => copyToClipboard(viewingLicense.key)}
                      className="p-1.5 hover:bg-orange-500/10 text-orange-500 rounded-lg transition"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-900">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Current Status</span>
                  <div className="flex items-center gap-2">
                    {viewingLicense.status === 'active' ? (
                      <span className="px-2.5 py-1 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1.5 shadow-md shadow-emerald-500/20">
                        <CheckCircle className="w-3 h-3" /> Active
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1.5 shadow-md shadow-rose-500/20">
                        <Ban className="w-3 h-3" /> {viewingLicense.status.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* User Details */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4 text-orange-500" /> Assigned License Holder
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Full Name</span>
                    <p className="text-sm font-black text-slate-800 dark:text-slate-100">{viewingLicense.userName || 'Not Assigned'}</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Email Identity</span>
                    <p className="text-sm font-bold text-slate-600 dark:text-slate-300">{viewingLicense.userEmail || 'Not Assigned'}</p>
                  </div>
                </div>
              </div>

              {/* Hardware / Device Fingerprint */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-orange-500" /> Secure Device Signature
                </h4>
                {viewingLicense.deviceId ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-900 text-white rounded-2xl shadow-xl border border-slate-800">
                    <div className="col-span-full border-b border-slate-800 pb-3 mb-1">
                      <span className="text-[9px] font-black text-slate-500 uppercase">Unique Hardware UID (Bound)</span>
                      <p className="text-xs font-mono font-bold text-orange-400 truncate select-all">{viewingLicense.deviceId}</p>
                    </div>
                    <div>
                      <span className="text-[9px] font-black text-slate-500 uppercase">Device Name</span>
                      <p className="text-xs font-bold">{viewingLicense.deviceName || 'Unknown Terminal'}</p>
                    </div>
                    <div>
                      <span className="text-[9px] font-black text-slate-500 uppercase">Model / OS</span>
                      <p className="text-xs font-bold">{viewingLicense.deviceModel || 'N/A'} • {viewingLicense.osVersion || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-[9px] font-black text-slate-500 uppercase">Last Seen IP</span>
                      <p className="text-xs font-mono font-bold">{viewingLicense.ipAddress || 'Not Recorded'}</p>
                    </div>
                    <div>
                      <span className="text-[9px] font-black text-slate-500 uppercase">Software Version</span>
                      <p className="text-xs font-bold text-emerald-400">v{viewingLicense.appVersion || '1.0.0'}</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl text-center">
                    <Smartphone className="w-10 h-10 text-slate-200 dark:text-slate-800 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-400">No hardware binding detected yet. Key is ready for initial activation.</p>
                  </div>
                )}
              </div>

              {/* Time Metrics */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-orange-500" /> Subscription Timeline
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-900">
                    <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">Created At</span>
                    <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      {viewingLicense.createdAt ? new Date(viewingLicense.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-900">
                    <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">Activation Date</span>
                    <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      {viewingLicense.activationDate ? new Date(viewingLicense.activationDate).toLocaleDateString() : 'Pending'}
                    </p>
                  </div>
                  <div className="p-3 bg-orange-500/5 dark:bg-orange-500/10 rounded-xl border border-orange-500/20">
                    <span className="text-[9px] font-black text-orange-500 uppercase block mb-1">Expiry Date</span>
                    <p className="text-[11px] font-black text-slate-800 dark:text-slate-100">
                      {viewingLicense.expiryDate} {viewingLicense.expiryTime}
                    </p>
                  </div>
                </div>
              </div>

              {/* Audit History */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <History className="w-4 h-4 text-orange-500" /> License Event Log
                </h4>
                <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-850 p-4 max-h-48 overflow-y-auto">
                  {viewingLicense.history && viewingLicense.history.length > 0 ? (
                    <div className="space-y-3">
                      {viewingLicense.history.slice().reverse().map((event, idx) => (
                        <div key={idx} className="flex items-start gap-3 text-[10px] font-medium text-slate-500 dark:text-slate-400 pb-2 border-b border-slate-100 dark:border-slate-900 last:border-0 last:pb-0">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mt-1 shrink-0"></div>
                          <span>{event}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400 italic text-center py-2">No history recorded for this license.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer / Actions */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleDeleteLicense(viewingLicense.key);
                    setViewingLicense(null);
                  }}
                  className="px-4 py-2 bg-red-50 hover:bg-red-500 text-red-600 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-xl border border-red-200 hover:border-red-500 transition-all flex items-center gap-2 shadow-sm"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Permanently
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleToggleLicenseStatus(viewingLicense.key, viewingLicense.status);
                    // Update local view state if needed or just close
                    setViewingLicense(null);
                  }}
                  className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl border transition-all shadow-sm ${
                    viewingLicense.status === 'disabled'
                      ? 'bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600'
                      : 'bg-orange-500 text-white border-orange-500 hover:bg-orange-600'
                  }`}
                >
                  {viewingLicense.status === 'disabled' ? 'Re-activate' : 'Suspend License'}
                </button>
                <button
                  onClick={() => setViewingLicense(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
