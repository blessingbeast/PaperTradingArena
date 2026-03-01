const https = require('https');

// We will test if NSE options can be fetched in batch via v7 quote endpoint
const symbols = "NIFTY26FEB27C00022000.NS,NIFTY240321C22000.NS,RELIANCE.NS";

https.get(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}`, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            console.log(JSON.stringify(JSON.parse(data), null, 2));
        } catch (e) {
            console.log("Raw Data:", data.substring(0, 500));
        }
    });
}).on('error', err => console.error(err));
