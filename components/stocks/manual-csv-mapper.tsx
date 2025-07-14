'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Check, X, ArrowDown, FileText } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface CSVPreviewData {
  headers: string[]
  rows: Record<string, any>[]
  totalRows: number
}

interface FieldMapping {
  csvColumn: string
  internalField: string
  required: boolean
  dataType: 'string' | 'number' | 'date' | 'currency'
}

interface ManualCSVMapperProps {
  csvData: CSVPreviewData
  onMappingComplete: (mappings: FieldMapping[]) => void
  onCancel: () => void
}

const REQUIRED_FIELDS: Array<{
  field: string
  label: string
  description: string
  dataType: 'string' | 'number' | 'date' | 'currency'
  required: boolean
}> = [
  { field: 'id', label: 'Transaksjons-ID', description: 'Unik identifikator for transaksjonen', dataType: 'string', required: true },
  { field: 'booking_date', label: 'Bokføringsdato', description: 'Dato transaksjonen ble bokført', dataType: 'date', required: true },
  { field: 'portfolio_name', label: 'Portefølje', description: 'Navnet/ID på porteføljen', dataType: 'string', required: true },
  { field: 'transaction_type', label: 'Transaksjonstype', description: 'Type transaksjon (kjøp, salg, utbytte, etc.)', dataType: 'string', required: true },
  { field: 'currency', label: 'Valuta', description: 'Valutakode (NOK, USD, EUR, etc.)', dataType: 'currency', required: true },
  { field: 'amount', label: 'Beløp', description: 'Transaksjonsbeløp', dataType: 'number', required: true },
  { field: 'security_name', label: 'Verdipapir', description: 'Navn på aksje/verdipapir', dataType: 'string', required: false },
  { field: 'isin', label: 'ISIN', description: 'ISIN-kode for verdipapir', dataType: 'string', required: false },
  { field: 'quantity', label: 'Antall', description: 'Antall aksjer/enheter', dataType: 'number', required: false },
  { field: 'price', label: 'Kurs', description: 'Pris per aksje/enhet', dataType: 'number', required: false },
  { field: 'total_fees', label: 'Avgifter', description: 'Totale avgifter og kostnader', dataType: 'number', required: false },
  { field: 'commission', label: 'Kurtasje', description: 'Megleravgift', dataType: 'number', required: false },
]

