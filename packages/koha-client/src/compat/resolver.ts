import type { Capabilities } from '../capabilities/catalog.js';
import { OPERATIONS, type OperationDefinition, type OperationId } from './operations.js';

export type SupportLevel = 'FULL' | 'LIMITED' | 'UNSUPPORTED';

/** İşlem → seçilen strateji kimliği (`null` = bu Koha'da desteklenmiyor). */
export type CompatibilityProfile = Record<OperationId, string | null>;

export interface CompatibilityReport {
  profile: CompatibilityProfile;
  supportLevel: SupportLevel;
  /** Strateji bulunamayan işlemler, katmanına göre. */
  missing: { core: OperationId[]; mvp: OperationId[]; optional: OperationId[] };
}

const entries = Object.entries(OPERATIONS) as [OperationId, OperationDefinition][];

export function resolveCompatibility(capabilities: Capabilities): CompatibilityReport {
  const profile = {} as CompatibilityProfile;
  const missing: CompatibilityReport['missing'] = { core: [], mvp: [], optional: [] };

  for (const [operation, definition] of entries) {
    const strategy = definition.strategies.find((s) =>
      s.requires.every((capability) => capabilities.has(capability)),
    );
    profile[operation] = strategy?.id ?? null;
    if (!strategy) missing[definition.tier].push(operation);
  }

  const supportLevel: SupportLevel =
    missing.core.length > 0 ? 'UNSUPPORTED' : missing.mvp.length > 0 ? 'LIMITED' : 'FULL';

  return { profile, supportLevel, missing };
}
