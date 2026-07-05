const fs = require('fs');
const content = fs.readFileSync('src/components/SecurityScreen.tsx', 'utf8');

const searchEffect = `  useEffect(() => {
    // If Firebase Auth state changes and user is logged in, unlock automatically.
    if (user && !userProfile.isLoggedIn) {
       onLoginSuccess({
         ...userProfile,
         isLoggedIn: true,
         email: user.email || userProfile.email,
       });
    }
  }, [user, onLoginSuccess, userProfile]);`;

const replacementEffect = `  useEffect(() => {
    // Sync Google email but do NOT bypass the lockscreen automatically
    if (user && user.email && user.email !== userProfile.email) {
       onLoginSuccess({
         ...userProfile,
         email: user.email,
         isLoggedIn: false
       });
    }
  }, [user, onLoginSuccess, userProfile]);`;

const searchBiometric = `  const handleBiometric = () => {
    setBiometricScanning(true);
    setTimeout(() => {
      setBiometricScanning(false);
      onLoginSuccess({ ...userProfile, isLoggedIn: true });
    }, 1500);
  };`;

const replacementBiometric = `  const handleBiometric = async () => {
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
      setErrorMsg(e.name === 'NotAllowedError' ? 'Biometric authentication canceled' : (e.message || 'Biometric failed.'));
    } finally {
      setBiometricScanning(false);
    }
  };`;

let newContent = content.replace(searchEffect, replacementEffect);
newContent = newContent.replace(searchBiometric, replacementBiometric);

fs.writeFileSync('src/components/SecurityScreen.tsx', newContent);
console.log("Patched");
