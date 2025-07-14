'use client'

import { useState, useEffect } from 'react'

interface SimpleMapperProps {
  csvHeaders: string[]
  sampleRow: Record<string, any>
  onComplete: (mappings: Record<string, string>) => void
  onCancel: () => void
}

const REQUIRED_FIELDS = [
  'id',
  'booking_date', 
  'portfolio_name',
  'transaction_type',
  'currency',
  'amount'
]

export default function SimpleManualMapper({ csvHeaders, sampleRow, onComplete, onCancel }: SimpleMapperProps) {
  const [mappings, setMappings] = useState<Record<string, string>>({})

  // Prevent any navigation or refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
        e.preventDefault()
        e.stopPropagation()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('keydown', handleKeyDown, true)
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [])

  const handleSelectChange = (field: string, column: string) => {
    console.log('🔧 Mapping:', field, '->', column)
    setMappings(prev => ({ ...prev, [field]: column }))
  }

  const canComplete = REQUIRED_FIELDS.every(field => mappings[field])

  const handleSubmit = () => {
    if (canComplete) {
      console.log('🚀 Submitting mappings:', mappings)
      onComplete(mappings)
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Manual Field Mapping</h2>
      <p>Map CSV columns to required fields:</p>
      
      <div style={{ marginTop: '20px' }}>
        {REQUIRED_FIELDS.map(field => (
          <div key={field} style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              {field}:
            </label>
            <select 
              value={mappings[field] || ''}
              onChange={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleSelectChange(field, e.target.value)
              }}
              style={{ 
                width: '100%', 
                padding: '8px', 
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            >
              <option value="">-- Select Column --</option>
              {csvHeaders.map(header => (
                <option key={header} value={header}>
                  {header}
                </option>
              ))}
            </select>
            {mappings[field] && (
              <div style={{ 
                marginTop: '5px', 
                padding: '5px', 
                backgroundColor: '#f0f0f0',
                fontSize: '12px'
              }}>
                Sample: {String(sampleRow[mappings[field]] || 'N/A')}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: '30px', textAlign: 'right' }}>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onCancel()
          }}
          style={{
            marginRight: '10px',
            padding: '10px 20px',
            border: '1px solid #ccc',
            backgroundColor: 'white',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleSubmit()
          }}
          disabled={!canComplete}
          style={{
            padding: '10px 20px',
            border: 'none',
            backgroundColor: canComplete ? '#6366f1' : '#ccc',
            color: 'white',
            borderRadius: '4px',
            cursor: canComplete ? 'pointer' : 'not-allowed'
          }}
        >
          Continue ({Object.keys(mappings).length}/{REQUIRED_FIELDS.length})
        </button>
      </div>
    </div>
  )
}