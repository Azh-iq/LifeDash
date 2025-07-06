'use client';

import { memo, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/cn';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Percent, 
  Target, 
  Calendar,
  PieChart,
  BarChart3,
  Activity,
  Clock
} from 'lucide-react';

interface MetricData {
  id: string;
  title: string;
  value: number | string;
  change?: number;
  changeType?: 'percentage' | 'currency' | 'number';
  period?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ElementType;
  color?: 'green' | 'red' | 'blue' | 'purple' | 'orange' | 'gray';
  format?: 'currency' | 'percentage' | 'number' | 'text';
  subtitle?: string;
  target?: number;
  isLoading?: boolean;
}

interface MobileMetricCardsProps {
  metrics: MetricData[];
  layout?: 'grid' | 'carousel' | 'stack';
  compact?: boolean;
  showTrends?: boolean;
  showTargets?: boolean;
  className?: string;
}

const iconMap = {
  DollarSign,
  Percent,
  Target,
  Calendar,
  PieChart,
  BarChart3,
  Activity,
  Clock,
  TrendingUp,
  TrendingDown
};

const colorMap = {
  green: {
    bg: 'bg-green-50',
    text: 'text-green-600',
    border: 'border-green-200',
    icon: 'text-green-500'
  },
  red: {
    bg: 'bg-red-50',
    text: 'text-red-600',
    border: 'border-red-200',
    icon: 'text-red-500'
  },
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    border: 'border-blue-200',
    icon: 'text-blue-500'
  },
  purple: {
    bg: 'bg-purple-50',
    text: 'text-purple-600',
    border: 'border-purple-200',
    icon: 'text-purple-500'
  },
  orange: {
    bg: 'bg-orange-50',
    text: 'text-orange-600',
    border: 'border-orange-200',
    icon: 'text-orange-500'
  },
  gray: {
    bg: 'bg-gray-50',
    text: 'text-gray-600',
    border: 'border-gray-200',
    icon: 'text-gray-500'
  }
};

const MetricCard = memo(({ 
  metric, 
  compact = false, 
  showTrends = true, 
  showTargets = true,
  index = 0 
}: { 
  metric: MetricData; 
  compact?: boolean; 
  showTrends?: boolean; 
  showTargets?: boolean;
  index?: number;
}) => {
  const Icon = metric.icon ? iconMap[metric.icon.name as keyof typeof iconMap] || DollarSign : DollarSign;
  const colors = colorMap[metric.color || 'gray'];
  
  const formatValue = (value: number | string, format: string = 'text') => {
    if (typeof value === 'string') return value;
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 2
        }).format(value);
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'number':
        return value.toLocaleString();
      default:
        return value.toString();
    }
  };

  const formatChange = (change: number, type: string = 'number') => {
    const prefix = change >= 0 ? '+' : '';
    switch (type) {
      case 'currency':
        return `${prefix}${formatValue(change, 'currency')}`;
      case 'percentage':
        return `${prefix}${change.toFixed(1)}%`;
      default:
        return `${prefix}${change.toLocaleString()}`;
    }
  };

  const getTrendIcon = () => {
    if (!metric.change) return null;
    return metric.change >= 0 ? TrendingUp : TrendingDown;
  };

  const getTrendColor = () => {
    if (!metric.change) return 'text-gray-400';
    return metric.change >= 0 ? 'text-green-500' : 'text-red-500';
  };

  const progressPercentage = useMemo(() => {
    if (!metric.target || typeof metric.value !== 'number') return 0;
    return Math.min((metric.value / metric.target) * 100, 100);
  }, [metric.value, metric.target]);

  const TrendIcon = getTrendIcon();

  return (
    <Card 
      className={cn(
        'relative overflow-hidden transition-all duration-300 hover:shadow-md',
        colors.bg,
        colors.border,
        compact ? 'p-3' : 'p-4',
        metric.isLoading && 'animate-pulse'
      )}
      style={{
        animationDelay: `${index * 100}ms`
      }}
    >
      {metric.isLoading && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
        </div>
      )}
      
      <div className={cn(
        'flex items-start',
        compact ? 'space-x-2' : 'space-x-3'
      )}>
        <div className={cn(
          'flex-shrink-0 rounded-lg p-2',
          colors.bg,
          colors.border
        )}>
          <Icon className={cn(
            compact ? 'h-4 w-4' : 'h-5 w-5',
            colors.icon
          )} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className={cn(
              'font-medium truncate',
              compact ? 'text-sm' : 'text-base',
              colors.text
            )}>
              {metric.title}
            </h3>
            {metric.period && (
              <Badge variant="secondary" className="text-xs">
                {metric.period}
              </Badge>
            )}
          </div>
          
          <div className="space-y-1">
            <div className={cn(
              'font-bold',
              compact ? 'text-lg' : 'text-xl',
              colors.text
            )}>
              {formatValue(metric.value, metric.format)}
            </div>
            
            {metric.subtitle && (
              <div className="text-xs text-gray-500 truncate">
                {metric.subtitle}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {(showTrends && metric.change !== undefined) && (
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-200">
          <div className="flex items-center space-x-1">
            {TrendIcon && (
              <TrendIcon className={cn(
                'h-3 w-3',
                getTrendColor()
              )} />
            )}
            <span className={cn(
              'text-xs font-medium',
              getTrendColor()
            )}>
              {formatChange(metric.change, metric.changeType)}
            </span>
          </div>
          
          {metric.period && (
            <span className="text-xs text-gray-400">
              {metric.period}
            </span>
          )}
        </div>
      )}
      
      {(showTargets && metric.target && typeof metric.value === 'number') && (
        <div className="mt-3 pt-2 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Progress to target</span>
            <span>{progressPercentage.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={cn(
                'h-2 rounded-full transition-all duration-500',
                progressPercentage >= 100 ? 'bg-green-500' : 'bg-blue-500'
              )}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      )}
    </Card>
  );
});

