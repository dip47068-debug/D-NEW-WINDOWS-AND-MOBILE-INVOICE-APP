const fs = require('fs');
let content = fs.readFileSync('src/components/InvoicesView.tsx', 'utf8');

const tableSearch = `            <thead>
              <tr className="border-b border-black bg-gray-50">
                <th className="p-2 border-r border-black font-bold text-center w-10">Sr.</th>
                <th className="p-2 border-r border-black font-bold">Item Description</th>
                <th className="p-2 border-r border-black font-bold text-center w-16">HSN/SAC</th>
                <th className="p-2 border-r border-black font-bold text-center w-12">Qty</th>
                <th className="p-2 border-r border-black font-bold text-right w-20">List Price</th>
                <th className="p-2 border-r border-black font-bold text-right w-16">Disc</th>
                <th className="p-2 border-r border-black font-bold text-center w-12">Tax %</th>
                <th className="p-2 font-bold text-right w-24">Amount</th>
              </tr>
            </thead>
            <tbody className="align-top">
              {items.map((item, idx) => (
                <tr key={idx} className="border-b border-gray-200 last:border-b-0">
                  <td className="p-2 border-r border-black text-center">{idx + 1}</td>
                  <td className="p-2 border-r border-black">
                    <p className="font-bold">{item.productName}</p>
                    {showProdDescInPrint && item.description && <p className="text-[10px] mt-0.5 whitespace-pre-line">{item.description}</p>}
                  </td>
                  <td className="p-2 border-r border-black text-center">{item.hsnCode || '-'}</td>
                  <td className="p-2 border-r border-black text-center">{item.quantity} {item.unit || 'PCS'}</td>
                  <td className="p-2 border-r border-black text-right">{(item.rate).toFixed(2)}</td>
                  <td className="p-2 border-r border-black text-right">{item.discount || '0'}</td>
                  <td className="p-2 border-r border-black text-center">{item.taxRate}%</td>
                  <td className="p-2 text-right">{(item.total).toFixed(2)}</td>
                </tr>
              ))}
              {/* Filler row to push footer down if items are few */}
              <tr className="h-full">
                <td className="border-r border-black"></td>
                <td className="border-r border-black"></td>
                <td className="border-r border-black"></td>
                <td className="border-r border-black"></td>
                <td className="border-r border-black"></td>
                <td className="border-r border-black"></td>
                <td className="border-r border-black"></td>
                <td></td>
              </tr>
            </tbody>`;

const tableReplacement = `            <thead>
              <tr className="border-b border-black">
                <th className="p-2 border-r border-black font-bold text-center w-8">Sr.</th>
                <th className="p-2 border-r border-black font-bold">Item Name/Description</th>
                <th className="p-2 border-r border-black font-bold text-center w-14">HSN/SAC</th>
                <th className="p-2 border-r border-black font-bold text-center w-10">Qty</th>
                <th className="p-2 border-r border-black font-bold text-center w-10">Unit</th>
                <th className="p-2 border-r border-black font-bold text-right w-16">List Price</th>
                <th className="p-2 border-r border-black font-bold text-right w-12">Disc</th>
                <th className="p-2 border-r border-black font-bold text-center w-12">Tax %</th>
                <th className="p-2 font-bold text-right w-20">Amount</th>
              </tr>
            </thead>
            <tbody className="align-top">
              {items.map((item, idx) => (
                <tr key={idx} className="border-b border-black last:border-b-0">
                  <td className="p-2 border-r border-black text-center">{idx + 1}</td>
                  <td className="p-2 border-r border-black">
                    <p className="font-bold">{item.productName}</p>
                    {showProdDescInPrint && item.description && <p className="text-[10px] mt-0.5 whitespace-pre-line">{item.description}</p>}
                  </td>
                  <td className="p-2 border-r border-black text-center">{item.hsnCode || '-'}</td>
                  <td className="p-2 border-r border-black text-center">{item.quantity}</td>
                  <td className="p-2 border-r border-black text-center">{item.unit || 'PCS'}</td>
                  <td className="p-2 border-r border-black text-right">{(item.rate).toFixed(2)}</td>
                  <td className="p-2 border-r border-black text-right">{item.discount || '0'}</td>
                  <td className="p-2 border-r border-black text-center">{item.taxRate}%</td>
                  <td className="p-2 text-right">{(item.total).toFixed(2)}</td>
                </tr>
              ))}
              {/* Filler row to push footer down if items are few */}
              <tr className="h-full border-t border-black">
                <td className="border-r border-black"></td>
                <td className="border-r border-black"></td>
                <td className="border-r border-black"></td>
                <td className="border-r border-black"></td>
                <td className="border-r border-black"></td>
                <td className="border-r border-black"></td>
                <td className="border-r border-black"></td>
                <td className="border-r border-black"></td>
                <td></td>
              </tr>
            </tbody>`;

content = content.replace(tableSearch, tableReplacement);
fs.writeFileSync('src/components/InvoicesView.tsx', content);
console.log('Patched table columns');
