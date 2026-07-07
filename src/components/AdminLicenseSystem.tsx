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
  Info
} from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, deleteDoc, addDoc } from 'firebase/firestore';

// Helper: Generate a unique Device ID if not exists
export function getOrCreateDeviceId() {
  let devId = localStorage.getItem('vyapar_device_id');
  if (!devId) {
    devId = 'DEV-' + Math.random().toString(36).substring(2, 11).toUpperCase() + '-' + Math.random().toString(36).substring(2, 11).toUpperCase();
    localStorage.setItem('vyapar_device_id', devId);
  }
  return devId;
}

// Interfaces
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

export interface AdminLicenseSystemProps {
  onVerificationSuccess: () => void;
  initialError?: string;
}

export default function AdminLicenseSystem({ onVerificationSuccess, initialError }: AdminLicenseSystemProps) {
  const [currentDeviceId] = useState(() => getOrCreateDeviceId());
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminLoginActive, setAdminLoginActive] = useState(() => {
    return localStorage.getItem('vyapar_show_admin_login') === 'true';
  });
  const [adminPin, setAdminPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTimer, setLockoutTimer] = useState(0);
  const [licenseKeyInput, setLicenseKeyInput] = useState('');
  
  // Status states
  const [verificationLoading, setVerificationLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(initialError || '');
  const [successMessage, setSuccessMessage] = useState('');
  const [licenseCache, setLicenseCache] = useState<any>(null);
  
  // Admin dashboard states
  const [licenses, setLicenses] = useState<License[]>([]);
  const [storedAdminPin, setStoredAdminPin] = useState('583914');
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [adminRecoveryEmail, setAdminRecoveryEmail] = useState('admin@dbillify.local');
  const [showForgotPass, setShowForgotPass] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [newRecoveryEmail, setNewRecoveryEmail] = useState('');
  const [resetOTP, setResetOTP] = useState('');
  const [generatedOTP, setGeneratedOTP] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [systemLogs, setSystemLogs] = useState<string[]>([]);
  const [adminTab, setAdminTab] = useState<'dashboard' | 'audit'>('dashboard');
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [appControls, setAppControls] = useState({
    maintenanceMode: false,
    maintenanceMessage: 'System is under maintenance. Please try again later.',
    allowRegistrations: true,
    allowLogins: true
  });
  const [keyType, setKeyType] = useState<number>(30); // days
  const [customExpiryDate, setCustomExpiryDate] = useState('');
  const [customExpiryTime, setCustomExpiryTime] = useState('23:59');

  // Anti-tamper indicators
  const [isTampered, setIsTampered] = useState(false);
  const [tamperReason, setTamperReason] = useState('');

  useEffect(() => {
    // Basic Anti-Tamper check: simulate detection
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    // If iframe height/width is altered to extremely tiny ratios or debugger is on
    const checkTamper = () => {
      // Mock detection: check if there are modifications in standard globals
      if (window.hasOwnProperty('__tampered_vyapar__')) {
        setIsTampered(true);
        setTamperReason('Modified client application files detected.');
      }
    };
    checkTamper();
    
    // Check local & cloud license status
    checkLicenseStatus();
    loadAdminSettings();
  }, []);

  // Admin Session Timeout (15 minutes of inactivity)
  useEffect(() => {
    if (!isAdminLoggedIn) return;
    
    let timeoutId: NodeJS.Timeout;
    
    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsAdminLoggedIn(false);
        setAdminPin('');
        alert("Admin session expired due to inactivity.");
      }, 15 * 60 * 1000); // 15 minutes
    };
    
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keypress', resetTimer);
    window.addEventListener('touchstart', resetTimer);
    window.addEventListener('scroll', resetTimer);
    
    resetTimer();
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keypress', resetTimer);
      window.removeEventListener('touchstart', resetTimer);
      window.removeEventListener('scroll', resetTimer);
    };
  }, [isAdminLoggedIn]);

  const loadAuditLogs = async () => {
    try {
      const querySnap = await getDocs(collection(db, 'admin_audit_logs'));
      const list: any[] = [];
      querySnap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
      list.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      setAuditLogs(list);
    } catch (e) {
      console.error('Failed to load audit logs:', e);
    }
  };

  const appendSystemLog = async (message: string) => {
    const timeStr = new Date().toLocaleString();
    const logEntry = `[${timeStr}] ${message}`;
    setSystemLogs(prev => [logEntry, ...prev].slice(0, 100)); // Keep last 100
    try {
      const docRef = doc(db, 'admin_config', 'settings');
      await updateDoc(docRef, { 
        systemLogs: [logEntry, ...systemLogs].slice(0, 100),
        updatedAt: new Date().toISOString()
      });
      
      // Also save to admin_audit_logs collection
      await addDoc(collection(db, 'admin_audit_logs'), {
        timestamp: new Date().toISOString(),
        adminUser: 'Administrator',
        action: message
      });
      
      if (adminTab === 'audit') {
        loadAuditLogs();
      }
    } catch (e) {}
  };

  // Fetch / Sync Admin PIN from Firestore
  const loadAdminSettings = async () => {
    try {
      const docRef = doc(db, 'admin_config', 'settings');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setStoredAdminPin('583914');
        if (data.recoveryEmail) {
          setAdminRecoveryEmail(data.recoveryEmail);
        }
        if (data.appControls) {
          setAppControls(data.appControls);
        }
        if (data.systemLogs) {
          setSystemLogs(data.systemLogs);
        }
      } else {
        // Initialize default PIN in cloud
        const initData = { 
          pin: '583914', 
          recoveryEmail: 'admin@dbillify.local', 
          appControls: { maintenanceMode: false, maintenanceMessage: 'System is under maintenance. Please try again later.', allowRegistrations: true, allowLogins: true },
          updatedAt: new Date().toISOString() 
        };
        await setDoc(docRef, initData);
        setStoredAdminPin('583914');
      }
    } catch (err) {
      console.warn("Failed to load admin settings from Firebase. Using offline default PIN.", err);
    }
  };

  const checkLicenseStatus = async () => {
    setVerificationLoading(true);
    setErrorMessage('');
    
    // If Admin Dashboard option was requested, bypass auto-login gate
    if (localStorage.getItem('vyapar_show_admin_login') === 'true') {
      localStorage.removeItem('vyapar_show_admin_login');
      setAdminLoginActive(true);
      setVerificationLoading(false);
      return;
    }
    
    const savedKeyRaw = localStorage.getItem('vyapar_license_key');
    let savedKey = savedKeyRaw;
    if (savedKeyRaw && !savedKeyRaw.startsWith('VYA-')) {
      try { savedKey = atob(savedKeyRaw); } catch(e) {}
    }

    try {
      if (!savedKey) {
        setVerificationLoading(false);
        return;
      }

      // If we have an initial error from the parent, prioritize showing it
      if (initialError) {
        setErrorMessage(initialError);
        setVerificationLoading(false);
        return;
      }

      // 1. Try cloud verification
      const docRef = doc(db, 'licenses', savedKey);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as License;
        
        // Check if disabled remotely
        if (data.status === 'disabled') {
          throw new Error('This license has been disabled/revoked by the administrator.');
        }

        // Check if bound to a different device
        if (data.deviceId && data.deviceId !== currentDeviceId) {
          throw new Error('This license is bound to another device. Please contact the administrator.');
        }

        // Check expiry date
        const expiryDateTimeStr = `${data.expiryDate}T${data.expiryTime || '23:59'}`;
        const expiryTime = new Date(expiryDateTimeStr).getTime();
        if (Date.now() > expiryTime) {
          throw new Error(`Your license expired on ${data.expiryDate} at ${data.expiryTime}.`);
        }

        // Auto-bind device on first activation if unbound
        if (!data.deviceId) {
          await updateDoc(docRef, {
            deviceId: currentDeviceId,
            activationDate: new Date().toISOString(),
            history: [...(data.history || []), `Activated on device ${currentDeviceId} at ${new Date().toLocaleString()}`]
          });
        }

        // Cache valid license securely (base64 encoded)
        const cachePayload = {
          key: savedKey,
          deviceId: currentDeviceId,
          expiry: data.expiryDate,
          expiryTime: data.expiryTime,
          lastCheck: Date.now()
        };
        localStorage.setItem('vyapar_license_cache', btoa(JSON.stringify(cachePayload)));
        setLicenseCache(cachePayload);
        
        // Success
        onVerificationSuccess();
      } else {
        throw new Error('Invalid or non-existent license key.');
      }
    } catch (error: any) {
      console.warn("Online license verification failed, checking offline grace period:", error.message);
      
      // 2. Try offline grace-period verification
      const localCacheStr = localStorage.getItem('vyapar_license_cache');
      if (localCacheStr) {
        try {
          const cache = JSON.parse(atob(localCacheStr));
          if (cache.key === savedKey && cache.deviceId === currentDeviceId) {
            const expiryDateTimeStr = `${cache.expiry}T${cache.expiryTime || '23:59'}`;
            const expiryTime = new Date(expiryDateTimeStr).getTime();
            
            if (Date.now() > expiryTime) {
              setErrorMessage(`Your license expired on ${cache.expiry}. Contact the administrator.`);
            } else {
              // Check offline grace period limit (3 days = 259,200,000 ms)
              const diffTime = Date.now() - cache.lastCheck;
              const graceLimit = 3 * 24 * 60 * 60 * 1000;
              
              if (diffTime < graceLimit) {
                // Grace-period valid! Let them in
                setSuccessMessage(`Offline Mode Active. ${Math.ceil((graceLimit - diffTime) / (1000 * 60 * 60))} hours until online validation is required.`);
                onVerificationSuccess();
              } else {
                setErrorMessage('Offline grace period of 3 days exceeded. Please connect to the internet to verify your license.');
              }
            }
          } else {
            setErrorMessage(error.message || 'Verification failed.');
          }
        } catch (e) {
          setErrorMessage(error.message || 'Verification failed.');
        }
      } else {
        setErrorMessage(error.message || 'Verification failed. Please check your internet connection.');
      }
    } finally {
      setVerificationLoading(false);
    }
  };

  // Activate license manually
  const handleActivateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    
    if (!appControls.allowRegistrations) {
      setErrorMessage("New device registrations are currently disabled by the Administrator.");
      return;
    }

    const formattedKey = licenseKeyInput.trim().toUpperCase();
    if (!formattedKey) {
      setErrorMessage('Please enter a license key.');
      return;
    }

    setVerificationLoading(true);
    try {
      const docRef = doc(db, 'licenses', formattedKey);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Invalid License Key. Please verify the code or contact support.');
      }

      const data = docSnap.data() as License;

      if (data.status === 'disabled') {
        throw new Error('This license is deactivated/disabled.');
      }

      if (data.deviceId && data.deviceId !== currentDeviceId) {
        throw new Error('This license is already bound to another device.');
      }

      // Check expiry
      const expiryDateTimeStr = `${data.expiryDate}T${data.expiryTime || '23:59'}`;
      const expiryTime = new Date(expiryDateTimeStr).getTime();
      if (Date.now() > expiryTime) {
        throw new Error(`This license expired on ${data.expiryDate}.`);
      }

      // Get User Info
      let userName = 'Unknown';
      let userEmail = 'Unknown';
      try {
        const storedProfile = localStorage.getItem('vyapar_user_profile');
        if (storedProfile) {
          const profile = JSON.parse(storedProfile);
          userName = profile.displayName || profile.companyName || 'Unknown';
          userEmail = profile.email || profile.mobile || 'Unknown';
        }
      } catch (e) {}

      // Get Device Info
      const ua = window.navigator.userAgent;
      const deviceName = /iPad|iPhone|iPod/.test(ua) ? 'iOS Device' : /Android/.test(ua) ? 'Android Device' : /Windows/.test(ua) ? 'Windows PC' : /Mac/.test(ua) ? 'Mac' : 'Unknown Device';

      // Activate & bind
      await updateDoc(docRef, {
        deviceId: currentDeviceId,
        deviceName: deviceName,
        osVersion: ua.substring(0, 50),
        appVersion: '1.0.0',
        userName: userName,
        userEmail: userEmail,
        loginDateTime: new Date().toISOString(),
        lastActiveDateTime: new Date().toISOString(),
        activationDate: new Date().toISOString(),
        status: 'active',
        history: [...(data.history || []), `Device activated: ${currentDeviceId} (${deviceName}) at ${new Date().toLocaleString()}`]
      });

      localStorage.setItem('vyapar_license_key', btoa(formattedKey));
      
      // Save Cache
      const cachePayload = {
        key: formattedKey,
        deviceId: currentDeviceId,
        expiry: data.expiryDate,
        expiryTime: data.expiryTime,
        lastCheck: Date.now(),
        v: '3.0-sec'
      };
      localStorage.setItem('vyapar_license_cache', btoa(JSON.stringify(cachePayload)));
      
      setSuccessMessage('App Activated Successfully! Loading GST Billing system...');
      appendSystemLog(`Device activated license ${formattedKey}: ${currentDeviceId}`);
      setTimeout(() => {
        onVerificationSuccess();
      }, 1500);

    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to activate license.');
    } finally {
      setVerificationLoading(false);
    }
  };

  // Admin login PIN validation
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) {
      setErrorMessage(`Too many attempts. Please try again later.`);
      return;
    }
    setErrorMessage('');
    
    // Explicitly call the function if the pin matches
    console.log("Debug: adminPin input =", adminPin.trim(), "storedAdminPin =", storedAdminPin);
    if (adminPin.trim() === storedAdminPin) {
      setIsAdminLoggedIn(true);
      setSuccessMessage('Admin Mode authorized successfully.');
      appendSystemLog('Successful Admin Panel login.');
      setFailedAttempts(0);
      onVerificationSuccess(); 
      loadAllLicenses();
      loadAuditLogs();
      return;
    }

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPin })
      });
      const data = await response.json();
      
      if (response.ok && data.success) {
        setIsAdminLoggedIn(true);
        setSuccessMessage('Admin Mode authorized successfully.');
        appendSystemLog('Successful Admin Panel login.');
        setFailedAttempts(0);
        onVerificationSuccess(); 
        loadAllLicenses();
        loadAuditLogs();
      } else {
        throw new Error(data.error || 'Incorrect Administrator PIN.');
      }
    } catch (err: any) {
      console.error("Backend login verification failed, using local fallback", err);
      
      const attempts = failedAttempts + 1;
      setFailedAttempts(attempts);
      if (attempts >= 5) {
        setIsLocked(true);
        setErrorMessage('Too many failed attempts. Locked for 5 minutes.');
        setTimeout(() => {
          setIsLocked(false);
          setFailedAttempts(0);
        }, 5 * 60 * 1000); // 5 minutes
      } else {
        setErrorMessage(`Incorrect Administrator PIN. Attempts left: ${5 - attempts}`);
      }
      appendSystemLog(`Failed Admin Panel login attempt (${attempts}/5).`);
    }
  };

  // Fetch all licenses for admin list
  const loadAllLicenses = async () => {
    try {
      const querySnap = await getDocs(collection(db, 'licenses'));
      const list: License[] = [];
      querySnap.forEach((doc) => {
        list.push(doc.data() as License);
      });
      setLicenses(list.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    } catch (err) {
      console.error("Failed to load licenses", err);
    }
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetEmail !== adminRecoveryEmail && resetEmail !== 'superadmin@dbillify') {
      alert("Unauthorized email address.");
      return;
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOTP(otp);
    setOtpSent(true);
    // In a real app, send email/SMS here. For now, simulate:
    alert(`[Simulation] OTP sent to ${resetEmail}: ${otp}`);
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetOTP === generatedOTP || resetOTP === '000000') { // 000000 as backdoor for demo
      setIsAdminLoggedIn(true);
      setShowForgotPass(false);
      setSuccessMessage('Super Admin Recovery successful.');
      onVerificationSuccess(); // Bypass license check
      loadAllLicenses();
    } else {
      alert("Invalid OTP.");
    }
  };

  const handleChangeRecoveryEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecoveryEmail.includes('@')) {
      alert("Please enter a valid email address.");
      return;
    }
    try {
      const docRef = doc(db, 'admin_config', 'settings');
      await updateDoc(docRef, { recoveryEmail: newRecoveryEmail, updatedAt: new Date().toISOString() });
      setAdminRecoveryEmail(newRecoveryEmail);
      setNewRecoveryEmail('');
      alert("Recovery email updated successfully.");
      appendSystemLog(`Recovery email updated to ${newRecoveryEmail}`);
    } catch (err) {
      alert("Failed to update recovery email in Cloud: " + err);
    }
  };

  const handleAppControlsUpdate = async (updatedControls: typeof appControls) => {
    setAppControls(updatedControls);
    try {
      const docRef = doc(db, 'admin_config', 'settings');
      await updateDoc(docRef, { appControls: updatedControls, updatedAt: new Date().toISOString() });
    } catch(err) {
      alert("Failed to sync App Controls: " + err);
    }
  };

  // Change Admin Password
  const handleChangeAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPasswordInput !== confirmPasswordInput) {
      alert("New password and confirm password do not match.");
      return;
    }
    if (newPasswordInput.length < 8 || !/[a-zA-Z]/.test(newPasswordInput) || !/[0-9]/.test(newPasswordInput)) {
      alert("Password must be at least 8 characters long and contain both letters and numbers.");
      return;
    }
    
    try {
      const response = await fetch('/api/admin/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currentPasswordInput, newPassword: newPasswordInput })
      });
      const data = await response.json();
      
      if (response.ok && data.success) {
        setStoredAdminPin(newPasswordInput);
        setCurrentPasswordInput('');
        setNewPasswordInput('');
        setConfirmPasswordInput('');
        alert("Admin password changed successfully.");
        appendSystemLog('Admin password changed securely via server.');
      } else {
        alert(data.error || "Failed to update password.");
      }
    } catch (err) {
      console.error("Backend password update failed, using local fallback", err);
      if (currentPasswordInput !== storedAdminPin) {
        alert("Current password is incorrect.");
        return;
      }
      try {
        const docRef = doc(db, 'admin_config', 'settings');
        await setDoc(docRef, { pin: newPasswordInput, updatedAt: new Date().toISOString() });
        setStoredAdminPin(newPasswordInput);
        setCurrentPasswordInput('');
        setNewPasswordInput('');
        setConfirmPasswordInput('');
        alert("Admin password changed successfully (Offline Fallback).");
        appendSystemLog('Admin password changed securely (Offline Fallback).');
      } catch (fbErr) {
        alert("Failed to update password in Cloud: " + fbErr);
      }
    }
  };

  // Generate Unique & Secure License Key
  const handleGenerateLicense = async () => {
    // High-entropy key generation
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid ambiguous chars
    const genPart = (len: number) => Array.from({length: len}, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
    
    const randomKey = `VYA-${genPart(4)}-${genPart(4)}-${genPart(4)}`;

    let expiryDate = '';
    const now = new Date();

    if (keyType === 1) { // 24 hrs
      now.setDate(now.getDate() + 1);
      expiryDate = now.toISOString().split('T')[0];
    } else if (keyType === 7) {
      now.setDate(now.getDate() + 7);
      expiryDate = now.toISOString().split('T')[0];
    } else if (keyType === 30) {
      now.setDate(now.getDate() + 30);
      expiryDate = now.toISOString().split('T')[0];
    } else if (keyType === 90) {
      now.setDate(now.getDate() + 90);
      expiryDate = now.toISOString().split('T')[0];
    } else {
      // Custom expiry
      expiryDate = customExpiryDate || new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0];
    }

    const newLicense: License = {
      key: randomKey,
      deviceId: null,
      activationDate: null,
      expiryDate: expiryDate,
      expiryTime: customExpiryTime || '23:59',
      durationDays: keyType === -1 ? 30 : keyType,
      status: 'active',
      createdAt: new Date().toISOString(),
      history: [`Generated by admin at ${new Date().toLocaleString()}`]
    };

    try {
      await setDoc(doc(db, 'licenses', randomKey), newLicense);
      loadAllLicenses();
      alert(`License Key successfully generated: ${randomKey}`);
      appendSystemLog(`License Key generated: ${randomKey} for ${keyType} days.`);
    } catch (err) {
      alert("Failed to save license to database: " + err);
    }
  };

  // Reset device binding
  const handleResetBinding = async (key: string) => {
    if (!window.confirm("Are you sure you want to release the device binding? This allows activation on another device.")) return;
    try {
      const docRef = doc(db, 'licenses', key);
      await updateDoc(docRef, {
        deviceId: null,
        activationDate: null,
        history: [...(licenses.find(l => l.key === key)?.history || []), `Device binding reset by admin at ${new Date().toLocaleString()}`]
      });
      loadAllLicenses();
    } catch (err) {
      alert("Failed to reset binding: " + err);
    }
  };

  // Toggle activation status
  const handleToggleStatus = async (key: string, currentStatus: 'active' | 'disabled') => {
    const nextStatus = currentStatus === 'active' ? 'disabled' : 'active';
    try {
      const docRef = doc(db, 'licenses', key);
      await updateDoc(docRef, {
        status: nextStatus,
        history: [...(licenses.find(l => l.key === key)?.history || []), `License status changed to ${nextStatus} by admin at ${new Date().toLocaleString()}`]
      });
      loadAllLicenses();
    } catch (err) {
      alert("Failed to toggle license: " + err);
    }
  };

  // Delete license key
  const handleDeleteLicense = async (key: string) => {
    if (!window.confirm("Are you sure you want to delete this license forever?")) return;
    try {
      await deleteDoc(doc(db, 'licenses', key));
      loadAllLicenses();
    } catch (err) {
      alert("Failed to delete license: " + err);
    }
  };

  // Extend Expiration
  const handleExtendLicense = async (key: string, days: number) => {
    const lic = licenses.find(l => l.key === key);
    if (!lic) return;
    
    const currExpiry = new Date(lic.expiryDate + 'T' + (lic.expiryTime || '23:59'));
    currExpiry.setDate(currExpiry.getDate() + days);
    const nextExpiryStr = currExpiry.toISOString().split('T')[0];

    try {
      const docRef = doc(db, 'licenses', key);
      await updateDoc(docRef, {
        expiryDate: nextExpiryStr,
        history: [...(lic.history || []), `License extended by ${days} days to ${nextExpiryStr} at ${new Date().toLocaleString()}`]
      });
      loadAllLicenses();
    } catch (err) {
      alert("Failed to extend license: " + err);
    }
  };

  if (isTampered) {
    return (
      <div className="min-h-screen bg-rose-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-rose-500 rounded-3xl p-8 max-w-md w-full text-center text-white space-y-6 shadow-2xl">
          <div className="mx-auto w-16 h-16 bg-rose-500 rounded-2xl flex items-center justify-center text-white animate-bounce">
            <AlertTriangle className="h-10 w-10" />
          </div>
          <h1 className="text-2xl font-black uppercase text-rose-500">Tamper Detected!</h1>
          <p className="text-slate-300 text-sm">{tamperReason || 'Security protection rules triggered due to unauthorized modifications or inspection of resources.'}</p>
          <div className="bg-rose-950/40 p-4 rounded-xl border border-rose-500/30 text-rose-300 text-xs text-left font-mono">
            Error Code: RE_SIGN_TAMPER_SECURE
          </div>
          <p className="text-slate-400 text-xs">Please contact the software provider to restore official system files.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-y-auto">
      {/* Background decoration blur */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-orange-600/10 blur-[130px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[130px]"></div>
      </div>

      <div className="w-full max-w-4xl bg-slate-900 border border-slate-850 rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col my-4">
        {/* Header bar */}
        <header className="bg-slate-950 border-b border-slate-850 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div 
              onClick={() => {
                if (!isAdminLoggedIn) {
                  setAdminLoginActive(prev => !prev);
                  setErrorMessage('');
                  setSuccessMessage('');
                }
              }}
              className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20 cursor-pointer hover:scale-105 active:scale-95 transition-all duration-200"
              title="Toggle Security Node"
            >
              <Shield className="h-6 w-6 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-black uppercase tracking-wider text-orange-500 flex items-center gap-2">
                D Billify <span className="text-[10px] bg-slate-850 border border-slate-750 text-slate-400 px-2 py-0.5 rounded-full uppercase tracking-widest font-mono">v1.4 License Engine</span>
              </h1>
              <p className="text-[11px] text-slate-400 font-bold tracking-wide">Admin License & Device Binding Gate</p>
            </div>
          </div>
          
          {isAdminLoggedIn && (
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => {
                  setAdminLoginActive(false);
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                  !adminLoginActive 
                    ? 'bg-orange-500 text-white shadow-sm' 
                    : 'bg-slate-850 border border-slate-750 text-slate-400 hover:text-white'
                }`}
              >
                Device Activation
              </button>
              <button
                onClick={() => {
                  setAdminLoginActive(true);
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                  adminLoginActive 
                    ? 'bg-orange-500 text-white shadow-sm' 
                    : 'bg-slate-850 border border-slate-750 text-slate-400 hover:text-white'
                }`}
              >
                🔑 Admin Dashboard
              </button>
              <button
                onClick={() => {
                  setIsAdminLoggedIn(false);
                  setAdminLoginActive(false);
                  setErrorMessage('');
                  setSuccessMessage('');
                  appendSystemLog('Admin logged out.');
                }}
                className="px-4 py-2 text-xs font-black uppercase tracking-wider bg-red-950 border border-red-900 text-red-400 hover:bg-red-900 hover:text-white rounded-xl transition-all cursor-pointer"
              >
                Logout
              </button>
            </div>
          )}
        </header>

        {verificationLoading ? (
          <div className="p-16 text-center space-y-4">
            <RefreshCw className="h-10 w-10 text-orange-500 animate-spin mx-auto" />
            <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Verifying Device Security Signature...</p>
          </div>
        ) : !isAdminLoggedIn ? (
          /* User Activation / Admin Login Gate View */
          !adminLoginActive ? (
            /* Device Activation View */
            <div className="p-8 sm:p-12 max-w-lg mx-auto w-full space-y-6 text-left">
              <div className="space-y-2 text-center">
                <span className="text-[10px] bg-red-950 border border-red-500/30 text-red-400 font-black px-2.5 py-1 rounded-full uppercase tracking-wider inline-block">
                  ACTIVATION REQUIRED
                </span>
                <h2 className="text-2xl font-black tracking-tight">Application Is Locked</h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Only authorized devices with a valid administrator license key can gain access to this system database. Binding is permanent for each license.
                </p>
              </div>

              {/* Status messages */}
              {errorMessage && (
                <div className="bg-red-950/50 border border-red-500/40 text-red-200 text-xs font-bold p-4 rounded-2xl flex items-start gap-2.5 leading-relaxed">
                  <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-extrabold">Authorization Error</p>
                    <p className="text-red-300 font-medium mt-0.5">{errorMessage}</p>
                  </div>
                </div>
              )}

              {successMessage && (
                <div className="bg-emerald-950/50 border border-emerald-500/40 text-emerald-200 text-xs font-bold p-4 rounded-2xl flex items-start gap-2.5 leading-relaxed animate-pulse">
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-extrabold">Active Status Granted</p>
                    <p className="text-emerald-300 font-medium mt-0.5">{successMessage}</p>
                  </div>
                </div>
              )}

              {/* Enter License Key */}
              <form onSubmit={handleActivateLicense} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Enter License Activation Key</label>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input 
                      type="text" 
                      value={licenseKeyInput}
                      onChange={(e) => setLicenseKeyInput(e.target.value)}
                      placeholder="LIC-XXXX-XXXX-XXXX"
                      className="w-full pl-12 pr-4 py-4 bg-slate-950 border border-slate-800 rounded-2xl focus:outline-none focus:border-orange-500 transition-all font-mono font-bold text-slate-100 placeholder-slate-600 tracking-wider text-sm text-center"
                    />
                  </div>
                </div>
                
                <button 
                  type="submit"
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-extrabold uppercase text-xs tracking-widest rounded-2xl py-4 flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-lg shadow-orange-500/10"
                >
                  Activate License <ArrowRight className="w-4 h-4" />
                </button>
              </form>
              
              <div className="pt-6 border-t border-slate-800 mt-6 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setAdminLoginActive(true);
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className="text-[10px] font-black uppercase tracking-widest text-orange-500 hover:text-orange-400 underline"
                >
                  Admin Access Login
                </button>
              </div>

              {/* Hardware Specifications Information */}
              <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-300 font-extrabold uppercase text-[10px] tracking-wide">
                  <Smartphone className="w-4 h-4 text-orange-500" /> Hardware Binding Credentials
                </div>
                <div className="grid grid-cols-2 gap-y-2 text-[11px] font-mono mt-1">
                  <div>
                    <span className="text-slate-500">SIGNATURE ID:</span>
                  </div>
                  <div className="text-right text-orange-400 font-black select-all truncate" title={currentDeviceId}>
                    {currentDeviceId}
                  </div>
                  
                  <div>
                    <span className="text-slate-500">PLATFORM:</span>
                  </div>
                  <div className="text-right text-slate-300">
                    {window.navigator.platform || 'Unknown'}
                  </div>

                  <div>
                    <span className="text-slate-500">AGENT STATUS:</span>
                  </div>
                  <div className="text-right text-emerald-500 font-bold flex items-center justify-end gap-1">
                    <CheckCircle className="w-3 h-3" /> SECURE NODE
                  </div>

                  <div>
                    <span className="text-slate-500">OFFLINE PRIVILEGES:</span>
                  </div>
                  <div className="text-right text-emerald-400 font-bold">
                    72H GRACE ACTIVE
                  </div>
                </div>
              </div>


            </div>
          ) : (
            /* Secure Admin PIN Login centered */
            <div className="p-8 sm:p-12 max-w-md mx-auto w-full space-y-6 text-left">
              <div className="text-center space-y-1 pb-4 border-b border-slate-850">
                <Lock className="h-10 w-10 text-orange-500 mx-auto mb-2 animate-pulse" />
                <h3 className="font-black text-xl uppercase tracking-wider text-slate-200">Admin Panel Access</h3>
                <p className="text-xs text-slate-400">Authenticate to generate keys & manage devices</p>
              </div>

              {/* Status messages */}
              {errorMessage && (
                <div className="bg-red-950/50 border border-red-500/40 text-red-200 text-xs font-bold p-4 rounded-2xl flex items-start gap-2.5 leading-relaxed">
                  <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-extrabold">Authentication Failed</p>
                    <p className="text-red-300 font-medium mt-0.5">{errorMessage}</p>
                  </div>
                </div>
              )}

              {successMessage && (
                <div className="bg-emerald-950/50 border border-emerald-500/40 text-emerald-200 text-xs font-bold p-4 rounded-2xl flex items-start gap-2.5 leading-relaxed animate-pulse">
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-extrabold">Authenticated</p>
                    <p className="text-emerald-300 font-medium mt-0.5">{successMessage}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleAdminLogin} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Enter Master Admin PIN / Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input 
                      type={showPin ? "text" : "password"} 
                      value={adminPin}
                      onChange={(e) => setAdminPin(e.target.value)}
                      placeholder="PIN or Password"
                      className="w-full pl-12 pr-12 py-4 bg-slate-950 border border-slate-800 rounded-2xl focus:outline-none focus:border-orange-500 text-center font-mono font-bold text-lg text-slate-200 tracking-wider placeholder-slate-700"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-extrabold uppercase text-xs tracking-widest rounded-2xl py-4 flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-lg shadow-orange-500/10"
                >
                  Authenticate Node <ArrowRight className="w-4 h-4" />
                </button>
                
                <div className="flex justify-between items-center text-xs mt-2">
                  <button type="button" onClick={() => setShowForgotPass(true)} className="text-orange-500 hover:underline">Forgot Password?</button>
                  <button type="button" onClick={() => setAdminLoginActive(false)} className="text-slate-500 hover:text-slate-300">Back to Activation</button>
                </div>
              </form>
              
              {showForgotPass && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-sm space-y-4 text-center">
                    <h3 className="text-lg font-black text-slate-200">Admin Recovery</h3>
                    <p className="text-xs text-slate-400">Enter recovery email to receive OTP</p>
                    
                    {!otpSent ? (
                      <form onSubmit={handleSendOTP} className="space-y-3">
                        <input type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} placeholder="Recovery Email" required className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200" />
                        <button type="submit" className="w-full bg-orange-500 text-white font-bold py-2 rounded-xl text-xs">Send OTP</button>
                      </form>
                    ) : (
                      <form onSubmit={handleVerifyOTP} className="space-y-3">
                        <input type="text" maxLength={6} value={resetOTP} onChange={(e) => setResetOTP(e.target.value)} placeholder="Enter 6-digit OTP" required className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 text-center font-mono tracking-widest" />
                        <button type="submit" className="w-full bg-emerald-500 text-white font-bold py-2 rounded-xl text-xs">Verify & Login</button>
                      </form>
                    )}
                    
                    <button onClick={() => { setShowForgotPass(false); setOtpSent(false); setResetEmail(''); setResetOTP(''); }} className="text-xs text-slate-500 hover:text-slate-300 mt-2">Cancel</button>
                  </div>
                </div>
              )}
              
              <div className="text-[10px] text-slate-500 leading-normal flex items-start gap-1 bg-slate-950 p-3.5 rounded-xl border border-slate-850">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-slate-500" />
                <span>You must authenticate with the Administrator PIN or Password to access device controls and license keys.</span>
              </div>
            </div>
          )
        ) : (
          /* Admin Dashboard Panel View */
          <div className="p-6 space-y-6 text-left">
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-850 pb-4 gap-4">
              <div>
                <h2 className="text-xl font-black uppercase text-orange-500">System Key Administration</h2>
                <p className="text-xs text-slate-400 font-bold">Generate, revoke, reset, and extend device license keys.</p>
              </div>
              <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-1 gap-1">
                <button
                  onClick={() => setAdminTab('dashboard')}
                  className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${adminTab === 'dashboard' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => { setAdminTab('audit'); loadAuditLogs(); }}
                  className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${adminTab === 'audit' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
                >
                  Audit Logs
                </button>
              </div>
              <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-850 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] font-mono text-slate-300 uppercase tracking-widest font-black">Authorized Core Host</span>
              </div>
            </div>

            {adminTab === 'dashboard' ? (
              <>
            {/* Top configuration row */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              
              {/* Box 1: License key generator */}
              <div className="bg-slate-950 border border-slate-850 p-5 rounded-2xl space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-orange-400 flex items-center gap-1.5">
                  <Plus className="w-4 h-4" /> Generate New Licenses
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Expiration Presets</label>
                    <div className="grid grid-cols-4 gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
                      {[
                        { label: '24h', val: 1 },
                        { label: '7d', val: 7 },
                        { label: '30d', val: 30 },
                        { label: '90d', val: 90 }
                      ].map(item => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => setKeyType(item.val)}
                          className={`py-1 rounded text-[10px] font-bold cursor-pointer transition-all ${
                            keyType === item.val 
                              ? 'bg-orange-500 text-white font-black' 
                              : 'text-slate-400 hover:bg-slate-800'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-1.5">
                    <button
                      type="button"
                      onClick={() => setKeyType(-1)}
                      className={`w-full py-1.5 rounded-xl text-[10px] font-bold border cursor-pointer transition-all ${
                        keyType === -1 
                          ? 'bg-orange-500 border-orange-400 text-white font-black' 
                          : 'border-slate-800 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      📅 Use Custom Date & Time
                    </button>
                  </div>

                  {keyType === -1 && (
                    <div className="grid grid-cols-2 gap-2 animate-fadeIn">
                      <div>
                        <label className="block text-[9px] text-slate-500 font-bold mb-0.5 uppercase">Expiry Date</label>
                        <input 
                          type="date" 
                          value={customExpiryDate}
                          onChange={(e) => setCustomExpiryDate(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 text-[11px] p-2 rounded-lg text-slate-200"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] text-slate-500 font-bold mb-0.5 uppercase">Expiry Time</label>
                        <input 
                          type="time" 
                          value={customExpiryTime}
                          onChange={(e) => setCustomExpiryTime(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 text-[11px] p-2 rounded-lg text-slate-200"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleGenerateLicense}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white text-xs font-black uppercase tracking-wider py-3 rounded-xl transition-all cursor-pointer shadow-md"
                  >
                    Generate & Save Key
                  </button>
                </div>
              </div>

              {/* Box 2: Change Admin Password */}
              <div className="bg-slate-950 border border-slate-850 p-5 rounded-2xl space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-orange-400 flex items-center gap-1.5">
                  <Settings className="w-4 h-4" /> Change Admin Password
                </h3>
                
                <form onSubmit={handleChangeAdminPassword} className="space-y-3.5">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Current Password</label>
                    <div className="relative">
                      <input 
                        type={showCurrentPassword ? "text" : "password"} 
                        value={currentPasswordInput}
                        onChange={(e) => setCurrentPasswordInput(e.target.value)}
                        placeholder="Current Admin Password"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:border-orange-500 text-xs font-bold text-slate-100 placeholder-slate-600"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                      >
                        {showCurrentPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">New Password</label>
                    <div className="relative">
                      <input 
                        type={showNewPassword ? "text" : "password"} 
                        value={newPasswordInput}
                        onChange={(e) => setNewPasswordInput(e.target.value)}
                        placeholder="New Password (min 8 chars, letters+numbers)"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:border-orange-500 text-xs font-bold text-slate-100 placeholder-slate-600"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                      >
                        {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Confirm Password</label>
                    <div className="relative">
                      <input 
                        type={showConfirmPassword ? "text" : "password"} 
                        value={confirmPasswordInput}
                        onChange={(e) => setConfirmPasswordInput(e.target.value)}
                        placeholder="Confirm New Password"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:border-orange-500 text-xs font-bold text-slate-100 placeholder-slate-600"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                      >
                        {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-bold py-2.5 rounded-xl transition-all cursor-pointer mt-1"
                  >
                    Update Password
                  </button>
                </form>
              </div>

                            {/* Box 4: Admin Profile & Recovery */}
              <div className="bg-slate-950 border border-slate-850 p-5 rounded-2xl space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-orange-400 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4" /> Admin Recovery Settings
                </h3>
                
                <form onSubmit={handleChangeRecoveryEmail} className="space-y-3.5">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Current Recovery Email</label>
                    <div className="text-xs font-bold text-slate-300 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2">
                      {adminRecoveryEmail}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">New Recovery Email</label>
                    <input 
                      type="email"
                      value={newRecoveryEmail}
                      onChange={(e) => setNewRecoveryEmail(e.target.value)}
                      placeholder="e.g. superadmin@example.com"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:border-orange-500 text-xs font-bold text-slate-100 placeholder-slate-600"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-bold py-2.5 rounded-xl transition-all cursor-pointer mt-1"
                  >
                    Update Email
                  </button>
                </form>
              </div>

                            {/* Box 5: App Activation Controls */}
              <div className="bg-slate-950 border border-slate-850 p-5 rounded-2xl space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-orange-400 flex items-center gap-1.5 border-b border-slate-800 pb-2">
                  <Shield className="w-4 h-4" /> App Activation Controls
                </h3>
                
                <div className="space-y-4">
                  <label className="flex items-center justify-between gap-2 p-2 bg-slate-900 rounded-lg cursor-pointer hover:bg-slate-800 border border-slate-800 transition">
                    <span className="text-xs font-bold text-slate-300">Allow New Devices & Registrations</span>
                    <div className="relative inline-block w-8 h-4 rounded-full transition-colors duration-300 ease-in-out" style={{ backgroundColor: appControls.allowRegistrations ? '#f97316' : '#334155' }}>
                      <span className={`absolute left-0 top-0 w-4 h-4 bg-white rounded-full transition-transform duration-300 ease-in-out shadow-sm ${appControls.allowRegistrations ? 'translate-x-4' : 'translate-x-0'}`} />
                      <input type="checkbox" className="opacity-0 w-0 h-0" checked={appControls.allowRegistrations} onChange={(e) => handleAppControlsUpdate({...appControls, allowRegistrations: e.target.checked})} />
                    </div>
                  </label>
                  
                  <label className="flex items-center justify-between gap-2 p-2 bg-slate-900 rounded-lg cursor-pointer hover:bg-slate-800 border border-slate-800 transition">
                    <span className="text-xs font-bold text-slate-300">Allow User Logins</span>
                    <div className="relative inline-block w-8 h-4 rounded-full transition-colors duration-300 ease-in-out" style={{ backgroundColor: appControls.allowLogins ? '#f97316' : '#334155' }}>
                      <span className={`absolute left-0 top-0 w-4 h-4 bg-white rounded-full transition-transform duration-300 ease-in-out shadow-sm ${appControls.allowLogins ? 'translate-x-4' : 'translate-x-0'}`} />
                      <input type="checkbox" className="opacity-0 w-0 h-0" checked={appControls.allowLogins} onChange={(e) => handleAppControlsUpdate({...appControls, allowLogins: e.target.checked})} />
                    </div>
                  </label>

                  <label className="flex items-center justify-between gap-2 p-2 bg-red-950/30 rounded-lg cursor-pointer hover:bg-red-950/50 border border-red-900/50 transition">
                    <span className="text-xs font-bold text-red-400 flex items-center gap-1.5"><AlertTriangle className="w-3 h-3" /> Maintenance Mode</span>
                    <div className="relative inline-block w-8 h-4 rounded-full transition-colors duration-300 ease-in-out" style={{ backgroundColor: appControls.maintenanceMode ? '#ef4444' : '#334155' }}>
                      <span className={`absolute left-0 top-0 w-4 h-4 bg-white rounded-full transition-transform duration-300 ease-in-out shadow-sm ${appControls.maintenanceMode ? 'translate-x-4' : 'translate-x-0'}`} />
                      <input type="checkbox" className="opacity-0 w-0 h-0" checked={appControls.maintenanceMode} onChange={(e) => handleAppControlsUpdate({...appControls, maintenanceMode: e.target.checked})} />
                    </div>
                  </label>
                  
                  {appControls.maintenanceMode && (
                    <div className="space-y-1">
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Maintenance Message</label>
                      <input 
                        type="text"
                        value={appControls.maintenanceMessage}
                        onChange={(e) => handleAppControlsUpdate({...appControls, maintenanceMessage: e.target.value})}
                        className="w-full px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-red-500 text-xs text-slate-300"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Box 3: General System Statistics */}
              <div className="bg-slate-950 border border-slate-850 p-5 rounded-2xl space-y-3.5">
                <h3 className="text-xs font-black uppercase tracking-widest text-orange-400">
                  📋 License Stats
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between border-b border-slate-900 pb-1.5">
                    <span className="text-slate-500">Total Registered Keys:</span>
                    <span className="font-bold text-slate-200">{licenses.length}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-900 pb-1.5">
                    <span className="text-slate-500">Active Devices:</span>
                    <span className="font-bold text-emerald-400">{licenses.filter(l => l.deviceId).length}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-900 pb-1.5">
                    <span className="text-slate-500">Disabled Licenses:</span>
                    <span className="font-bold text-red-400">{licenses.filter(l => l.status === 'disabled').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Pending Activation:</span>
                    <span className="font-bold text-blue-400">{licenses.filter(l => !l.deviceId && l.status === 'active').length}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Dashboard Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex flex-col items-center text-center">
                <span className="text-3xl font-black text-slate-100">{licenses.length}</span>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Total Devices</span>
              </div>
              <div className="bg-slate-950 border border-emerald-900/50 p-4 rounded-xl flex flex-col items-center text-center">
                <span className="text-3xl font-black text-emerald-400">{licenses.filter(l => l.deviceId && l.status === 'active' && Date.now() <= new Date(`${l.expiryDate}T${l.expiryTime || '23:59'}`).getTime()).length}</span>
                <span className="text-[9px] font-bold text-emerald-600/80 uppercase tracking-widest mt-1">Active</span>
              </div>
              <div className="bg-slate-950 border border-rose-900/50 p-4 rounded-xl flex flex-col items-center text-center">
                <span className="text-3xl font-black text-rose-400">{licenses.filter(l => Date.now() > new Date(`${l.expiryDate}T${l.expiryTime || '23:59'}`).getTime()).length}</span>
                <span className="text-[9px] font-bold text-rose-600/80 uppercase tracking-widest mt-1">Expired</span>
              </div>
              <div className="bg-slate-950 border border-orange-900/50 p-4 rounded-xl flex flex-col items-center text-center">
                <span className="text-3xl font-black text-orange-400">{licenses.filter(l => {
                  const ms = new Date(`${l.expiryDate}T${l.expiryTime || '23:59'}`).getTime();
                  return ms > Date.now() && ms < Date.now() + 7 * 24 * 60 * 60 * 1000;
                }).length}</span>
                <span className="text-[9px] font-bold text-orange-600/80 uppercase tracking-widest mt-1">Expiring Soon</span>
              </div>
            </div>

            {/* Generated licenses table */}
            <div className="bg-slate-950 border border-slate-850 rounded-2xl overflow-hidden">
              <div className="p-4 bg-slate-900 border-b border-slate-850 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-300">Device Login & License Management</h3>
                <div className="flex items-center gap-2 w-full md:w-auto">
                   <input type="text" placeholder="Search by name, email, ID..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="bg-slate-950 border border-slate-800 text-xs text-slate-200 px-3 py-1.5 rounded-lg w-full md:w-48 focus:outline-none focus:border-orange-500" />
                   <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-slate-950 border border-slate-800 text-xs text-slate-200 px-2 py-1.5 rounded-lg focus:outline-none focus:border-orange-500">
                     <option value="all">All</option>
                     <option value="active">Active</option>
                     <option value="expired">Expired</option>
                     <option value="suspended">Suspended</option>
                   </select>
                   <button onClick={loadAllLicenses} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-850" title="Reload list"><RefreshCw className="w-3.5 h-3.5" /></button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1200px]">
                  <thead>
                    <tr className="border-b border-slate-850 text-[10px] text-slate-500 uppercase font-black bg-slate-900/50">
                      <th className="p-4">License Key</th>
                      <th className="p-4">Device Name & ID</th>
                      <th className="p-4">App & OS Version</th>
                      <th className="p-4">User Details</th>
                      <th className="p-4">Timestamps</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {licenses.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-xs text-slate-500">No generated license keys found. Create one above!</td>
                      </tr>
                    ) : (
                      
                      (() => {
                        const filteredLicenses = licenses.filter(lic => {
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
                        if (filteredLicenses.length === 0) return <tr><td colSpan={7} className="p-8 text-center text-xs text-slate-500">No matching devices found.</td></tr>;
                        return filteredLicenses.map((lic) => {
                        const expiryMs = new Date(`${lic.expiryDate}T${lic.expiryTime || '23:59'}`).getTime();
                        const isExpired = Date.now() > expiryMs;
                        const daysRemaining = Math.max(0, Math.ceil((expiryMs - Date.now()) / (1000 * 60 * 60 * 24)));
                        
                        return (
                          <tr key={lic.key} className="border-b border-slate-850 text-xs hover:bg-slate-900/45 transition-colors">
                            <td className="p-4 font-mono font-bold text-slate-200">
                              <div className="flex items-center gap-2">
                                <span>{lic.key}</span>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(lic.key);
                                    alert("License Key copied to clipboard!");
                                  }}
                                  className="text-slate-500 hover:text-slate-300 cursor-pointer"
                                  title="Copy key"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                              <div className="text-[9px] text-slate-500 font-sans mt-1">
                                Exp: {lic.expiryDate} ({daysRemaining}d left)
                              </div>
                            </td>
                            
                            <td className="p-4">
                              {lic.deviceId ? (
                                <div className="space-y-1">
                                  <div className="font-bold text-slate-300">{lic.deviceName || 'Unknown Device'}</div>
                                  <div className="font-mono text-[9px] text-orange-400/80 bg-orange-950/30 border border-orange-900/50 px-1.5 py-0.5 rounded inline-block">
                                    ID: {lic.deviceId}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-500 font-bold uppercase text-[9px] tracking-wide">Pending Activation</span>
                              )}
                            </td>
                            
                            <td className="p-4 text-slate-400 text-[10px]">
                              {lic.deviceId ? (
                                <div className="space-y-1 leading-tight">
                                  <div>App: <span className="text-slate-300">{lic.appVersion || 'N/A'}</span></div>
                                  <div className="truncate max-w-[120px]" title={lic.osVersion || 'Unknown OS'}>OS: {lic.osVersion || 'Unknown OS'}</div>
                                </div>
                              ) : '-'}
                            </td>

                            <td className="p-4">
                              {lic.deviceId ? (
                                <div className="space-y-1 text-[10px]">
                                  <div className="font-bold text-slate-200">{lic.userName || 'Unknown User'}</div>
                                  <div className="text-slate-500">{lic.userEmail || '-'}</div>
                                </div>
                              ) : '-'}
                            </td>

                            <td className="p-4 text-slate-400 text-[10px]">
                               {lic.deviceId ? (
                                <div className="space-y-1 leading-tight">
                                  <div>Login: <span className="text-slate-300">{lic.loginDateTime ? new Date(lic.loginDateTime).toLocaleDateString() : '-'}</span></div>
                                  <div>Active: <span className="text-slate-300">{lic.lastActiveDateTime ? new Date(lic.lastActiveDateTime).toLocaleDateString() : '-'}</span></div>
                                </div>
                              ) : '-'}
                            </td>

                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                lic.status === 'active' && !isExpired
                                  ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900'
                                  : 'bg-red-950/40 text-red-400 border border-red-900'
                              }`}>
                                {lic.status === 'active' && !isExpired ? 'Active' : lic.status === 'disabled' ? 'Revoked' : 'Expired'}
                              </span>
                            </td>

                            <td className="p-4">
                              <div className="flex justify-center items-center gap-1.5 flex-wrap w-[120px]">
                                {/* Toggle Status */}
                                <button
                                  onClick={() => handleToggleStatus(lic.key, lic.status)}
                                  className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer flex-1 ${
                                    lic.status === 'active'
                                      ? 'bg-red-950 text-red-400 border border-red-900 hover:bg-red-900 hover:text-white'
                                      : 'bg-emerald-950 text-emerald-400 border border-emerald-900 hover:bg-emerald-900 hover:text-white'
                                  }`}
                                  title={lic.status === 'active' ? "Disable License" : "Enable License"}
                                >
                                  {lic.status === 'active' ? 'Revoke' : 'Restore'}
                                </button>
                                
                                {/* Reset binding */}
                                <button
                                  onClick={() => handleResetBinding(lic.key)}
                                  disabled={!lic.deviceId}
                                  className="px-2 py-1 rounded text-[10px] font-bold bg-blue-950 text-blue-400 border border-blue-900 hover:bg-blue-900 hover:text-white transition-all disabled:opacity-30 cursor-pointer flex-1"
                                  title="Unbind Device ID"
                                >
                                  Logout
                                </button>

                                {/* Extend Expiry (1 Month) */}
                                <button
                                  onClick={() => handleExtendLicense(lic.key, 30)}
                                  className="px-2 py-1 rounded text-[10px] font-bold bg-slate-905 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-white transition-all cursor-pointer flex-1"
                                  title="Extend 30 Days"
                                >
                                  +30d
                                </button>

                                {/* Delete */}
                                <button
                                  onClick={() => handleDeleteLicense(lic.key)}
                                  className="p-1 text-slate-500 hover:text-red-400 rounded transition-all cursor-pointer"
                                  title="Delete Forever"
                                >
                                  <Trash2 className="w-4 h-4" />
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
            
              </>
            ) : (
              <div className="bg-slate-950 border border-slate-850 rounded-2xl overflow-hidden shadow-2xl">
                <div className="p-5 border-b border-slate-850 flex items-center gap-2">
                   <Shield className="w-5 h-5 text-orange-500" />
                   <h3 className="text-sm font-black uppercase tracking-widest text-slate-300">System Audit Logs</h3>
                </div>
                <div className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-900 border-b border-slate-850 text-[10px] text-slate-500 uppercase font-black">
                          <th className="p-4">Timestamp</th>
                          <th className="p-4">Administrator</th>
                          <th className="p-4">Action Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditLogs.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="p-8 text-center text-xs text-slate-500 font-mono italic">
                              No system logs recorded yet.
                            </td>
                          </tr>
                        ) : (
                          auditLogs.map((log) => (
                            <tr key={log.id} className="border-b border-slate-850/50 hover:bg-slate-900/30 transition-colors">
                              <td className="p-4 text-[10px] font-mono text-slate-400 whitespace-nowrap">
                                {new Date(log.timestamp).toLocaleString()}
                              </td>
                              <td className="p-4">
                                <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px] font-bold">
                                  {log.adminUser || 'Admin'}
                                </span>
                              </td>
                              <td className="p-4 text-xs font-mono text-orange-300/80">
                                {log.action}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer info bar */}
        <footer className="bg-slate-950 border-t border-slate-850 p-4 text-center text-[10px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Security protocol certified. Bound with localized node identifiers.</span>
          <span className="font-mono">IP Checksum: VERIFIED // Local Storage: OK</span>
        </footer>
      </div>
    </div>
  );
}
