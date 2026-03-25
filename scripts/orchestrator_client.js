const https = require('https');

function callByUrl(url, payload) {
  const data = JSON.stringify(payload);
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
      'Content-Length': Buffer.byteLength(data)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      if ((res.statusCode === 302 || res.statusCode === 301) && res.headers.location) {
        https.get(res.headers.location, (redirectRes) => {
          let body = '';
          redirectRes.on('data', chunk => body += chunk);
          redirectRes.on('end', () => {
            try { resolve(JSON.parse(body)); } 
            catch (e) { resolve(body); }
          });
        }).on('error', reject);
        return;
      }
      
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } 
        catch (e) { resolve(body); }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function run() {
  const url = 'https://script.google.com/macros/s/AKfycbyfPJqKphhEhdjd1NWa4mDG3D_hwE_H2dalTPsCDzMp6qMB10vDurTMgxKSWSbKlG15/exec';
  const token = 'PROTON-77-X';
  const args = process.argv.slice(2);
  const subAction = args[0];

  if (!subAction) {
    console.log('Usage: node orchestrator_client.js <subAction> <table> <params...>');
    console.log('Actions: READ_RAW, UPDATE_FIELD, APPEND_ROW, DELETE_ROW');
    return;
  }

  const payload = { action: 'orchestrate', token, subAction, table: args[1] };
  
  if (subAction === 'READ_RAW') {
    payload.tenantID = args[2] || 'GLOBAL';
  } else if (subAction === 'UPDATE_FIELD') {
    payload.idKey = args[2];
    payload.idValue = args[3];
    payload.field = args[4];
    payload.value = args[5];
  } else if (subAction === 'APPEND_ROW') {
    // Expects JSON string as 3rd argument: '{"id": "...", "name": "..."}'
    try { payload.rowData = JSON.parse(args[2]); } 
    catch(e) { console.error('Error: rowData must be a valid JSON string'); return; }
  } else if (subAction === 'DELETE_ROW') {
    payload.idKey = args[2];
    payload.idValue = args[3];
  }

  try {
    const res = await callByUrl(url, payload);
    console.log(JSON.stringify(res, null, 2));
  } catch (e) {
    console.error('Error:', e.message);
  }
}

run();
