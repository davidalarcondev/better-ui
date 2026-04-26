import { describe, it, expect } from 'vitest'
import { normalizeSlashArgv, parseSlashCommand, SLASH_ALIASES } from '../src/slashCommands'
import { COMMANDS } from '../src/commandCatalog'

describe('slashCommands', () => {
  it('defines some aliases', () => {
    expect(Object.keys(SLASH_ALIASES).length).toBeGreaterThan(0)
  })

  Object.entries(SLASH_ALIASES).forEach(([slash, mapped]) => {
    it(`normalizeSlashArgv maps ${slash} -> ${mapped.join(' ')}`, () => {
      const argv = ['node', 'cli', slash, '--changed', '--format', 'json']
      const out = normalizeSlashArgv(argv.slice())
      // the mapped tokens should appear starting at argv index 2
      expect(out.slice(2, 2 + mapped.length)).toEqual(mapped)
      // remaining args should be preserved
      expect(out.slice(2 + mapped.length)).toEqual(argv.slice(3))
    })

    it(`parseSlashCommand parses ${slash} to ${mapped.join(' ')}`, () => {
      const input = `${slash} --changed --format json`
      const parsed = parseSlashCommand(input)
      expect(parsed!.slice(0, mapped.length)).toEqual(mapped)
      expect(parsed).toContain('--changed')
      expect(parsed).toContain('--format')
    })
  })

  it('falls back to raw token for unknown slash', () => {
    const parsed = parseSlashCommand('/unknown --x')
    expect(parsed![0]).toBe('unknown')
  })

  // Ensure every command declared in the catalog is parseable and maps to the expected tokens
  COMMANDS.forEach((cmd) => {
    it(`commandCatalog: ${cmd.slash} is handled`, () => {
      const expected = SLASH_ALIASES[cmd.slash] || [cmd.slash.slice(1)]

      const parsed = parseSlashCommand(`${cmd.slash} --test`)
      expect(parsed).not.toBeNull()
      expect(parsed!.slice(0, expected.length)).toEqual(expected)

      const argv = ['node', 'cli', cmd.slash, '--test']
      const out = normalizeSlashArgv(argv.slice())
      expect(out.slice(2, 2 + expected.length)).toEqual(expected)
    })
  })
})
