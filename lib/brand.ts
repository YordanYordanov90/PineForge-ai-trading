/** Product name and display strings — single source for UI/metadata */
export const PRODUCT_NAME = 'PineForge' as const;

export function brandLogoParts(): { prefix: string; accent: string } {
  return { prefix: 'Pine', accent: 'Forge' };
}
