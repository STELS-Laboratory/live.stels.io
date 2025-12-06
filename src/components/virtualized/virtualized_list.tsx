/**
 * Virtualized List Component
 * Efficiently renders large lists by only rendering visible items
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";

interface VirtualizedListProps<T> {
	items: T[];
	itemHeight: number;
	containerHeight: number;
	renderItem: (item: T, index: number) => React.ReactNode;
	keyExtractor?: (item: T, index: number) => string;
	overscan?: number;
	className?: string;
	onScroll?: (scrollTop: number) => void;
}

/**
 * Virtualized List Component
 * Only renders visible items plus overscan for smooth scrolling
 */
export function VirtualizedList<T>({
	items,
	itemHeight,
	containerHeight,
	renderItem,
	keyExtractor,
	overscan = 3,
	className,
	onScroll,
}: VirtualizedListProps<T>): React.ReactElement {
	const [scrollTop, setScrollTop] = useState(0);
	const scrollContainerRef = useRef<HTMLDivElement>(null);

	// Calculate visible range
	const visibleRange = useMemo(() => {
		const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
		const endIndex = Math.min(
			items.length - 1,
			Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan,
		);

		return { startIndex, endIndex };
	}, [scrollTop, containerHeight, itemHeight, items.length, overscan]);

	// Get visible items
	const visibleItems = useMemo(() => {
		return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1).map((item, index) => ({
			item,
			index: visibleRange.startIndex + index,
		}));
	}, [items, visibleRange.startIndex, visibleRange.endIndex]);

	// Total height of all items
	const totalHeight = items.length * itemHeight;

	// Offset for visible items
	const offsetY = visibleRange.startIndex * itemHeight;

	// Handle scroll
	const handleScroll = useCallback(
		(event: React.UIEvent<HTMLDivElement>) => {
			const newScrollTop = event.currentTarget.scrollTop;
			setScrollTop(newScrollTop);
			onScroll?.(newScrollTop);
		},
		[onScroll],
	);

	// Default key extractor
	const getKey = useCallback(
		(item: T, index: number) => {
			if (keyExtractor) {
				return keyExtractor(item, index);
			}
			return `item-${index}`;
		},
		[keyExtractor],
	);

	return (
		<div
			ref={scrollContainerRef}
			className={cn("overflow-auto", className)}
			style={{ height: containerHeight }}
			onScroll={handleScroll}
		>
			<div style={{ height: totalHeight, position: "relative" }}>
				<div
					style={{
						transform: `translateY(${offsetY}px)`,
						position: "absolute",
						top: 0,
						left: 0,
						right: 0,
					}}
				>
					{visibleItems.map(({ item, index }) => (
						<div
							key={getKey(item, index)}
							style={{
								height: itemHeight,
							}}
						>
							{renderItem(item, index)}
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

/**
 * Virtualized Grid Component
 * Efficiently renders large grids by only rendering visible cells
 */
interface VirtualizedGridProps<T> {
	items: T[];
	itemWidth: number;
	itemHeight: number;
	containerWidth: number;
	containerHeight: number;
	columns: number;
	renderItem: (item: T, index: number) => React.ReactNode;
	keyExtractor?: (item: T, index: number) => string;
	overscan?: number;
	className?: string;
	onScroll?: (scrollTop: number, scrollLeft: number) => void;
}

export function VirtualizedGrid<T>({
	items,
	itemWidth,
	itemHeight,
	containerWidth,
	containerHeight,
	columns,
	renderItem,
	keyExtractor,
	overscan = 2,
	className,
	onScroll,
}: VirtualizedGridProps<T>): React.ReactElement {
	const [scrollTop, setScrollTop] = useState(0);
	const [scrollLeft, setScrollLeft] = useState(0);
	const scrollContainerRef = useRef<HTMLDivElement>(null);

	// Calculate visible range
	const visibleRange = useMemo(() => {
		const rows = Math.ceil(items.length / columns);
		const startRow = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
		const endRow = Math.min(
			rows - 1,
			Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan,
		);
		const startCol = Math.max(0, Math.floor(scrollLeft / itemWidth) - overscan);
		const endCol = Math.min(
			columns - 1,
			Math.ceil((scrollLeft + containerWidth) / itemWidth) + overscan,
		);

		return { startRow, endRow, startCol, endCol };
	}, [scrollTop, scrollLeft, containerWidth, containerHeight, itemWidth, itemHeight, columns, items.length, overscan]);

	// Get visible items
	const visibleItems = useMemo(() => {
		const itemsList: Array<{ item: T; index: number; row: number; col: number }> = [];
		const rows = Math.ceil(items.length / columns);

		for (let row = visibleRange.startRow; row <= visibleRange.endRow; row++) {
			for (let col = visibleRange.startCol; col <= visibleRange.endCol; col++) {
				const index = row * columns + col;
				if (index >= 0 && index < items.length) {
					itemsList.push({
						item: items[index],
						index,
						row,
						col,
					});
				}
			}
		}

		return itemsList;
	}, [items, columns, visibleRange]);

	// Total dimensions
	const totalHeight = Math.ceil(items.length / columns) * itemHeight;
	const totalWidth = columns * itemWidth;

	// Offset for visible items
	const offsetY = visibleRange.startRow * itemHeight;
	const offsetX = visibleRange.startCol * itemWidth;

	// Handle scroll
	const handleScroll = useCallback(
		(event: React.UIEvent<HTMLDivElement>) => {
			const newScrollTop = event.currentTarget.scrollTop;
			const newScrollLeft = event.currentTarget.scrollLeft;
			setScrollTop(newScrollTop);
			setScrollLeft(newScrollLeft);
			onScroll?.(newScrollTop, newScrollLeft);
		},
		[onScroll],
	);

	// Default key extractor
	const getKey = useCallback(
		(item: T, index: number) => {
			if (keyExtractor) {
				return keyExtractor(item, index);
			}
			return `item-${index}`;
		},
		[keyExtractor],
	);

	return (
		<div
			ref={scrollContainerRef}
			className={cn("overflow-auto", className)}
			style={{ width: containerWidth, height: containerHeight }}
			onScroll={handleScroll}
		>
			<div style={{ height: totalHeight, width: totalWidth, position: "relative" }}>
				<div
					style={{
						transform: `translate(${offsetX}px, ${offsetY}px)`,
						position: "absolute",
						top: 0,
						left: 0,
						display: "grid",
						gridTemplateColumns: `repeat(${columns}, ${itemWidth}px)`,
					}}
				>
					{visibleItems.map(({ item, index, row, col }) => (
						<div
							key={getKey(item, index)}
							style={{
								width: itemWidth,
								height: itemHeight,
							}}
						>
							{renderItem(item, index)}
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

