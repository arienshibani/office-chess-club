/**
 * Shared library root ($lib).
 *
 * Layout:
 * - server/     Backend-only code (DB, auth, match workflows, integrations). Not importable from client code.
 * - chess/      Pure chess domain logic shared by client and server.
 * - components/ Svelte UI, grouped by feature (board, charts, matches, player, theme, common).
 * - client/     Browser-only helpers (theme persistence, form toasts).
 * - utils/      Environment-agnostic helpers.
 * - stockfish/  Engine analysis (WASM worker).
 * - assets/     Static files.
 */
