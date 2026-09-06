# VAMS fit assessment (agent output, 2026-09-06)

## Model
- Laravel 11 + Postgres 15, DO App Platform, Docker. UUID keys, everything user_id-scoped, BaseEntity.
- Album + AlbumImage (ordered, per-image JSON `properties`, published flags, reorder route).
- Mosaic + MosaicItem (layout builder).
- EntryType (field_config JSON schema) / Entry (content JSON column) / EntryImage (field_name + order + properties JSON).
- Entry types created ONLY via admin UI /admin/entry-types (no API, no migration). Field types: text, textarea, number, select, checkbox, image, repeatable, image_collection, entry_relation, object. Nested fields one level (text..image). entry_relation = string exists:entries,id → relations exist.
- No `json` passthrough field type; EntryValidationService coerces unknown to string. Entries.content is native json, no size cap → add a `json` field type.

## API (/api/v1, X-API-Key per-user static key, throttle 60/min)
- READ ONLY: GET test, albums, albums/{id}, albums/by-title/{t}, mosaics..., entries, entries/by-type/{slug}, entries/{id}. per_page ≤100. Always status=published + published_at not null + entry_type_permissions.
- NO POST/PUT/DELETE on API; writes = Inertia web routes (session+CSRF). Sanctum installed but no token routes wired (commented-out media routes).
- Docs: Scramble at /docs/api and /docs/api.json.

## Files
- Storage::disk('spaces') hardcoded (DO Spaces bucket `bengijzel`, ams3 — SAME bucket the color app uses). POST /media/upload web-only. Auto WebP ≥2MB, no thumbnails/variants. 20MB max.

## Tenancy
- Per-user only; is_admin, is_approved, entry_type_permissions JSON. No projects/orgs. Permission tables in docs don't exist.

## CORS
- allowed_origins includes https://2025-bengijzel.netlify.app AND '*' with supports_credentials=true (invalid/insecure combo).

## Gaps for color app
1 write API for entries (+token auth) · 2 API file upload · 3 bulk/transactional writes · 4 json field type · 5 drafts/cross-user/project scope · 6 webhooks/filters/variants · 7 programmatic entry-type provisioning
