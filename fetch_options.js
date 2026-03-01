const https = require('https');

https.get('https://query1.finance.yahoo.com/v7/finance/options/^NSEI', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const parsed = JSON.parse(data);
            const options = parsed.optionChain.result[0].options[0];
            const calls = options.calls.slice(0, 3);
            console.log(JSON.stringify(calls, null, 2));
        } catch (e) {
            console.error("Parse error:", e.message);
            console.log("Raw Data preview:", data.substring(0, 500));
        }
    });
}).on('error', err => console.error(err));
