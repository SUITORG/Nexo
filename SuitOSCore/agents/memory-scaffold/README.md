# Persistent Agent Memory Scaffold

A generic memory system for subagents. Drop this into any agent definition to give it persistent, file-based memory.

## Memory Types

| Type | Description | When to Save |
|------|-------------|-------------|
| `user` | User's role, goals, preferences, knowledge | When learning details about the user |
| `feedback` | Corrections or confirmed approaches | After user corrects you or validates an approach |
| `project` | Ongoing work, goals, initiatives, context | When learning project state (use absolute dates) |
| `reference` | Pointers to external systems (dashboards, tickets) | When learning where to find info outside the repo |

## Structure

```
agent-memory/
├── MEMORY.md          ← Index (one-line entries, ~150 chars each)
├── user_role.md       ← Example: user profile
├── feedback_testing.md ← Example: validated approach
└── ...                ← One file per memory entry
```

## Rules

1. Save memories to individual files with frontmatter (name, description, type).
2. Add a one-line pointer in MEMORY.md.
3. What NOT to save: code patterns, git history, debugging fixes, ephemeral task details, anything derivable from reading current project state.
4. Keep index under 200 lines.
5. Before recommending from memory, verify the file/function/flag still exists.
6. Update or remove stale memories — trust current state over old records.