MetricCard.displayName = 'MetricCard';

const MobileMetricCards = memo(({
  metrics,
  layout = 'grid',
  compact = false,
  showTrends = true,
  showTargets = true,
  className
}: MobileMetricCardsProps) => {
  const renderGrid = () => (
    <div className={cn(
      'grid gap-4',
      compact ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2',
      className
    )}>
      {metrics.map((metric, index) => (
        <MetricCard
          key={metric.id}
          metric={metric}
          compact={compact}
          showTrends={showTrends}
          showTargets={showTargets}
          index={index}
        />
      ))}
    </div>
  );

  const renderCarousel = () => (
    <div className={cn('overflow-x-auto', className)}>
      <div className="flex space-x-4 pb-4">
        {metrics.map((metric, index) => (
          <div
            key={metric.id}
            className={cn(
              'flex-shrink-0',
              compact ? 'w-48' : 'w-64'
            )}
          >
            <MetricCard
              metric={metric}
              compact={compact}
              showTrends={showTrends}
              showTargets={showTargets}
              index={index}
            />
          </div>
        ))}
      </div>
    </div>
  );

  const renderStack = () => (
    <div className={cn('space-y-3', className)}>
      {metrics.map((metric, index) => (
        <MetricCard
          key={metric.id}
          metric={metric}
          compact={compact}
          showTrends={showTrends}
          showTargets={showTargets}
          index={index}
        />
      ))}
    </div>
  );

  switch (layout) {
    case 'carousel':
      return renderCarousel();
    case 'stack':
      return renderStack();
    default:
      return renderGrid();
  }
});

MobileMetricCards.displayName = 'MobileMetricCards';

export default MobileMetricCards;

// Example usage and data structure
export const sampleMetrics: MetricData[] = [
  {
    id: 'portfolio-value',
    title: 'Portfolio Value',
    value: 125430.50,
    change: 2340.75,
    changeType: 'currency',
    period: 'Today',
    trend: 'up',
    icon: DollarSign,
    color: 'green',
    format: 'currency',
    subtitle: 'Total market value'
  },
  {
    id: 'total-return',
    title: 'Total Return',
    value: 12.4,
    change: 0.8,
    changeType: 'percentage',
    period: 'YTD',
    trend: 'up',
    icon: TrendingUp,
    color: 'green',
    format: 'percentage',
    target: 15.0
  },
  {
    id: 'cash-balance',
    title: 'Cash Balance',
    value: 8450.25,
    change: -500.00,
    changeType: 'currency',
    period: 'Available',
    trend: 'down',
    icon: DollarSign,
    color: 'blue',
    format: 'currency',
    subtitle: 'Ready to invest'
  },
  {
    id: 'positions',
    title: 'Active Positions',
    value: 24,
    change: 2,
    changeType: 'number',
    period: 'Holdings',
    trend: 'up',
    icon: PieChart,
    color: 'purple',
    format: 'number',
    subtitle: 'Diversified across sectors'
  },
  {
    id: 'dividend-yield',
    title: 'Dividend Yield',
    value: 3.2,
    change: 0.1,
    changeType: 'percentage',
    period: 'Annual',
    trend: 'up',
    icon: Percent,
    color: 'orange',
    format: 'percentage',
    target: 4.0
  },
  {
    id: 'expense-ratio',
    title: 'Avg Expense Ratio',
    value: 0.65,
    change: -0.05,
    changeType: 'percentage',
    period: 'Weighted',
    trend: 'down',
    icon: BarChart3,
    color: 'gray',
    format: 'percentage',
    subtitle: 'Cost efficiency'
  }
];