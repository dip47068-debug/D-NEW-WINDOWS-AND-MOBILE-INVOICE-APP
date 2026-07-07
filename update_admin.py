import re

with open('src/components/AdminLicenseSystem.tsx', 'r') as f:
    content = f.read()

# 1. Update License Interface
content = content.replace("""export interface License {
  key: string;
  deviceId: string | null;
  activationDate: string | null;
  expiryDate: string;
  expiryTime: string;
  durationDays: number;
  status: 'active' | 'disabled';
  createdAt: string;
  history: string[];
}""", """export interface License {
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
}""")

# 2. Add new states for password
content = content.replace("""  const [storedAdminPin, setStoredAdminPin] = useState('583914');
  const [newPinInput, setNewPinInput] = useState('');
  const [showNewPin, setShowNewPin] = useState(false);""", """  const [storedAdminPin, setStoredAdminPin] = useState('583914');
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);""")

# 3. Modify handleActivateLicense
old_activate = """      // Activate & bind
      await updateDoc(docRef, {
        deviceId: currentDeviceId,
        activationDate: new Date().toISOString(),
        history: [...(data.history || []), `Device activated: ${currentDeviceId} (${window.navigator.userAgent.substring(0, 50)}...) at ${new Date().toLocaleString()}`]
      });"""

new_activate = """      // Get User Info
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
      });"""

content = content.replace(old_activate, new_activate)

# 4. Modify handleChangeAdminPin to Change Password Logic
old_change_pin = """  // Change Admin PIN
  const handleChangeAdminPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPinInput.length < 4) {
      alert("PIN must be at least 4 digits.");
      return;
    }
    
    try {
      const docRef = doc(db, 'admin_config', 'settings');
      await setDoc(docRef, { pin: newPinInput, updatedAt: new Date().toISOString() });
      setStoredAdminPin(newPinInput);
      setNewPinInput('');
      alert("Admin PIN successfully changed!");
    } catch (err) {
      alert("Failed to update PIN in Cloud: " + err);
    }
  };"""

new_change_pin = """  // Change Admin Password
  const handleChangeAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentPasswordInput !== storedAdminPin) {
      alert("Current password is incorrect.");
      return;
    }
    if (newPasswordInput !== confirmPasswordInput) {
      alert("New password and confirm password do not match.");
      return;
    }
    if (newPasswordInput.length < 8 || !/[a-zA-Z]/.test(newPasswordInput) || !/[0-9]/.test(newPasswordInput)) {
      alert("Password must be at least 8 characters long and contain both letters and numbers.");
      return;
    }
    
    try {
      const docRef = doc(db, 'admin_config', 'settings');
      await setDoc(docRef, { pin: newPasswordInput, updatedAt: new Date().toISOString() });
      setStoredAdminPin(newPasswordInput);
      setCurrentPasswordInput('');
      setNewPasswordInput('');
      setConfirmPasswordInput('');
      alert("Admin password changed successfully.");
    } catch (err) {
      alert("Failed to update password in Cloud: " + err);
    }
  };"""

content = content.replace(old_change_pin, new_change_pin)

with open('src/components/AdminLicenseSystem.tsx', 'w') as f:
    f.write(content)

print("Done")
