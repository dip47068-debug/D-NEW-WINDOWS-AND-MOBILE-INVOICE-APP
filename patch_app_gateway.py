import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Add states for app controls
new_states = """  const [isLicenseVerified, setIsLicenseVerified] = useState(false);
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
  }, []);"""

content = content.replace("  const [isLicenseVerified, setIsLicenseVerified] = useState(false);\n  const [licenseError, setLicenseError] = useState('');", new_states)


# Add Gateway rendering
old_return = """  return (
    <div className="flex bg-slate-50 min-h-screen text-slate-800 font-sans">
      <Sidebar 
        currentView={currentView}
        onNavigate={setCurrentView}
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />"""

new_return = """  if (appControls?.maintenanceMode && currentView !== 'settings') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="bg-slate-900 border border-red-500/30 p-8 rounded-3xl max-w-md w-full text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-200">System Maintenance</h1>
            <p className="text-slate-400 mt-2 text-sm">{appControls.maintenanceMessage || 'We are currently upgrading the system. Please try again later.'}</p>
          </div>
          <button 
             onClick={() => setCurrentView('settings')}
             className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition"
          >
             Admin Access
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-slate-50 min-h-screen text-slate-800 font-sans">
      <Sidebar 
        currentView={currentView}
        onNavigate={setCurrentView}
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />"""

content = content.replace(old_return, new_return)

with open('src/App.tsx', 'w') as f:
    f.write(content)

print("Done")
