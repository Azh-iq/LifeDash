'use client';

import { useState, useEffect, useRef, useCallback, useMemo, ReactNode } from 'react';

// Virtualization utilities for handling large datasets efficiently

export interface VirtualItem {
  index: number;
  start: number;
  end: number;
  size: number;
}

export interface VirtualizerOptions {
  count: number;
  estimateSize: (index: number) => number;
  overscan?: number;
  paddingStart?: number;
  paddingEnd?: number;
  scrollMargin?: number;
  getItemKey?: (index: number) => string | number;
}

export interface VirtualizerInstance {
  virtualItems: VirtualItem[];
  totalSize: number;
  scrollToIndex: (index: number, options?: { align?: 'start' | 'center' | 'end' }) => void;
  scrollToOffset: (offset: number) => void;
  measureElement: (element: HTMLElement | null, index: number) => void;
}

// Core virtualizer hook
export function useVirtualizer({
  count,
  estimateSize,
  overscan = 5,
  paddingStart = 0,
  paddingEnd = 0,
  scrollMargin = 0,
  getItemKey
}: VirtualizerOptions): VirtualizerInstance {
  const [scrollElement, setScrollElement] = useState<HTMLElement | null>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [scrollDirection, setScrollDirection] = useState<'forward' | 'backward'>('forward');
  const [isScrolling, setIsScrolling] = useState(false);
  
  const measurements = useRef<Map<number, number>>(new Map());
  const scrollElementRef = useRef<HTMLElement | null>(null);
  const scrollTimeoutRef = useRef<number | null>(null);
  const isScrollingTimeoutRef = useRef<number | null>(null);

  // Calculate item positions
  const calculateItemPosition = useCallback((index: number) => {
    let start = paddingStart;
    
    for (let i = 0; i < index; i++) {
      const size = measurements.current.get(i) ?? estimateSize(i);
      start += size;
    }
    
    const size = measurements.current.get(index) ?? estimateSize(index);
    return { start, size, end: start + size };
  }, [estimateSize, paddingStart]);

  // Get visible range
  const getVisibleRange = useCallback(() => {
    if (!scrollElement) return [0, 0];
    
    const containerSize = scrollElement.clientHeight;
    const scrollTop = scrollOffset;
    
    let start = 0;
    let end = count - 1;
    
    // Binary search for start index
    let left = 0;
    let right = count - 1;
    
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const { start: itemStart, end: itemEnd } = calculateItemPosition(mid);
      
      if (itemEnd <= scrollTop) {
        left = mid + 1;
        start = mid + 1;
      } else if (itemStart >= scrollTop + containerSize) {
        right = mid - 1;
      } else {
        start = mid;
        break;
      }
    }
    
    // Find end index
    let currentOffset = calculateItemPosition(start).start;
    
    for (let i = start; i < count; i++) {
      const { size } = calculateItemPosition(i);
      
      if (currentOffset > scrollTop + containerSize + scrollMargin) {
        end = i - 1;
        break;
      }
      
      currentOffset += size;
      end = i;
    }
    
    return [Math.max(0, start - overscan), Math.min(count - 1, end + overscan)];
  }, [scrollElement, scrollOffset, count, calculateItemPosition, overscan, scrollMargin]);

  // Generate virtual items
  const virtualItems = useMemo(() => {
    const [startIndex, endIndex] = getVisibleRange();
    const items: VirtualItem[] = [];
    
    for (let i = startIndex; i <= endIndex; i++) {
      const { start, size, end } = calculateItemPosition(i);
      items.push({ index: i, start, end, size });
    }
    
    return items;
  }, [getVisibleRange, calculateItemPosition]);

  // Calculate total size
  const totalSize = useMemo(() => {
    let size = paddingStart + paddingEnd;
    
    for (let i = 0; i < count; i++) {
      size += measurements.current.get(i) ?? estimateSize(i);
    }
    
    return size;
  }, [count, estimateSize, paddingStart, paddingEnd]);

  // Scroll to index
  const scrollToIndex = useCallback((
    index: number,
    options: { align?: 'start' | 'center' | 'end' } = {}
  ) => {
    if (!scrollElement) return;
    
    const { align = 'start' } = options;
    const { start, size } = calculateItemPosition(index);
    const containerSize = scrollElement.clientHeight;
    
    let offset = start;
    
    if (align === 'center') {
      offset = start - (containerSize - size) / 2;
    } else if (align === 'end') {
      offset = start - (containerSize - size);
    }
    
    scrollElement.scrollTo({
      top: Math.max(0, offset),
      behavior: 'smooth'
    });
  }, [scrollElement, calculateItemPosition]);

  // Scroll to offset
  const scrollToOffset = useCallback((offset: number) => {
    if (!scrollElement) return;
    
    scrollElement.scrollTo({
      top: Math.max(0, offset),
      behavior: 'smooth'
    });
  }, [scrollElement]);

  // Measure element
  const measureElement = useCallback((element: HTMLElement | null, index: number) => {
    if (!element) return;
    
    const prevSize = measurements.current.get(index);
    const newSize = element.getBoundingClientRect().height;
    
    if (prevSize !== newSize) {
      measurements.current.set(index, newSize);
      // Trigger re-render by updating a dummy state
      setScrollOffset(offset => offset);
    }
  }, []);

  // Handle scroll events
  useEffect(() => {
    if (!scrollElement) return;
    
    const handleScroll = () => {
      const newOffset = scrollElement.scrollTop;
      const direction = newOffset > scrollOffset ? 'forward' : 'backward';
      
      setScrollOffset(newOffset);
      setScrollDirection(direction);
      setIsScrolling(true);
      
      // Clear existing timeout
      if (isScrollingTimeoutRef.current) {
        clearTimeout(isScrollingTimeoutRef.current);
      }
      
      // Set scrolling to false after delay
      isScrollingTimeoutRef.current = window.setTimeout(() => {
        setIsScrolling(false);
      }, 150);
    };
    
    scrollElement.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      scrollElement.removeEventListener('scroll', handleScroll);
      if (isScrollingTimeoutRef.current) {
        clearTimeout(isScrollingTimeoutRef.current);
      }
    };
  }, [scrollElement, scrollOffset]);

  // Set initial scroll element
  useEffect(() => {
    if (scrollElementRef.current) {
      setScrollElement(scrollElementRef.current);
    }
  }, []);

  return {
    virtualItems,
    totalSize,
    scrollToIndex,
    scrollToOffset,
    measureElement
  };
}

