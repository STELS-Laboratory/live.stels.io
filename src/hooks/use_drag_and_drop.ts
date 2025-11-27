import { useCallback, useEffect, useRef, useState } from "react";
import type { SessionWidgetData } from "@/lib/canvas-types";

/**
 * Drag and drop state interface
 */
interface DragState {
	isDragging: boolean;
	draggedWidget: SessionWidgetData | null;
	mousePosition: { x: number; y: number } | null;
	dropZoneActive: boolean;
}

/**
 * Hook for enhanced drag and drop functionality
 */
export function useDragAndDrop() {
	const [dragState, setDragState] = useState<DragState>({
		isDragging: false,
		draggedWidget: null,
		mousePosition: null,
		dropZoneActive: false,
	});

	const dragStartTimeRef = useRef<number>(0);
	const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	/**
	 * Handle drag start
	 */
	const handleDragStart = useCallback(
		(event: React.DragEvent<HTMLDivElement>, widgetData: SessionWidgetData) => {
			dragStartTimeRef.current = Date.now();
			
			setDragState({
				isDragging: true,
				draggedWidget: widgetData,
				mousePosition: { x: event.clientX, y: event.clientY },
				dropZoneActive: false,
			});

			// Set drag data
			event.dataTransfer.setData("application/reactflow", JSON.stringify(widgetData));
			event.dataTransfer.effectAllowed = "move";
			
			// Add visual feedback
			if (event.dataTransfer.setDragImage) {
				const dragImage = document.createElement("div");
				// Use name for schemas, module for regular widgets
				const displayText = widgetData.type === "schema"
					? widgetData.name || widgetData.widgetKey || "Schema"
					: widgetData.module || widgetData.channel || "Widget";
				
				dragImage.innerHTML = `
					<div style="
						background: #c9995a;
						color: black;
						padding: 8px 12px;
						border-radius: 6px;
						font-size: 12px;
						font-weight: 500;
						box-shadow: 0 4px 12px rgba(0,0,0,0.3);
						border: 2px solid #d9ad66;
					">
						${displayText}
					</div>
				`;
				dragImage.style.position = "absolute";
				dragImage.style.top = "-1000px";
				document.body.appendChild(dragImage);
				event.dataTransfer.setDragImage(dragImage, 0, 0);
				
				// Clean up after a short delay
				setTimeout(() => {
					document.body.removeChild(dragImage);
				}, 0);
			}
		},
		[],
	);

	/**
	 * Handle drag end
	 */
	const handleDragEnd = useCallback(() => {
		// Add a small delay to ensure drop event is processed first
		setTimeout(() => {
			setDragState({
				isDragging: false,
				draggedWidget: null,
				mousePosition: null,
				dropZoneActive: false,
			});
		}, 100);
	}, []);

	/**
	 * Handle drag over
	 */
	const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		event.dataTransfer.dropEffect = "move";
		
		setDragState(prev => ({
			...prev,
			mousePosition: { x: event.clientX, y: event.clientY },
			dropZoneActive: true,
		}));
	}, []);

	/**
	 * Handle drag leave
	 */
	const handleDragLeave = useCallback(() => {
		setDragState(prev => ({
			...prev,
			dropZoneActive: false,
		}));
	}, []);

	/**
	 * Handle drop
	 */
	const handleDrop = useCallback(
		(event: React.DragEvent<HTMLDivElement>, onDrop: (data: SessionWidgetData, position: { x: number; y: number }) => void) => {
			event.preventDefault();
			
			// Immediately reset drag state
			setDragState({
				isDragging: false,
				draggedWidget: null,
				mousePosition: null,
				dropZoneActive: false,
			});
			
			try {
				const widgetData = JSON.parse(event.dataTransfer.getData("application/reactflow"));
				const position = { x: event.clientX, y: event.clientY };
				
				onDrop(widgetData, position);
			} catch {
			// Error handled silently
		}
		},
		[],
	);

	/**
	 * Handle touch start for mobile devices
	 */
	const handleTouchStart = useCallback(
		(event: React.TouchEvent<HTMLDivElement>, widgetData: SessionWidgetData) => {
			const touch = event.touches[0];
			
			// Start long press detection
			longPressTimeoutRef.current = setTimeout(() => {
				setDragState({
					isDragging: true,
					draggedWidget: widgetData,
					mousePosition: { x: touch.clientX, y: touch.clientY },
					dropZoneActive: false,
				});
			}, 500); // 500ms long press
		},
		[],
	);

	/**
	 * Handle touch move for mobile devices
	 */
	const handleTouchMove = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
		if (dragState.isDragging && event.touches[0]) {
			const touch = event.touches[0];
			setDragState(prev => ({
				...prev,
				mousePosition: { x: touch.clientX, y: touch.clientY },
			}));
		}
	}, [dragState.isDragging]);

	/**
	 * Handle touch end for mobile devices
	 */
	const handleTouchEnd = useCallback(() => {
		if (longPressTimeoutRef.current) {
			clearTimeout(longPressTimeoutRef.current);
			longPressTimeoutRef.current = null;
		}
		
		setDragState({
			isDragging: false,
			draggedWidget: null,
			mousePosition: null,
			dropZoneActive: false,
		});
	}, []);

	/**
	 * Handle mouse move for drag tracking
	 */
	const handleMouseMove = useCallback((event: MouseEvent) => {
		if (dragState.isDragging) {
			setDragState(prev => ({
				...prev,
				mousePosition: { x: event.clientX, y: event.clientY },
			}));
		}
	}, [dragState.isDragging]);

	// Add global mouse move listener and click handler
	useEffect(() => {
		if (dragState.isDragging) {
			document.addEventListener("mousemove", handleMouseMove);
			
			// Add click handler to reset state if user clicks outside
			const handleGlobalClick = () => {
				setDragState({
					isDragging: false,
					draggedWidget: null,
					mousePosition: null,
					dropZoneActive: false,
				});
			};
			
			// Add escape key handler to cancel drag
			const handleEscapeKey = (event: KeyboardEvent) => {
				if (event.key === "Escape") {
					setDragState({
						isDragging: false,
						draggedWidget: null,
						mousePosition: null,
						dropZoneActive: false,
					});
				}
			};
			
			document.addEventListener("click", handleGlobalClick);
			document.addEventListener("keydown", handleEscapeKey);
			
			return () => {
				document.removeEventListener("mousemove", handleMouseMove);
				document.removeEventListener("click", handleGlobalClick);
				document.removeEventListener("keydown", handleEscapeKey);
			};
		}
	}, [dragState.isDragging, handleMouseMove]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (longPressTimeoutRef.current) {
				clearTimeout(longPressTimeoutRef.current);
			}
		};
	}, []);

	return {
		dragState,
		handleDragStart,
		handleDragEnd,
		handleDragOver,
		handleDragLeave,
		handleDrop,
		handleTouchStart,
		handleTouchMove,
		handleTouchEnd,
	};
}
