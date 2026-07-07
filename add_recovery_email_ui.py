import re

with open('src/components/AdminLicenseSystem.tsx', 'r') as f:
    content = f.read()

# Add states for recovery email update
new_states = """  const [showForgotPass, setShowForgotPass] = useState(false);
  const [newRecoveryEmail, setNewRecoveryEmail] = useState('');"""

content = content.replace("  const [showForgotPass, setShowForgotPass] = useState(false);", new_states)

handlers = """  const handleChangeRecoveryEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecoveryEmail.includes('@')) {
      alert("Please enter a valid email address.");
      return;
    }
    try {
      const docRef = doc(db, 'admin_config', 'settings');
      await updateDoc(docRef, { recoveryEmail: newRecoveryEmail, updatedAt: new Date().toISOString() });
      setAdminRecoveryEmail(newRecoveryEmail);
      setNewRecoveryEmail('');
      alert("Recovery email updated successfully.");
    } catch (err) {
      alert("Failed to update recovery email in Cloud: " + err);
    }
  };"""

content = content.replace("  // Change Admin Password", handlers + "\n\n  // Change Admin Password")

ui_to_add = """              {/* Box 4: Admin Profile & Recovery */}
              <div className="bg-slate-950 border border-slate-850 p-5 rounded-2xl space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-orange-400 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4" /> Admin Recovery Settings
                </h3>
                
                <form onSubmit={handleChangeRecoveryEmail} className="space-y-3.5">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Current Recovery Email</label>
                    <div className="text-xs font-bold text-slate-300 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2">
                      {adminRecoveryEmail}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">New Recovery Email</label>
                    <input 
                      type="email"
                      value={newRecoveryEmail}
                      onChange={(e) => setNewRecoveryEmail(e.target.value)}
                      placeholder="e.g. superadmin@example.com"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:border-orange-500 text-xs font-bold text-slate-100 placeholder-slate-600"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-bold py-2.5 rounded-xl transition-all cursor-pointer mt-1"
                  >
                    Update Email
                  </button>
                </form>
              </div>"""

content = content.replace("{/* Box 3: General System Statistics */}", ui_to_add + "\n\n              {/* Box 3: General System Statistics */}")


# Fix layout grids to handle 4 boxes nicely. Currently it's grid-cols-1 lg:grid-cols-3
content = content.replace('className="grid grid-cols-1 lg:grid-cols-3 gap-6"', 'className="grid grid-cols-1 lg:grid-cols-4 gap-6"')

with open('src/components/AdminLicenseSystem.tsx', 'w') as f:
    f.write(content)

print("Done")
