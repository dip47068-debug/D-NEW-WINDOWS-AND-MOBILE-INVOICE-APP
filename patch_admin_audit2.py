import re

with open('src/components/AdminLicenseSystem.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    "alert(`License Key successfully generated: ${randomKey}`);",
    "alert(`License Key successfully generated: ${randomKey}`);\n      appendSystemLog(`License Key generated: ${randomKey} for ${keyType} days.`);"
)

content = content.replace(
    "setSuccessMessage('App Activated Successfully! Loading GST Billing system...');",
    "setSuccessMessage('App Activated Successfully! Loading GST Billing system...');\n      appendSystemLog(`Device activated license ${formattedKey}: ${currentDeviceId}`);"
)

with open('src/components/AdminLicenseSystem.tsx', 'w') as f:
    f.write(content)

print("Done")
