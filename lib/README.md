# `lib/` layout

| Path | Purpose |
|------|---------|
| `utils.ts` | `cn()` — shadcn/ui (keep at root) |
| `brand.ts` | Product name and logo wordmark |
| `config/constants.ts` | Models, presets, limits, webhook message strings |
| `types/` | `SavedScript`, `GrokModelId`, generation stats |
| `auth/` | Clerk appearance theme, `requireClerkSession()` |
| `db/` | Neon/Drizzle client, user sync, script row ↔ `SavedScript` |
| `scripts/` | Version lineage helpers, webhook JSON export |
| `api/` | Zod route schemas, API error message parsing |
| `ai/` | xAI env guard, Pine syntax highlighting, system prompts |

Import examples:

```ts
import { cn } from '@/lib/utils';
import { PRODUCT_NAME } from '@/lib/brand';
import { DEFAULT_MODEL, GROK_MODELS } from '@/lib/config/constants';
import type { SavedScript } from '@/lib/types';
import { db, rowToSavedScript } from '@/lib/db';
import { generateSchema } from '@/lib/api/validation';
import { PINE_GENERATE_SYSTEM_PROMPT } from '@/lib/ai/prompts/pine-generate-system';
```
