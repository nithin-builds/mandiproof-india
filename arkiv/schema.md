# Arkiv schema

Project namespace: `mandiproof-india-v1`

## `price_quote`

Payload (`application/json`):

| Field | Type | Purpose |
|---|---|---|
| crop | string | Human-readable crop name |
| variety | string | Crop variety or grade |
| mandi | string | Public market or APMC |
| state | string | Indian state |
| price | number | INR per quintal |
| unit | string | Display unit, currently quintal |
| source | string | Public source category, never personal data |
| publishedAt | ISO string | Human-readable publication time |

Indexed attributes:

| Attribute | Arkiv type | Purpose |
|---|---|---|
| project | str | Namespace isolation |
| entity_type | str | Entity discriminator |
| crop | str | Exact crop filter |
| state | str | Exact state filter |
| mandi | str | Exact market filter |
| price_inr | dec | Price/range queries |
| posted_at_ms | u64 | Recency/range queries |

Quotes are created `readonly` and expire after 1, 3 or 7 days. Expiry is essential domain behavior: stale quotes should cease to appear, not remain as misleading historical facts.
