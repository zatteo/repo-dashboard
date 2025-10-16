import { createServerFn } from '@tanstack/react-start'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export const getMetadata = createServerFn({
  method: 'GET',
}).handler(async () => {
  try {
    const cachePath = join(process.cwd(), 'data', 'cache', 'metadata.json')
    const data = readFileSync(cachePath, 'utf-8')
    return JSON.parse(data) as { lastUpdated: string }
  } catch (error) {
    console.error('Error reading metadata:', error)
    return { lastUpdated: null }
  }
})
