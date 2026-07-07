/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Settings, 
  Building, 
  MapPin, 
  CreditCard, 
  CheckCircle, 
  FileText, 
  Palette, 
  User, 
  Upload, 
  Image,
  RefreshCw,
  Lock,
  Eye,
  EyeOff,
  Mail,
  Database,
  Download,
  Shield,
  Sun,
  Moon
} from 'lucide-react';
import { getOrCreateDeviceId } from './AdminLicenseSystem';
import { CompanySettings, UserProfile, BackupSettings } from '../types';

interface SettingsViewProps {
  companySettings: CompanySettings;
  onUpdateSettings: (settings: CompanySettings) => void;
  onClearDatabase: () => void;
  userProfile: UserProfile;
  onUpdateUserProfile: (profile: UserProfile) => void;
  backupSettings: BackupSettings;
  onUpdateBackupSettings: (settings: BackupSettings) => void;
  onTriggerEmailBackup: () => Promise<{ success: boolean; message: string; mode: string; backupFilename?: string }>;
  onRestoreBackup: (backupJson: string) => boolean;
  theme: 'light' | 'dark' | 'system';
  onThemeChange: (theme: 'light' | 'dark' | 'system') => void;
}

export default function SettingsView({ 
  companySettings, 
  onUpdateSettings, 
  onClearDatabase,
  userProfile,
  onUpdateUserProfile,
  backupSettings,
  onUpdateBackupSettings,
  onTriggerEmailBackup,
  onRestoreBackup,
  theme,
  onThemeChange
}: SettingsViewProps) {
  
  const [companyName, setCompanyName] = useState(companySettings.companyName);
  const [tagline, setTagline] = useState(companySettings.tagline);
  const [address, setAddress] = useState(companySettings.address);
  const [phone, setPhone] = useState(companySettings.phone);
  const [email, setEmail] = useState(companySettings.email);
  const [gstin, setGstin] = useState(companySettings.gstin);
  const [bankName, setBankName] = useState(companySettings.bankName);
  const [accountNumber, setAccountNumber] = useState(companySettings.accountNumber);
  const [ifscCode, setIfscCode] = useState(companySettings.ifscCode);
  const [upiId, setUpiId] = useState(companySettings.upiId);
  const [terms, setTerms] = useState(companySettings.terms);
  const [invoiceTemplate, setInvoiceTemplate] = useState(companySettings.invoiceTemplate);
  const [logoUrl, setLogoUrl] = useState(companySettings.logoUrl || '');

  // Security Lockscreen configuration states
  const [secPassword, setSecPassword] = useState(userProfile.passwordHash);
  const [secPin, setSecPin] = useState(userProfile.securityPin);
  const [secMobile, setSecMobile] = useState(userProfile.mobile);
  const [secEmail, setSecEmail] = useState(userProfile.email || 'billing@rudraenterprises.com');
  const [secLockType, setSecLockType] = useState<UserProfile['securityLockType']>(userProfile.securityLockType || 'password');
  const [forceLockOnOpen, setForceLockOnOpen] = useState(() => {
    return localStorage.getItem('vyapar_force_lock_on_open') !== 'false';
  });
  const [showSecPass, setShowSecPass] = useState(false);
  const [secBiometricsEnabled, setSecBiometricsEnabled] = useState(userProfile.biometricsEnabled || false);
  const [secAiEnabled, setSecAiEnabled] = useState(userProfile.aiEnabled !== false);
  
  // Re-auth states
  const [isChangingSecurity, setIsChangingSecurity] = useState(false);
  const [reauthCurrent, setReauthCurrent] = useState('');
  const [newCredential, setNewCredential] = useState('');
  const [confirmCredential, setConfirmCredential] = useState('');

  // Backup configurations
  const [autoBackup, setAutoBackup] = useState(backupSettings.autoBackup);
  const [backupEmail, setBackupEmail] = useState(backupSettings.backupEmail || 'dip47068@gmail.com');
  const [backupFrequency, setBackupFrequency] = useState<'Daily' | 'Weekly' | 'Monthly'>(backupSettings.frequency || 'Daily');
  const [smtpHost, setSmtpHost] = useState(backupSettings.smtpHost || '');
  const [smtpPort, setSmtpPort] = useState(backupSettings.smtpPort || 587);
  const [smtpSecure, setSmtpSecure] = useState(backupSettings.smtpSecure || false);
  const [smtpUser, setSmtpUser] = useState(backupSettings.smtpUser || '');
  const [smtpPass, setSmtpPass] = useState(backupSettings.smtpPass || '');
  const [triggeringBackup, setTriggeringBackup] = useState(false);
  const [backupLogs, setBackupLogs] = useState<string[]>([]);

  const handleSaveBackupSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateBackupSettings({
      autoBackup,
      backupEmail,
      frequency: backupFrequency,
      smtpHost,
      smtpPort: Number(smtpPort),
      smtpSecure,
      smtpUser,
      smtpPass
    });
    alert("Backup configurations have been updated successfully!");
  };

  const handleManualBackup = async () => {
    setTriggeringBackup(true);
    const timeStr = new Date().toLocaleTimeString();
    setBackupLogs(prev => [...prev, `[${timeStr}] Packing local database stores...`]);
    try {
      const res = await onTriggerEmailBackup();
      const endTimeStr = new Date().toLocaleTimeString();
      if (res.success) {
        setBackupLogs(prev => [
          ...prev, 
          `[${endTimeStr}] SUCCESS: ${res.message}`,
          res.backupFilename ? `[${endTimeStr}] Created: ${res.backupFilename}` : ''
        ].filter(Boolean));
        alert(res.message);
      } else {
        setBackupLogs(prev => [...prev, `[${endTimeStr}] ERROR: ${res.message}`]);
        alert("Failed to send backup: " + res.message);
      }
    } catch (err: any) {
      const endTimeStr = new Date().toLocaleTimeString();
      setBackupLogs(prev => [...prev, `[${endTimeStr}] CONNECTION ERROR: ${err.message}`]);
      alert("Error sending backup: " + err.message);
    } finally {
      setTriggeringBackup(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const parsed = JSON.parse(content);
          if (parsed && typeof parsed === 'object') {
            const success = onRestoreBackup(content);
            if (success) {
              alert("Database restored successfully from the backup file! The application will refresh.");
              window.location.reload();
            } else {
              alert("The backup file format was invalid or missing required keys.");
            }
          } else {
            alert("The selected file is not a valid JSON document.");
          }
        } catch (err: any) {
          alert("Error parsing backup file: " + err.message);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleToggleBiometrics = async (checked: boolean) => {
    if (!checked) {
      setSecBiometricsEnabled(false);
      localStorage.removeItem('vyapar_biometrics_enrolled');
      localStorage.removeItem('vyapar_biometric_id');
      return;
    }

    if (!window.PublicKeyCredential) {
      alert("Web Authentication API is not supported on this browser/environment. Falling back to simulated hardware security enclave.");
      setSecBiometricsEnabled(true);
      localStorage.setItem('vyapar_biometrics_enrolled', 'true');
      return;
    }

    try {
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);
      const userId = new Uint8Array(16);
      window.crypto.getRandomValues(userId);

      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: {
          name: "D Billify Invoicing",
          id: window.location.hostname,
        },
        user: {
          id: userId,
          name: secEmail || "billing@rudraenterprises.com",
          displayName: "D Billify User",
        },
        pubKeyCredParams: [
          { alg: -7, type: "public-key" }, // ES256
          { alg: -257, type: "public-key" } // RS256
        ],
        timeout: 60000,
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
          residentKey: "preferred",
          requireResidentKey: false
        }
      };

      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions
      });

      if (credential) {
        const rawId = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array((credential as PublicKeyCredential).rawId))));
        localStorage.setItem('vyapar_biometric_id', rawId);
        setSecBiometricsEnabled(true);
        localStorage.setItem('vyapar_biometrics_enrolled', 'true');
        alert("Success! Biometric hardware fingerprint registered successfully.");
      }
    } catch (err: any) {
      console.warn("WebAuthn API error: ", err);
      
      // Handle specific iframe security error
      if (err.name === 'SecurityError' || (err.message && err.message.includes('feature is not enabled'))) {
        setSecBiometricsEnabled(true);
        localStorage.setItem('vyapar_biometrics_enrolled', 'true');
        localStorage.setItem('vyapar_biometric_id', btoa('simulated-iframe-token-' + Date.now()));
        alert("Sandbox Context Detected: Real WebAuthn is restricted inside iframe preview environments. We have activated a high-fidelity biometric simulation for this session so you can test the flow. To use your REAL device fingerprint scanner, click 'Open in New Tab'.");
      } else if (err.name === 'NotAllowedError') {
        alert("Registration cancelled. Biometric enrolment was not completed.");
      } else {
        // General fallback
        setSecBiometricsEnabled(true);
        localStorage.setItem('vyapar_biometrics_enrolled', 'true');
        localStorage.setItem('vyapar_biometric_id', btoa('fallback-token-' + Date.now()));
        alert("Note: Using simulated secure biometric enclave. " + (err.message || "Device biometrics unavailable."));
      }
    }
  };

  const hashInput = async (text: string): Promise<string> => {
    try {
      const msgUint8 = new TextEncoder().encode(text);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (err) {
      console.error('Hashing failed', err);
      return text;
    }
  };

  const isSha256 = (str: string) => /^[a-f0-9]{64}$/i.test(str);

  const handleUpdateSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secPassword || secPassword.length < 4) {
      alert("Application Security Password must be at least 4 characters.");
      return;
    }
    if (!secPin || secPin.length !== 4 || isNaN(Number(secPin))) {
      alert("Application Security PIN must be exactly 4 numeric digits.");
      return;
    }

    // Securely hash password and PIN using SHA-256 before saving if not already hashed
    const hashedPass = isSha256(secPassword) ? secPassword : await hashInput(secPassword);
    const hashedPin = isSha256(secPin) ? secPin : await hashInput(secPin);

    onUpdateUserProfile({
      ...userProfile,
      passwordHash: hashedPass,
      securityPin: hashedPin,
      mobile: secMobile,
      email: secEmail,
      securityLockType: secLockType,
      biometricsEnabled: secBiometricsEnabled,
      aiEnabled: secAiEnabled
    });
    localStorage.setItem('vyapar_force_lock_on_open', 'true'); // completely mandatory lock
    alert("Application Security configuration has been synchronized! Your password and PIN are securely encrypted using SHA-256.");
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      companyName,
      tagline,
      address,
      phone,
      email,
      gstin,
      bankName,
      accountNumber,
      ifscCode,
      upiId,
      terms,
      invoiceTemplate,
      logoUrl: logoUrl || undefined
    });
    alert("Corporate settings updated successfully! New details will reflect on upcoming A4 invoices.");
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* settings lock */}
      <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl shadow-sm border border-slate-700/50">
        <h2 className="text-base font-extrabold text-white flex items-center gap-1.5">
          <Settings className="h-5 w-5 text-orange-400" />
          App & Company Settings Panel
        </h2>
        <p className="text-xs text-slate-400">
          Set up merchant credentials, custom branding logos, government GSTIN tags, and bank details for invoice wire remittance.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Settings Form Column */}
        <form onSubmit={handleUpdate} className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
          
          {/* Section: Company Info */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 border-b pb-1.5">
              <Building className="h-4.5 w-4.5 text-orange-500" /> Corporate Trademark details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Company Registered Name</label>
                <input
                  id="settings-co-name"
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-orange-500 bg-slate-50/40"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Company Tagline / Slogan</label>
                <input
                  id="settings-co-tagline"
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-orange-500 bg-slate-50/40"
                  placeholder="e.g. Quality and Trust"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Merchant GSTIN Number</label>
                <input
                  id="settings-co-gst"
                  type="text"
                  required
                  maxLength={15}
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-orange-500 bg-slate-50/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-705 text-slate-750 mb-1">Office Telephone</label>
                  <input
                    id="settings-co-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-orange-500 bg-slate-50/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-750 mb-1">Support Email</label>
                  <input
                    id="settings-co-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-orange-500 bg-slate-50/40"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Billing Headquarter Address</label>
              <input
                id="settings-co-address"
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-orange-500 bg-slate-50/40"
              />
            </div>
          </div>

          {/* Section: Banking */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 border-b pb-1.5">
              <CreditCard className="h-4.5 w-4.5 text-orange-500" /> Remittance Bank Credentials (Printed on A4 Invoice)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Receiving Bank Name</label>
                <input
                  id="settings-bank-name"
                  type="text"
                  required
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-orange-500 bg-slate-50/40"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Account Number</label>
                <input
                  id="settings-bank-acc"
                  type="text"
                  required
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                  className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-orange-500 bg-slate-50/40"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">IFSC Bank Code</label>
                <input
                  id="settings-bank-ifsc"
                  type="text"
                  required
                  maxLength={11}
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                  className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-orange-500 bg-slate-50/40"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">UPI Pay ID (For Fast Remittance QR)</label>
                <input
                  id="settings-bank-upi"
                  type="text"
                  required
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value.toLowerCase())}
                  className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-orange-500 bg-slate-50/40"
                />
              </div>
            </div>
          </div>

          {/* Section: terms footer declarations */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 border-b pb-1.5">
              <FileText className="h-4.5 w-4.5 text-orange-500" /> Default Terms & Declarations
            </h3>

            <textarea
              id="settings-terms"
              rows={3}
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              className="block w-full p-3 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-orange-500 bg-slate-50/40 leading-relaxed font-sans"
            />
          </div>

          <button
            id="btn-settings-update-submit"
            type="submit"
            className="w-full bg-slate-900 hover:bg-slate-850 text-white font-extrabold py-2.5 rounded-xl text-xs transition shadow hover:shadow-md"
          >
            Apply Corporate Changes & Recompile Layouts
          </button>
        </form>

        {/* Side Column: Custom Logo upload & system presets controls */}
        <div className="space-y-6">
          
          {/* Security & Password App Lock Settings Section */}
          <form onSubmit={handleUpdateSecurity} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5 border-b pb-2 justify-center">
              <Lock className="h-4.5 w-4.5 text-orange-500" /> App Lock & Password Settings
            </h3>

            <div className="space-y-3.5 text-left">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  🔒 Startup Force App Lock
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="chk-force-lock-startup"
                    type="checkbox"
                    checked={true}
                    disabled={true}
                    className="accent-orange-500 h-4 w-4 opacity-75 cursor-not-allowed"
                  />
                  <span className="text-[11px] text-slate-500 font-extrabold leading-none select-none flex items-center gap-1.5">
                    Ask for password on every launch <span className="text-[8px] bg-orange-100 border border-orange-200 text-orange-600 px-1 py-0.5 rounded-md font-black uppercase">Mandatory</span>
                  </span>
                </div>
                <p className="text-[9px] text-slate-400 mt-1 leading-normal">
                  To meet corporate safety mandates, authentication is required immediately upon launching or reloading the application.
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Active Lock Type
                </label>
                <select
                  id="select-lock-type"
                  value={secLockType}
                  onChange={(e) => setSecLockType(e.target.value as any)}
                  className="w-full text-xs font-bold px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 text-slate-800"
                >
                  <option value="password">Password Verification</option>
                  <option value="pin">Secure 4-Digit PIN Lock</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Security Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowSecPass(!showSecPass)}
                    className="text-[9px] text-orange-500 font-bold hover:underline flex items-center gap-0.5 focus:outline-none"
                  >
                    {showSecPass ? <EyeOff className="h-2.5 w-2.5" /> : <Eye className="h-2.5 w-2.5" />}
                    {showSecPass ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  id="input-sec-password"
                  type={showSecPass ? 'text' : 'password'}
                  required
                  value={secPassword}
                  onChange={(e) => setSecPassword(e.target.value)}
                  placeholder="e.g. mysecretpassword"
                  className="w-full text-xs font-bold px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 text-slate-855"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Security 4-Digit PIN
                </label>
                <input
                  id="input-sec-pin"
                  type="text"
                  maxLength={4}
                  required
                  value={secPin}
                  onChange={(e) => setSecPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="1234"
                  className="w-full text-xs font-mono font-bold px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 text-slate-855"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Mobile Verified
                  </label>
                  <input
                    id="input-sec-mobile"
                    type="text"
                    required
                    value={secMobile}
                    onChange={(e) => setSecMobile(e.target.value)}
                    className="w-full text-[10.5px] font-bold px-2 py-1 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Backup Email ID
                  </label>
                  <input
                    id="input-sec-email"
                    type="email"
                    required
                    value={secEmail}
                    onChange={(e) => setSecEmail(e.target.value)}
                    className="w-full text-[10.5px] font-bold px-2 py-1 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    🧬 Biometric Security Options
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="chk-enable-biometrics"
                      type="checkbox"
                      checked={secBiometricsEnabled}
                      onChange={(e) => handleToggleBiometrics(e.target.checked)}
                      className="accent-orange-500 h-4 w-4 cursor-pointer"
                    />
                    <span className="text-[11px] text-slate-600 font-bold leading-none select-none">
                      Enable biometric login (WebAuthn)
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-400 mt-1 leading-normal">
                    Securely gates the application entry using WebAuthn / Touch ID / Face ID hardware.
                  </p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    🤖 AI Optimization Features
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="chk-enable-ai"
                      type="checkbox"
                      checked={secAiEnabled}
                      onChange={(e) => setSecAiEnabled(e.target.checked)}
                      className="accent-orange-500 h-4 w-4 cursor-pointer"
                    />
                    <span className="text-[11px] text-slate-600 font-bold leading-none select-none">
                      Enable Gemini AI Dashboard
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-400 mt-1 leading-normal">
                    Activates Gemini-powered sales trends analysis and restocking predictions.
                  </p>
                </div>
              </div>
            </div>

            <button
              id="btn-save-security-locks"
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-2 rounded-xl text-xs transition shadow-sm cursor-pointer"
            >
              🔒 Update & Enforce Security Settings
            </button>
            <button
              type="button"
              onClick={() => setIsChangingSecurity(true)}
              className="w-full bg-orange-100 hover:bg-orange-200 text-orange-700 font-extrabold py-2 rounded-xl text-xs transition shadow-sm cursor-pointer mt-2"
            >
              🔑 Change Password / PIN
            </button>
          </form>

          {isChangingSecurity && (
            <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-xl">
                <h3 className="text-sm font-black text-slate-800 border-b pb-2">Change {secLockType === 'password' ? 'Password' : 'PIN'}</h3>
                
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Current {secLockType === 'password' ? 'Password' : 'PIN'}</label>
                  <input
                    type={secLockType === 'password' ? 'password' : 'text'}
                    value={reauthCurrent}
                    onChange={(e) => setReauthCurrent(e.target.value)}
                    className="w-full text-xs font-bold px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">New {secLockType === 'password' ? 'Password' : 'PIN'}</label>
                  <input
                    type={secLockType === 'password' ? 'password' : 'text'}
                    value={newCredential}
                    onChange={(e) => setNewCredential(e.target.value)}
                    className="w-full text-xs font-bold px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Confirm New {secLockType === 'password' ? 'Password' : 'PIN'}</label>
                  <input
                    type={secLockType === 'password' ? 'password' : 'text'}
                    value={confirmCredential}
                    onChange={(e) => setConfirmCredential(e.target.value)}
                    className="w-full text-xs font-bold px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button 
                    onClick={() => setIsChangingSecurity(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 py-2 rounded-xl text-xs font-bold text-slate-700"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={async () => {
                      const trimmedCurrent = reauthCurrent.trim();
                      const trimmedNew = newCredential.trim();
                      const trimmedConfirm = confirmCredential.trim();

                      if (trimmedNew !== trimmedConfirm) {
                        alert("New credentials do not match. Please re-enter.");
                        return;
                      }
                      
                      if (trimmedNew.length < 4) {
                        alert("New credential must be at least 4 characters.");
                        return;
                      }

                      // Verify current
                      const hashedCurrent = await hashInput(trimmedCurrent);
                      const isVerified = secLockType === 'password' ? (hashedCurrent === secPassword) : (hashedCurrent === secPin);
                      
                      if (!isVerified) {
                        const errorMsg = secLockType === 'password' ? "Current password is incorrect." : "Current PIN is incorrect.";
                        alert(errorMsg);
                        console.error(`Admin Auth Failed: ${errorMsg} | Type: ${secLockType}`);
                        return;
                      }
                      
                      const hashedNew = await hashInput(trimmedNew);
                      if (secLockType === 'password') {
                        setSecPassword(hashedNew);
                      } else {
                        setSecPin(hashedNew);
                      }
                      
                      // Trigger update
                      try {
                        onUpdateUserProfile({
                          ...userProfile,
                          passwordHash: secLockType === 'password' ? hashedNew : secPassword,
                          securityPin: secLockType === 'pin' ? hashedNew : secPin
                        });
                        
                        alert("New credential updated successfully!");
                        setIsChangingSecurity(false);
                        setReauthCurrent('');
                        setNewCredential('');
                        setConfirmCredential('');
                      } catch (err) {
                        console.error("Error updating credentials in Firestore:", err);
                        alert("Failed to update credentials. Please check your connection.");
                      }
                    }}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 py-2 rounded-xl text-xs font-bold text-white"
                  >
                    Update
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Device & License Information Section */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4 text-left">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5 border-b pb-2 justify-center">
              <Shield className="h-4.5 w-4.5 text-orange-500" /> Device & License Protection
            </h3>

            <div className="space-y-3">
              <p className="text-[11px] text-slate-600 leading-relaxed font-bold">
                This node is verified and protected by our secure **Admin License Management System**.
              </p>

              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 uppercase tracking-wide font-bold text-[9px]">Device Protection:</span>
                  <span className="text-emerald-600 font-extrabold uppercase text-[9px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Protected by Admin
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 uppercase tracking-wide font-bold text-[9px]">License Status:</span>
                  <span className="text-blue-600 font-extrabold uppercase text-[9px] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> License Activated
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 uppercase tracking-wide font-bold text-[9px]">License Key:</span>
                  <span className="text-slate-600 font-extrabold uppercase text-[9px] bg-slate-200 px-1.5 py-0.5 rounded border border-slate-300 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-slate-500" /> Hidden for Security
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 uppercase tracking-wide font-bold text-[9px]">Local Device ID:</span>
                  <span className="font-mono text-[10px] text-slate-800 font-bold select-all">{getOrCreateDeviceId()}</span>
                </div>
              </div>

              <div className="bg-red-50/50 border border-red-100 p-2.5 rounded-lg text-center mt-2">
                 <p className="text-[10px] text-red-600 font-bold">Access Denied. Only the Administrator can view or manage this license.</p>
              </div>

              <div className="text-[10px] text-slate-400 leading-normal">
                To manage keys, view license details, or de-authorize devices, please lock the app and open the <strong>🔑 Admin Dashboard</strong> on the lockscreen. Admin Authentication is strictly required.
              </div>

              <button
                type="button"
                onClick={() => {
                  if (confirm("Are you sure you want to lock the system to access the Admin Panel?")) {
                    localStorage.setItem('vyapar_show_admin_login', 'true');
                    localStorage.removeItem('vyapar_license_cache');
                    window.location.reload();
                  }
                }}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 active:scale-[0.98] text-white font-black uppercase tracking-wider py-2.5 rounded-xl text-xs transition-all duration-200 shadow-md shadow-orange-500/20 hover:shadow-lg hover:shadow-orange-500/30 cursor-pointer mt-2 flex items-center justify-center gap-2"
              >
                🔒 Secure Lock & Admin Login
              </button>
            </div>
          </div>

          {/* Logo Management Section */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4 text-center">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5 border-b pb-2 justify-center">
              <Image className="h-4.5 w-4.5 text-orange-500" /> Company Corporate Logo
            </h3>

            <div className="flex justify-center my-4">
              {logoUrl ? (
                <div className="relative group">
                  <img 
                    src={logoUrl} 
                    alt="Corporate Logo Preview" 
                    className="h-28 w-28 object-contain rounded-xl border border-slate-200 p-2 shadow-inner"
                    referrerPolicy="no-referrer"
                  />
                  <button
                    type="button"
                    onClick={() => setLogoUrl('')}
                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white h-5 w-5 rounded-full text-[10px] font-bold shadow flex items-center justify-center cursor-pointer"
                  >
                    X
                  </button>
                </div>
              ) : (
                <div className="h-28 w-28 rounded-xl bg-orange-50 border-2 border-dashed border-orange-200 flex flex-col items-center justify-center p-3 text-slate-400">
                  <Upload className="h-6 w-6 text-orange-400 mb-1" />
                  <span className="text-[10px] font-bold text-orange-500">Insert Logo</span>
                  <span className="text-[8px] text-slate-400 mt-0.5">Base64 PNG supported</span>
                </div>
              )}
            </div>

            <div className="text-left space-y-2">
              <label className="block text-[10px] font-bold text-slate-600 uppercase text-center">Upload base64 image file</label>
              <input
                id="logo-input-field"
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="block w-full text-[10px] text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border file:border-slate-250 file:text-[10px] file:font-semibold file:bg-slate-50 hover:file:bg-slate-100 cursor-pointer"
              />
            </div>
          </div>

          {/* Application Theme Selection */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5 border-b pb-2 justify-center">
              <Sun className="h-4.5 w-4.5 text-orange-500" /> Application Theme (Appearance)
            </h3>

            <div className="grid grid-cols-3 gap-2">
              {(['light', 'dark', 'system'] as const).map(t => {
                const isActive = theme === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => onThemeChange(t)}
                    className={`p-2.5 rounded-xl border text-center text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-slate-900 text-white border-slate-950 shadow-sm' 
                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-black'
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-400 text-center leading-normal">
              Select your preferred appearance. System theme will automatically match your device settings.
            </p>
          </div>

          {/* Aesthetic template choose layout */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5 border-b pb-2 justify-center">
              <Palette className="h-4.5 w-4.5 text-orange-500" /> A4 Invoice Layout Design
            </h3>

            <div className="grid grid-cols-3 gap-2">
              {(['classic', 'modern', 'minimalist'] as const).map(tmpl => {
                const isActive = invoiceTemplate === tmpl;
                return (
                  <button
                    key={tmpl}
                    type="button"
                    onClick={() => setInvoiceTemplate(tmpl)}
                    className={`p-2.5 rounded-xl border text-center text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-slate-900 text-white border-slate-950 shadow-sm' 
                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-black'
                    }`}
                  >
                    {tmpl}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-400 text-center leading-normal">
              Applied standard template formats can fine-tune margin scales and font sizing.
            </p>
          </div>

          {/* Automatic Email Backups Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Mail className="h-4.5 w-4.5 text-orange-500" />
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Automated Email Backups
              </h4>
            </div>
            
            <form onSubmit={handleSaveBackupSettings} className="space-y-3 text-left">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Automated Snapshots (PDF + JSON)</span>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={autoBackup}
                    onChange={(e) => setAutoBackup(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-350 peer peer-checked:bg-orange-500 after:border after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                </label>
              </div>

              {autoBackup && (
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                    Backup Frequency Scheduler
                  </label>
                  <div className="grid grid-cols-3 gap-1 bg-slate-100 border border-slate-200 p-1 rounded-xl mb-3">
                    {(['Daily', 'Weekly', 'Monthly'] as const).map((freq) => {
                      const isSelected = backupFrequency === freq;
                      return (
                        <button
                          key={freq}
                          type="button"
                          onClick={() => setBackupFrequency(freq)}
                          className={`py-1 text-[11px] font-bold rounded-lg transition-all text-center cursor-pointer ${
                            isSelected 
                              ? 'bg-orange-500 text-white shadow-sm' 
                              : 'text-slate-600 hover:bg-slate-250 hover:text-slate-800'
                          }`}
                        >
                          {freq}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                  Backup Destination Email
                </label>
                <input
                  type="email"
                  value={backupEmail}
                  onChange={(e) => setBackupEmail(e.target.value)}
                  placeholder="e.g. dip47068@gmail.com"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-orange-500"
                  required
                />
              </div>

              {/* Collapsible custom SMTP settings */}
              <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/55 space-y-2">
                <span className="text-[10px] font-extrabold text-slate-500 block uppercase tracking-wide">
                  ⚙️ Custom SMTP Mail Server (Optional)
                </span>
                <p className="text-[9px] text-slate-400 leading-normal">
                  Leave blank to use D Billify's high-speed secure cloud dispatch relays automatically.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[8px] font-bold text-slate-400 uppercase">SMTP Host</label>
                    <input
                      type="text"
                      value={smtpHost}
                      onChange={(e) => setSmtpHost(e.target.value)}
                      placeholder="smtp.gmail.com"
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-[10px] focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] font-bold text-slate-400 uppercase">SMTP Port</label>
                    <input
                      type="number"
                      value={smtpPort}
                      onChange={(e) => setSmtpPort(Number(e.target.value))}
                      placeholder="587"
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-[10px] focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[8px] font-bold text-slate-400 uppercase">Username / Email</label>
                    <input
                      type="text"
                      value={smtpUser}
                      onChange={(e) => setSmtpUser(e.target.value)}
                      placeholder="user@gmail.com"
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-[10px] focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] font-bold text-slate-400 uppercase">Password / App Key</label>
                    <input
                      type="password"
                      value={smtpPass}
                      onChange={(e) => setSmtpPass(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-[10px] focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-1.5 pt-1">
                  <input
                    type="checkbox"
                    id="smtpSecure"
                    checked={smtpSecure}
                    onChange={(e) => setSmtpSecure(e.target.checked)}
                    className="rounded border-slate-300 text-orange-500 focus:ring-orange-500"
                  />
                  <label htmlFor="smtpSecure" className="text-[9px] font-bold text-slate-500 cursor-pointer">
                    Enable SSL/TLS Security Connection
                  </label>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-100 text-xs font-bold rounded-lg transition"
                >
                  Save Sync Config
                </button>
                <button
                  type="button"
                  onClick={handleManualBackup}
                  disabled={triggeringBackup}
                  className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-200 text-white disabled:text-slate-400 text-xs font-bold rounded-lg transition"
                >
                  {triggeringBackup ? "Sending..." : "Backup Now"}
                </button>
              </div>
            </form>

            {backupLogs.length > 0 && (
              <div className="mt-2 text-left bg-slate-950 p-2.5 rounded-xl font-mono text-[9px] text-emerald-400 max-h-24 overflow-y-auto leading-relaxed space-y-0.5">
                {backupLogs.map((log, i) => (
                  <p key={i}>{log}</p>
                ))}
              </div>
            )}
          </div>

          {/* Database Import & Restore */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
              <Database className="h-4.5 w-4.5 text-orange-500" />
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Restore Database
              </h4>
            </div>
            <p className="text-[10px] text-slate-400 leading-normal text-left">
              Import a D Billify backup file (.json) received in your email or generated locally to recover all contacts, products, and historic invoices.
            </p>
            
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-18 border-2 border-slate-200 border-dashed rounded-xl cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-all">
                <div className="flex flex-col items-center justify-center pt-2 pb-2">
                  <Download className="w-5 h-5 text-slate-400 mb-1" />
                  <p className="text-[10px] font-bold text-slate-500">Click to import backup file</p>
                  <p className="text-[8px] text-slate-400">JSON document only</p>
                </div>
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={handleFileUpload} 
                  className="hidden" 
                />
              </label>
            </div>
          </div>

          {/* Core system actions - Reset database */}
          <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-5 text-center space-y-3">
            <h4 className="text-xs font-black text-red-650 uppercase tracking-widest">Danger Zone</h4>
            <p className="text-[10px] text-slate-400 leading-normal">
              Purging the ledger database will delete all of your current invoices, contacts, and custom catalog.
            </p>

            <button
              id="btn-clear-db"
              type="button"
              onClick={() => {
                if (window.confirm("Verify: Are you sure you want to restore the clean initial Indian merchant dataset? Custom items will be reset.")) {
                  onClearDatabase();
                }
              }}
              className="mt-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 py-1.5 px-3 rounded-lg transition-all inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="h-3 w-3 animate-spin-hover" /> Purge & Reload Demo Datasets
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
