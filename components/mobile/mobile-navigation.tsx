'use client';

import { useState, memo, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import { 
  Home, 
  PieChart, 
  TrendingUp, 
  Settings, 
  User,
  Plus,
  Search,
  Bell,
  Menu,
  X
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href: string;
  badge?: number;
  disabled?: boolean;
}

interface MobileNavigationProps {
  items?: NavItem[];
  showFab?: boolean;
  showNotifications?: boolean;
  notificationCount?: number;
  onFabClick?: () => void;
  onNotificationClick?: () => void;
  className?: string;
}

const defaultNavItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home,
    href: '/dashboard'
  },
  {
    id: 'portfolio',
    label: 'Portfolio',
    icon: PieChart,
    href: '/investments'
  },
  {
    id: 'stocks',
    label: 'Stocks',
    icon: TrendingUp,
    href: '/investments/stocks'
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: User,
    href: '/profile'
  }
];

const MobileNavItem = memo(({ 
  item, 
  isActive, 
  onClick 
}: { 
  item: NavItem; 
  isActive: boolean; 
  onClick: () => void;
}) => {
  const Icon = item.icon;
  
  return (
    <button
      onClick={onClick}
      disabled={item.disabled}
      className={cn(
        'flex flex-col items-center justify-center p-2 min-w-0 flex-1 transition-all duration-200',
        'active:scale-95 touch-manipulation',
        isActive 
          ? 'text-blue-600' 
          : 'text-gray-400 hover:text-gray-600',
        item.disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <div className="relative">
        <Icon className={cn(
          'h-6 w-6 transition-transform duration-200',
          isActive && 'scale-110'
        )} />
        {item.badge && item.badge > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-4 w-4 p-0 flex items-center justify-center text-xs"
          >
            {item.badge > 99 ? '99+' : item.badge}
          </Badge>
        )}
      </div>
      <span className={cn(
        'text-xs font-medium mt-1 truncate max-w-full',
        isActive ? 'text-blue-600' : 'text-gray-500'
      )}>
        {item.label}
      </span>
    </button>
  );
});

MobileNavItem.displayName = 'MobileNavItem';

const FloatingActionButton = memo(({ 
  onClick, 
  notificationCount = 0,
  showNotifications = false,
  onNotificationClick,
  quickActions = [],
  onSharePortfolio,
  showPortfolioActions = false
}: {
  onClick: () => void;
  notificationCount?: number;
  showNotifications?: boolean;
  onNotificationClick?: () => void;
  quickActions?: PortfolioQuickAction[];
  onSharePortfolio?: () => void;
  showPortfolioActions?: boolean;
}) => {
  const [expanded, setExpanded] = useState(false);

  const handleMainClick = useCallback(() => {
    if (showNotifications) {
      setExpanded(!expanded);
    } else {
      onClick();
    }
  }, [showNotifications, expanded, onClick]);

  const handleNotificationClick = useCallback(() => {
    onNotificationClick?.();
    setExpanded(false);
  }, [onNotificationClick]);

  const handleAddClick = useCallback(() => {
    onClick();
    setExpanded(false);
  }, [onClick]);

  return (
    <div className="relative">
      {/* Backdrop */}
      {expanded && (
        <div 
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setExpanded(false)}
        />
      )}
      
      {/* Expanded menu */}
      {expanded && (
        <div className="absolute bottom-16 right-0 flex flex-col space-y-3 z-50">
          {/* Portfolio Share Button */}
          {showPortfolioActions && onSharePortfolio && (
            <Button
              size="sm"
              variant="secondary"
              onClick={onSharePortfolio}
              className="shadow-lg"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          )}
          
          {/* Quick Actions */}
          {quickActions.map((action) => {
            const ActionIcon = action.icon;
            return (
              <Button
                key={action.id}
                size="sm"
                variant="secondary"
                onClick={action.onClick}
                disabled={action.disabled}
                className="relative shadow-lg"
                style={{ backgroundColor: action.color }}
              >
                <ActionIcon className="h-4 w-4" />
                {action.badge && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-4 w-4 p-0 flex items-center justify-center text-xs"
                  >
                    {action.badge}
                  </Badge>
                )}
              </Button>
            );
          })}
          
          {/* Notifications */}
          {showNotifications && (
            <Button
              size="sm"
              variant="secondary"
              onClick={handleNotificationClick}
              className="relative shadow-lg"
            >
              <Bell className="h-4 w-4" />
              {notificationCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-4 w-4 p-0 flex items-center justify-center text-xs"
                >
                  {notificationCount > 99 ? '99+' : notificationCount}
                </Badge>
              )}
            </Button>
          )}
          
          {/* Add Button */}
          <Button
            size="sm"
            onClick={handleAddClick}
            className="shadow-lg"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      {/* Main FAB */}
      <Button
        size="lg"
        onClick={handleMainClick}
        className={cn(
          'fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg transition-all duration-200 z-50',
          'active:scale-95 touch-manipulation',
          expanded && 'rotate-45'
        )}
      >
        {expanded ? (
          <X className="h-6 w-6" />
        ) : showNotifications ? (
          <Menu className="h-6 w-6" />
        ) : (
          <Plus className="h-6 w-6" />
        )}
      </Button>
    </div>
  );
});

