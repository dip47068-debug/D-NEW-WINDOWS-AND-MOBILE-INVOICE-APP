const fs = require('fs');
let content = fs.readFileSync('src/components/SecurityScreen.tsx', 'utf8');

content = content.replace('Simulated biometric unlock', 'System device biometric unlock (WebAuthn)');

fs.writeFileSync('src/components/SecurityScreen.tsx', content);
