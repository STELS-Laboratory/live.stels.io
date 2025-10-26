/**
 * Example Custom Hook
 * Template for creating reusable hooks
 * 
 * INSTRUCTIONS:
 * 1. Copy this file for new hooks
 * 2. Use camelCase naming: useYourHook.ts
 * 3. Export typed return values
 * 4. Document hook purpose and usage
 */

import { useCallback, useEffect, useState } from "react";

/**
 * Hook return type
 * Always define explicit return types
 */
interface UseExampleReturn {
	/** Current data */
	data: string | null;
	/** Loading state */
	isLoading: boolean;
	/** Error message */
	error: string | null;
	/** Refresh data */
	refresh: () => Promise<void>;
	/** Reset to initial state */
	reset: () => void;
}

/**
 * Example custom hook
 * Demonstrates data fetching with error handling
 * 
 * @param initialValue - Initial data value
 * @param autoLoad - Whether to load data on mount
 * @returns Object with data, loading state, and actions
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { data, isLoading, error, refresh } = useExample("initial", true);
 *   
 *   if (isLoading) return <Loading />;
 *   if (error) return <Error message={error} />;
 *   
 *   return <div>{data}</div>;
 * }
 * ```
 */
export function useExample(
	initialValue: string = "",
	autoLoad: boolean = false,
): UseExampleReturn {
	const [data, setData] = useState<string | null>(initialValue || null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	/**
	 * Load data from source
	 */
	const loadData = useCallback(async (): Promise<void> => {
		setIsLoading(true);
		setError(null);

		try {
			// TODO: Replace with actual data fetching
			// Example: const response = await fetch('/api/endpoint');
			// const result = await response.json();

			// Simulated async operation
			await new Promise((resolve) => setTimeout(resolve, 1000));

			setData("Example data loaded");
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to load data",
			);
		} finally {
			setIsLoading(false);
		}
	}, []);

	/**
	 * Reset to initial state
	 */
	const reset = useCallback((): void => {
		setData(initialValue || null);
		setError(null);
		setIsLoading(false);
	}, [initialValue]);

	/**
	 * Auto-load on mount if enabled
	 */
	useEffect(() => {
		if (autoLoad) {
			loadData();
		}
	}, [autoLoad, loadData]);

	return {
		data,
		isLoading,
		error,
		refresh: loadData,
		reset,
	};
}

/**
 * Hook for managing form state
 */
interface UseFormReturn<T> {
	values: T;
	errors: Partial<Record<keyof T, string>>;
	handleChange: (field: keyof T, value: unknown) => void;
	handleSubmit: (onSubmit: (values: T) => Promise<void>) => Promise<void>;
	reset: () => void;
	isSubmitting: boolean;
}

export function useForm<T extends Record<string, unknown>>(
	initialValues: T,
): UseFormReturn<T> {
	const [values, setValues] = useState<T>(initialValues);
	const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleChange = useCallback((field: keyof T, value: unknown): void => {
		setValues((prev) => ({ ...prev, [field]: value }));
		// Clear error when field changes
		setErrors((prev) => ({ ...prev, [field]: undefined }));
	}, []);

	const handleSubmit = useCallback(
		async (onSubmit: (values: T) => Promise<void>): Promise<void> => {
			setIsSubmitting(true);
			setErrors({});

			try {
				await onSubmit(values);
			} catch (err) {
				if (err instanceof Error) {
					setErrors({ form: err.message } as Partial<
						Record<keyof T, string>
					>);
				}
			} finally {
				setIsSubmitting(false);
			}
		},
		[values],
	);

	const reset = useCallback((): void => {
		setValues(initialValues);
		setErrors({});
		setIsSubmitting(false);
	}, [initialValues]);

	return {
		values,
		errors,
		handleChange,
		handleSubmit,
		reset,
		isSubmitting,
	};
}

