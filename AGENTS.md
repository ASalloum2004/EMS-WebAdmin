# EMS WebAdmin — Codex Instructions

## Project stack

- React 19, TypeScript, Vite, and SCSS.
- Feature-based frontend architecture.
- Tests use Node Test Runner and Testing Library.

## Repository structure

- Shared API client: `src/api/apiClient.ts`
- Shared components: `src/components`
- Features: `src/features/<feature>`
- Layouts: `src/layouts`
- English translations: `src/i18n/locales/en.ts`
- Arabic translations: `src/i18n/locales/ar.ts`
- Design tokens: `src/assets/styles/_design-tokens.scss`
- Dark-theme tokens: `src/assets/styles/_dark-theme.scss`
- Tests: `tests`

Feature files belong in:

- API functions: `src/features/<feature>/api`
- React hooks: `src/features/<feature>/hooks`
- UI components: `src/features/<feature>/components`
- Page composition: `src/features/<feature>/pages`
- Feature types: `src/features/<feature>/types.ts`
- Feature data helpers: `src/features/<feature>/data`

Export new modules through the nearest existing `index.ts`.

## Architecture rules

- Never call `fetch` directly from React components.
- Use the shared `apiRequest` client for backend requests.
- API files must contain only endpoint construction, request execution, response typing, and normalization.
- API files must not contain React state, hooks, or UI behavior.
- Loading, error, query, and mutation state belongs in feature hooks.
- Components should receive data, state, and callbacks through props.
- Pages should compose hooks and components without containing low-level API logic.
- Add explicit TypeScript types for API payloads and responses.
- Prevent duplicate mutation submissions.
- Preserve backend error messages through the existing error-handling flow.

## Order feature rules

- Booth request API functions belong in `src/features/order/api`.
- Booth request list state belongs in `useBoothRequests.ts`.
- Booth request details state belongs in `useBoothRequestDetails.ts`.
- Reject and Approve mutation state belongs in `useBoothRequestActions.ts`.
- `boothRequestActionsApi.ts` must remain a pure API module.
- After successful request actions, refresh details, the Orders list, and statistics.
- Keep Order components inside `src/features/order/components`.
- Do not combine Reject and Approve work unless the task explicitly requests both.

## Styling rules

- Keep each substantial component’s SCSS next to its TSX file.
- Use the existing BEM naming convention.
- Use existing project design tokens and CSS custom properties.
- Never introduce new colors, hardcoded hex values, RGB values, HSL values, or new color variables unless explicitly requested.
- Reuse colors from `_design-tokens.scss` and `_dark-theme.scss`.
- If no suitable existing color token exists, ask before creating a new one.
- Do not duplicate an existing color under a different variable name.
- Preserve light theme, dark theme, RTL, responsive behavior, focus states, and accessibility.
- Do not redesign existing UI unless explicitly requested.

## Internationalization

- Never hardcode user-facing text inside components.
- Add new text to both English and Arabic locale files.
- Reuse existing common translations when available.

## Change discipline

- Treat the current working tree as the source of truth.
- Preserve all existing and uncommitted user changes.
- Never use `git reset`, `git checkout`, or destructive restore commands.
- Make the smallest change that satisfies the request.
- Do not modify unrelated code.
- Do not repeatedly scan the entire repository; use this structure map and inspect only files directly related to the task.
- Follow an existing implementation pattern when one is already known.

## Verification

For source-code changes, run:

```bash
npm test
npm run lint
npm run build
```

Do not claim completion if relevant verification fails. Report the exact blocker instead.

Documentation-only changes do not require running the full test suite.
