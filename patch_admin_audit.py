import re

with open('src/components/AdminLicenseSystem.tsx', 'r') as f:
    content = f.read()

# 1. Add state for systemLogs
new_states = """  const [systemLogs, setSystemLogs] = useState<string[]>([]);"""
content = content.replace("  const [appControls, setAppControls]", new_states + "\n  const [appControls, setAppControls]")

# 2. Add appendSystemLog helper
helpers = """  const appendSystemLog = async (message: string) => {
    const timeStr = new Date().toLocaleString();
    const logEntry = `[${timeStr}] ${message}`;
    setSystemLogs(prev => [logEntry, ...prev].slice(0, 100)); // Keep last 100
    try {
      const docRef = doc(db, 'admin_config', 'settings');
      await updateDoc(docRef, { 
        systemLogs: [logEntry, ...systemLogs].slice(0, 100),
        updatedAt: new Date().toISOString()
      });
    } catch (e) {}
  };"""

content = content.replace("  // Fetch / Sync Admin PIN from Firestore", helpers + "\n\n  // Fetch / Sync Admin PIN from Firestore")


# 3. Modify loadAdminSettings to load systemLogs
old_load = """        if (data.appControls) {
          setAppControls(data.appControls);
        }
      } else {"""
new_load = """        if (data.appControls) {
          setAppControls(data.appControls);
        }
        if (data.systemLogs) {
          setSystemLogs(data.systemLogs);
        }
      } else {"""
content = content.replace(old_load, new_load)


# 4. Instrument logs in password change, login, activation etc.
content = content.replace(
    "setSuccessMessage('Admin Mode authorized successfully.');",
    "setSuccessMessage('Admin Mode authorized successfully.');\n      appendSystemLog('Successful Admin Panel login.');"
)
content = content.replace(
    "setErrorMessage('Incorrect Administrator PIN.');",
    "setErrorMessage('Incorrect Administrator PIN.');\n      appendSystemLog('Failed Admin Panel login attempt.');"
)
content = content.replace(
    "alert(\"Admin password changed successfully.\");",
    "alert(\"Admin password changed successfully.\");\n      appendSystemLog('Admin password changed securely.');"
)
content = content.replace(
    "alert(\"Recovery email updated successfully.\");",
    "alert(\"Recovery email updated successfully.\");\n      appendSystemLog(`Recovery email updated to ${newRecoveryEmail}`);"
)


# 5. Modify Activation Audit Trail UI to System Audit Logs
old_logs_ui = """            {/* Activation history audit log */}
            <div className="bg-slate-950 border border-slate-850 p-5 rounded-2xl">
              <h3 className="text-xs font-black uppercase tracking-widest text-orange-400 mb-3 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4" /> Activation Audit Trail
              </h3>
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1 text-xs">
                {licenses.filter(l => l.history && l.history.length > 0).length === 0 ? (
                  <p className="text-slate-500 font-mono italic text-[11px]">No activation logs compiled yet.</p>
                ) : (
                  licenses.flatMap(l => l.history || []).map((log, index) => (
                    <div key={index} className="bg-slate-900 border border-slate-850 p-2 rounded-xl text-[11px] font-mono text-slate-400 flex items-start gap-2">
                      <span className="text-orange-500 shrink-0">▸</span>
                      <span>{log}</span>
                    </div>
                  ))
                )}
              </div>
            </div>"""

new_logs_ui = """            {/* System Audit Logs */}
            <div className="bg-slate-950 border border-slate-850 p-5 rounded-2xl">
              <h3 className="text-xs font-black uppercase tracking-widest text-orange-400 mb-3 flex items-center gap-1.5">
                <Shield className="w-4 h-4" /> System Audit Logs
              </h3>
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1 text-xs">
                {systemLogs.length === 0 ? (
                  <p className="text-slate-500 font-mono italic text-[11px]">No system logs recorded yet.</p>
                ) : (
                  systemLogs.map((log, index) => (
                    <div key={index} className="bg-slate-900 border border-slate-850 p-2 rounded-xl text-[11px] font-mono text-slate-400 flex items-start gap-2">
                      <span className="text-orange-500 shrink-0">▸</span>
                      <span>{log}</span>
                    </div>
                  ))
                )}
              </div>
            </div>"""

content = content.replace(old_logs_ui, new_logs_ui)

with open('src/components/AdminLicenseSystem.tsx', 'w') as f:
    f.write(content)

print("Done")
