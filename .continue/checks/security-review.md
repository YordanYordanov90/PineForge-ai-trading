---
name: Security Review
description: Flag hardcoded secrets and missing input validation
---
Review this pull request for security issues. Flag as failing if any of these are true:
- Hardcoded API keys, tokens, or passwords in source files
- New API endpoints without protectAiRoute() wrapper
- Missing Zod validation on request bodies
- Raw LLM output rendered without validation
- Secrets referenced in client components
If none of these issues are found, pass the check.