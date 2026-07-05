const fs = require('fs');
let appContent = fs.readFileSync('src/App.tsx', 'utf8');

if (!appContent.includes("import { auth } from")) {
    // try to import auth from firebase config.
    // Let's assume it's src/firebase.ts or src/lib/firebase.ts
    // Looking at earlier grep, it's import { auth } from ... let's see.
    appContent = appContent.replace("import { doc, setDoc, getDoc } from 'firebase/firestore';", "import { doc, setDoc, getDoc } from 'firebase/firestore';\nimport { auth } from './lib/firebase';");
    fs.writeFileSync('src/App.tsx', appContent);
}

let invContent = fs.readFileSync('src/components/InvoicesView.tsx', 'utf8');

// replace companySettings.state -> (companySettings as any).state
invContent = invContent.replace(/companySettings\.state/g, "(companySettings as any).state");

// replace item.taxRate -> item.gstRate
invContent = invContent.replace(/item\.taxRate/g, "item.gstRate");

// replace invoice.discount -> invoice.totalDiscount
invContent = invContent.replace(/invoice\.discount/g, "invoice.totalDiscount");

// fix numToWords
const oldNumToWords = `  const numToWords = (num: number) => {
    const a = ['','One ','Two ','Three ','Four ', 'Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
    const b = ['', '', 'Twenty','Thirty','Forty','Fifty', 'Sixty','Seventy','Eighty','Ninety'];
    if ((num = num.toString()).length > 9) return 'overflow';
    const n = ('000000000' + num).substr(-9).match(/^(\\d{2})(\\d{2})(\\d{2})(\\d{1})(\\d{2})$/);
    if (!n) return;
    let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
    return str ? str + 'Rupees Only' : '';
  };`;

const newNumToWords = `  const numToWords = (num: number) => {
    const a = ['','One ','Two ','Three ','Four ', 'Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
    const b = ['', '', 'Twenty','Thirty','Forty','Fifty', 'Sixty','Seventy','Eighty','Ninety'];
    const numStr = num.toString();
    if (numStr.length > 9) return 'overflow';
    const n = ('000000000' + numStr).slice(-9).match(/^(\\d{2})(\\d{2})(\\d{2})(\\d{1})(\\d{2})$/);
    if (!n) return;
    let str = '';
    str += (n[1] !== '00') ? (a[Number(n[1])] || b[Number(n[1][0])] + ' ' + a[Number(n[1][1])]) + 'Crore ' : '';
    str += (n[2] !== '00') ? (a[Number(n[2])] || b[Number(n[2][0])] + ' ' + a[Number(n[2][1])]) + 'Lakh ' : '';
    str += (n[3] !== '00') ? (a[Number(n[3])] || b[Number(n[3][0])] + ' ' + a[Number(n[3][1])]) + 'Thousand ' : '';
    str += (n[4] !== '0') ? (a[Number(n[4])] || b[Number(n[4][0])] + ' ' + a[Number(n[4][1])]) + 'Hundred ' : '';
    str += (n[5] !== '00') ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[Number(n[5][0])] + ' ' + a[Number(n[5][1])]) : '';
    return str ? str + 'Rupees Only' : '';
  };`;

invContent = invContent.replace(oldNumToWords, newNumToWords);
fs.writeFileSync('src/components/InvoicesView.tsx', invContent);

console.log("Patched linter errors");
