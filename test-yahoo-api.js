// Simple test script to verify Yahoo Finance API
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testYahooAPI() {
  const symbols = ['EQNR.OL', 'DNB.OL', 'AAPL'];
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols.join(',')}`;
  
  console.log('Testing Yahoo Finance API...');
  console.log('URL:', url);
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error('HTTP Error:', response.status, response.statusText);
      return;
    }
    
    const data = await response.json();
    console.log('API Response:', JSON.stringify(data, null, 2));
    
    if (data.quoteResponse && data.quoteResponse.result) {
      console.log('\n=== Parsed Stock Data ===');
      data.quoteResponse.result.forEach(quote => {
        console.log(`${quote.symbol}:`);
        console.log(`  Price: ${quote.regularMarketPrice} ${quote.currency}`);
        console.log(`  Change: ${quote.regularMarketChange} (${quote.regularMarketChangePercent}%)`);
        console.log(`  Market State: ${quote.marketState}`);
        console.log(`  Volume: ${quote.regularMarketVolume}`);
        console.log('');
      });
    } else {
      console.log('No quote results found');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testYahooAPI();