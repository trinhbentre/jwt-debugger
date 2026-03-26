export type DiffType = 'added' | 'removed' | 'changed' | 'unchanged'

export interface DiffEntry {
  path: string
  type: DiffType
  oldValue?: unknown
  newValue?: unknown
}

/**
 * Recursively diff two JSON objects.
 * Returns a flat list of changes at each leaf path.
 */
export function diffObjects(
  a: Record<string, unknown>,
  b: Record<string, unknown>,
  prefix = '',
): DiffEntry[] {
  const results: DiffEntry[] = []
  const allKeys = new Set([...Object.keys(a), ...Object.keys(b)])

  for (const key of allKeys) {
    const path = prefix ? `${prefix}.${key}` : key
    const inA = Object.prototype.hasOwnProperty.call(a, key)
    const inB = Object.prototype.hasOwnProperty.call(b, key)

    if (!inA) {
      results.push({ path, type: 'added', newValue: b[key] })
    } else if (!inB) {
      results.push({ path, type: 'removed', oldValue: a[key] })
    } else {
      const va = a[key]
      const vb = b[key]
      if (
        va !== null &&
        vb !== null &&
        typeof va === 'object' &&
        typeof vb === 'object' &&
        !Array.isArray(va) &&
        !Array.isArray(vb)
      ) {
        // Both are plain objects — recurse
        results.push(
          ...diffObjects(
            va as Record<string, unknown>,
            vb as Record<string, unknown>,
            path,
          ),
        )
      } else if (JSON.stringify(va) !== JSON.stringify(vb)) {
        results.push({ path, type: 'changed', oldValue: va, newValue: vb })
      } else {
        results.push({ path, type: 'unchanged', oldValue: va, newValue: vb })
      }
    }
  }

  return results
}
