const https = require('https');

const req = https.request({
  hostname: 'localhost',
  port: 5000,
  path: '/api/users',
  method: 'GET',
  rejectUnauthorized: false
}, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(data.substring(0, 100)));
});
req.on('error', e => console.error(e));
req.end();
