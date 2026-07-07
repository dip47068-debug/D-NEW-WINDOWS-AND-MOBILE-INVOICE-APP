import re

with open('src/components/AdminLicenseSystem.tsx', 'r') as f:
    content = f.read()

old_table = """              <div className="overflow-x-auto">
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
                  <tbody>
                    {licenses.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-xs text-slate-500">No generated license keys found. Create one above!</td>
                      </tr>
                    ) : (
                      licenses.map((lic) => {
                        const isExpired = Date.now() > new Date(`${lic.expiryDate}T${lic.expiryTime || '23:59'}`).getTime();
                        return (
                          <tr key={lic.key} className="border-b border-slate-850 text-xs hover:bg-slate-900/45 transition-colors">
                            <td className="p-4 font-mono font-bold text-slate-200">
                              <div className="flex items-center gap-2">
                                <span>{lic.key}</span>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(lic.key);
                                    alert("License Key copied to clipboard!");
                                  }}
                                  className="text-slate-500 hover:text-slate-300 cursor-pointer"
                                  title="Copy key"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                            </td>
                            <td className="p-4">
                              {lic.deviceId ? (
                                <div className="space-y-1">
                                  <span className="font-mono text-[10px] text-slate-300 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded">
                                    {lic.deviceId}
                                  </span>
                                  {lic.activationDate && (
                                    <p className="text-[9px] text-slate-500">Active since {new Date(lic.activationDate).toLocaleDateString()}</p>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-500 font-bold uppercase text-[9px] tracking-wide">Pending Activation</span>
                              )}
                            </td>
                            <td className="p-4 text-slate-300 font-medium">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                <span>{lic.expiryDate}</span>
                                <span className="text-slate-500">@{lic.expiryTime}</span>
                              </div>
                              {isExpired && (
                                <span className="text-[9px] text-red-400 font-bold block mt-0.5">Expired</span>
                              )}
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                lic.status === 'active' && !isExpired
                                  ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900'
                                  : 'bg-red-950/40 text-red-400 border border-red-900'
                              }`}>
                                {lic.status === 'active' && !isExpired ? 'Active' : lic.status === 'disabled' ? 'Revoked' : 'Expired'}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex justify-center items-center gap-1.5">
                                {/* Toggle Status */}
                                <button
                                  onClick={() => handleToggleStatus(lic.key, lic.status)}
                                  className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                                    lic.status === 'active'
                                      ? 'bg-red-950 text-red-400 border border-red-900 hover:bg-red-900 hover:text-white'
                                      : 'bg-emerald-950 text-emerald-400 border border-emerald-900 hover:bg-emerald-900 hover:text-white'
                                  }`}
                                  title={lic.status === 'active' ? "Disable License" : "Enable License"}
                                >
                                  {lic.status === 'active' ? 'Revoke' : 'Restore'}
                                </button>
                                
                                {/* Reset binding */}
                                <button
                                  onClick={() => handleResetBinding(lic.key)}
                                  disabled={!lic.deviceId}
                                  className="px-2 py-1 rounded text-[10px] font-bold bg-blue-950 text-blue-400 border border-blue-900 hover:bg-blue-900 hover:text-white transition-all disabled:opacity-30 cursor-pointer"
                                  title="Unbind Device ID"
                                >
                                  Unbind
                                </button>

                                {/* Extend Expiry (1 Month) */}
                                <button
                                  onClick={() => handleExtendLicense(lic.key, 30)}
                                  className="px-2 py-1 rounded text-[10px] font-bold bg-slate-905 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
                                  title="Extend 30 Days"
                                >
                                  +30d
                                </button>

                                {/* Delete */}
                                <button
                                  onClick={() => handleDeleteLicense(lic.key)}
                                  className="p-1 text-slate-500 hover:text-red-400 rounded transition-all cursor-pointer"
                                  title="Delete Forever"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>"""

