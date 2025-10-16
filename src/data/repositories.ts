import { createServerFn } from '@tanstack/react-start'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { GitHubRepository } from '../types/github'

export const getRepositories = createServerFn({
  method: 'GET',
}).handler(async () => {
  try {
    const cachePath = join(process.cwd(), 'data', 'cache', 'repositories.json')
    const data = readFileSync(cachePath, 'utf-8')
    return JSON.parse(data) as GitHubRepository[]
  } catch (error) {
    console.error('Error reading cached repository data:', error)
    return []
  }
})
