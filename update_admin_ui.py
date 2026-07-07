import re

with open('src/components/AdminLicenseSystem.tsx', 'r') as f:
    content = f.read()

old_ui = """              {/* Box 2: Master PIN Change (Anti-sharing PIN protection) */}
              <div className="bg-slate-950 border border-slate-850 p-5 rounded-2xl space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-orange-400 flex items-center gap-1.5">
                  <Settings className="w-4 h-4" /> Change Master Admin PIN
                </h3>
                
                <form onSubmit={handleChangeAdminPin} className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Current PIN: {storedAdminPin}</label>
                    <div className="relative">
                      <input 
                        type={showNewPin ? "text" : "password"} 
                        maxLength={6}
                        value={newPinInput}
                        onChange={(e) => setNewPinInput(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="Enter New 4-6 digit PIN"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:border-orange-500 text-center font-mono font-bold text-sm text-slate-100 placeholder-slate-600"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowNewPin(!showNewPin)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                      >
                        {showNewPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-bold py-2.5 rounded-xl transition-all cursor-pointer"
                  >
                    Apply New PIN
                  </button>
                </form>
                
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Changing this PIN updates the gateway globally. Write down the new PIN to avoid lockouts!
                </p>
              </div>"""

new_ui = """              {/* Box 2: Change Admin Password */}
              <div className="bg-slate-950 border border-slate-850 p-5 rounded-2xl space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-orange-400 flex items-center gap-1.5">
                  <Settings className="w-4 h-4" /> Change Admin Password
                </h3>
                
                <form onSubmit={handleChangeAdminPassword} className="space-y-3.5">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Current Password</label>
                    <div className="relative">
                      <input 
                        type={showCurrentPassword ? "text" : "password"} 
                        value={currentPasswordInput}
                        onChange={(e) => setCurrentPasswordInput(e.target.value)}
                        placeholder="Current Admin Password"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:border-orange-500 text-xs font-bold text-slate-100 placeholder-slate-600"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                      >
                        {showCurrentPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">New Password</label>
                    <div className="relative">
                      <input 
                        type={showNewPassword ? "text" : "password"} 
                        value={newPasswordInput}
                        onChange={(e) => setNewPasswordInput(e.target.value)}
                        placeholder="New Password (min 8 chars, letters+numbers)"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:border-orange-500 text-xs font-bold text-slate-100 placeholder-slate-600"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                      >
                        {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Confirm Password</label>
                    <div className="relative">
                      <input 
                        type={showConfirmPassword ? "text" : "password"} 
                        value={confirmPasswordInput}
                        onChange={(e) => setConfirmPasswordInput(e.target.value)}
                        placeholder="Confirm New Password"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:border-orange-500 text-xs font-bold text-slate-100 placeholder-slate-600"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                      >
                        {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-bold py-2.5 rounded-xl transition-all cursor-pointer mt-1"
                  >
                    Update Password
                  </button>
                </form>
              </div>"""

content = content.replace(old_ui, new_ui)

with open('src/components/AdminLicenseSystem.tsx', 'w') as f:
    f.write(content)

print("Done")
