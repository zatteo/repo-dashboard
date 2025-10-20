/**
 * Workflow statistics calculation utilities
 */

import type { GitHubWorkflowRun } from '../../types/github'

export interface WorkflowStats {
	total: number
	successful: number
	failed: number
	avgDuration: number
	successRate: number
}

/**
 * Calculates overall statistics for workflow runs
 */
export function calculateWorkflowStats(runs: GitHubWorkflowRun[]): WorkflowStats {
	if (runs.length === 0) {
		return {
			total: 0,
			successful: 0,
			failed: 0,
			avgDuration: 0,
			successRate: 0,
		}
	}

	const successful = runs.filter((r) => r.conclusion === 'success').length
	const failed = runs.filter((r) => r.conclusion === 'failure').length
	const avgDuration =
		runs.reduce((sum, r) => sum + r.duration_seconds, 0) / runs.length / 60

	return {
		total: runs.length,
		successful,
		failed,
		avgDuration: Math.round(avgDuration * 10) / 10,
		successRate: Math.round((successful / runs.length) * 100),
	}
}
