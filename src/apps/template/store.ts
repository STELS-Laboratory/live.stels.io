/**
 * Template App Store
 * State management with Zustand
 * 
 * INSTRUCTIONS:
 * 1. Rename types and interfaces for your app
 * 2. Add your state properties
 * 3. Implement your actions
 * 4. Update store name in devtools and persist
 */

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { TemplateData } from "./types";

/**
 * Template App Store State
 */
interface TemplateStoreState {
	/** App data */
	data: TemplateData | null;
	/** Loading state */
	isLoading: boolean;
	/** Error message */
	error: string | null;
	/** Last update timestamp */
	lastUpdate: number | null;
	/** Hydration flag */
	_hasHydrated: boolean;
}

/**
 * Template App Store Actions
 */
interface TemplateStoreActions {
	/** Load data from API or source */
	loadData: () => Promise<void>;
	/** Update data */
	setData: (data: TemplateData) => void;
	/** Clear error */
	clearError: () => void;
	/** Reset all data */
	resetData: () => void;
	/** Set hydration flag */
	setHasHydrated: (state: boolean) => void;
}

/**
 * Combined store type
 */
export type TemplateStoreType = TemplateStoreState & TemplateStoreActions;

/**
 * Template App Store
 */
export const useTemplateStore = create<TemplateStoreType>()(
	devtools(
		persist(
			(set) => ({
				// Initial State
				data: null,
				isLoading: false,
				error: null,
				lastUpdate: null,
				_hasHydrated: false,

				// Actions
				loadData: async (): Promise<void> => {
					set({ isLoading: true, error: null });

					try {
						// TODO: Replace with your actual data loading logic
						// Example: Fetch from API
						// const response = await fetch('/api/your-endpoint');
						// const data = await response.json();

						// Simulated data loading
						await new Promise((resolve) => setTimeout(resolve, 1000));

						const mockData: TemplateData = {
							id: "example-id",
							title: "Example Data",
							value: 42,
							timestamp: Date.now(),
						};

						set({
							data: mockData,
							isLoading: false,
							lastUpdate: Date.now(),
							error: null,
						});
					} catch (error) {
						set({
							isLoading: false,
							error:
								error instanceof Error
									? error.message
									: "Failed to load data",
						});
					}
				},

				setData: (data: TemplateData): void => {
					set({
						data,
						lastUpdate: Date.now(),
						error: null,
					});
				},

				clearError: (): void => {
					set({ error: null });
				},

				resetData: (): void => {
					set({
						data: null,
						error: null,
						lastUpdate: null,
					});
				},

				setHasHydrated: (state: boolean): void => {
					set({ _hasHydrated: state });
				},
			}),
			{
				name: "template-app-store",
				partialize: (state) => ({
					data: state.data,
					lastUpdate: state.lastUpdate,
					// Don't persist loading/error states
				}),
				onRehydrateStorage: () => (state) => {
					state?.setHasHydrated(true);
				},
			},
		),
		{
			name: "Template App Store",
		},
	),
);

/**
 * Hooks for specific parts of the store
 */
export const useTemplateData = () => useTemplateStore((state) => state.data);
export const useTemplateLoading = () =>
	useTemplateStore((state) => state.isLoading);
export const useTemplateError = () => useTemplateStore((state) => state.error);
export const useTemplateActions = () =>
	useTemplateStore((state) => ({
		loadData: state.loadData,
		setData: state.setData,
		clearError: state.clearError,
		resetData: state.resetData,
	}));

