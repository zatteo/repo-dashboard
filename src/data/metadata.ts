import { createServerFn } from '@tanstack/react-start'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export interface Metadata {
	lastUpdated: string | null
}

export const getMetadata = createServerFn({
	method: 'GET',
}).handler(async (): Promise<Metadata> => {
	try {
		const cachePath = join(process.cwd(), 'data', 'cache', 'metadata.json')
		const data = readFileSync(cachePath, 'utf-8')
		return JSON.parse(data) as Metadata
	} catch (error) {
		console.error('Error reading metadata:', error)
		return { lastUpdated: null }
	}
})
