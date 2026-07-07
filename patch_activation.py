import re

with open('src/components/AdminLicenseSystem.tsx', 'r') as f:
    content = f.read()

old_activation = """  // Activate license manually
  const handleActivateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    
    const formattedKey = licenseKeyInput.trim().toUpperCase();"""

new_activation = """  // Activate license manually
  const handleActivateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    
    if (!appControls.allowRegistrations) {
      setErrorMessage("New device registrations are currently disabled by the Administrator.");
      return;
    }

    const formattedKey = licenseKeyInput.trim().toUpperCase();"""

content = content.replace(old_activation, new_activation)

with open('src/components/AdminLicenseSystem.tsx', 'w') as f:
    f.write(content)

print("Done")
