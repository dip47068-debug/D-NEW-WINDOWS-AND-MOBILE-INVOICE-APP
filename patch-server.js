const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  'const { backupData, backupEmail, smtpSettings } = req.body;',
  'const { backupData, backupEmail, smtpSettings, pdfBase64 } = req.body;'
);

code = code.replace(
  'const filename = `dbillify_backup_${dateStr}.json`;',
  'const filename = `dbillify_backup_${dateStr}.json`;\n    const pdfFilename = `dbillify_backup_${dateStr}.pdf`;'
);

code = code.replace(
  '        attachments: [\n          {\n            filename,\n            content: backupJsonString,\n            contentType: "application/json"\n          }\n        ]',
  `        attachments: (() => {
          const atts = [
            {
              filename,
              content: backupJsonString,
              contentType: "application/json"
            }
          ];
          if (pdfBase64) {
            atts.push({
              filename: pdfFilename,
              content: Buffer.from(pdfBase64.replace(/^data:application\\/pdf;filename=.*?;base64,/, ""), 'base64'),
              contentType: "application/pdf"
            });
          }
          return atts;
        })()`
);

fs.writeFileSync('server.ts', code);
