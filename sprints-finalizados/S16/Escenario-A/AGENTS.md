## Skills
### Available skills
- read-audit-counter: Track files read by Codex, show per-message and total counts, and append read events to `.audit/read-audit-counter.csv`. (file: C:/Users/peorr/.codex/skills/read-audit-counter/SKILL.md)
- skill-creator: Guide for creating effective skills. (file: C:/Users/peorr/.codex/skills/.system/skill-creator/SKILL.md)
- skill-installer: Install Codex skills from curated list or GitHub repo path. (file: C:/Users/peorr/.codex/skills/.system/skill-installer/SKILL.md)

### How to use skills
- If user names a skill (`$SkillName`) or clearly asks for what it does, use that skill for this turn.
- Sticky exception: if user activates `$read-audit-counter`, keep it active for all subsequent turns until user says `disable read audit counter`.
- If skill file is missing, say it briefly and continue with best fallback.
- Read only needed parts of SKILL.md and referenced files.
- Keep context small and avoid loading unrelated files.

### Read-audit-counter enforcement
- While `read-audit-counter` is active, every file-read command must be logged to `.audit/read-audit-counter.csv` in the same turn.
- File-read commands include at least: `Get-Content`, `Import-Csv`, `rg` (when concrete file paths are known).
- Before final response, append missing read entries for that turn using `C:/Users/peorr/.codex/skills/read-audit-counter/scripts/log-read.ps1`.
- Never log guessed paths.