// Virtual list component
export function VirtualList<T>({
  items,
  height,
  itemHeight,
  renderItem,
  overscan = 5,
  className,
  onScroll,
  getItemKey
}: {
  items: T[];
  height: number;
  itemHeight: number | ((index: number) => number);
  renderItem: (item: T, index: number) => ReactNode;
  overscan?: number;
  className?: string;
  onScroll?: (scrollTop: number) => void;
  getItemKey?: (index: number) => string | number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const estimateSize = useCallback((index: number) => {
    return typeof itemHeight === 'function' ? itemHeight(index) : itemHeight;
  }, [itemHeight]);

  const virtualizer = useVirtualizer({
    count: items.length,
    estimateSize,
    overscan,
    getItemKey
  });

  useEffect(() => {
    if (containerRef.current) {
      const handleScroll = () => {
        onScroll?.(containerRef.current?.scrollTop || 0);
      };
      
      containerRef.current.addEventListener('scroll', handleScroll);
      return () => containerRef.current?.removeEventListener('scroll', handleScroll);
    }
  }, [onScroll]);

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height }}
    >
      <div style={{ height: virtualizer.totalSize, position: 'relative' }}>
        {virtualizer.virtualItems.map((virtualItem) => (
          <div
            key={getItemKey ? getItemKey(virtualItem.index) : virtualItem.index}
            style={{
              position: 'absolute',
              top: virtualItem.start,
              left: 0,
              right: 0,
              height: virtualItem.size
            }}
            ref={(el) => virtualizer.measureElement(el, virtualItem.index)}
          >
            {renderItem(items[virtualItem.index], virtualItem.index)}
          </div>
        ))}
      </div>
    </div>
  );
}