new_table = """              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1200px]">
                  <thead>
                    <tr className="border-b border-slate-850 text-[10px] text-slate-500 uppercase font-black bg-slate-900/50">
                      <th className="p-4">License Key</th>
                      <th className="p-4">Device Name & ID</th>
                      <th className="p-4">App & OS Version</th>
                      <th className="p-4">User Details</th>
                      <th className="p-4">Timestamps</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {licenses.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-xs text-slate-500">No generated license keys found. Create one above!</td>
                      </tr>
                    ) : (
                      licenses.map((lic) => {
                        const expiryMs = new Date(`${lic.expiryDate}T${lic.expiryTime || '23:59'}`).getTime();
                        const isExpired = Date.now() > expiryMs;
                        const daysRemaining = Math.max(0, Math.ceil((expiryMs - Date.now()) / (1000 * 60 * 60 * 24)));
                        
                        return (
                          <tr key={lic.key} className="border-b border-slate-850 text-xs hover:bg-slate-900/45 transition-colors">
                            <td className="p-4 font-mono font-bold text-slate-200">
                              <div className="flex items-center gap-2">
                                <span>{lic.key}</span>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(lic.key);
                                    alert("License Key copied to clipboard!");
                                  }}
                                  className="text-slate-500 hover:text-slate-300 cursor-pointer"
                                  title="Copy key"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                              <div className="text-[9px] text-slate-500 font-sans mt-1">
                                Exp: {lic.expiryDate} ({daysRemaining}d left)
                              </div>
                            </td>
                            
                            <td className="p-4">
                              {lic.deviceId ? (
                                <div className="space-y-1">
                                  <div className="font-bold text-slate-300">{lic.deviceName || 'Unknown Device'}</div>
                                  <div className="font-mono text-[9px] text-orange-400/80 bg-orange-950/30 border border-orange-900/50 px-1.5 py-0.5 rounded inline-block">
                                    ID: {lic.deviceId}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-500 font-bold uppercase text-[9px] tracking-wide">Pending Activation</span>
                              )}
                            </td>
                            
                            <td className="p-4 text-slate-400 text-[10px]">
                              {lic.deviceId ? (
                                <div className="space-y-1 leading-tight">
                                  <div>App: <span className="text-slate-300">{lic.appVersion || 'N/A'}</span></div>
                                  <div className="truncate max-w-[120px]" title={lic.osVersion || 'Unknown OS'}>OS: {lic.osVersion || 'Unknown OS'}</div>
                                </div>
                              ) : '-'}
                            </td>

                            <td className="p-4">
                              {lic.deviceId ? (
                                <div className="space-y-1 text-[10px]">
                                  <div className="font-bold text-slate-200">{lic.userName || 'Unknown User'}</div>
                                  <div className="text-slate-500">{lic.userEmail || '-'}</div>
                                </div>
                              ) : '-'}
                            </td>

                            <td className="p-4 text-slate-400 text-[10px]">
                               {lic.deviceId ? (
                                <div className="space-y-1 leading-tight">
                                  <div>Login: <span className="text-slate-300">{lic.loginDateTime ? new Date(lic.loginDateTime).toLocaleDateString() : '-'}</span></div>
                                  <div>Active: <span className="text-slate-300">{lic.lastActiveDateTime ? new Date(lic.lastActiveDateTime).toLocaleDateString() : '-'}</span></div>
                                </div>
                              ) : '-'}
                            </td>

                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                lic.status === 'active' && !isExpired
                                  ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900'
                                  : 'bg-red-950/40 text-red-400 border border-red-900'
                              }`}>
                                {lic.status === 'active' && !isExpired ? 'Active' : lic.status === 'disabled' ? 'Revoked' : 'Expired'}
                              </span>
                            </td>

                            <td className="p-4">
                              <div className="flex justify-center items-center gap-1.5 flex-wrap w-[120px]">
                                {/* Toggle Status */}
                                <button
                                  onClick={() => handleToggleStatus(lic.key, lic.status)}
                                  className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer flex-1 ${
                                    lic.status === 'active'
                                      ? 'bg-red-950 text-red-400 border border-red-900 hover:bg-red-900 hover:text-white'
                                      : 'bg-emerald-950 text-emerald-400 border border-emerald-900 hover:bg-emerald-900 hover:text-white'
                                  }`}
                                  title={lic.status === 'active' ? "Disable License" : "Enable License"}
                                >
                                  {lic.status === 'active' ? 'Revoke' : 'Restore'}
                                </button>
                                
                                {/* Reset binding */}
                                <button
                                  onClick={() => handleResetBinding(lic.key)}
                                  disabled={!lic.deviceId}
                                  className="px-2 py-1 rounded text-[10px] font-bold bg-blue-950 text-blue-400 border border-blue-900 hover:bg-blue-900 hover:text-white transition-all disabled:opacity-30 cursor-pointer flex-1"
                                  title="Unbind Device ID"
                                >
                                  Logout
                                </button>

                                {/* Extend Expiry (1 Month) */}
                                <button
                                  onClick={() => handleExtendLicense(lic.key, 30)}
                                  className="px-2 py-1 rounded text-[10px] font-bold bg-slate-905 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-white transition-all cursor-pointer flex-1"
                                  title="Extend 30 Days"
                                >
                                  +30d
                                </button>

                                {/* Delete */}
                                <button
                                  onClick={() => handleDeleteLicense(lic.key)}
                                  className="p-1 text-slate-500 hover:text-red-400 rounded transition-all cursor-pointer"
                                  title="Delete Forever"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>"""

content = content.replace(old_table, new_table)

with open('src/components/AdminLicenseSystem.tsx', 'w') as f:
    f.write(content)

print("Done")
