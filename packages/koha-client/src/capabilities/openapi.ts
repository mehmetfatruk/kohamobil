import { SPEC_CAPABILITIES, type SpecCapabilityId, type SpecRule } from './catalog.js';

/**
 * Koha OpenAPI spec'inden (Swagger 2.0; ileride OpenAPI 3) yetenekleri çıkarır.
 * Spec güvenilmeyen girdidir: beklenmeyen yapıda olan kısımlar sessizce yok sayılır.
 */

type Json = unknown;
type JsonObject = Record<string, Json>;

const isObject = (value: Json): value is JsonObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const asArray = (value: Json): Json[] => (Array.isArray(value) ? (value as Json[]) : []);

/** `/patrons/{patron_id}/account` → `/patrons/{}/account` */
export function normalizePath(path: string): string {
  const withoutSlash = path.length > 1 ? path.replace(/\/+$/, '') : path;
  return withoutSlash.replace(/\{[^}]*\}/g, '{}');
}

/** Spec içi `$ref` çözümleyici (yalnızca yerel `#/...` referansları, döngü korumalı). */
function createResolver(spec: JsonObject) {
  const resolve = (value: Json, depth = 0): Json => {
    if (!isObject(value) || typeof value.$ref !== 'string' || depth > 16) return value;
    const ref = value.$ref;
    if (!ref.startsWith('#/')) return undefined;
    let current: Json = spec;
    for (const raw of ref.slice(2).split('/')) {
      const key = raw.replace(/~1/g, '/').replace(/~0/g, '~');
      current = isObject(current) ? current[key] : undefined;
    }
    return resolve(current, depth + 1);
  };
  return resolve;
}

interface Operation {
  parameters: JsonObject[];
  bodyProperties: Set<string>;
}

function schemaProperties(schema: Json, resolve: (v: Json) => Json, depth = 0): Set<string> {
  const resolved = resolve(schema);
  const names = new Set<string>();
  if (!isObject(resolved) || depth > 8) return names;
  if (isObject(resolved.properties)) {
    for (const name of Object.keys(resolved.properties)) names.add(name);
  }
  for (const key of ['allOf', 'oneOf', 'anyOf'] as const) {
    for (const part of asArray(resolved[key])) {
      for (const name of schemaProperties(part, resolve, depth + 1)) names.add(name);
    }
  }
  return names;
}

function indexOperations(spec: JsonObject): Map<string, Operation> {
  const resolve = createResolver(spec);
  const index = new Map<string, Operation>();
  const paths = isObject(spec.paths) ? spec.paths : {};

  for (const [rawPath, rawItem] of Object.entries(paths)) {
    const item = resolve(rawItem);
    if (!isObject(item)) continue;
    const shared = asArray(item.parameters);

    for (const method of ['get', 'post', 'put', 'patch', 'delete'] as const) {
      const op = item[method];
      if (!isObject(op)) continue;
      const parameters = [...shared, ...asArray(op.parameters)]
        .map((p) => resolve(p))
        .filter(isObject);

      const bodyProperties = new Set<string>();
      // Swagger 2.0: `in: body` parametresi
      for (const p of parameters) {
        if (p.in === 'body') {
          for (const name of schemaProperties(p.schema, resolve)) bodyProperties.add(name);
        }
      }
      // OpenAPI 3: requestBody.content.*.schema
      const requestBody = resolve(op.requestBody);
      if (isObject(requestBody) && isObject(requestBody.content)) {
        for (const media of Object.values(requestBody.content)) {
          if (isObject(media)) {
            for (const name of schemaProperties(media.schema, resolve)) bodyProperties.add(name);
          }
        }
      }

      index.set(`${method} ${normalizePath(rawPath)}`, { parameters, bodyProperties });
    }
  }
  return index;
}

function matches(index: Map<string, Operation>, rule: SpecRule): boolean {
  const op = index.get(`${rule.method} ${normalizePath(rule.path)}`);
  if (!op) return false;
  if (rule.bodyField && !op.bodyProperties.has(rule.bodyField)) return false;
  if (
    rule.queryParam &&
    !op.parameters.some((p) => p.in === 'query' && p.name === rule.queryParam)
  ) {
    return false;
  }
  return true;
}

export function detectSpecCapabilities(spec: Json): Set<SpecCapabilityId> {
  const detected = new Set<SpecCapabilityId>();
  if (!isObject(spec)) return detected;
  const index = indexOperations(spec);
  for (const [id, rule] of Object.entries(SPEC_CAPABILITIES) as [SpecCapabilityId, SpecRule][]) {
    if (matches(index, rule)) detected.add(id);
  }
  return detected;
}
