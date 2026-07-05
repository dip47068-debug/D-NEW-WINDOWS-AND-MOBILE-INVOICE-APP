import React, { useState, useEffect } from 'react';
import { Shield, Key, Fingerprint, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { UserProfile } from '../types';

interface SecurityScreenProps {
  userProfile: UserProfile;
  onLoginSuccess: (profile: UserProfile) => void;
}

export default function SecurityScreen({ userProfile, onLoginSuccess }: SecurityScreenProps) {
  const { user, signIn, loading } = useAuth();
  
  const [authMode, setAuthMode] = useState<'password' | 'pin' | 'biometric'>('password');
  
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [biometricScanning, setBiometricScanning] = useState(false);
  const isIframe = window.self !== window.top;

  useEffect(() => {
    // Sync Google email but do NOT bypass the lockscreen automatically
    if (user && user.email && user.email !== userProfile.email) {
       onLoginSuccess({
         ...userProfile,
         email: user.email,
         isLoggedIn: false
       });
    }
  }, [user, onLoginSuccess, userProfile]);

  const handleLocalUnlock = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    
    if (authMode === 'password') {
      // Allow 'admin123' as default fallback
      if (password === userProfile.passwordHash || password === 'admin123') {
        onLoginSuccess({ ...userProfile, isLoggedIn: true });
      } else {
        setErrorMsg('Incorrect password');
      }
    } else if (authMode === 'pin') {
      if (pin === userProfile.securityPin || pin === '1234') {
        onLoginSuccess({ ...userProfile, isLoggedIn: true });
      } else {
        setErrorMsg('Incorrect PIN');
      }
    }
  };

  const handleBiometric = async () => {
    setBiometricScanning(true);
    setErrorMsg('');
    try {
      if (!window.PublicKeyCredential) {
        throw new Error('Biometric authentication is not supported on this device/browser.');
      }
      
      const savedCredId = localStorage.getItem('vyapar_biometric_id');
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);
      
      if (savedCredId) {
        // Assert (Login)
        const credentialId = Uint8Array.from(atob(savedCredId), c => c.charCodeAt(0));
        await navigator.credentials.get({
          publicKey: {
            challenge: challenge,
            allowCredentials: [{
              id: credentialId,
              type: 'public-key',
              transports: ['internal', 'usb', 'nfc', 'ble']
            }],
            userVerification: 'required'
          }
        });
        
        onLoginSuccess({ ...userProfile, isLoggedIn: true });
      } else {
        // Register (First time)
        const userId = new Uint8Array(16);
        crypto.getRandomValues(userId);
        
        const credential = await navigator.credentials.create({
          publicKey: {
            challenge: challenge,
            rp: { name: 'D Billify App', id: window.location.hostname },
            user: {
              id: userId,
              name: userProfile.email || 'user@example.com',
              displayName: 'D Billify User'
            },
            pubKeyCredParams: [{ alg: -7, type: 'public-key' }, { alg: -257, type: 'public-key' }],
            authenticatorSelection: {
              authenticatorAttachment: 'platform',
              userVerification: 'required'
            },
            timeout: 60000,
            attestation: 'none'
          }
        });
        
        if (credential) {
          const rawId = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array((credential as PublicKeyCredential).rawId))));
          localStorage.setItem('vyapar_biometric_id', rawId);
          onLoginSuccess({ ...userProfile, isLoggedIn: true });
        }
      }
    } catch (e: any) {
      console.error(e);
      let errorText = e.message || 'Biometric failed.';
      if (errorText.includes('publickey-credentials-create') || errorText.includes('feature is not enabled') || e.name === 'SecurityError') {
        errorText = 'Biometric WebAuthn APIs are blocked inside iframes by your browser. Please click "Open in New Tab" at the top right of the page to unlock using Touch ID.';
      }
      setErrorMsg(e.name === 'NotAllowedError' ? 'Biometric authentication canceled' : errorText);
    } finally {
      setBiometricScanning(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signIn();
    } catch (e) {
      setErrorMsg('Google Sign-In failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-orange-600/10 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/10 blur-[120px]"></div>
      </div>

      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col z-10 border border-slate-100">
        <div className="bg-slate-900 p-10 text-center text-white flex flex-col items-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-800 to-slate-900 opacity-50"></div>
          <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-orange-500/30 relative z-10">
            <Shield className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-black tracking-tight uppercase relative z-10">D Billify</h1>
          <p className="text-slate-400 text-sm font-medium mt-2 relative z-10 uppercase tracking-widest">Secure Access Gateway</p>
        </div>
        
        <div className="p-8 flex flex-col">
          {/* Auth Mode Tabs */}
          <div className="flex bg-slate-100 p-1.5 rounded-xl mb-8">
            <button 
              type="button"
              onClick={() => { setAuthMode('password'); setErrorMsg(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${authMode === 'password' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Key className="w-4 h-4" /> Password
            </button>
            <button 
              type="button"
              onClick={() => { setAuthMode('pin'); setErrorMsg(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${authMode === 'pin' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Lock className="w-4 h-4" /> PIN
            </button>
            <button 
              type="button"
              onClick={() => { setAuthMode('biometric'); setErrorMsg(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${authMode === 'biometric' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Fingerprint className="w-4 h-4" /> Touch ID
            </button>
          </div>

          {errorMsg && (
            <div className="bg-rose-50 text-rose-600 text-sm font-bold p-4 rounded-xl mb-6 flex items-center gap-2 border border-rose-100 animate-pulse">
              <Shield className="w-4 h-4" /> {errorMsg}
            </div>
          )}

          {authMode === 'password' && (
            <form onSubmit={handleLocalUnlock} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Master Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password (admin123)"
                    className="w-full pl-11 pr-12 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all font-medium text-slate-900"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <button 
                type="submit"
                className="w-full bg-slate-900 text-white font-bold rounded-xl p-4 flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20"
              >
                Unlock System <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          )}

          {authMode === 'pin' && (
            <form onSubmit={handleLocalUnlock} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Security PIN</label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="Enter 4-digit PIN (1234)"
                    className="w-full pl-11 pr-12 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all font-mono font-bold text-center text-xl text-slate-900 tracking-widest"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <button 
                type="submit"
                className="w-full bg-slate-900 text-white font-bold rounded-xl p-4 flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20"
              >
                Unlock System <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          )}

          {authMode === 'biometric' && (
            <div className="flex flex-col items-center py-6">
              <button
                type="button"
                onClick={handleBiometric}
                disabled={biometricScanning}
                className={`w-28 h-28 rounded-full flex items-center justify-center transition-all ${
                  biometricScanning 
                    ? 'bg-orange-50 text-orange-500 border-4 border-orange-500 animate-pulse' 
                    : 'bg-slate-50 text-slate-400 border-2 border-slate-200 hover:border-orange-500 hover:text-orange-500 hover:bg-orange-50 shadow-sm'
                }`}
              >
                <Fingerprint className={`w-14 h-14 ${biometricScanning ? 'animate-bounce' : ''}`} />
              </button>
              <p className="mt-6 text-sm font-bold text-slate-600">
                {biometricScanning ? 'Scanning fingerprint...' : 'Tap to scan fingerprint'}
              </p>
              <p className="text-xs text-slate-400 mt-1">System device biometric unlock (WebAuthn)</p>

              {isIframe && (
                <div className="mt-6 p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-800 text-xs text-center leading-relaxed">
                  <p className="font-bold mb-1">🔒 Browser Security Sandbox Notice</p>
                  <p>Fingerprint authentication requires a secure top-level context and is blocked inside cross-origin preview frames.</p>
                  <p className="mt-2 font-bold text-slate-900">Please click the "Open in New Tab" button in the top-right corner of the screen to register and use biometrics!</p>
                </div>
              )}
            </div>
          )}

          <div className="mt-10 pt-8 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center mb-4">Or sign in with Cloud Auth</p>
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-xl p-3.5 flex items-center justify-center gap-3 hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50"
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
              {loading ? "Connecting..." : "Continue with Google"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
