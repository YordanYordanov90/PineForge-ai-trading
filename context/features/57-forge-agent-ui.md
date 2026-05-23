# 57 — Forge Agent UI

The `/forge` page: a dedicated chat interface for the Forge Agent with
conversation history sidebar, tool call display, and entry points from
the rest of the app.

## Page Structure

```
app/forge/page.tsx        → async RSC (auth-required, loads initial data)
app/forge/layout.tsx      → layout shell (navbar, terminal background)
```

`/forge` is auth-protected in `proxy.ts` (same as `/generate`). Unsigned
users are redirected to `/sign-in`.

## Layout

Full-height two-panel layout on desktop, single-panel with toggle on mobile:

```
┌──────────────────────────────────────────────────────┐
│  Navbar (PineForge logo, nav links, UserButton)      │
├────────────┬─────────────────────────────────────────┤
│            │                                         │
│ Convo      │  Chat Area                              │
│ Sidebar    │                                         │
│            │  ┌─────────────────────────────────┐    │
│ - New Chat │  │ Message 1 (user)                │    │
│ - Convo 1  │  │ Message 2 (assistant)           │    │
│ - Convo 2  │  │ [Tool Call: Health Score]        │    │
│ - Convo 3  │  │ Message 3 (assistant)           │    │
│   ...      │  │                                 │    │
│            │  └─────────────────────────────────┘    │
│            │                                         │
│            │  ┌─────────────────────────────────┐    │
│            │  │ Message input + Send button      │    │
│            │  └─────────────────────────────────┘    │
├────────────┴─────────────────────────────────────────┤
│  TerminalPriceTicker (variant="generate")            │
└──────────────────────────────────────────────────────┘
```

**Desktop** (≥ lg): sidebar (280px fixed) + chat area (flex-1).
**Mobile** (< lg): chat area fills the screen; sidebar opens as a
Sheet/drawer (same pattern as Script History on `/generate`).

## Components

### `ForgeChat` (main orchestrator)

`components/forge/ForgeChat.tsx` — `'use client'`

Owns the conversation state and coordinates between sidebar, message
list, and input. Uses the Vercel AI SDK's `useChat` hook (or a custom
hook wrapping it) connected to `POST /api/forge`.

State:
- `activeConversationId: number | null` — which conversation is loaded
- `conversations: SavedConversation[]` — sidebar list (without messages)
- `messages: AgentMessage[]` — current conversation messages
- `isStreaming: boolean` — whether the agent is currently responding

### `ForgeMessageList`

`components/forge/ForgeMessageList.tsx`

Renders the conversation message list. Scrolls to bottom on new messages.
Each message renders based on `role`:

- **User messages**: right-aligned bubble, zinc surface, user's text
- **Assistant messages**: left-aligned, no bubble (clean text), supports
  markdown rendering (bold, italic, code blocks, bullet lists)
- **Tool calls**: inline collapsible card between assistant messages
  showing what tool was called and the result (see Tool Call Display)

### `ForgeToolCallCard`

`components/forge/ForgeToolCallCard.tsx`

Displays a tool invocation inline in the conversation. Shows:
- Tool name as a label (e.g. "Health Score", "Script Search")
- Lucide icon per tool type (same icons as the output tabs on `/generate`
  where applicable — `Shield` for health, `FlaskConical` for backtest,
  `Bell` for alerts, `Search` for script search, `Pencil` for refine,
  `Globe` for web search)
- Collapsed by default: just the tool name + icon + a brief result
  summary (e.g. "Score: 7/10" or "Found 3 scripts")
- Expandable: click to show the full tool result (Health Score details,
  search results list, full backtest summary sections, etc.)
- Loading state: spinner + "Running Health Score..." while the tool
  executes
- Error state: amber border + error message

### `ForgeInput`

`components/forge/ForgeInput.tsx`

Chat input at the bottom of the chat area:
- Textarea (auto-resizes, max 4 lines before scrolling)
- Send button (emerald accent, disabled while streaming)
- Enter to send, Shift+Enter for newline
- Character count (max 4000, matching the Zod schema in spec `55`)
- Disabled with a message when the conversation has hit 200 messages

### `ForgeConversationSidebar`

`components/forge/ForgeConversationSidebar.tsx`

