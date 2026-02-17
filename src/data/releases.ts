import type { GitHubRelease } from '../types/github';

const DATA_BASE_URL = import.meta.env.BASE_URL || '/';

export async function getReleases(): Promise<GitHubRelease[]> {
	try {
		const response = await fetch(`${DATA_BASE_URL}data/cache/releases.json`);
		if (!response.ok) {
			throw new Error(`Failed to fetch releases: ${response.status}`);
		}
		return (await response.json()) as GitHubRelease[];
	} catch (error) {
		console.error('Error reading cached releases data:', error);
		return [];
	}
}
