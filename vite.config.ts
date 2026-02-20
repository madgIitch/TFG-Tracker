import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'
import type { Plugin } from 'vite'

function gitDiffPlugin(): Plugin {
  return {
    name: 'git-diff-api',
    configureServer(server) {
      server.middlewares.use('/api/git-diff', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('Method not allowed')
          return
        }

        let body = ''
        req.on('data', (chunk: Buffer) => { body += chunk.toString() })
        req.on('end', () => {
          try {
            const { repoPath, fromCommit, toCommit } = JSON.parse(body) as {
              repoPath: string
              fromCommit: string
              toCommit: string
            }

            if (!repoPath || !fromCommit || !toCommit) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'repoPath, fromCommit y toCommit son obligatorios' }))
              return
            }

            const output = execSync(
              `git diff --name-status "${fromCommit}" "${toCommit}"`,
              { cwd: repoPath, encoding: 'utf-8', timeout: 10000 }
            )

            const lines = output.trim().split('\n').filter(Boolean)
            let created = 0
            let modified = 0

            for (const line of lines) {
              const status = line[0]
              if (status === 'A') created++
              else if (status === 'M' || status === 'R' || status === 'C' || status === 'T') modified++
            }

            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ created, modified, total: lines.length }))
          } catch (e: unknown) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            const message = e instanceof Error ? e.message : String(e)
            res.end(JSON.stringify({ error: message }))
          }
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), gitDiffPlugin()],
})
