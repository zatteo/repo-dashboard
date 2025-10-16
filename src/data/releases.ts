import { createServerFn } from '@tanstack/react-start'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { GitHubRelease } from '../types/github'

export const getReleases = createServerFn({
  method: 'GET',
}).handler(async () => {
  try {
    const cachePath = join(process.cwd(), 'data', 'cache', 'releases.json')
    const data = readFileSync(cachePath, 'utf-8')
    return JSON.parse(data) as GitHubRelease[]
  } catch (error) {
    console.error('Error reading cached releases data:', error)
    return []
  }
})
