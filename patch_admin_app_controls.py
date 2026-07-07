import re

with open('src/components/AdminLicenseSystem.tsx', 'r') as f:
    content = f.read()

# 1. Add State
new_states = """  const [appControls, setAppControls] = useState({
    maintenanceMode: false,
    maintenanceMessage: 'System is under maintenance. Please try again later.',
    allowRegistrations: true,
    allowLogins: true
  });"""
content = content.replace("  const [keyType, setKeyType]", new_states + "\n  const [keyType, setKeyType]")

# 2. Update loadAdminSettings
old_load = """  // Fetch / Sync Admin PIN from Firestore
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

new_load = """  // Fetch / Sync Admin PIN from Firestore
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
        if (data.appControls) {
          setAppControls(data.appControls);
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
  };"""
content = content.replace(old_load, new_load)


# 3. Add handleAppControlsUpdate
handlers = """  const handleAppControlsUpdate = async (updatedControls: typeof appControls) => {
    setAppControls(updatedControls);
    try {
      const docRef = doc(db, 'admin_config', 'settings');
      await updateDoc(docRef, { appControls: updatedControls, updatedAt: new Date().toISOString() });
    } catch(err) {
      alert("Failed to sync App Controls: " + err);
    }
  };"""

content = content.replace("  // Change Admin Password", handlers + "\n\n  // Change Admin Password")

# 4. Add UI for App Controls
# Let's insert it after the recovery email box, replacing the Grid to have more boxes or just placing it nicely.
# The grid is currently <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

app_controls_ui = """              {/* Box 5: App Activation Controls */}
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
              </div>"""

content = content.replace('{/* Box 3: General System Statistics */}', app_controls_ui + '\n\n              {/* Box 3: General System Statistics */}')

with open('src/components/AdminLicenseSystem.tsx', 'w') as f:
    f.write(content)

print("Done")
