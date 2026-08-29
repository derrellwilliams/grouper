# Grouper

A quick way to split a class into critique groups that are as different as possible each time — pairings that haven't happened yet are favored over ones that have.

Pick a group size (2–6), click the button, groups appear — as evenly sized as possible for however many students are present. Everything lives in the browser (`localStorage`) — no backend, no login, nothing leaves the machine.

## Getting started

```
npm install
npm run dev
```

## Editing the roster

Gear icon (top right) → **Edit roster**. Every student is listed alphabetically with a present/absent checkbox — uncheck anyone who's not in class today. All names are required, but at least 2 need to be present before groups can be generated.

## Resetting for a new semester

Gear icon → **Reset history**. Clears the "who's been grouped with whom" record so future groups start fresh. Doesn't touch the roster.

## Scripts

```
npm run dev      # dev server with hot reload
npm run build    # type-check and build to dist/
npm run lint     # run oxlint
```
