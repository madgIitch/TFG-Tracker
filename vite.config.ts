import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import type { Plugin } from 'vite'

function gitDiffPlugin(): Plugin {
  return {
    name: 'git-diff-api',
    configureServer(server) {

      // ── /api/repo-files : count tracked files in given folders ──────────
      server.middlewares.use('/api/repo-files', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end('Method not allowed'); return }
        let body = ''
        req.on('data', (chunk: Buffer) => { body += chunk.toString() })
        req.on('end', () => {
          try {
            const { repoPath, folders = ['src', 'supabase'] } = JSON.parse(body) as {
              repoPath: string
              folders?: string[]
            }
            if (!repoPath) { res.statusCode = 400; res.end(JSON.stringify({ error: 'repoPath es obligatorio' })); return }
            const folderArgs = folders.map((f) => `"${f}"`).join(' ')
            const output = execSync(
              `git ls-files -- ${folderArgs}`,
              { cwd: repoPath, encoding: 'utf-8', timeout: 10000 }
            )
            const count = output.trim().split('\n').filter(Boolean).length
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ count }))
          } catch (e: unknown) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }))
          }
        })
      })

      // ── /api/save-backup : write JSON backup to project root ─────────────
      server.middlewares.use('/api/save-backup', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end('Method not allowed'); return }
        let body = ''
        req.on('data', (chunk: Buffer) => { body += chunk.toString() })
        req.on('end', () => {
          try {
            const { filename, content } = JSON.parse(body) as { filename: string; content: string }
            if (!filename || !content) { res.statusCode = 400; res.end(JSON.stringify({ error: 'filename y content son obligatorios' })); return }
            const filePath = join(process.cwd(), filename)
            writeFileSync(filePath, content, 'utf-8')
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: true, path: filePath }))
          } catch (e: unknown) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }))
          }
        })
      })

      // ── /api/save-images : write image files to exported-images/ folder ──
      server.middlewares.use('/api/save-images', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end('Method not allowed'); return }
        let body = ''
        req.on('data', (chunk: Buffer) => { body += chunk.toString() })
        req.on('end', () => {
          try {
            const { images } = JSON.parse(body) as {
              images: Array<{ path: string; data: string }>
            }
            if (!Array.isArray(images)) { res.statusCode = 400; res.end(JSON.stringify({ error: 'images debe ser un array' })); return }
            const baseDir = join(process.cwd(), 'exported-images')
            let count = 0
            for (const img of images) {
              const fullPath = join(baseDir, img.path)
              mkdirSync(dirname(fullPath), { recursive: true })
              const match = img.data.match(/^data:[^;]+;base64,(.+)$/)
              if (!match) continue
              writeFileSync(fullPath, Buffer.from(match[1], 'base64'))
              count++
            }
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: true, count, folder: baseDir }))
          } catch (e: unknown) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }))
          }
        })
      })

      // ── /api/git-diff : diff between two commits ─────────────────────────
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

            const nameStatus = execSync(
              `git diff --name-status "${fromCommit}" "${toCommit}"`,
              { cwd: repoPath, encoding: 'utf-8', timeout: 10000 }
            )
            const shortStat = execSync(
              `git diff --shortstat "${fromCommit}" "${toCommit}"`,
              { cwd: repoPath, encoding: 'utf-8', timeout: 10000 }
            )

            const lines = nameStatus.trim().split('\n').filter(Boolean)
            let created = 0
            let modified = 0

            const files: { status: string; path: string }[] = []

            for (const line of lines) {
              const parts = line.split('\t')
              const statusCode = parts[0][0]
              let filePath: string
              if ((statusCode === 'R' || statusCode === 'C') && parts.length >= 3) {
                filePath = `${parts[1]} → ${parts[2]}`
              } else {
                filePath = parts[1] ?? ''
              }
              files.push({ status: statusCode, path: filePath })

              if (statusCode === 'A') created++
              else if (statusCode === 'M' || statusCode === 'R' || statusCode === 'C' || statusCode === 'T') modified++
            }

            const addedMatch   = shortStat.match(/(\d+) insertion/)
            const removedMatch = shortStat.match(/(\d+) deletion/)
            const linesAdded   = addedMatch   ? parseInt(addedMatch[1],   10) : 0
            const linesRemoved = removedMatch ? parseInt(removedMatch[1], 10) : 0

            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ created, modified, total: lines.length, linesAdded, linesRemoved, files }))
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
