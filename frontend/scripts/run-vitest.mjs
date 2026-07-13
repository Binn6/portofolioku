#!/usr/bin/env node
// Node 22+ ships an experimental global `localStorage` that shadows jsdom's
// own implementation in tests and throws without a `--localstorage-file`.
// Cross-platform (Windows/macOS/Linux) way to disable it for the vitest
// process without requiring contributors to set env vars by hand.
import { spawnSync } from 'node:child_process'

const args = process.argv.slice(2)

const result = spawnSync('npx', ['vitest', ...args], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    NODE_OPTIONS: [process.env.NODE_OPTIONS, '--no-experimental-webstorage'].filter(Boolean).join(' '),
  },
})

process.exit(result.status ?? 1)
