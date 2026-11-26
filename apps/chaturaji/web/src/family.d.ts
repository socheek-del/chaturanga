import type { FamilyLink } from '@chaturanga/family';

declare global {
  const __FAMILY__: FamilyLink[];
  const __SITE_URL__: string;
}

export {};