// Virtual grid component
export function VirtualGrid<T>({
  items,
  height,
  width,
  itemHeight,
  itemWidth,
  columns,
  renderItem,
  overscan = 5,
  className,
  gap = 0,
  getItemKey
}: {
  items: T[];
  height: number;
  width: number;
  itemHeight: number | ((index: number) => number);
  itemWidth: number | ((index: number) => number);
  columns: number;
  renderItem: (item: T, index: number) => ReactNode;
  overscan?: number;
  className?: string;
  gap?: number;
  getItemKey?: (index: number) => string | number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const rowCount = Math.ceil(items.length / columns);
  
  const estimateRowSize = useCallback((rowIndex: number) => {
    const startIndex = rowIndex * columns;
    const endIndex = Math.min(startIndex + columns, items.length);
    let maxHeight = 0;
    
    for (let i = startIndex; i < endIndex; i++) {
      const height = typeof itemHeight === 'function' ? itemHeight(i) : itemHeight;
      maxHeight = Math.max(maxHeight, height);
    }
    
    return maxHeight + gap;
  }, [itemHeight, columns, gap]);

  const virtualizer = useVirtualizer({
    count: rowCount,
    estimateSize: estimateRowSize,
    overscan,
    getItemKey: (index) => `row-${index}`
  });

  const getItemWidth = useCallback((index: number) => {
    return typeof itemWidth === 'function' ? itemWidth(index) : itemWidth;
  }, [itemWidth]);

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height, width }}
    >
      <div style={{ height: virtualizer.totalSize, position: 'relative' }}>
        {virtualizer.virtualItems.map((virtualRow) => {
          const startIndex = virtualRow.index * columns;
          const endIndex = Math.min(startIndex + columns, items.length);
          
          return (
            <div
              key={virtualRow.index}
              style={{
                position: 'absolute',
                top: virtualRow.start,
                left: 0,
                right: 0,
                height: virtualRow.size,
                display: 'flex',
                gap: `${gap}px`
              }}
              ref={(el) => virtualizer.measureElement(el, virtualRow.index)}
            >
              {Array.from({ length: endIndex - startIndex }, (_, colIndex) => {
                const itemIndex = startIndex + colIndex;
                const item = items[itemIndex];
                
                return (
                  <div
                    key={getItemKey ? getItemKey(itemIndex) : itemIndex}
                    style={{
                      width: getItemWidth(itemIndex),
                      flexShrink: 0
                    }}
                  >
                    {renderItem(item, itemIndex)}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Infinite scroll with virtualization
export function useInfiniteVirtualizer<T>({
  items,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  estimateSize,
  overscan = 5
}: {
  items: T[];
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  estimateSize: (index: number) => number;
  overscan?: number;
}) {
  const [scrollElement, setScrollElement] = useState<HTMLElement | null>(null);
  
  const virtualizer = useVirtualizer({
    count: items.length,
    estimateSize,
    overscan
  });

  // Trigger fetch when near the end
  useEffect(() => {
    if (!scrollElement || !hasNextPage || isFetchingNextPage) return;
    
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollElement;
      const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
      
      // Fetch when 80% scrolled
      if (scrollPercentage > 0.8) {
        fetchNextPage();
      }
    };
    
    scrollElement.addEventListener('scroll', handleScroll);
    return () => scrollElement.removeEventListener('scroll', handleScroll);
  }, [scrollElement, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return {
    ...virtualizer,
    setScrollElement
  };
}

// Virtual table component
export function VirtualTable<T>({
  data,
  columns,
  height,
  rowHeight = 50,
  headerHeight = 40,
  overscan = 5,
  className,
  onRowClick,
  getRowKey
}: {
  data: T[];
  columns: Array<{
    key: string;
    header: string;
    width: number;
    render?: (item: T, index: number) => ReactNode;
  }>;
  height: number;
  rowHeight?: number;
  headerHeight?: number;
  overscan?: number;
  className?: string;
  onRowClick?: (item: T, index: number) => void;
  getRowKey?: (index: number) => string | number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: data.length,
    estimateSize: () => rowHeight,
    overscan
  });

  const totalWidth = columns.reduce((sum, col) => sum + col.width, 0);

  return (
    <div className={`border border-gray-200 ${className}`}>
      {/* Header */}
      <div
        className="bg-gray-50 border-b border-gray-200 flex"
        style={{ height: headerHeight }}
      >
        {columns.map((column) => (
          <div
            key={column.key}
            className="px-4 py-2 font-medium text-gray-900 border-r border-gray-200 flex items-center"
            style={{ width: column.width }}
          >
            {column.header}
          </div>
        ))}
      </div>

      {/* Body */}
      <div
        ref={containerRef}
        className="overflow-auto"
        style={{ height: height - headerHeight }}
      >
        <div style={{ height: virtualizer.totalSize, position: 'relative' }}>
          {virtualizer.virtualItems.map((virtualRow) => {
            const item = data[virtualRow.index];
            
            return (
              <div
                key={getRowKey ? getRowKey(virtualRow.index) : virtualRow.index}
                className="border-b border-gray-200 flex hover:bg-gray-50 cursor-pointer"
                style={{
                  position: 'absolute',
                  top: virtualRow.start,
                  left: 0,
                  right: 0,
                  height: virtualRow.size
                }}
                onClick={() => onRowClick?.(item, virtualRow.index)}
                ref={(el) => virtualizer.measureElement(el, virtualRow.index)}
              >
                {columns.map((column) => (
                  <div
                    key={column.key}
                    className="px-4 py-2 border-r border-gray-200 flex items-center"
                    style={{ width: column.width }}
                  >
                    {column.render 
                      ? column.render(item, virtualRow.index)
                      : (item as any)[column.key]
                    }
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Performance monitoring
export function useVirtualizationPerformance() {
  const [metrics, setMetrics] = useState({
    renderTime: 0,
    itemCount: 0,
    visibleItems: 0,
    fps: 0
  });

  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());

  const updateMetrics = useCallback((visibleItems: number, itemCount: number) => {
    const now = performance.now();
    const delta = now - lastTime.current;
    
    frameCount.current++;
    
    if (delta >= 1000) {
      const fps = Math.round((frameCount.current * 1000) / delta);
      
      setMetrics(prev => ({
        ...prev,
        visibleItems,
        itemCount,
        fps
      }));
      
      frameCount.current = 0;
      lastTime.current = now;
    }
  }, []);

  return { metrics, updateMetrics };
}

// Export utilities
export const virtualizationUtils = {
  // Calculate optimal buffer size based on scroll speed
  calculateOptimalOverscan: (scrollSpeed: number) => {
    return Math.max(5, Math.min(20, Math.floor(scrollSpeed / 10)));
  },

  // Estimate item size based on content
  estimateItemSize: (content: string, baseSize: number = 50) => {
    const lineHeight = 20;
    const lines = Math.ceil(content.length / 80); // Rough estimate
    return Math.max(baseSize, lines * lineHeight);
  },

  // Calculate grid dimensions
  calculateGridDimensions: (
    containerWidth: number,
    itemWidth: number,
    gap: number = 0
  ) => {
    const availableWidth = containerWidth - gap;
    const columns = Math.floor(availableWidth / (itemWidth + gap));
    return { columns, itemWidth: (availableWidth - (columns - 1) * gap) / columns };
  }
};