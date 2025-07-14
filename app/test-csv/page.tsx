'use client'

import { useState } from 'react'
import SimpleManualMapper from '@/components/stocks/simple-manual-mapper'

const testHeaders = [
  'Id', 
  'Bokføringsdag', 
  'Portefølje', 
  'Transaksjonstype', 
  'Valuta', 
  'Beløp',
  'Verdipapir',
  'ISIN',
  'Antall',
  'Kurs'
]

const testSampleRow = {
  'Id': '123456',
  'Bokføringsdag': '2024-01-15',
  'Portefølje': '55130769',
  'Transaksjonstype': 'Kjøp',
  'Valuta': 'NOK',
  'Beløp': '-28706.04',
  'Verdipapir': 'APPLE INC',
  'ISIN': 'US0378331005',
  'Antall': '100',
  'Kurs': '287.06'
}

export default function TestCSVPage() {
  const [showMapper, setShowMapper] = useState(false)
  const [result, setResult] = useState<any>(null)

  return (
    <div style={{ padding: '20px' }}>
      <h1>Test CSV Mapping (Isolert)</h1>
      
      {!showMapper ? (
        <div>
          <p>Klikk knappen under for å teste manuell mapping:</p>
          <button
            onClick={() => {
              console.log('🔧 Opening mapper...')
              setShowMapper(true)
            }}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            Åpne Manuell Mapping
          </button>
        </div>
      ) : (
        <SimpleManualMapper
          csvHeaders={testHeaders}
          sampleRow={testSampleRow}
          onComplete={(mappings) => {
            console.log('✅ Mappings completed:', mappings)
            setResult(mappings)
            setShowMapper(false)
          }}
          onCancel={() => {
            console.log('❌ Mapping cancelled')
            setShowMapper(false)
          }}
        />
      )}
      
      {result && (
        <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0' }}>
          <h3>Resultat:</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}