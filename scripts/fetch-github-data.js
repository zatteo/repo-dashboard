import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')

// Read repository configuration
const configPath = join(rootDir, 'data', 'repositories.json')
const config = JSON.parse(readFileSync(configPath, 'utf-8'))

// GitHub API token (optional, but recommended to avoid rate limits)
const GITHUB_TOKEN = process.env.GITHUB_TOKEN

async function fetchRepoData(owner, repo) {
  const url = `https://api.github.com/repos/${owner}/${repo}`
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'repo-dashboard'
  }

  if (GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`
  }

  console.log(`Fetching data for ${owner}/${repo}...`)

  const response = await fetch(url, { headers })

  if (!response.ok) {
    throw new Error(`Failed to fetch ${owner}/${repo}: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

async function fetchReleases(owner, repo) {
  const url = `https://api.github.com/repos/${owner}/${repo}/releases?per_page=100`
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'repo-dashboard'
  }

  if (GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`
  }

  console.log(`Fetching releases for ${owner}/${repo}...`)

  const response = await fetch(url, { headers })

  if (!response.ok) {
    throw new Error(`Failed to fetch releases for ${owner}/${repo}: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

async function fetchWorkflowRuns(owner, repo) {
  const url = `https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=100&status=completed`
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'repo-dashboard'
  }

  if (GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`
  }

  console.log(`Fetching workflow runs for ${owner}/${repo}...`)

  const response = await fetch(url, { headers })

  if (!response.ok) {
    throw new Error(`Failed to fetch workflow runs for ${owner}/${repo}: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

async function fetchPackageJson(owner, repo) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/package.json`
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'repo-dashboard'
  }

  if (GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`
  }

  console.log(`Fetching package.json for ${owner}/${repo}...`)

  const response = await fetch(url, { headers })

  if (!response.ok) {
    throw new Error(`Failed to fetch package.json for ${owner}/${repo}: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()

  // Decode base64 content
  const content = Buffer.from(data.content, 'base64').toString('utf-8')
  return JSON.parse(content)
}

async function main() {
  const results = []
  const allReleases = []
  const allWorkflowRuns = []
  const allPackages = []

  for (const { owner, repo } of config.repositories) {
    try {
      const data = await fetchRepoData(owner, repo)

      // Extract only the fields we need
      const repoData = {
        id: data.id,
        name: data.name,
        full_name: data.full_name,
        description: data.description,
        html_url: data.html_url,
        homepage: data.homepage,
        language: data.language,
        stargazers_count: data.stargazers_count,
        watchers_count: data.watchers_count,
        forks_count: data.forks_count,
        open_issues_count: data.open_issues_count,
        created_at: data.created_at,
        updated_at: data.updated_at,
        pushed_at: data.pushed_at,
        topics: data.topics || [],
        license: data.license,
        owner: {
          login: data.owner.login,
          avatar_url: data.owner.avatar_url,
          html_url: data.owner.html_url
        }
      }

      results.push(repoData)
      console.log(`✓ Successfully fetched ${owner}/${repo}`)

      // Fetch releases for this repository
      try {
        const releases = await fetchReleases(owner, repo)

        const releaseData = releases.map(release => ({
          id: release.id,
          repo_full_name: data.full_name,
          repo_name: data.name,
          tag_name: release.tag_name,
          name: release.name,
          body: release.body,
          prerelease: release.prerelease,
          draft: release.draft,
          created_at: release.created_at,
          published_at: release.published_at,
          html_url: release.html_url,
          author: {
            login: release.author.login,
            avatar_url: release.author.avatar_url
          }
        }))

        allReleases.push(...releaseData)
        console.log(`✓ Successfully fetched ${releases.length} releases for ${owner}/${repo}`)
      } catch (error) {
        console.error(`✗ Error fetching releases for ${owner}/${repo}:`, error.message)
      }

      // Fetch workflow runs for this repository
      try {
        const workflowRunsResponse = await fetchWorkflowRuns(owner, repo)
        const runs = workflowRunsResponse.workflow_runs || []

        // Filter for CI/CD workflow on master branch only
        const filteredRuns = runs.filter(run =>
          run.name === 'CI/CD' && run.head_branch === 'master'
        )

        const workflowData = filteredRuns.map(run => {
          // Calculate duration in seconds
          const startedAt = new Date(run.run_started_at || run.created_at)
          const updatedAt = new Date(run.updated_at)
          const durationSeconds = (updatedAt - startedAt) / 1000

          return {
            id: run.id,
            repo_full_name: data.full_name,
            repo_name: data.name,
            name: run.name,
            workflow_id: run.workflow_id,
            status: run.status,
            conclusion: run.conclusion,
            run_number: run.run_number,
            event: run.event,
            created_at: run.created_at,
            updated_at: run.updated_at,
            run_started_at: run.run_started_at,
            duration_seconds: durationSeconds,
            html_url: run.html_url,
            head_branch: run.head_branch
          }
        })

        allWorkflowRuns.push(...workflowData)
        console.log(`✓ Successfully fetched ${filteredRuns.length} CI/CD workflow runs on master for ${owner}/${repo}`)
      } catch (error) {
        console.error(`✗ Error fetching workflow runs for ${owner}/${repo}:`, error.message)
      }

      // Fetch package.json for this repository
      try {
        const packageJson = await fetchPackageJson(owner, repo)

        const packageData = {
          repo_full_name: data.full_name,
          repo_name: data.name,
          dependencies: packageJson.dependencies || {},
          devDependencies: packageJson.devDependencies || {}
        }

        allPackages.push(packageData)
        console.log(`✓ Successfully fetched package.json for ${owner}/${repo}`)
      } catch (error) {
        console.error(`✗ Error fetching package.json for ${owner}/${repo}:`, error.message)
      }
    } catch (error) {
      console.error(`✗ Error fetching ${owner}/${repo}:`, error.message)
    }
  }

  // Save the results
  const outputDir = join(rootDir, 'data', 'cache')
  mkdirSync(outputDir, { recursive: true })

  const lastUpdated = new Date().toISOString()

  const repoOutputPath = join(outputDir, 'repositories.json')
  writeFileSync(repoOutputPath, JSON.stringify(results, null, 2), 'utf-8')

  const releasesOutputPath = join(outputDir, 'releases.json')
  writeFileSync(releasesOutputPath, JSON.stringify(allReleases, null, 2), 'utf-8')

  const workflowRunsOutputPath = join(outputDir, 'workflow-runs.json')
  writeFileSync(workflowRunsOutputPath, JSON.stringify(allWorkflowRuns, null, 2), 'utf-8')

  const packagesOutputPath = join(outputDir, 'packages.json')
  writeFileSync(packagesOutputPath, JSON.stringify(allPackages, null, 2), 'utf-8')

  const metadataOutputPath = join(outputDir, 'metadata.json')
  writeFileSync(metadataOutputPath, JSON.stringify({ lastUpdated }, null, 2), 'utf-8')

  console.log(`\n✓ Saved ${results.length} repositories to ${repoOutputPath}`)
  console.log(`✓ Saved ${allReleases.length} releases to ${releasesOutputPath}`)
  console.log(`✓ Saved ${allWorkflowRuns.length} workflow runs to ${workflowRunsOutputPath}`)
  console.log(`✓ Saved ${allPackages.length} package.json files to ${packagesOutputPath}`)
  console.log(`Last updated: ${lastUpdated}`)
}

main().catch(console.error)
