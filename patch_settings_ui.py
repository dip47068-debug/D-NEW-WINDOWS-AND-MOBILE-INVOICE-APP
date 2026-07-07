import re

with open('src/components/SettingsView.tsx', 'r') as f:
    content = f.read()

old_license_ui = """              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400 uppercase tracking-wide font-bold text-[9px]">Local Device ID:</span>
                  <span className="font-mono text-[10px] text-slate-800 font-bold select-all">{getOrCreateDeviceId()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 uppercase tracking-wide font-bold text-[9px]">License Status:</span>
                  <span className="text-emerald-600 font-extrabold uppercase text-[9px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">ACTIVE & BOUND</span>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 leading-normal">
                To manage keys, extend access dates, or de-authorize devices, please lock the app or sign out and open the <strong>🔑 Admin Dashboard</strong> on the lockscreen.
              </div>

              <button
                type="button"
                onClick={() => {
                  if (confirm("Are you sure you want to lock the system to access the Admin Panel?")) {
                    localStorage.removeItem('vyapar_license_cache');
                    window.location.reload();
                  }
                }}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold py-2 rounded-xl text-xs transition border border-slate-200 cursor-pointer"
              >
                🔑 Lock & Access Admin License Panel
              </button>"""

new_license_ui = """              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-2 text-xs">
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
                    localStorage.removeItem('vyapar_license_cache');
                    window.location.reload();
                  }
                }}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-2 rounded-xl text-xs transition border border-slate-800 shadow-sm cursor-pointer mt-2"
              >
                🔒 Secure Lock & Admin Login
              </button>"""

content = content.replace(old_license_ui, new_license_ui)

with open('src/components/SettingsView.tsx', 'w') as f:
    f.write(content)

print("Done")
