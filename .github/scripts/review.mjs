import fs from 'fs';

const diff = fs.readFileSync('pr_diff.txt', 'utf8');

// grok-4.20-0309-non-reasoning has 1M context window
const MAX_DIFF_CHARS = 200000;
const truncated = diff.length > MAX_DIFF_CHARS;
const diffContent = truncated
  ? diff.slice(0, MAX_DIFF_CHARS) + '\n\n[diff truncated — showing first 200k chars]'
  : diff;

if (!diffContent.trim()) {
  fs.writeFileSync('review_output.txt', '✅ No TypeScript/JavaScript changes detected in this PR.');
  process.exit(0);
}

const systemPrompt = `You are a senior full-stack code reviewer for a Next.js TypeScript codebase.
You review only the git diff provided — never invent issues not visible in the diff.
You follow these exact rules:

RULES:
- Only report what exists in the diff — do not report missing features as issues
- Do not report missing .env files — check for hardcoded secrets instead
- Do not report NEXT_PUBLIC_ vars unless they expose something genuinely sensitive
- If a feature is stubbed or marked TODO, skip it unless it introduces active risk
- No noise — if uncertain, omit it. Quality over quantity
- Never report auth absence as a vulnerability unless auth was previously present

SCAN FOR:
Security:
- Hardcoded secrets, API keys, tokens in source files
- Unprotected API routes (missing auth checks, missing rate limiting)
- Missing input validation (no Zod or equivalent on request bodies)
- SQL injection risks or raw query concatenation
- CSRF vulnerabilities in Server Actions or API routes
- Prompt injection risks in AI/LLM integrations
- Unvalidated LLM outputs rendered directly to the UI
- Insecure cookie flags (missing httpOnly, secure, sameSite)
- Exposed internal errors or stack traces in API responses

Performance:
- N+1 query patterns in data fetching
- Unnecessary 'use client' on components with no interactivity
- Blocking data fetches that could run in parallel
- Missing Suspense boundaries on slow routes
- Images missing next/image or width/height

Code Quality:
- Functions exceeding 50 lines
- Components doing more than one job
- Duplicated logic that should be extracted
- any types without justification
- Unused imports, variables, or dead code
- Missing { success, data, error } return pattern in Server Actions

OUTPUT FORMAT — use exactly this structure:
## 🤖 AI PR Review

### 🔴 Critical
(list issues or "None")

### 🟠 High
(list issues or "None")

### 🟡 Medium
(list issues or "None")

### 🔵 Low / Suggestions
(list issues or "None")

### ✅ Looks good
(list areas with no issues found)

---
For each issue use:
- **File**: \`path/to/file.ts\` · **Line**: ~42
  **Issue**: description
  **Fix**: concrete fix suggestion`;

const apiKey = process.env.XAI_API_KEY;
if (!apiKey) {
  fs.writeFileSync('review_output.txt', '❌ XAI_API_KEY is missing in GitHub secrets.');
  process.exit(1);
}

const response = await fetch('https://api.x.ai/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  },
  body: JSON.stringify({
    model: 'grok-4.3',
    messages: [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: `Review this PR diff:\n\n\`\`\`diff\n${diffContent}\n\`\`\``
      }
    ],
    max_tokens: 2000,
    temperature: 0.1
  })
});

if (!response.ok) {
  const error = await response.text();
  console.error('xAI API error:', error);
  fs.writeFileSync('review_output.txt', `❌ AI review failed: ${response.status}`);
  process.exit(1);
}

const data = await response.json();
const reviewText = data.choices?.[0]?.message?.content ?? '❌ No review generated.';

const footer = truncated
  ? '\n\n> ⚠️ Diff was truncated to 200k chars. Large PRs may have incomplete coverage.'
  : '';

fs.writeFileSync('review_output.txt', reviewText + footer);
console.log('Review complete with grok-4.20-0309-non-reasoning.');