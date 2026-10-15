# Strapi → VAMS cutover plan

Written 2026-10-14 on branch `image-colors-v2`. Goal: Image Colors persists presets on VAMS only, Strapi is gone, and this state becomes the stable base that the core-rework branch forks from.

## Where things actually stand (verified today)

| Thing | State |
|---|---|
| VAMS write API (`POST/PUT/PATCH/DELETE /api/entries`) | On VAMS `main`, auto-deployed to `app.use-vams.me` (6 Oct) |
| VAMS entry types `preset`, `processed-image`, `parent-colors` | Seeded on prod, granted to `itamar@gilboa.net`, api_key set |
| Migrated data on prod VAMS | 22 presets, 173 processed images, all published, all carry `strapi_id`, 0 orphans, max 13 images per preset |
| New writes from the app since migration | None. Last entry 2026-10-01 20:04 (the import itself). Netlify prod is still talking to Strapi |
| `parent-colors` entries | 0. Parent colours still live in `localStorage` |
| App gateway `netlify/functions/shared/vams.js` | Exists on this branch, behind `CMS_SOURCE=vams`. Never run against prod from a deployed site |
| Tests | 7 files, 32 tests, green on Node 24 (`npx vitest run`) |
| Branch | `image-colors-v2` is 28 commits ahead of `main`, 0 behind. It already *is* the fork. |

So the move is mostly done on the VAMS side. What is left is on the app side: harden the gateway, remove Strapi, flip the environment, prove it on the live site.

## Step 1. Harden the gateway (code, this branch)

Three real problems in `vams.js` as it stands:

1. **Update is delete-then-create.** `updatePresetInVams` deletes every image, then re-creates them. If any create fails mid-way (network, 429, validation), the preset has lost images with no way back. Fix: create the new image entries first, then delete the old ones. Same number of calls, no data-loss window.
2. **Throttle.** The entries group runs under `throttle:60,1` (60 requests per minute per key). An update costs 2N+3 requests (N creates + N deletes + type lookup + PUT + list). A 13-image preset is 29 requests, so two saves inside a minute hit 429 and the second save fails half-way (see 1). Fix on the VAMS side: give the entries write routes their own, higher limit (the ADE stats route already does `throttle:600,1`). 300/min is plenty. Optional later: a diff-update in the gateway so unchanged images are not touched.
3. **Type-id lookups fetch every entry.** `typeId(slug)` calls `GET /entries/by-type/{slug}` and throws the entries away. Cache the two type ids per function invocation (module-level `Map`) so a create costs N+1 calls, not N+3. Cheap, cuts into the throttle budget.

Also small: stop sending `strapi_id: ""` on new presets (field is optional, the import is done), and write `average_confidence` / `problematic_count` on the processed image since the type already has them and the app already computes them.

Add `tests/functions/vams.test.js` (mock axios): read re-stitching sorts by `order` and groups by preset uuid; create posts preset then images with the relation set; update creates before it deletes; delete removes images before the preset.

## Step 2. Remove Strapi from the app

- `netlify/functions/presets/presets.js`: delete the Strapi branches and the `CMS_SOURCE` toggle. The function calls the VAMS gateway unconditionally. If `VAMS_API_KEY` is unset, return 500 with a clear message rather than silently falling back.
- `.env.example`, `netlify/functions/README.md`, `PROJECT.md` Guide: drop `PRESET_CREATION_TOKEN` and the Strapi wording. Keep `PRESET_ACCESS_TOKEN` + `NUXT_PUBLIC_PRESET_ACCESS_TOKEN` (that gate is about the Netlify function, not the CMS).
- `docs/cms-data-model.md`: mark the migration section done, point at this file.
- VAMS side, nothing to delete: the `strapi_id` field on `preset` stays (harmless, documents provenance), `strapi:import-image-colors` stays as the record of how the data got there.

## Step 3. Environment and deploy (Hiren, not code)

Netlify, production context:

| Variable | Value |
|---|---|
| `VAMS_API_KEY` | Itamar's `api_key` from the VAMS `users` table (never commit it) |
| `VAMS_BASE_URL` | leave unset, defaults to `https://app.use-vams.me` |
| `PRESET_ACCESS_TOKEN` and `NUXT_PUBLIC_PRESET_ACCESS_TOKEN` | same long random string; the `'banana'` fallback is gone on this branch |
| `PRESET_CREATION_TOKEN` | delete |
| `MY_AWS_ACCESS_KEY_ID` / `MY_AWS_SECRET_ACCESS_KEY` | unchanged, images still go to Spaces |

To read the key without printing it into a chat log, from the VAMS repo with the prod DB env exported:

```bash
php artisan tinker --execute 'echo App\Models\User::where("email","itamar@gilboa.net")->value("api_key");' | pbcopy
```

Then the branch question. Netlify deploys one production branch (today presumably `main`). Two options:

- **A. Merge `image-colors-v2` into `main`** (recommended). It is green, it carries Track A's bug fixes, and PROJECT.md already says it will become main. `main` then equals "stable + VAMS", which is exactly the base you want to fork the core rework from.
- B. Switch Netlify's production branch to `image-colors-v2`. Faster, but leaves `main` stale and two "truths".

Confirm in Netlify that the build command is `npm run build` (not `yarn`, yarn.lock is gone).

## Step 4. Prove it on the live site

1. Load the app with `?access=...`. The 22 presets must list, open, and show their images (reads).
2. Save-as-new a 2-image preset, reload, open it (create). Check `app.use-vams.me` shows 23 presets, 175 images.
3. Re-analyse one image in that preset, save (update). Count stays 175, the image's colours changed.
4. Delete the test preset. Back to 22 / 173.
5. Save a 13-image preset twice within a minute. No 429 (the throttle fix).

Local dry-run first if wanted: `cp .env.example .env`, fill `VAMS_API_KEY`, `npx netlify-cli dev --port 8899 --target-port 3001 --command "npx nuxt dev --port 3001"`.

## Step 5. Retire Strapi

Only after step 4 passes on the deployed site. Delete the DigitalOcean app `hiren-devs-strapi-j5h2f` (and its database component). The snapshot that fed the import is in VAMS at `database/data/image-colors-strapi-snapshot.json`, so nothing is lost.

## Then: the fork

Once `main` is "stable + VAMS", `image-colors-v2` continues as the core-rework branch for V1 to V7 in PROJECT.md. No new repo needed; the branch already is the fork, with the cockpit and the ClickUp list attached to it.

## Later, not now (persistence that is not Strapi)

- **Parent colours to VAMS (V6b).** Type exists, zero entries. Save the active 32-colour list as a versioned `parent-colors` entry, load it on start, stamp `processed-image.parent_colors` with the version used. Do it after the fork, it touches the matcher.
- **Feedback / knowledge base / model** stay on Spaces JSON until V4 decides whether the ML stack lives. Not a Strapi concern.
- **Analysis settings** stay in `localStorage` (per-browser knobs, fine).

## Risks to keep in view

- Entry reads are unpaginated `->get()` on the key owner's published entries. Fine at 173 images; revisit around a few thousand.
- One VAMS account (Itamar's) owns all Image Colors data. Writes are owner-scoped, so that key is the only thing between the internet and the presets. It lives server-side in the Netlify function only.
- VAMS's own DB move to Coolify (its e1 to e6) will change `VAMS_BASE_URL` at some point. One env var.
