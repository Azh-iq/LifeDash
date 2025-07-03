'use client'

import { useState } from 'react'
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  MetricCard,
  LoadingCard,
  Modal,
  ModalTrigger,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  ConfirmModal,
  ToastContainer,
  useToast,
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonTable,
  SkeletonChart,
  SkeletonList,
  Badge,
  Separator,
  Avatar,
  AvatarGroup,
} from '@/components/ui'

export default function UIDemo() {
  const [loading, setLoading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [inputError, setInputError] = useState('')

  return (
    <ToastContainer>
      <div className="min-h-screen bg-neutral-50 py-8 dark:bg-neutral-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
              LifeDash UI Component Library
            </h1>
            <p className="mt-2 text-neutral-600 dark:text-neutral-400">
              Comprehensive showcase of all available UI components with
              interactive states and animations.
            </p>
          </div>

          <div className="space-y-12">
            {/* Buttons Section */}
            <ComponentSection
              title="Buttons"
              description="Interactive buttons with various states and styles"
            >
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-4">
                  <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                    Variants
                  </h4>
                  <div className="space-y-2">
                    <Button variant="primary">Primary Button</Button>
                    <Button variant="secondary">Secondary Button</Button>
                    <Button variant="destructive">Destructive Button</Button>
                    <Button variant="ghost">Ghost Button</Button>
                    <Button variant="link">Link Button</Button>
                    <Button variant="outline">Outline Button</Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                    Sizes
                  </h4>
                  <div className="space-y-2">
                    <Button size="sm">Small Button</Button>
                    <Button size="default">Default Button</Button>
                    <Button size="lg">Large Button</Button>
                    <Button size="xl">Extra Large</Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                    States
                  </h4>
                  <div className="space-y-2">
                    <Button
                      loading={loading}
                      loadingText="Saving..."
                      onClick={() => {
                        setLoading(true)
                        setTimeout(() => setLoading(false), 2000)
                      }}
                    >
                      Click to Load
                    </Button>
                    <Button disabled>Disabled Button</Button>
                    <Button
                      leftIcon={<span>🚀</span>}
                      rightIcon={<span>→</span>}
                    >
                      With Icons
                    </Button>
                  </div>
                </div>
              </div>
            </ComponentSection>

            {/* Inputs Section */}
            <ComponentSection
              title="Inputs"
              description="Form inputs with validation states and interactive feedback"
            >
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <Input
                    label="Default Input"
                    placeholder="Enter some text..."
                    description="This is a helpful description"
                  />
                  <Input
                    label="Input with Icon"
                    placeholder="Search..."
                    leftIcon={
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
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    }
                  />
                  <Input
                    type="password"
                    label="Password Input"
                    placeholder="Enter password..."
                    showPasswordToggle
                  />
                </div>

                <div className="space-y-4">
                  <Input
                    label="Success State"
                    value="Valid input"
                    success="This input is valid!"
                  />
                  <Input
                    label="Error State"
                    value={inputValue}
                    onChange={e => {
                      setInputValue(e.target.value)
                      setInputError(
                        e.target.value.length < 3
                          ? 'Must be at least 3 characters'
                          : ''
                      )
                    }}
                    error={inputError}
                    placeholder="Type to see validation..."
                  />
                  <Input
                    label="Large Input"
                    size="lg"
                    placeholder="Large size input..."
                  />
                </div>
              </div>
            </ComponentSection>

            {/* Cards Section */}
            <ComponentSection
              title="Cards"
              description="Flexible card components with hover animations"
            >
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card variant="default">
                  <CardHeader>
                    <CardTitle>Default Card</CardTitle>
                    <CardDescription>
                      This is a basic card with default styling and hover
                      effects.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-neutral-600 dark:text-neutral-400">
                      Card content goes here with proper spacing and typography.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button size="sm">Action</Button>
                  </CardFooter>
                </Card>

                <Card variant="interactive">
                  <CardHeader>
                    <CardTitle>Interactive Card</CardTitle>
                    <CardDescription>
                      This card responds to clicks and hover states.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-neutral-600 dark:text-neutral-400">
                      Click me to see the interactive animation effects.
                    </p>
                  </CardContent>
                </Card>

                <MetricCard
                  title="Revenue"
                  value="$124,563"
                  description="Total revenue this month"
                  trend="up"
                  trendValue="+12.5%"
                  icon={
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
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                      />
                    </svg>
                  }
                />
              </div>
            </ComponentSection>

            {/* Modal Section */}
            <ComponentSection
              title="Modals"
              description="Accessible modal dialogs with focus management"
            >
              <div className="flex flex-wrap gap-4">
                <Modal open={modalOpen} onOpenChange={setModalOpen}>
                  <ModalTrigger asChild>
                    <Button>Open Modal</Button>
                  </ModalTrigger>
                  <ModalContent>
                    <ModalHeader>
                      <ModalTitle>Modal Example</ModalTitle>
                      <ModalDescription>
                        This is a modal dialog with proper accessibility
                        features and animations.
                      </ModalDescription>
                    </ModalHeader>
                    <div className="py-4">
                      <p className="text-neutral-600 dark:text-neutral-400">
                        Modal content can include forms, information, or any
                        other UI elements.
                      </p>
                    </div>
                    <ModalFooter>
                      <Button
                        variant="secondary"
                        onClick={() => setModalOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={() => setModalOpen(false)}>
                        Confirm
                      </Button>
                    </ModalFooter>
                  </ModalContent>
                </Modal>

                <Button onClick={() => setConfirmOpen(true)}>
                  Open Confirm Dialog
                </Button>

                <ConfirmModal
                  open={confirmOpen}
                  onOpenChange={setConfirmOpen}
                  title="Confirm Action"
                  description="Are you sure you want to perform this action? This cannot be undone."
                  confirmText="Yes, Continue"
                  cancelText="Cancel"
                  variant="destructive"
                  onConfirm={() => {
                    // Simulate async action
                    return new Promise(resolve => {
                      setTimeout(resolve, 1000)
                    })
                  }}
                />

                <ToastDemo />
              </div>
            </ComponentSection>

            {/* Skeleton Section */}
            <ComponentSection
              title="Skeleton Loaders"
              description="Loading states for better perceived performance"
            >
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-4">
                  <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                    Basic Skeletons
                  </h4>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-8 w-1/2" />
                  <SkeletonAvatar size="lg" />
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                    Text Patterns
                  </h4>
                  <SkeletonText lines={1} />
                  <SkeletonText lines={3} spacing="normal" />
                  <SkeletonText lines={2} spacing="relaxed" />
                </div>

                <div>
                  <h4 className="mb-4 font-medium text-neutral-900 dark:text-neutral-100">
                    Complex Layouts
                  </h4>
                  <SkeletonCard showAvatar showImage={false} lines={2} />
                </div>
              </div>

              <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div>
                  <h4 className="mb-4 font-medium text-neutral-900 dark:text-neutral-100">
                    Table Loading
                  </h4>
                  <SkeletonTable rows={3} columns={4} />
                </div>

                <div>
                  <h4 className="mb-4 font-medium text-neutral-900 dark:text-neutral-100">
                    Chart Loading
                  </h4>
                  <SkeletonChart type="line" height="h-48" />
                </div>
              </div>
            </ComponentSection>

            {/* Badges and Avatars Section */}
            <ComponentSection
              title="Badges & Avatars"
              description="Small UI elements for status and identity"
            >
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div className="space-y-6">
                  <div>
                    <h4 className="mb-4 font-medium text-neutral-900 dark:text-neutral-100">
                      Badges
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      <Badge>Default</Badge>
                      <Badge variant="secondary">Secondary</Badge>
                      <Badge variant="success">Success</Badge>
                      <Badge variant="warning">Warning</Badge>
                      <Badge variant="destructive">Error</Badge>
                      <Badge variant="info">Info</Badge>
                      <Badge variant="outline">Outline</Badge>
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-4 font-medium text-neutral-900 dark:text-neutral-100">
                      Interactive Badges
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        variant="secondary"
                        removable
                        onRemove={() => console.log('Badge removed')}
                      >
                        Removable
                      </Badge>
                      <Badge
                        variant="info"
                        icon={
                          <span className="h-2 w-2 rounded-full bg-blue-400"></span>
                        }
                      >
                        With Icon
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="mb-4 font-medium text-neutral-900 dark:text-neutral-100">
                      Avatars
                    </h4>
                    <div className="flex items-center gap-4">
                      <Avatar size="sm" fallback="JD" />
                      <Avatar size="default" fallback="AS" />
                      <Avatar size="lg" fallback="MJ" />
                      <Avatar size="xl" fallback="LK" />
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-4 font-medium text-neutral-900 dark:text-neutral-100">
                      Avatar Group
                    </h4>
                    <AvatarGroup max={4} size="default">
                      <Avatar fallback="JD" />
                      <Avatar fallback="AS" />
                      <Avatar fallback="MJ" />
                      <Avatar fallback="LK" />
                      <Avatar fallback="RB" />
                      <Avatar fallback="TW" />
                    </AvatarGroup>
                  </div>
                </div>
              </div>
            </ComponentSection>
          </div>
        </div>
      </div>
    </ToastContainer>
  )
}

function ComponentSection({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          {title}
        </h2>
        <p className="mt-1 text-neutral-600 dark:text-neutral-400">
          {description}
        </p>
      </div>
      <Separator />
      <div className="space-y-6">{children}</div>
    </section>
  )
}

function ToastDemo() {
  const { toast } = useToast()

  const showToast = (
    variant: 'default' | 'success' | 'warning' | 'destructive' | 'info'
  ) => {
    const messages = {
      default: {
        title: 'Default Toast',
        description: 'This is a default notification.',
      },
      success: {
        title: 'Success!',
        description: 'Your action was completed successfully.',
      },
      warning: { title: 'Warning', description: 'Please review your input.' },
      destructive: {
        title: 'Error',
        description: 'Something went wrong. Please try again.',
      },
      info: {
        title: 'Information',
        description: "Here's some useful information.",
      },
    }

    toast({
      variant,
      ...messages[variant],
      duration: 3000,
    })
  }

  return (
    <div className="space-x-2">
      <Button
        onClick={() => showToast('default')}
        variant="secondary"
        size="sm"
      >
        Default Toast
      </Button>
      <Button
        onClick={() => showToast('success')}
        variant="secondary"
        size="sm"
      >
        Success Toast
      </Button>
      <Button
        onClick={() => showToast('warning')}
        variant="secondary"
        size="sm"
      >
        Warning Toast
      </Button>
      <Button
        onClick={() => showToast('destructive')}
        variant="secondary"
        size="sm"
      >
        Error Toast
      </Button>
      <Button onClick={() => showToast('info')} variant="secondary" size="sm">
        Info Toast
      </Button>
    </div>
  )
}
