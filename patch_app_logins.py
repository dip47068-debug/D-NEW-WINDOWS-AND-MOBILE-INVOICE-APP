import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

old_return = """  if (appControls?.maintenanceMode && currentView !== 'settings') {
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
  }"""

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
             className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition cursor-pointer"
          >
             Admin Access
          </button>
        </div>
      </div>
    );
  }
  
  if (appControls && !appControls.allowLogins && currentView !== 'settings' && isLicenseVerified) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="bg-slate-900 border border-orange-500/30 p-8 rounded-3xl max-w-md w-full text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 bg-orange-500/20 text-orange-500 rounded-full flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-200">Logins Disabled</h1>
            <p className="text-slate-400 mt-2 text-sm">User logins are temporarily disabled by the Administrator.</p>
          </div>
          <button 
             onClick={() => setCurrentView('settings')}
             className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition cursor-pointer"
          >
             Admin Access
          </button>
        </div>
      </div>
    );
  }"""

content = content.replace(old_return, new_return)

with open('src/App.tsx', 'w') as f:
    f.write(content)

print("Done")
