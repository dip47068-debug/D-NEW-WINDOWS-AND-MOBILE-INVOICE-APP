import re

with open('src/components/AdminLicenseSystem.tsx', 'r') as f:
    content = f.read()

timeout_hook = """  // Admin Session Timeout (15 minutes of inactivity)
  useEffect(() => {
    if (!isAdminLoggedIn) return;
    
    let timeoutId: NodeJS.Timeout;
    
    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsAdminLoggedIn(false);
        setAdminPin('');
        alert("Admin session expired due to inactivity.");
      }, 15 * 60 * 1000); // 15 minutes
    };
    
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keypress', resetTimer);
    window.addEventListener('touchstart', resetTimer);
    window.addEventListener('scroll', resetTimer);
    
    resetTimer();
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keypress', resetTimer);
      window.removeEventListener('touchstart', resetTimer);
      window.removeEventListener('scroll', resetTimer);
    };
  }, [isAdminLoggedIn]);"""

content = content.replace("  // Fetch / Sync Admin PIN from Firestore", timeout_hook + "\n\n  // Fetch / Sync Admin PIN from Firestore")

with open('src/components/AdminLicenseSystem.tsx', 'w') as f:
    f.write(content)

print("Done")
