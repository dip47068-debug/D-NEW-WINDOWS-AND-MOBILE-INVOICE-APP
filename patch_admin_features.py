import re

with open('src/components/AdminLicenseSystem.tsx', 'r') as f:
    content = f.read()

# Add states
new_states = """  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');"""

content = content.replace("  const [showForgotPass, setShowForgotPass] = useState(false);", "  const [showForgotPass, setShowForgotPass] = useState(false);\n" + new_states)

# Replace table section
old_table_header = """            {/* Generated licenses table */}
            <div className="bg-slate-950 border border-slate-850 rounded-2xl overflow-hidden">
              <div className="p-4 bg-slate-900 border-b border-slate-850 flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-300">Generated Keys & Bindings</h3>
                <button 
                  onClick={loadAllLicenses}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-850"
                  title="Reload list"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>"""

new_table_header = """            {/* Dashboard Summary Cards */}
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
              </div>"""

content = content.replace(old_table_header, new_table_header)

old_map = "licenses.map((lic) => {"
new_map = """
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
                        return filteredLicenses.map((lic) => {"""

content = content.replace(old_map, new_map)

old_end_map = """                        );
                      })
                    )}
                  </tbody>"""
new_end_map = """                        );
                      });
                      })()
                    )}
                  </tbody>"""

content = content.replace(old_end_map, new_end_map)

with open('src/components/AdminLicenseSystem.tsx', 'w') as f:
    f.write(content)

print("Done")
