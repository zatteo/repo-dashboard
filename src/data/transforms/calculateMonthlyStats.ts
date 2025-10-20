/**
 * Data transformation utilities for calculating monthly statistics
 */

import { getMonthKey, formatMonthName } from '../../utils/dateUtils'

export interface MonthlyStats {
	month: string
	year: number
	stable: number
	beta: number
	total: number
}

export interface MonthlyItem {
	published_at?: string
	created_at: string
	prerelease?: boolean
}

/**
 * Calculates monthly release statistics for a list of releases
 * Returns data for the last 12 months, filling in zeros for months with no releases
 */
export function calculateMonthlyReleaseStats(
	items: MonthlyItem[]
): MonthlyStats[] {
	const monthlyMap = new Map<string, MonthlyStats>()

	// Aggregate data by month
	items.forEach((item) => {
		const dateString = item.published_at || item.created_at
		const date = new Date(dateString)
		const key = getMonthKey(dateString)
		const monthName = formatMonthName(key)

		if (!monthlyMap.has(key)) {
			monthlyMap.set(key, {
				month: monthName,
				year: date.getFullYear(),
				stable: 0,
				beta: 0,
				total: 0,
			})
		}

		const stats = monthlyMap.get(key)!
		stats.total++
		if (item.prerelease) {
			stats.beta++
		} else {
			stats.stable++
		}
	})

	// Fill in missing months with zero releases for the last 12 months
	const now = new Date()
	const last12Months: MonthlyStats[] = []

	for (let i = 11; i >= 0; i--) {
		const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
		const key = getMonthKey(targetDate.toISOString())
		const monthName = formatMonthName(key)

		const existingData = monthlyMap.get(key)

		last12Months.push(
			existingData || {
				month: monthName,
				year: targetDate.getFullYear(),
				stable: 0,
				beta: 0,
				total: 0,
			}
		)
	}

	return last12Months
}

export interface WorkflowMonthlyStats {
	month: string
	year: number
	averageDuration: number | null
	totalRuns: number
}

/**
 * Calculates average workflow duration by month
 */
export function calculateWorkflowMonthlyStats(
	runs: Array<{ created_at: string; duration_seconds: number }>
): WorkflowMonthlyStats[] {
	const monthlyMap = new Map<string, { total: number; count: number }>()

	// Aggregate data by month
	runs.forEach((run) => {
		const key = getMonthKey(run.created_at)

		if (!monthlyMap.has(key)) {
			monthlyMap.set(key, { total: 0, count: 0 })
		}

		const stats = monthlyMap.get(key)!
		stats.total += run.duration_seconds
		stats.count++
	})

	// Fill in missing months for the last 12 months
	const now = new Date()
	const last12Months: WorkflowMonthlyStats[] = []

	for (let i = 11; i >= 0; i--) {
		const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
		const key = getMonthKey(targetDate.toISOString())
		const monthName = formatMonthName(key)

		const existingData = monthlyMap.get(key)

		last12Months.push({
			month: monthName,
			year: targetDate.getFullYear(),
			// Convert seconds to minutes and round to 2 decimal places
			// Use null for months with no data so the line chart skips them
			averageDuration: existingData
				? Math.round((existingData.total / existingData.count / 60) * 100) / 100
				: (null as any),
			totalRuns: existingData ? existingData.count : 0,
		})
	}

	return last12Months
}
