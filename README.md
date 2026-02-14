# Goon (Expo + InstantDB)

This app uses InstantDB as the backend for:

- Email magic-code authentication
- Per-user cards
- Per-user profile/settings (`profileName`, avatar path)
- Per-user review analytics events (streaks and profile charts)

## Requirements

- Node.js + npm
- An Instant app ID from the Instant dashboard

## Environment

Set your Instant app id in `.env`:

```bash
EXPO_PUBLIC_INSTANT_APP_ID=your-instant-app-id
```

`EXPO_PUBLIC_INSTANT_APP_ID` is required at runtime. The app will throw on startup if it is missing.

## Install and Run

```bash
npm install
npx expo start --ios
```

## Instant Schema and Permissions

This repo includes:

- `instant.schema.ts`
- `instant.perms.ts`

To initialize/push backend config with Instant CLI:

```bash
npx instant-cli@latest init
npx instant-cli@latest push schema
npx instant-cli@latest push perms
```

If your CLI session is not authenticated, run:

```bash
npx instant-cli@latest login
```

## Auth Flow

1. Open app while signed out.
2. Enter email on `/sign-in` and request magic code.
3. Enter code to sign in.
4. Cards/settings sync to the authenticated user account.

## Scope

This implementation is targeted and tested for iOS in this iteration.

## Styling

- Styling is standardized with Uniwind utilities.
- Theme and shared color tokens are defined in `global.css`.
