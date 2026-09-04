# Grouper

Splits a class into critique groups that are as different as possible each time. Pairings that haven't happened yet are favored over ones that have.

Pick a group size (2-6), click the button, groups appear, as evenly sized as possible for however many students are present. Roster and grouping history live in the browser (`localStorage`); nothing else leaves the machine unless you use Canvas sync.

## Getting started

```
npm install
npm run dev
```

## Editing the roster

Gear icon (top right) → **Edit roster**. The roster starts empty. Use **Add student** to add a row, the X next to a row to remove it, and the checkbox to mark someone present or absent for today. All names are required, but at least 2 students need to be present before groups can be generated.

## Syncing attendance from Canvas

**Sync from Canvas** in the roster editor pulls attendance marked in Canvas and checks/unchecks students to match. This requires a companion userscript (not included) posting attendance to `api/attendance.ts`, a small Vercel function backed by Redis, and a shared secret entered once and stored in `localStorage`. Skip this if you'd rather mark attendance by hand.

## Resetting for a new semester

Gear icon → **Reset history**. Clears the "who's been grouped with whom" record so future groups start fresh. Doesn't touch the roster.

## Scripts

```
npm run dev      # dev server with hot reload
npm run build    # type-check and build to dist/
npm run lint     # run oxlint
```
