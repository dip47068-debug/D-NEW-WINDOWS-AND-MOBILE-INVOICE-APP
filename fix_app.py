import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

old_app = """  // Real-time License Verification & Device Locking
  useEffect(() => {
    const savedKey = localStorage.getItem('vyapar_license_key');
    if (!savedKey) {"""

new_app = """  // Real-time License Verification & Device Locking
  useEffect(() => {
    const savedKeyRaw = localStorage.getItem('vyapar_license_key');
    let savedKey = savedKeyRaw;
    if (savedKeyRaw && !savedKeyRaw.startsWith('VYA-')) {
      try { savedKey = atob(savedKeyRaw); } catch(e) {}
    }
    if (savedKey && savedKey.startsWith('VYA-') && savedKeyRaw === savedKey) {
       localStorage.setItem('vyapar_license_key', btoa(savedKey));
    }

    if (!savedKey) {"""

content = content.replace(old_app, new_app)

with open('src/App.tsx', 'w') as f:
    f.write(content)

print("Done")
