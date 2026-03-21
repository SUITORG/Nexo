---
description: Create a ZIP backup of the project with the standard SUIT_AAMMDD format
---

# Workflow: RespaldoZip

This workflow creates a compressed backup of the entire project using 7-Zip, following the standard naming convention `SUIT_AAMMDD.zip`.

## Steps

1. Identify the current date in **YYMMDD** format (e.g., 260124 for January 24, 2026).
2. Open the terminal in the project root directory.
3. Run the following command (replace `[YYMMDD]` with the actual date):

// turbo
```powershell
tar -cvzf SUIT_[YYMMDD].zip --exclude="*.zip" --exclude=".git" --exclude=".agent" --exclude=".gemini" --exclude="node_modules" .
```

## Details
- **Standard Name**: `SUIT_AAMMDD.zip`
- **Exclusions**:
    - `*.zip`: Avoids ZIP-in-ZIP recursion.
    - `.git`: Excludes heavy git history.
    - `.agent` & `.gemini`: Excludes internal AI configuration/logs.
    - `node_modules`: Excludes package dependencies (can be re-installed via npm).
