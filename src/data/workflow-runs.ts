import { createServerFn } from '@tanstack/react-start'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { GitHubWorkflowRun } from '../types/github'

export const getWorkflowRuns = createServerFn({
  method: 'GET',
}).handler(async () => {
  try {
    const cachePath = join(process.cwd(), 'data', 'cache', 'workflow-runs.json')
    const data = readFileSync(cachePath, 'utf-8')
    return JSON.parse(data) as GitHubWorkflowRun[]
  } catch (error) {
    console.error('Error reading cached workflow runs data:', error)
    return []
  }
})
