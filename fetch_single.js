const https = require('https');

const tickers = [
    "NIFTY260305C00025350.NS", // Our generated format
    "^NSEI",                  // To check if rate limited overall
    "RELIANCE.NS"
];

tickers.forEach(ticker => {
    https.get(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            console.log(`[${ticker}] HTTP ${res.statusCode}: ${data.substring(0, 100)}`);
        });
    }).on('error', err => console.error(err));
});
