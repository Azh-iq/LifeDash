'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ExternalLink, Clock, Filter, Newspaper, TrendingUp, Globe } from 'lucide-react'
import { StockWidget } from '@/components/ui/widget'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatRelativeTime } from '@/lib/utils/format'
import { cn } from '@/lib/utils'
import { type CompanyNews } from '@/lib/utils/finnhub-api'

interface NewsFeedWidgetProps {
  symbol: string
  companyName: string
  news: CompanyNews[]
  loading?: boolean
  error?: string | null
  onRefresh?: () => void
  onLoadMore?: () => void
  hasMore?: boolean
  className?: string
}

const NEWS_CATEGORIES = [
  { value: 'all', label: 'Alle', icon: Globe },
  { value: 'general', label: 'Generelt', icon: Newspaper },
  { value: 'business', label: 'Næringsliv', icon: TrendingUp },
  { value: 'technology', label: 'Teknologi', icon: TrendingUp },
] as const

const SENTIMENT_COLORS = {
  positive: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  negative: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  neutral: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
} as const

const SOURCE_COLORS = {
  'Reuters': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  'Bloomberg': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  'MarketWatch': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  'Yahoo Finance': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  'CNBC': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  'default': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
} as const

function NewsItem({ 
  news, 
  onReadMore 
}: { 
  news: CompanyNews
  onReadMore: (url: string) => void 
}) {
  const [imageError, setImageError] = useState(false)
  
  // Simple sentiment analysis based on keywords
  const sentiment = useMemo(() => {
    const headline = news.headline.toLowerCase()
    const summary = news.summary.toLowerCase()
    const text = `${headline} ${summary}`
    
    const positiveWords = ['up', 'gain', 'rise', 'growth', 'profit', 'strong', 'beat', 'surge', 'boost']
    const negativeWords = ['down', 'fall', 'drop', 'loss', 'weak', 'miss', 'decline', 'crash', 'plunge']
    
    const positiveCount = positiveWords.filter(word => text.includes(word)).length
    const negativeCount = negativeWords.filter(word => text.includes(word)).length
    
    if (positiveCount > negativeCount) return 'positive'
    if (negativeCount > positiveCount) return 'negative'
    return 'neutral'
  }, [news.headline, news.summary])

  const sourceColor = SOURCE_COLORS[news.source as keyof typeof SOURCE_COLORS] || SOURCE_COLORS.default

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="group rounded-lg border border-gray-200 bg-white p-4 transition-all duration-200 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 hover:border-purple-200 dark:hover:border-purple-700"
    >
      <div className="flex gap-3">
        {/* News Image */}
        {news.image && !imageError && (
          <div className="flex-shrink-0">
            <img
              src={news.image}
              alt={news.headline}
              className="h-16 w-16 rounded-lg object-cover"
              onError={() => setImageError(true)}
            />
          </div>
        )}

        {/* News Content */}
        <div className="flex-1 space-y-2">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn('text-xs', sourceColor)}>
                {news.source}
              </Badge>
              <Badge
                variant="outline"
                className={cn('text-xs', SENTIMENT_COLORS[sentiment])}
              >
                {sentiment === 'positive' ? 'Positiv' : 
                 sentiment === 'negative' ? 'Negativ' : 'Nøytral'}
              </Badge>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <Clock className="h-3 w-3" />
              {formatRelativeTime(new Date(news.datetime * 1000))}
            </div>
          </div>

          {/* Headline */}
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
            {news.headline}
          </h3>

          {/* Summary */}
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
            {news.summary}
          </p>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {news.category}
              </Badge>
              {news.related && (
                <Badge variant="outline" className="text-xs">
                  Relatert: {news.related}
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onReadMore(news.url)}
              className="h-7 px-2 text-xs opacity-0 transition-opacity group-hover:opacity-100"
            >
              Les mer
              <ExternalLink className="ml-1 h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export function NewsFeedWidget({
  symbol,
  companyName,
  news = [],
  loading = false,
  error = null,
  onRefresh,
  onLoadMore,
  hasMore = false,
  className,
}: NewsFeedWidgetProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)

  const filteredNews = useMemo(() => {
    let filtered = news

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        item =>
          item.headline.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.summary.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory)
    }

    // Sort by date (newest first)
    return filtered.sort((a, b) => b.datetime - a.datetime)
  }, [news, searchTerm, selectedCategory])

  const handleReadMore = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    setShowFilters(false)
  }

  return (
    <StockWidget
      title={`Nyheter - ${symbol}`}
      description={`Siste nyheter om ${companyName}`}
      icon={<Newspaper className="h-5 w-5" />}
      size="medium"
      loading={loading}
      error={error}
      onRefresh={onRefresh}
      className={cn('min-h-[600px]', className)}
      refreshLabel="Oppdater nyheter"
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant={showFilters ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="h-8 px-2 text-xs"
          >
            <Filter className="h-3 w-3" />
            {showFilters ? 'Skjul' : 'Filter'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-3 border-b border-gray-200 pb-4 dark:border-gray-700"
            >
              {/* Search */}
              <div className="relative">
                <Input
                  placeholder="Søk i nyheter..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>

              {/* Category Filters */}
              <div className="flex flex-wrap gap-2">
                {NEWS_CATEGORIES.map(category => (
                  <Button
                    key={category.value}
                    variant={selectedCategory === category.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleCategoryChange(category.value)}
                    className="h-7 px-3 text-xs"
                  >
                    <category.icon className="mr-1 h-3 w-3" />
                    {category.label}
                  </Button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* News Stats */}
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>
            {filteredNews.length} {filteredNews.length === 1 ? 'nyhet' : 'nyheter'}
            {searchTerm && ` (filtrert på "${searchTerm}")`}
          </span>
          <span>
            Oppdatert: {formatRelativeTime(new Date())}
          </span>
        </div>

        {/* News Feed */}
        {filteredNews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Newspaper className="h-12 w-12 text-gray-400 dark:text-gray-600" />
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm || selectedCategory !== 'all' 
                ? 'Ingen nyheter funnet med gjeldende filter'
                : 'Ingen nyheter tilgjengelig'}
            </p>
            {(searchTerm || selectedCategory !== 'all') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('')
                  setSelectedCategory('all')
                }}
                className="mt-2"
              >
                Fjern filter
              </Button>
            )}
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              <AnimatePresence>
                {filteredNews.map((item, index) => (
                  <NewsItem
                    key={`${item.id}-${index}`}
                    news={item}
                    onReadMore={handleReadMore}
                  />
                ))}
              </AnimatePresence>

              {/* Load More */}
              {hasMore && (
                <div className="flex justify-center pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onLoadMore}
                    disabled={loading}
                    className="h-8 px-6 text-xs"
                  >
                    {loading ? 'Laster...' : 'Last flere nyheter'}
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </div>
    </StockWidget>
  )
}