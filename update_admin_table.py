import re

with open('src/components/AdminLicenseSystem.tsx', 'r') as f:
    content = f.read()

# Replace the table part
old_table = """              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-850 text-[10px] text-slate-500 uppercase font-black">
                      <th className="p-4">License Key</th>
                      <th className="p-4">Bound Device ID</th>
                      <th className="p-4">Expiry Date & Time</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>"""

new_table = """              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1200px]">
                  <thead>
                    <tr className="border-b border-slate-850 text-[10px] text-slate-500 uppercase font-black">
                      <th className="p-4">Device Info</th>
                      <th className="p-4">User Details</th>
                      <th className="p-4">License Key</th>
                      <th className="p-4">Status / Timeline</th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>"""
content = content.replace(old_table, new_table)

old_row = """                            <td className="p-4">
                              {lic.deviceId ? (
                                <div className="space-y-1">
                                  <span className="font-mono text-[10px] text-slate-300 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded">
                                    {lic.deviceId}
                                  </span>
                                  {lic.deviceId === currentDeviceId && (
                                    <span className="ml-2 text-[9px] text-emerald-500 font-bold uppercase tracking-widest animate-pulse">This Node</span>
                                  )}
                                  <div className="text-[9px] text-slate-500 font-bold flex items-center gap-1">
                                    <Clock className="w-2.5 h-2.5" /> Bound: {lic.activationDate ? new Date(lic.activationDate).toLocaleDateString() : 'Unknown'}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-500 italic text-[10px] font-bold">Unbound - Awaiting Activation</span>
                              )}
                            </td>
                            <td className="p-4">
                              <div className="font-bold text-slate-300">{lic.expiryDate}</div>
                              <div className="text-[10px] text-slate-500">{lic.expiryTime || '23:59'} (System Time)</div>
                              {isExpired && <span className="text-[9px] text-red-500 font-black uppercase tracking-wider block mt-1">Expired</span>}
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${
                                lic.status === 'active' && !isExpired 
                                  ? 'border-emerald-500/30 text-emerald-400 bg-emerald-950' 
                                  : lic.status === 'disabled'
                                    ? 'border-red-500/30 text-red-400 bg-red-950'
                                    : 'border-amber-500/30 text-amber-400 bg-amber-950'
                              }`}>
                                {lic.status === 'active' && isExpired ? 'Expired' : lic.status}
                              </span>
                            </td>
                            <td className="p-4 space-y-2">
                              <div className="flex gap-2 justify-center">
                                {lic.deviceId && (
                                  <button
                                    onClick={() => handleResetDevice(lic.key)}
                                    className="px-2.5 py-1 text-[9px] font-bold border border-slate-750 text-slate-300 hover:bg-slate-800 rounded transition-colors"
                                    title="Unbind device to allow new device to use this key"
                                  >
                                    Unbind Device
                                  </button>
                                )}
                                <button
                                  onClick={() => handleToggleStatus(lic.key, lic.status)}
                                  className={`px-2.5 py-1 text-[9px] font-bold border rounded transition-colors ${
                                    lic.status === 'active' 
                                      ? 'border-red-900 text-red-400 hover:bg-red-950' 
                                      : 'border-emerald-900 text-emerald-400 hover:bg-emerald-950'
                                  }`}
                                >
                                  {lic.status === 'active' ? 'Revoke Key' : 'Restore Key'}
                                </button>
                                <button
                                  onClick={() => handleDeleteLicense(lic.key)}
                                  className="p-1 text-slate-600 hover:text-red-500 transition-colors"
                                  title="Permanently Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>"""

new_row = """                            <td className="p-4">
                              {lic.deviceId ? (
                                <div className="space-y-1">
                                  <div className="font-bold text-slate-200">{lic.deviceName || 'Unknown Device'}</div>
                                  <div className="text-[10px] text-slate-400 font-mono">{lic.deviceId}</div>
                                  <div className="text-[9px] text-slate-500 flex flex-wrap gap-2">
                                    <span>OS: {lic.osVersion?.split(' ')[0] || 'Unknown'}</span>
                                    <span>App: {lic.appVersion || '1.0'}</span>
                                    {lic.ipAddress && <span>IP: {lic.ipAddress}</span>}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-500 italic text-[10px] font-bold">Unbound License</span>
                              )}
                            </td>
                            <td className="p-4">
                              <div className="space-y-1">
                                <div className="font-bold text-slate-200">{lic.userName || 'No User'}</div>
                                <div className="text-[10px] text-slate-400">{lic.userEmail || 'No Email'}</div>
                              </div>
                            </td>
                            <td className="p-4 font-mono font-bold text-slate-200">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <span>{lic.key}</span>
                                  <button onClick={() => { navigator.clipboard.writeText(lic.key); alert("Copied!"); }} className="text-slate-500 hover:text-slate-300"><Copy className="w-3 h-3" /></button>
                                </div>
                                <span className={`self-start px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${
                                  lic.status === 'active' && !isExpired 
                                    ? 'border-emerald-500/30 text-emerald-400 bg-emerald-950' 
                                    : lic.status === 'disabled' || lic.status === 'suspended'
                                      ? 'border-red-500/30 text-red-400 bg-red-950'
                                      : 'border-amber-500/30 text-amber-400 bg-amber-950'
                                }`}>
                                  {lic.status === 'active' && isExpired ? 'Expired' : lic.status}
                                </span>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="space-y-1 text-[10px] text-slate-400">
                                <div className="flex items-center gap-1"><Clock className="w-3 h-3 text-emerald-500" /> Active: {lic.activationDate ? new Date(lic.activationDate).toLocaleDateString() : '-'}</div>
                                <div className="flex items-center gap-1"><Clock className="w-3 h-3 text-red-500" /> Expiry: {lic.expiryDate} {lic.expiryTime || ''}</div>
                                {lic.loginDateTime && <div className="text-[9px] mt-1 text-slate-500">Last Login: {new Date(lic.loginDateTime).toLocaleString()}</div>}
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex flex-wrap gap-2 justify-center">
                                {lic.deviceId && (
                                  <button onClick={() => handleResetDevice(lic.key)} className="px-2.5 py-1 text-[9px] font-bold border border-slate-750 text-slate-300 hover:bg-slate-800 rounded transition-colors" title="Logout remotely / unbind">
                                    Logout Device
                                  </button>
                                )}
                                <button onClick={() => handleToggleStatus(lic.key, lic.status)} className={`px-2.5 py-1 text-[9px] font-bold border rounded transition-colors ${lic.status === 'active' ? 'border-red-900 text-red-400 hover:bg-red-950' : 'border-emerald-900 text-emerald-400 hover:bg-emerald-950'}`}>
                                  {lic.status === 'active' ? 'Revoke' : 'Restore'}
                                </button>
                                <button onClick={() => handleDeleteLicense(lic.key)} className="p-1 text-slate-600 hover:text-red-500 transition-colors" title="Delete">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>"""

content = content.replace(old_row, new_row)

with open('src/components/AdminLicenseSystem.tsx', 'w') as f:
    f.write(content)

print("Done")
