const https = require('https');
const fs = require('fs');

https.get('https://raw.githubusercontent.com/kprohith/nse-stock-analysis/master/ind_nifty500list.csv', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const lines = data.split(/\r?\n/);
        const stocks = [];

        // Skip header line
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // Parse CSV line properly considering quotes
            const parts = line.split(',');
            if (parts.length >= 3) {
                // Find the index of EQ series, which is usually the second to last or third to last
                // Actually, the format is Company Name,Industry,Symbol,Series,ISIN Code
                // Because Company Name might have commas, we can work backwards from the end
                // [.., Symbol, Series, ISIN]
                const symbol = parts[parts.length - 3];
                const series = parts[parts.length - 2];
                const isin = parts[parts.length - 1];

                // Extract name by joining all parts before the symbol
                let name = parts.slice(0, parts.length - 4).join(',');

                // Remove surrounding quotes if any
                if (name && name.startsWith('"') && name.endsWith('"')) {
                    name = name.slice(1, -1);
                }

                if (symbol && symbol !== 'Symbol') {
                    stocks.push({
                        symbol: symbol.trim(),
                        name: name ? name.trim() : symbol.trim(),
                        exchange: 'NSE'
                    });
                }
            }
        }

        // Also ensure some popular indices are there
        stocks.unshift({ symbol: 'NIFTY', name: 'Nifty 50', exchange: 'NSE' });
        stocks.unshift({ symbol: 'BANKNIFTY', name: 'Bank Nifty', exchange: 'NSE' });

        fs.writeFileSync('src/data/stocks.json', JSON.stringify(stocks, null, 2));
        console.log('Successfully updated stocks.json with total:', stocks.length, 'stocks');
    });
}).on('error', (err) => {
    console.error('Error fetching CSV:', err.message);
});