Left sidebar listing the user's conversations:
- "New Chat" button at the top (creates a new conversation via POST)
- Conversation list ordered by `updated_at` desc
- Each entry shows: title (or "New conversation" if null), relative
  time ("2h ago", "Yesterday")
- Active conversation highlighted with emerald border
- Right-click or hover menu: Rename, Delete
- Rename: inline edit (same pattern as Script History rename)
- Delete: confirmation dialog, then DELETE request + remove from list

### `ForgeEmptyState`

`components/forge/ForgeEmptyState.tsx`

Shown when no conversation is active (fresh page load with no
conversations, or after deleting the last one):
- Forge icon/logo
- "Start a conversation with Forge"
- 3–4 suggestion chips (similar to the generator empty state):
  - "Analyze my last strategy"
  - "Help me build a BTC scalping strategy"
  - "Compare my starred scripts"
  - "What indicators work for 15m crypto?"
- Clicking a chip creates a new conversation and sends the chip text
  as the first message

## Entry Points

### Navbar Link

Add "Forge" to the navbar navigation items (between "Generate" and the
user menu). Visible only to signed-in users. Uses emerald accent or a
small badge to signal it's a new feature.

### "Discuss with Forge" on `/generate`

After a script is generated, show a button in the output action bar:
- Label: "Discuss with Forge" (or just a Forge icon with tooltip)
- Click: navigates to `/forge?scriptId=<currentScriptId>`
- Only visible when: the script is saved to DB (has an `id`),
  user is signed in, and output is idle (not streaming)

### URL Parameter Handling

When `/forge` loads with `?scriptId=<id>`:
1. Create a new conversation via `POST /api/forge/conversations`
   with `{ scriptId: id }`
2. The conversation is initialized with the script as context
3. The empty state is replaced with a context banner:
   "Forge has loaded your script: [Script Title]. Ask anything about it."
4. The user can start typing immediately

## Visual Design

Follows the existing terminal theme from `ui-context.md`:

- Page background: `TerminalAmbientBackground` (same as `/generate`)
- Chat area: `terminal-code-surface` or similar zinc-950 surface
- Message bubbles: user = `bg-zinc-800/60`, assistant = no background
- Tool call cards: `bg-zinc-900/50` with `border-zinc-800`
- Sidebar: `bg-zinc-950/80` with `border-r border-zinc-800`
- Input area: `bg-zinc-900/70` with emerald focus ring
- Ticker: `TerminalPriceTicker variant="generate"` at bottom
- Theme: respects `next-themes` dark/light toggle (`.pf-page` shell)

## Streaming UX

While the agent is responding:
- Typing indicator (blinking cursor or three dots) in the message area
- Assistant message streams in real-time (text appears word by word)
- When a tool call starts: `ForgeToolCallCard` appears in loading state
- When a tool call completes: card updates with the result
- When the full response is done: input re-enables
- If the user navigates away during streaming: `abortSignal` cancels
  the request; partial response is not persisted

## Data Flow

```
ForgeChat (state owner)
  ├── ForgeConversationSidebar
  │     └── GET /api/forge/conversations (list)
  │     └── POST /api/forge/conversations (create)
  │     └── PATCH /api/forge/conversations/[id] (rename)
  │     └── DELETE /api/forge/conversations/[id] (delete)
  ├── ForgeMessageList
  │     └── reads from messages state
  │     └── ForgeToolCallCard (per tool call)
  ├── ForgeInput
  │     └── POST /api/forge (streaming)
  └── ForgeEmptyState (when no active conversation)
```

## Accessibility

- Chat area: `role="log"` with `aria-live="polite"` for new messages
- Input: `aria-label="Message Forge"`, `aria-describedby` for character
  count and message limit warnings
- Tool call cards: `aria-expanded` on the collapsible, `aria-label`
  describing the tool name and result summary
- Sidebar conversations: keyboard navigable list with `aria-current`
  on the active conversation
- Send button: `aria-label="Send message"`, disabled state communicated
- Empty state chips: `role="button"` with descriptive `aria-label`

## Scope Limits

- No command palette integration (v1 — `/forge` has its own interaction
  model; palette stays on `/generate`)
- No drag-and-drop conversation reordering
- No conversation search/filter (v1 — list is max 50, scrollable)
- No inline script editor (the agent shows scripts as formatted code
  blocks; editing happens via the refine tool or back on `/generate`)
- No split-view showing a script alongside the chat (future enhancement)
- No export of conversation as markdown (future)
