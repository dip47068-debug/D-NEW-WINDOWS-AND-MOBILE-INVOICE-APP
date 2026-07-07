import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

old_app = """    const savedKey = localStorage.getItem('vyapar_license_key');
    const cachedDataStr = localStorage.getItem('vyapar_license_cache');"""

new_app = """    const savedKeyRaw = localStorage.getItem('vyapar_license_key');
    let savedKey = savedKeyRaw;
    if (savedKeyRaw && !savedKeyRaw.startsWith('VYA-')) {
      try { savedKey = atob(savedKeyRaw); } catch(e) {}
    }
    if (savedKey && savedKey.startsWith('VYA-') && savedKeyRaw === savedKey) {
       localStorage.setItem('vyapar_license_key', btoa(savedKey));
    }
    const cachedDataStr = localStorage.getItem('vyapar_license_cache');"""

content = content.replace(old_app, new_app)

with open('src/App.tsx', 'w') as f:
    f.write(content)

with open('src/components/AdminLicenseSystem.tsx', 'r') as f:
    content = f.read()

old_admin = """    const savedKey = localStorage.getItem('vyapar_license_key');

    try {
      if (!savedKey) {"""

new_admin = """    const savedKeyRaw = localStorage.getItem('vyapar_license_key');
    let savedKey = savedKeyRaw;
    if (savedKeyRaw && !savedKeyRaw.startsWith('VYA-')) {
      try { savedKey = atob(savedKeyRaw); } catch(e) {}
    }

    try {
      if (!savedKey) {"""

content = content.replace(old_admin, new_admin)

old_admin_set = """      localStorage.setItem('vyapar_license_key', formattedKey);"""
new_admin_set = """      localStorage.setItem('vyapar_license_key', btoa(formattedKey));"""
content = content.replace(old_admin_set, new_admin_set)

with open('src/components/AdminLicenseSystem.tsx', 'w') as f:
    f.write(content)

print("Done")
