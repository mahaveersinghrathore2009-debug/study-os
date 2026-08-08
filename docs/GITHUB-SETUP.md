# GitHub setup & daily workflow

## One-time setup

1. Create the repo on github.com: **+ → New repository → `StudyOS` → empty (no README/.gitignore/license) → Create**
2. Link it:
   ```bash
   cd C:/Users/mvart/StudyOS
   git remote add origin https://github.com/YOUR-USERNAME/StudyOS.git
   ```
3. First push (a browser popup will ask you to sign in — that's normal):
   ```bash
   scripts/push.sh        # or: git push -u origin main && git push -u origin develop
   ```

## After that — every day

```bash
git add .
git commit -m "what I changed"
git push
```

## Useful commands

| Command | What it does |
|---|---|
| `git status` | see what changed |
| `git add .` | stage everything |
| `git commit -m "msg"` | save a checkpoint |
| `git push` | upload to GitHub |
| `git pull` | download latest (other machine) |
| `git log --oneline` | see history |

## If push asks for a password

Git Credential Manager opens a browser window — just sign in there.
