# Grouper

Needed a way to quickly create critique groups that were as different as possible, unique, or whatever.

Splits a class of 20 into 4 groups of 5, favoring pairings that haven't happened before over the semester. Hit the button, groups appear. Everything is stored in the browser (`localStorage`) — no backend, no login, no data leaves the machine.

## Running it

```
npm install
npm run dev
```

Then open the URL it prints.

## Editing the roster

Gear icon (top right) → **Edit roster**. All 20 names are required before groups can be generated.

## Resetting for a new semester

Gear icon → **Reset history**. Clears the "who's been grouped with whom" record so future groups are generated as if starting fresh. Doesn't touch the roster.

## Development

```
npm run dev      # start the dev server with hot reload
npm run build    # type-check and build to dist/
npm run lint     # run oxlint
```
