import { createServerFn } from '@tanstack/react-start'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { PackageData } from '../types/github'

export const getPackages = createServerFn({
  method: 'GET',
}).handler(async () => {
  try {
    const cachePath = join(process.cwd(), 'data', 'cache', 'packages.json')
    const data = readFileSync(cachePath, 'utf-8')
    return JSON.parse(data) as PackageData[]
  } catch (error) {
    console.error('Error reading cached packages data:', error)
    return []
  }
})
