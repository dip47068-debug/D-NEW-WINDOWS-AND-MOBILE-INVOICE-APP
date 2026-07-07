const fetch = require('node-fetch'); // wait, fetch is built-in to node 18+
async function test() {
  const url = 'http://localhost:3000/api/gemini/generate';
  const headers = { 'Content-Type': 'application/json' };
  
  console.log("Testing chat...");
  const chatRes = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ action: 'chat', history: [{ role: 'user', parts: [{ text: 'Hello' }] }] })
  });
  console.log("Chat status:", chatRes.status, await chatRes.json());
  
  console.log("Testing expand-description...");
  const expRes = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ action: 'expand-description', prompt: 'Laptop' })
  });
  console.log("Expand status:", expRes.status, await expRes.json());
}
test();
