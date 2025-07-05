'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  connectPlatformCSV,
  connectPlatformAPI,
} from '@/lib/actions/platforms/setup'

interface Platform {
  id: string
  name: string
  description: string
  connectionTypes: string[]
  logo: string
}

interface ConnectionModalProps {
  platform: Platform
  onClose: () => void
  onSuccess: () => void
}

function CSVUploadModal({
  platform,
  onClose,
  onSuccess,
}: ConnectionModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile)
    }
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    setDragOver(false)

    const droppedFile = event.dataTransfer.files[0]
    if (droppedFile && droppedFile.type === 'text/csv') {
      setFile(droppedFile)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)

    try {
      // In a real implementation, you would upload the file first
      // For now, we'll simulate the upload and connection process
      const result = await connectPlatformCSV({
        platformId: platform.id,
        fileName: file.name,
        fileSize: file.size,
      })

      if (result.success) {
        onSuccess()
      } else {
        console.error('CSV upload failed:', result.error)
        // Handle error - you might want to show a toast or error message
      }
    } catch (error) {
      console.error('Upload error:', error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-2xl">
          {platform.logo}
        </div>
        <h3 className="mb-2 text-xl font-bold text-gray-900">
          Last opp {platform.name} CSV
        </h3>
        <p className="text-gray-600">
          Last opp en CSV-fil med dine transaksjoner fra {platform.name}
        </p>
      </div>

      {/* File Upload Area */}
      <div
        className={`
          rounded-xl border-2 border-dashed p-8 text-center transition-colors duration-200
          ${
            dragOver
              ? 'border-blue-400 bg-blue-50'
              : file
                ? 'border-green-400 bg-green-50'
                : 'border-gray-300 bg-gray-50'
          }
        `}
        onDragOver={e => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {file ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="space-y-3"
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
              <svg
                className="h-6 w-6 text-green-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414L10 14.414l-3.707-3.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900">{file.name}</p>
              <p className="text-sm text-gray-600">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFile(null)}
              className="text-red-600 hover:text-red-700"
            >
              Fjern fil
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-gray-200">
              <svg
                className="h-6 w-6 text-gray-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414L10 14.414l-3.707-3.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-700">
                Dra og slipp CSV-fil her
              </p>
              <p className="text-sm text-gray-500">
                eller klikk for å velge fil
              </p>
            </div>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
              id="csv-upload"
            />
            <label htmlFor="csv-upload">
              <Button variant="outline" className="cursor-pointer" asChild>
                <span>Velg fil</span>
              </Button>
            </label>
          </div>
        )}
      </div>

      {/* Sample File Link */}
      <div className="rounded-lg bg-blue-50 p-4 text-center">
        <p className="mb-2 text-sm text-blue-700">
          Trenger du hjelp med CSV-formatet?
        </p>
        <Button variant="link" size="sm" className="text-blue-600">
          Last ned eksempel-fil
        </Button>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between space-x-4">
        <Button variant="outline" onClick={onClose} className="flex-1">
          Avbryt
        </Button>
        <Button
          onClick={handleUpload}
          disabled={!file || uploading}
          loading={uploading}
          loadingText="Laster opp..."
          className="flex-1"
        >
          Last opp
        </Button>
      </div>
    </div>
  )
}

function OAuth2Modal({ platform, onClose, onSuccess }: ConnectionModalProps) {
  const [connecting, setConnecting] = useState(false)
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  })

  const handleConnect = async () => {
    setConnecting(true)

    try {
      // Connect to platform using API credentials
      const result = await connectPlatformAPI({
        platformId: platform.id,
        credentials: {
          username: credentials.username,
          password: credentials.password,
        },
      })

      if (result.success) {
        onSuccess()
      } else {
        console.error('API connection failed:', result.error)
        // Handle error - you might want to show a toast or error message
      }
    } catch (error) {
      console.error('Connection error:', error)
    } finally {
      setConnecting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-2xl">
          {platform.logo}
        </div>
        <h3 className="mb-2 text-xl font-bold text-gray-900">
          Koble til {platform.name}
        </h3>
        <p className="text-gray-600">
          Logg inn med dine {platform.name} legitimasjon for å gi LifeDash
          tilgang til dine investeringsdata
        </p>
      </div>

      {/* Security Notice */}
      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
        <div className="flex items-start space-x-3">
          <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-4 w-4 text-green-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-green-800">
              Sikker tilkobling
            </p>
            <p className="mt-1 text-xs text-green-700">
              Dine legitimasjon sendes direkte til {platform.name} via en
              kryptert forbindelse. LifeDash lagrer aldri ditt passord.
            </p>
          </div>
        </div>
      </div>

      {/* Login Form */}
      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Brukernavn / E-post
          </label>
          <Input
            type="text"
            value={credentials.username}
            onChange={e =>
              setCredentials(prev => ({ ...prev, username: e.target.value }))
            }
            placeholder={`Din bruker hos ${platform.name}`}
            className="w-full"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Passord
          </label>
          <Input
            type="password"
            value={credentials.password}
            onChange={e =>
              setCredentials(prev => ({ ...prev, password: e.target.value }))
            }
            placeholder="Ditt passord"
            className="w-full"
          />
        </div>
      </div>

      {/* OAuth Flow Info */}
      <div className="rounded-lg bg-blue-50 p-4">
        <h4 className="mb-2 text-sm font-medium text-blue-900">
          Hva skjer når du kobler til?
        </h4>
        <ol className="space-y-1 text-xs text-blue-700">
          <li>
            1. Du blir videresendt til {platform.name}s sikre påloggingsside
          </li>
          <li>2. Du godkjenner tilgang til dine investeringsdata</li>
          <li>3. LifeDash får tilgang til å lese dine porteføljedata</li>
          <li>4. Du kan koble fra når som helst</li>
        </ol>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between space-x-4">
        <Button variant="outline" onClick={onClose} className="flex-1">
          Avbryt
        </Button>
        <Button
          onClick={handleConnect}
          disabled={
            !credentials.username || !credentials.password || connecting
          }
          loading={connecting}
          loadingText="Kobler til..."
          className="flex-1"
        >
          Koble til
        </Button>
      </div>
    </div>
  )
}

export function ConnectionModal({
  platform,
  onClose,
  onSuccess,
}: ConnectionModalProps) {
  const hasCSV = platform.connectionTypes.includes('csv')
  const hasAPI = platform.connectionTypes.includes('api')

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-2xl"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200"
          >
            <svg
              className="h-4 w-4 text-gray-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {/* Modal Content */}
          {hasCSV && platform.id === 'nordnet' && (
            <CSVUploadModal
              platform={platform}
              onClose={onClose}
              onSuccess={onSuccess}
            />
          )}

          {hasAPI && platform.id !== 'nordnet' && (
            <OAuth2Modal
              platform={platform}
              onClose={onClose}
              onSuccess={onSuccess}
            />
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
