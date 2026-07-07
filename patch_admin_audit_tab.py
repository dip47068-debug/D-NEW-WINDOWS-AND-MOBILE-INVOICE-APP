import re

with open('src/components/AdminLicenseSystem.tsx', 'r') as f:
    content = f.read()

# 1. Update imports
content = content.replace("deleteDoc } from 'firebase/firestore';", "deleteDoc, addDoc } from 'firebase/firestore';")

# 2. Add state for active tab and audit logs
new_states = """  const [systemLogs, setSystemLogs] = useState<string[]>([]);
  const [adminTab, setAdminTab] = useState<'dashboard' | 'audit'>('dashboard');
  const [auditLogs, setAuditLogs] = useState<any[]>([]);"""
content = content.replace("  const [systemLogs, setSystemLogs] = useState<string[]>([]);", new_states)

# 3. Update appendSystemLog to write to admin_audit_logs
old_append = """  const appendSystemLog = async (message: string) => {
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

new_append = """  const loadAuditLogs = async () => {
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
  };"""
content = content.replace(old_append, new_append)

# 4. Modify handleAdminLogin to load audit logs
old_login = """      setIsAdminLoggedIn(true);
      setSuccessMessage('Admin Mode authorized successfully.');
      appendSystemLog('Successful Admin Panel login.');
      loadAllLicenses();"""
new_login = """      setIsAdminLoggedIn(true);
      setSuccessMessage('Admin Mode authorized successfully.');
      appendSystemLog('Successful Admin Panel login.');
      loadAllLicenses();
      loadAuditLogs();"""
content = content.replace(old_login, new_login)


# 5. Add Tab Navigation in the UI
old_ui_header = """          /* Admin Dashboard Panel View */
          <div className="p-6 space-y-6 text-left">
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-850 pb-4 gap-4">
              <div>
                <h2 className="text-xl font-black uppercase text-orange-500">System Key Administration</h2>
                <p className="text-xs text-slate-400 font-bold">Generate, revoke, reset, and extend device license keys.</p>
              </div>"""

new_ui_header = """          /* Admin Dashboard Panel View */
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
              </div>"""
content = content.replace(old_ui_header, new_ui_header)

# 6. Make Dashboard body conditional
# Let's find the content after the header.

with open('src/components/AdminLicenseSystem.tsx', 'w') as f:
    f.write(content)

print("Done")
