# First-Message Streaming Bug – Root Cause & Fix

Summary
- Symptom: In a brand‑new chat, the first assistant message starts streaming, then disappears mid‑stream; full response only shows after refresh. Subsequent messages work fine.

Core Issue
- Race between navigation and streaming.
- Home page `ChatInputField` called `append()/complete()` immediately, then navigated to `/chat/:threadId`.
- Streaming began in the old `ChatInterface` instance and that component unmounted during navigation.
- The new `ChatInterface` mounted empty; real‑time sync only restored the user message (assistant not yet persisted), so the in‑flight assistant message “vanished”.

Targeted Fix (minimal changes)
1) First‑input handoff (no premature stream)
   - File: `frontend/components/ChatInputField.tsx`
   - On a new conversation without `id`, store `{ threadId, input }` in `sessionStorage` under `avchat_pending_input`, navigate to `/chat/:threadId`, and return early (no `append()` / no stream).

2) Auto‑submit in the correct instance
   - File: `frontend/components/ChatInterface.tsx`
   - On mount for a thread, read `avchat_pending_input`. If it matches `threadId` and there are no messages:
     - `setInput(pending.input)` and wait until the child `ChatInputField` registers `submitRef` (poll up to ~3s), then call it to start streaming in the mounted component.

3) Ensure empty thread is actionable
   - File: `frontend/components/ChatInterface.tsx`
   - When `messages.length === 0` on a thread page, render a centered `ChatInputField` so the page isn’t blank before the first send.

Why this works
- Streaming now starts only after the thread page has mounted; no unmount interrupts the stream.
- Real‑time sync no longer races the initial stream; the assistant message is owned by the live `ChatInterface`.
- Works for both regular chat and web/Reddit search (auto‑submit path is the same input/submitRef flow).

File Diffs (high‑level)
- `frontend/components/ChatInputField.tsx`
  - Add sessionStorage handoff and early return before navigation on first send.
- `frontend/components/ChatInterface.tsx`
  - Read handoff, wait for `submitRef`, trigger submit.
  - Render input on empty thread pages.

Operational Notes
- No server changes; no schema changes.
- Lint passes; existing flows remain intact.