export default function ManualCSVMapper({ csvData, onMappingComplete, onCancel }: ManualCSVMapperProps) {
  const [mappings, setMappings] = useState<Record<string, string>>({})
  const [previewIndex, setPreviewIndex] = useState(0)

  const handleMappingChange = (internalField: string, csvColumn: string) => {
    console.log('🔧 Mapping change:', internalField, '->', csvColumn)
    setMappings(prev => ({
      ...prev,
      [internalField]: csvColumn === 'none' ? '' : csvColumn
    }))
  }

  // Prevent any event bubbling to parent
  const stopAllEvents = (e: React.SyntheticEvent) => {
    e.preventDefault()
    e.stopPropagation()
    e.stopImmediatePropagation()
  }

  const getValidationStatus = () => {
    const requiredFields = REQUIRED_FIELDS.filter(f => f.required)
    const mappedRequired = requiredFields.filter(f => mappings[f.field] && mappings[f.field] !== '')
    return {
      isValid: mappedRequired.length === requiredFields.length,
      mappedCount: mappedRequired.length,
      requiredCount: requiredFields.length
    }
  }

  const handleComplete = (e?: React.FormEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    
    const fieldMappings: FieldMapping[] = REQUIRED_FIELDS
      .filter(field => mappings[field.field] && mappings[field.field] !== '')
      .map(field => ({
        csvColumn: mappings[field.field],
        internalField: field.field,
        required: field.required,
        dataType: field.dataType
      }))

    onMappingComplete(fieldMappings)
  }

  const validation = getValidationStatus()
  const previewRow = csvData.rows[previewIndex] || {}

  return (
    <div 
      onClick={stopAllEvents}
      onSubmit={stopAllEvents}
      className="space-y-6"
    >
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Manuell CSV Feltmapping
          </CardTitle>
          <CardDescription>
            Map CSV-kolonner til interne felter. {csvData.totalRows} rader oppdaget.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Validation Status */}
      <Alert>
        <AlertDescription>
          <div className="flex items-center justify-between">
            <span>
              Obligatoriske felter: {validation.mappedCount} av {validation.requiredCount} mappet
            </span>
            {validation.isValid ? (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <Check className="mr-1 h-3 w-3" />
                Klar for import
              </Badge>
            ) : (
              <Badge variant="destructive">
                <X className="mr-1 h-3 w-3" />
                Mangler {validation.requiredCount - validation.mappedCount} felt(er)
              </Badge>
            )}
          </div>
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mapping Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Feltmapping</CardTitle>
            <CardDescription>
              Velg hvilken CSV-kolonne som skal mappes til hvert felt
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {REQUIRED_FIELDS.map((field) => (
              <div key={field.field} className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <Badge variant="outline" className="text-xs">
                    {field.dataType}
                  </Badge>
                </div>
                <Select
                  value={mappings[field.field] || 'none'}
                  onValueChange={(value) => {
                    console.log('🔧 Select change triggered:', field.field, value)
                    handleMappingChange(field.field, value)
                  }}
                >
                  <SelectTrigger onClick={stopAllEvents}>
                    <SelectValue placeholder="Velg CSV-kolonne..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- Ikke mapp --</SelectItem>
                    {csvData.headers.map((header) => (
                      <SelectItem key={header} value={header}>
                        {header}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">{field.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Data Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Forhåndsvisning</CardTitle>
            <CardDescription>
              Se hvordan dataene blir mappet (rad {previewIndex + 1} av {csvData.totalRows})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Row Selector */}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    stopAllEvents(e)
                    console.log('🔧 Forrige button clicked, current index:', previewIndex)
                    setPreviewIndex(Math.max(0, previewIndex - 1))
                  }}
                  disabled={previewIndex === 0}
                >
                  ← Forrige
                </Button>
                <span className="text-sm">
                  Rad {previewIndex + 1} av {csvData.totalRows}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    stopAllEvents(e)
                    console.log('🔧 Neste button clicked, current index:', previewIndex)
                    setPreviewIndex(Math.min(csvData.totalRows - 1, previewIndex + 1))
                  }}
                  disabled={previewIndex === csvData.totalRows - 1}
                >
                  Neste →
                </Button>
              </div>

              {/* Preview Table */}
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Felt</TableHead>
                      <TableHead>CSV Kolonne</TableHead>
                      <TableHead>Verdi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {REQUIRED_FIELDS.filter(field => mappings[field.field]).map((field) => {
                      const csvColumn = mappings[field.field]
                      const value = previewRow[csvColumn] || ''
                      
                      return (
                        <TableRow key={field.field}>
                          <TableCell className="font-medium">
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{csvColumn}</Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {value ? (
                              <span className="font-mono text-sm">{String(value)}</span>
                            ) : (
                              <span className="text-gray-400 italic">tom</span>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Raw CSV Headers */}
      <Card>
        <CardHeader>
          <CardTitle>Tilgjengelige CSV-kolonner</CardTitle>
          <CardDescription>
            Alle kolonner i CSV-filen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {csvData.headers.map((header, index) => {
              const isUsed = Object.values(mappings).includes(header)
              return (
                <Badge 
                  key={index} 
                  variant={isUsed ? "default" : "outline"}
                  className={isUsed ? "bg-blue-100 text-blue-800" : ""}
                >
                  {header}
                </Badge>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button 
          type="button"
          variant="outline" 
          onClick={(e) => {
            stopAllEvents(e)
            console.log('🔧 Avbryt button clicked')
            onCancel()
          }}
        >
          Avbryt
        </Button>
        <Button 
          type="button"
          onClick={(e) => {
            stopAllEvents(e)
            console.log('🔧 Fortsett button clicked, validation:', validation)
            handleComplete(e)
          }}
          disabled={!validation.isValid}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Check className="mr-2 h-4 w-4" />
          Fortsett med Import ({validation.mappedCount}/{validation.requiredCount})
        </Button>
      </div>
    </div>
  )
}