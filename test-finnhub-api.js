// Simple test script to verify Finnhub API
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testFinnhubAPI() {
  // Use demo API key for testing
  const apiKey = 'demo';
  const symbols = ['EQNR.OL', 'DNB.OL', 'AAPL', 'TSLA'];
  
  console.log('Testing Finnhub API...');
  console.log('API Key:', apiKey);
  
  for (const symbol of symbols) {
    try {
      const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`;
      console.log(`\n--- Testing ${symbol} ---`);
      console.log('URL:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error('HTTP Error:', response.status, response.statusText);
        continue;
      }
      
      const data = await response.json();
      console.log('API Response:', JSON.stringify(data, null, 2));
      
      if (data.c && data.c > 0) {
        console.log(`✅ ${symbol}:`);
        console.log(`  Current Price: ${data.c}`);
        console.log(`  Change: ${data.d} (${data.dp}%)`);
        console.log(`  High: ${data.h}`);
        console.log(`  Low: ${data.l}`);
        console.log(`  Open: ${data.o}`);
        console.log(`  Previous Close: ${data.pc}`);
      } else {
        console.log(`❌ ${symbol}: No valid data received`);
      }
      
      // Add delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ Error testing ${symbol}:`, error.message);
    }
  }
}

testFinnhubAPI();