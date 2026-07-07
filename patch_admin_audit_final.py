import re

with open('src/components/AdminLicenseSystem.tsx', 'r') as f:
    content = f.read()

# 1. wrap dashboard components based on `adminTab`
# First, insert `{adminTab === 'dashboard' ? ( <> ` right before the first Grid.
dashboard_start = "            {/* Top configuration row */}"
new_dashboard_start = """            {adminTab === 'dashboard' ? (
              <>
            {/* Top configuration row */}"""
content = content.replace(dashboard_start, new_dashboard_start, 1)

# 2. Replace the old System Audit Logs section entirely and close the `adminTab === 'dashboard'` ternary.
old_logs_end = """            {/* System Audit Logs */}
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

new_logs_end = """              </>
            ) : (
              <div className="bg-slate-950 border border-slate-850 rounded-2xl overflow-hidden shadow-2xl">
                <div className="p-5 border-b border-slate-850 flex items-center gap-2">
                   <Shield className="w-5 h-5 text-orange-500" />
                   <h3 className="text-sm font-black uppercase tracking-widest text-slate-300">System Audit Logs</h3>
                </div>
                <div className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-900 border-b border-slate-850 text-[10px] text-slate-500 uppercase font-black">
                          <th className="p-4">Timestamp</th>
                          <th className="p-4">Administrator</th>
                          <th className="p-4">Action Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditLogs.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="p-8 text-center text-xs text-slate-500 font-mono italic">
                              No system logs recorded yet.
                            </td>
                          </tr>
                        ) : (
                          auditLogs.map((log) => (
                            <tr key={log.id} className="border-b border-slate-850/50 hover:bg-slate-900/30 transition-colors">
                              <td className="p-4 text-[10px] font-mono text-slate-400 whitespace-nowrap">
                                {new Date(log.timestamp).toLocaleString()}
                              </td>
                              <td className="p-4">
                                <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px] font-bold">
                                  {log.adminUser || 'Admin'}
                                </span>
                              </td>
                              <td className="p-4 text-xs font-mono text-orange-300/80">
                                {log.action}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}"""

content = content.replace(old_logs_end, new_logs_end)

with open('src/components/AdminLicenseSystem.tsx', 'w') as f:
    f.write(content)

print("Done")
