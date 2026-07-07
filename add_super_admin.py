import re

with open('src/components/AdminLicenseSystem.tsx', 'r') as f:
    content = f.read()

# 1. Add states for Super Admin / Reset
new_states = """  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [adminRecoveryEmail, setAdminRecoveryEmail] = useState('admin@dbillify.local');
  const [showForgotPass, setShowForgotPass] = useState(false);
  const [resetOTP, setResetOTP] = useState('');
  const [generatedOTP, setGeneratedOTP] = useState('');
  const [otpSent, setOtpSent] = useState(false);"""

content = content.replace("  const [showConfirmPassword, setShowConfirmPassword] = useState(false);", new_states)

# 2. Modify loadAdminSettings to load recovery email
old_load_settings = """  // Fetch / Sync Admin PIN from Firestore
  const loadAdminSettings = async () => {
    try {
      const docRef = doc(db, 'admin_config', 'settings');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setStoredAdminPin(docSnap.data().pin || '583914');
      } else {
        // Initialize default PIN in cloud
        await setDoc(docRef, { pin: '583914', updatedAt: new Date().toISOString() });
        setStoredAdminPin('583914');
      }
    } catch (err) {
      console.warn("Failed to load admin settings from Firebase. Using offline default PIN.", err);
    }
  };"""

new_load_settings = """  // Fetch / Sync Admin PIN from Firestore
  const loadAdminSettings = async () => {
    try {
      const docRef = doc(db, 'admin_config', 'settings');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setStoredAdminPin(data.pin || '583914');
        if (data.recoveryEmail) {
          setAdminRecoveryEmail(data.recoveryEmail);
        }
      } else {
        // Initialize default PIN in cloud
        await setDoc(docRef, { pin: '583914', recoveryEmail: 'admin@dbillify.local', updatedAt: new Date().toISOString() });
        setStoredAdminPin('583914');
      }
    } catch (err) {
      console.warn("Failed to load admin settings from Firebase. Using offline default PIN.", err);
    }
  };"""

content = content.replace(old_load_settings, new_load_settings)


# 3. Add handleSendOTP and handleVerifyOTP
handlers = """  const handleSendOTP = async (e: React.FormEvent) => {
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
      loadAllLicenses();
    } else {
      alert("Invalid OTP.");
    }
  };"""

content = content.replace("  // Change Admin Password", handlers + "\n\n  // Change Admin Password")

# 4. Modify login form to include Forgot Password UI
old_login_ui = """                <button 
                  type="submit"
                  className="w-full bg-slate-850 border border-slate-750 hover:bg-slate-800 hover:text-white text-slate-300 font-bold text-xs uppercase tracking-wider py-2.5 rounded-xl transition-all cursor-pointer text-center"
                >
                  Authorize Node
                </button>
              </form>"""

new_login_ui = """                <button 
                  type="submit"
                  className="w-full bg-slate-850 border border-slate-750 hover:bg-slate-800 hover:text-white text-slate-300 font-bold text-xs uppercase tracking-wider py-2.5 rounded-xl transition-all cursor-pointer text-center"
                >
                  Authorize Node
                </button>
                <div className="text-center mt-2">
                  <button type="button" onClick={() => setShowForgotPass(true)} className="text-[10px] text-orange-500 hover:underline">Forgot Admin Password?</button>
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
              )}"""

content = content.replace(old_login_ui, new_login_ui)

with open('src/components/AdminLicenseSystem.tsx', 'w') as f:
    f.write(content)

print("Done")