FloatingActionButton.displayName = 'FloatingActionButton';

const MobileNavigation = memo(({
  items = defaultNavItems,
  showFab = true,
  showNotifications = false,
  notificationCount = 0,
  onFabClick,
  onNotificationClick,
  className,
  activePortfolioId,
  portfolioNotifications = [],
  quickActions = [],
  onPortfolioChange,
  onSharePortfolio,
  enableDeepLinking = true,
  showPortfolioSwitcher = false
}: MobileNavigationProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const { portfolios, loading: portfoliosLoading } = usePortfoliosState();
  const [showPortfolioMenu, setShowPortfolioMenu] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState<PortfolioNotification[]>([]);
  
  // Portfolio-specific navigation items
  const navigationItems = activePortfolioId ? getPortfolioNavItems(activePortfolioId) : items;
  
  // Filter and manage notifications
  useEffect(() => {
    const unread = portfolioNotifications.filter(n => !n.read);
    setUnreadNotifications(unread);
  }, [portfolioNotifications]);
  
  // Generate shareable portfolio link
  const generatePortfolioShareLink = useCallback((portfolioId: string) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}/portfolio/share/${portfolioId}`;
  }, []);
  
  // Handle deep linking
  const handleDeepLink = useCallback((item: NavItem) => {
    if (!enableDeepLinking || !item.deepLinkData) return;
    
    const { type, id, action } = item.deepLinkData;
    const params = new URLSearchParams({
      type,
      id,
      ...(action && { action })
    });
    
    // Create deep link URL
    const deepLinkUrl = `${item.href}?${params.toString()}`;
    router.push(deepLinkUrl);
  }, [enableDeepLinking, router]);
  
  // Calculate portfolio-specific badges
  const calculatePortfolioBadges = useCallback(() => {
    if (!activePortfolioId) return {};
    
    const portfolioNotifs = portfolioNotifications.filter(
      n => n.portfolioId === activePortfolioId && !n.read
    );
    
    return {
      portfolio: portfolioNotifs.filter(n => n.type === 'portfolio_update').length,
      holdings: portfolioNotifs.filter(n => n.type === 'price_alert').length,
      performance: portfolioNotifs.filter(n => n.type === 'market_update').length
    };
  }, [activePortfolioId, portfolioNotifications]);
  
  const portfolioBadges = calculatePortfolioBadges();

  const handleNavClick = useCallback((item: NavItem) => {
    if (item.disabled) return;
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
    
    // Handle deep linking if enabled
    if (item.deepLinkData) {
      handleDeepLink(item);
    } else {
      router.push(item.href);
    }
  }, [router, handleDeepLink]);
  
  const handlePortfolioSwitch = useCallback((portfolioId: string) => {
    onPortfolioChange?.(portfolioId);
    setShowPortfolioMenu(false);
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  }, [onPortfolioChange]);
  
  const handleSharePortfolio = useCallback(() => {
    if (!activePortfolioId) return;
    
    if (navigator.share) {
      navigator.share({
        title: 'LifeDash Portefølje',
        text: 'Se min investeringsportefølje',
        url: generatePortfolioShareLink(activePortfolioId)
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(generatePortfolioShareLink(activePortfolioId));
    }
    
    onSharePortfolio?.(activePortfolioId);
  }, [activePortfolioId, generatePortfolioShareLink, onSharePortfolio]);
  
  const handleNotificationClick = useCallback(() => {
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
    
    onNotificationClick?.();
  }, [onNotificationClick]);

  const handleFabClick = useCallback(() => {
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(100);
    }
    
    onFabClick?.();
  }, [onFabClick]);

  return (
    <>
      {/* Bottom Navigation Bar */}
      <div className={cn(
        'fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-200 z-40',
        'safe-area-inset-bottom',
        className
      )}>
        <div className="flex items-center justify-between px-2 py-2">
          {navigationItems.map((item) => {
            // Add portfolio-specific badges
            const itemWithBadge = {
              ...item,
              badge: item.badge || portfolioBadges[item.id as keyof typeof portfolioBadges] || 0
            };
            
            return (
              <MobileNavItem
                key={item.id}
                item={itemWithBadge}
                isActive={pathname === item.href || pathname.startsWith(item.href + '/')}
                onClick={() => handleNavClick(item)}
              />
            );
          })}
        </div>
        
        {/* Portfolio Switcher */}
        {showPortfolioSwitcher && portfolios.length > 1 && (
          <div className="absolute top-0 left-0 right-0 transform -translate-y-full bg-white/95 backdrop-blur-sm border-t border-gray-200 p-2">
            <div className="flex items-center space-x-2 overflow-x-auto">
              {portfolios.map((portfolio) => (
                <Button
                  key={portfolio.id}
                  variant={activePortfolioId === portfolio.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePortfolioSwitch(portfolio.id)}
                  className="whitespace-nowrap"
                >
                  {portfolio.name}
                  {portfolio.daily_change !== undefined && (
                    <span className={cn(
                      'ml-1 text-xs',
                      portfolio.daily_change >= 0 ? 'text-green-600' : 'text-red-600'
                    )}>
                      {portfolio.daily_change >= 0 ? '+' : ''}{portfolio.daily_change.toFixed(1)}%
                    </span>
                  )}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      {showFab && (
        <FloatingActionButton
          onClick={handleFabClick}
          showNotifications={showNotifications}
          notificationCount={unreadNotifications.length}
          onNotificationClick={handleNotificationClick}
          quickActions={quickActions}
          onSharePortfolio={handleSharePortfolio}
          showPortfolioActions={!!activePortfolioId}
        />
      )}
    </>
  );
});

MobileNavigation.displayName = 'MobileNavigation';

export default MobileNavigation;

// Top Navigation Bar for Mobile
export const MobileTopBar = memo(({
  title,
  showBack = false,
  showSearch = false,
  showMenu = false,
  onBackClick,
  onSearchClick,
  onMenuClick,
  rightContent,
  className
}: {
  title: string;
  showBack?: boolean;
  showSearch?: boolean;
  showMenu?: boolean;
  onBackClick?: () => void;
  onSearchClick?: () => void;
  onMenuClick?: () => void;
  rightContent?: React.ReactNode;
  className?: string;
}) => {
  const handleBackClick = useCallback(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
    onBackClick?.();
  }, [onBackClick]);

  const handleSearchClick = useCallback(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
    onSearchClick?.();
  }, [onSearchClick]);

  const handleMenuClick = useCallback(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
    onMenuClick?.();
  }, [onMenuClick]);

  return (
    <div className={cn(
      'fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-gray-200 z-40',
      'safe-area-inset-top',
      className
    )}>
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-3">
          {showBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackClick}
              className="p-2"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Button>
          )}
          {showMenu && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMenuClick}
              className="p-2"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <h1 className="text-xl font-semibold truncate">{title}</h1>
        </div>
        
        <div className="flex items-center space-x-2">
          {showSearch && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSearchClick}
              className="p-2"
            >
              <Search className="h-5 w-5" />
            </Button>
          )}
          {rightContent}
        </div>
      </div>
    </div>
  );
});

MobileTopBar.displayName = 'MobileTopBar';

// Portfolio-specific Mobile Top Bar
export const MobilePortfolioTopBar = memo(({ 
  portfolioName,
  portfolioValue,
  portfolioChange,
  portfolioChangePercent,
  showBack = true,
  showShare = true,
  showMenu = false,
  onBackClick,
  onShareClick,
  onMenuClick,
  className,
  currency = 'NOK'
}: {
  portfolioName: string;
  portfolioValue: number;
  portfolioChange?: number;
  portfolioChangePercent?: number;
  showBack?: boolean;
  showShare?: boolean;
  showMenu?: boolean;
  onBackClick?: () => void;
  onShareClick?: () => void;
  onMenuClick?: () => void;
  className?: string;
  currency?: string;
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('nb-NO', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  return (
    <div className={cn(
      'fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md border-b border-gray-200 z-40',
      'safe-area-inset-top',
      className
    )}>
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            {showBack && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBackClick}
                className="p-2"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Button>
            )}
            {showMenu && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMenuClick}
                className="p-2"
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {showShare && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onShareClick}
                className="p-2"
              >
                <ExternalLink className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
        
        <div className="text-center">
          <h1 className="text-lg font-semibold mb-1">{portfolioName}</h1>
          <div className="text-2xl font-bold mb-1">{formatCurrency(portfolioValue)}</div>
          {portfolioChange !== undefined && portfolioChangePercent !== undefined && (
            <div className={cn(
              'text-sm font-medium flex items-center justify-center space-x-1',
              portfolioChange >= 0 ? 'text-green-600' : 'text-red-600'
            )}>
              {portfolioChange >= 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span>{formatCurrency(portfolioChange)}</span>
              <span>({formatPercent(portfolioChangePercent)})</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

MobilePortfolioTopBar.displayName = 'MobilePortfolioTopBar';