'use client'

import { useState, useEffect } from 'react'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
} from '@/components/ui/modal'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import PlatformCard, { Platform } from './platform-card'
import PlatformForm from './platform-form'
import AccountCard, { Account } from './account-card'
import AccountForm from './account-form'
import {
  getPlatforms,
  getAccounts,
  deleteAccount,
} from '@/lib/actions/platforms/crud'

interface PlatformManagementModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  initialTab?: 'platforms' | 'accounts'
}

export default function PlatformManagementModal({
  open,
  onOpenChange,
  userId,
  initialTab = 'accounts',
}: PlatformManagementModalProps) {
  const [activeTab, setActiveTab] = useState(initialTab)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Platforms state
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [editingPlatform, setEditingPlatform] = useState<Platform | null>(null)
  const [showPlatformForm, setShowPlatformForm] = useState(false)

  // Accounts state
  const [accounts, setAccounts] = useState<Account[]>([])
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [showAccountForm, setShowAccountForm] = useState(false)

  useEffect(() => {
    if (open) {
      loadData()
      setActiveTab(initialTab)
    }
  }, [open, initialTab])

  useEffect(() => {
    if (open && activeTab === 'platforms') {
      loadPlatforms()
    } else if (open && activeTab === 'accounts') {
      loadAccounts()
    }
  }, [open, activeTab])

  const loadData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      await Promise.all([loadPlatforms(), loadAccounts()])
    } catch (err) {
      setError('Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  const loadPlatforms = async () => {
    try {
      const result = await getPlatforms()
      if (result.success) {
        setPlatforms(result.data || [])
      } else {
        setError(result.error || 'Failed to load platforms')
      }
    } catch (err) {
      setError('Failed to load platforms')
    }
  }

  const loadAccounts = async () => {
    try {
      const result = await getAccounts(userId)
      if (result.success) {
        setAccounts(result.data || [])
      } else {
        setError(result.error || 'Failed to load accounts')
      }
    } catch (err) {
      setError('Failed to load accounts')
    }
  }

  // Platform handlers
  const handleCreatePlatform = () => {
    setEditingPlatform(null)
    setShowPlatformForm(true)
  }

  const handleEditPlatform = (platform: Platform) => {
    setEditingPlatform(platform)
    setShowPlatformForm(true)
  }

  const handlePlatformSuccess = (platform: Platform) => {
    setShowPlatformForm(false)
    setEditingPlatform(null)
    loadPlatforms()
  }

  const handlePlatformCancel = () => {
    setShowPlatformForm(false)
    setEditingPlatform(null)
  }

  // Account handlers
  const handleCreateAccount = () => {
    setEditingAccount(null)
    setShowAccountForm(true)
  }

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account)
    setShowAccountForm(true)
  }

  const handleDeleteAccount = async (accountId: string) => {
    try {
      const result = await deleteAccount(accountId)
      if (result.success) {
        loadAccounts()
      } else {
        setError(result.error || 'Failed to delete account')
      }
    } catch (err) {
      setError('Failed to delete account')
    }
  }

  const handleAccountSuccess = (account: Account) => {
    setShowAccountForm(false)
    setEditingAccount(null)
    loadAccounts()
  }

  const handleAccountCancel = () => {
    setShowAccountForm(false)
    setEditingAccount(null)
  }

  // Group accounts by platform
  const accountsByPlatform = accounts.reduce(
    (groups, account) => {
      const platformName = account.platform.display_name
      if (!groups[platformName]) {
        groups[platformName] = []
      }
      groups[platformName].push(account)
      return groups
    },
    {} as Record<string, Account[]>
  )

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size="xl" className="max-h-[90vh] overflow-hidden">
        <ModalHeader>
          <ModalTitle>Platform & Account Management</ModalTitle>
          <ModalDescription>
            Manage your investment platforms and accounts
          </ModalDescription>
        </ModalHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex h-full flex-col"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger
                value="accounts"
                className="flex items-center space-x-2"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <span>Accounts ({accounts.length})</span>
              </TabsTrigger>
              <TabsTrigger
                value="platforms"
                className="flex items-center space-x-2"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                <span>Platforms ({platforms.length})</span>
              </TabsTrigger>
            </TabsList>

            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="flex items-center">
                  <svg
                    className="mr-2 h-5 w-5 text-red-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 14.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                  <p className="text-sm text-red-800">{error}</p>
                  <button
                    onClick={() => setError(null)}
                    className="ml-auto text-red-400 hover:text-red-600"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            <TabsContent value="accounts" className="flex-1 overflow-hidden">
              <div className="flex h-full flex-col">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Investment Accounts
                    </h3>
                    <p className="text-sm text-gray-600">
                      Manage your investment accounts across different platforms
                    </p>
                  </div>
                  <Button
                    onClick={handleCreateAccount}
                    className="bg-blue-600 text-white hover:bg-blue-700"
                  >
                    <svg
                      className="mr-2 h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Add Account
                  </Button>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {showAccountForm ? (
                    <AccountForm
                      account={editingAccount || undefined}
                      userId={userId}
                      onSuccess={handleAccountSuccess}
                      onCancel={handleAccountCancel}
                    />
                  ) : (
                    <div className="space-y-6">
                      {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                          <span className="ml-2 text-gray-600">
                            Loading accounts...
                          </span>
                        </div>
                      ) : accounts.length === 0 ? (
                        <div className="py-12 text-center">
                          <svg
                            className="mx-auto mb-4 h-16 w-16 text-gray-300"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                          </svg>
                          <h3 className="mb-2 text-lg font-semibold text-gray-900">
                            No accounts yet
                          </h3>
                          <p className="mb-4 text-gray-600">
                            Add your first investment account to get started
                          </p>
                          <Button
                            onClick={handleCreateAccount}
                            className="bg-blue-600 text-white hover:bg-blue-700"
                          >
                            Add Your First Account
                          </Button>
                        </div>
                      ) : (
                        Object.entries(accountsByPlatform).map(
                          ([platformName, platformAccounts]) => (
                            <div key={platformName}>
                              <div className="mb-4 flex items-center space-x-2">
                                <h4 className="text-md font-semibold text-gray-800">
                                  {platformName}
                                </h4>
                                <Badge variant="outline" className="text-xs">
                                  {platformAccounts.length} account
                                  {platformAccounts.length !== 1 ? 's' : ''}
                                </Badge>
                              </div>
                              <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
                                {platformAccounts.map(account => (
                                  <AccountCard
                                    key={account.id}
                                    account={account}
                                    onEdit={handleEditAccount}
                                    onDelete={handleDeleteAccount}
                                    showPlatform={false}
                                  />
                                ))}
                              </div>
                            </div>
                          )
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="platforms" className="flex-1 overflow-hidden">
              <div className="flex h-full flex-col">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Investment Platforms
                    </h3>
                    <p className="text-sm text-gray-600">
                      Configure brokers, banks, and other financial platforms
                    </p>
                  </div>
                  <Button
                    onClick={handleCreatePlatform}
                    className="bg-blue-600 text-white hover:bg-blue-700"
                  >
                    <svg
                      className="mr-2 h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Add Platform
                  </Button>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {showPlatformForm ? (
                    <PlatformForm
                      platform={editingPlatform || undefined}
                      onSuccess={handlePlatformSuccess}
                      onCancel={handlePlatformCancel}
                    />
                  ) : (
                    <div className="space-y-4">
                      {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                          <span className="ml-2 text-gray-600">
                            Loading platforms...
                          </span>
                        </div>
                      ) : platforms.length === 0 ? (
                        <div className="py-12 text-center">
                          <svg
                            className="mx-auto mb-4 h-16 w-16 text-gray-300"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                            />
                          </svg>
                          <h3 className="mb-2 text-lg font-semibold text-gray-900">
                            No platforms configured
                          </h3>
                          <p className="mb-4 text-gray-600">
                            Add platforms to organize your investment accounts
                          </p>
                          <Button
                            onClick={handleCreatePlatform}
                            className="bg-blue-600 text-white hover:bg-blue-700"
                          >
                            Add Your First Platform
                          </Button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                          {platforms.map(platform => (
                            <PlatformCard
                              key={platform.id}
                              platform={platform}
                              onEdit={handleEditPlatform}
                              canEdit={true}
                              canDelete={false} // Disable deletion for now to prevent data integrity issues
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </ModalContent>
    </Modal>
  )
}
