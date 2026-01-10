# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Prose is an AI-assisted writing application for long-form fiction (novels, book chapters). It combines a LaTeX-based document editor with AI tools for editing, consistency checking, and developmental feedback.

## Commands

All commands run from the `prose/` directory:

```bash
# Development
bun dev              # Start Next.js dev server (http://localhost:3000)
bun build            # Production build
bun lint             # ESLint

# Formatting (Biome)
bun biome:check      # Check formatting and linting
bun biome:fix        # Auto-fix all issues

# Database (SQLite via Drizzle)
bun db:generate      # Generate migrations from schema changes
bun db:migrate       # Apply migrations
bun db:studio        # Open Drizzle Studio GUI
```

Database stored at `~/.prose/prose.db` (created automatically on first run).

## Architecture

### Tech Stack
- **Frontend**: Next.js 16 (App Router), React 19, TailwindCSS 4
- **Editor**: CodeMirror with markdown/LaTeX language support
- **Database**: SQLite + Drizzle ORM
- **AI**: LangChain with OpenAI/Ollama providers
- **PDF**: pdflatex compilation for document preview

### Key Directories

```
prose/
├── app/
│   ├── api/workspace/[workspaceId]/   # Workspace-scoped API routes
│   │   ├── ai/                        # AI endpoints (checker, editor-pass, helper)
│   │   ├── documents/[id]/            # Document CRUD, drafts, summaries
│   │   └── compile/                   # LaTeX PDF compilation
│   └── workspace/[workspaceId]/       # Workspace UI pages
├── components/
│   ├── ai/                            # AI panel components
│   ├── editor.tsx                     # Main CodeMirror editor
│   └── ui/                            # shadcn/ui components
├── lib/
│   ├── ai/                            # AiGenerator class (OpenAI/Ollama)
│   ├── db/schema.ts                   # Drizzle schema definitions
│   ├── latex/                         # PDF compilation pipeline
│   └── prompts/                       # AI prompt templates
└── hooks/
    └── use-whisp.ts                   # Voice transcription via Whisp server
```

### Data Model

- **Workspaces**: Pointer to a folder on disk (rootPath) containing documents
- **Documents**: LaTeX files on disk (not in database - filesystem refactor pending)
- **DocumentDrafts**: Working copies before commit, keyed by filePath
- **DocumentSummaries**: AI-generated chapter summaries, keyed by filePath
- **HelpSuggestions**: AI responses from developmental editor, keyed by filePath
- **ConsistencyChecks**: Proofreading issues (punctuation, repetition, tense)
- **BookFiles**: Ordered list of files that form the book structure

### AI Tools

Three AI endpoints under `/api/workspace/[workspaceId]/ai/`:

1. **editor-pass**: Returns edited version of chapter (stored as draft)
2. **helper**: Developmental editor suggesting plot extensions (stored as help suggestion)
3. **checker**: Proofreader returning JSON array of fixes (stored as consistency checks)

API_KEY environment variable determines provider: `sk-` prefix = OpenAI, `ollama` prefix = Ollama.

### LaTeX Workflow

Documents contain LaTeX content. The compile endpoint:
1. Fetches workspace folder structure (`lib/latex/fetch-tree.ts`)
2. Writes files to temp directory (`lib/latex/export-files.ts`)
3. Runs pdflatex (`lib/latex/compile.ts`)
4. Returns PDF blob for preview

### Voice Transcription

The `useWhisp` hook connects to a local Whisp WebSocket server (port 9090) for real-time speech-to-text. The Whisp server is in the `/whisp` directory (Python).

## Code Style

- Biome for formatting/linting (tabs, double quotes, trailing commas)
- Use `type` imports for TypeScript types
- Zod for API request/response validation (see `app/api/schemas.ts`)
- LaTeX conventions: `\`word''` for quotes, `---` for em-dashes
