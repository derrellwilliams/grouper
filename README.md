# Grouper

A quick way to split a class into critique groups that are as different as possible each time — pairings that haven't happened yet are favored over ones that have.

Splits a roster of 20 into 4 groups of 5. Click the button, groups appear. Everything lives in the browser (`localStorage`) — no backend, no login, nothing leaves the machine.

## Getting started

```
npm install
npm run dev
```

## Editing the roster

Gear icon (top right) → **Edit roster**. All 20 names are required before groups can be generated.

## Resetting for a new semester

Gear icon → **Reset history**. Clears the "who's been grouped with whom" record so future groups start fresh. Doesn't touch the roster.

## Scripts

```
npm run dev      # dev server with hot reload
npm run build    # type-check and build to dist/
npm run lint     # run oxlint
```
