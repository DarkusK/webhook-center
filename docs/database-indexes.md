# Database Index Investigation

This investigation maps each new index to a real Webhook Center query and compares `EXPLAIN ANALYZE` plans on small and larger disposable datasets.

## Named query patterns

### Q1: list endpoints owned by one user

```sql
SELECT id, name
FROM "WebhookEndpoint"
WHERE "userId" = $1;
```

This query needs efficient equality lookup by `userId`.

### Q2: load the latest events for one endpoint

```sql
SELECT id, "receivedAt"
FROM "WebhookEvent"
WHERE "endpointId" = $1
ORDER BY "receivedAt" DESC
LIMIT 100;
```

This query first filters by `endpointId`, then reads events in descending `receivedAt` order and stops after 100 rows.

## Existing indexes

Before the migration, PostgreSQL reported these indexes:

```text
WebhookEndpoint_pkey               PRIMARY KEY, btree (id)
WebhookEndpoint_captureToken_key   UNIQUE, btree (captureToken)
WebhookEvent_pkey                  PRIMARY KEY, btree (id)
```

The primary-key and unique indexes do not start with `userId` or `endpointId`, so they cannot serve Q1 or Q2.

## Small dataset plans

The initial dataset contained one endpoint and no events:

```text
WebhookEndpoint: 1 row
WebhookEvent:    0 rows
```

Before the migration, Q1 used a sequential scan:

```text
Seq Scan on WebhookEndpoint
  Filter: (userId = 1)
  actual rows=1
Execution Time: 0.018 ms
```

Q2 used a sequential scan followed by a sort:

```text
Limit
  -> Sort
       Sort Key: receivedAt DESC
       -> Seq Scan on WebhookEvent
            Filter: (endpointId = 1)
Execution Time: 0.069 ms
```

After the migration and benchmark cleanup, PostgreSQL still chose sequential scans on the same small dataset:

```text
Q1: Seq Scan, Execution Time: 0.034 ms
Q2: Seq Scan -> Sort -> Limit, Execution Time: 0.047 ms
```

This is expected. Reading an entire one-row or empty table is cheaper than traversing an index and then fetching table rows. An unused index on a tiny dataset is therefore a planner decision, not evidence that the index is broken.

## Large dataset plans before indexes

The benchmark generated 10,000 events for the target endpoint and 10,000 unrelated users with one endpoint each. Unique prefixes made every row disposable.

```sql
INSERT INTO "WebhookEvent" (
  "endpointId",
  method,
  path,
  headers,
  "rawBody",
  "bodySizeBytes",
  "receivedAt"
)
SELECT
  (
    SELECT id
    FROM "WebhookEndpoint"
    WHERE "captureToken" = 'sql-exercise-capture-token'
  ),
  'POST',
  '/benchmark/' || n,
  '{}'::jsonb,
  convert_to('', 'UTF8'),
  0,
  CURRENT_TIMESTAMP - n * INTERVAL '1 second'
FROM generate_series(1, 10000) AS series(n);

INSERT INTO "User" (email, "passwordHash", "updatedAt")
SELECT
  'index-user-' || n || '@example.com',
  'benchmark-hash',
  CURRENT_TIMESTAMP
FROM generate_series(1, 10000) AS series(n)
ON CONFLICT (email) DO NOTHING;

INSERT INTO "WebhookEndpoint" ("userId", name, "captureToken", "updatedAt")
SELECT
  u.id,
  'benchmark-endpoint-' || u.id,
  'benchmark-token-' || u.id,
  CURRENT_TIMESTAMP
FROM "User" AS u
WHERE u.email LIKE 'index-user-%@example.com'
ON CONFLICT ("captureToken") DO NOTHING;

ANALYZE "WebhookEndpoint";
ANALYZE "WebhookEvent";
```

Q1 scanned all 10,001 endpoints to return one row:

```text
Seq Scan on WebhookEndpoint
  Filter: (userId = 1)
  Rows Removed by Filter: 10000
  Buffers: shared hit=124
Execution Time: 0.372 ms
```

Q2 scanned and sorted all 10,000 matching events before returning 100:

```text
Limit
  -> Sort
       Sort Key: receivedAt DESC
       Sort Method: top-N heapsort
       -> Seq Scan on WebhookEvent
            Filter: (endpointId = 1)
            actual rows=10000
Execution Time: 1.758 ms
```

## Indexes and migration

The Prisma schema maps one index to each named query:

```prisma
model WebhookEndpoint {
  // fields omitted
  @@index([userId])
}

model WebhookEvent {
  // fields omitted
  @@index([endpointId, receivedAt(sort: Desc)])
}
```

Migration `20260825125311_add_database_indexes` creates exactly these B-tree indexes:

```sql
CREATE INDEX "WebhookEndpoint_userId_idx"
ON "WebhookEndpoint"("userId");

CREATE INDEX "WebhookEvent_endpointId_receivedAt_idx"
ON "WebhookEvent"("endpointId", "receivedAt" DESC);
```

The composite index follows the query: the equality field comes first and the ordering field second. A separate index on `endpointId` would be redundant because the composite index can also support queries using its leading column.

## Plans after indexes

On the large dataset, Q1 changed from a sequential scan to an index scan:

```text
Index Scan using WebhookEndpoint_userId_idx on WebhookEndpoint
  Index Cond: (userId = 1)
  Index Searches: 1
  Buffers: shared hit=1 read=2
Execution Time: 0.054 ms
```

The plan no longer reads and rejects 10,000 unrelated endpoints. The observed local execution time changed from `0.372 ms` to `0.054 ms`.

Q2 used the composite index and no longer needed a separate sort:

```text
Limit
  -> Index Scan using WebhookEvent_endpointId_receivedAt_idx on WebhookEvent
       Index Cond: (endpointId = 1)
       actual rows=100
       Index Searches: 1
       Buffers: shared hit=1 read=2
Execution Time: 0.057 ms
```

The index already stores matching events in the requested order, so PostgreSQL stops after 100 rows. The observed local execution time changed from `1.758 ms` to `0.057 ms`. Timings depend on hardware and cache state; the important evidence is the changed scan type, removed sort, and reduced rows read.

## Trade-offs

- Both indexes speed up the named read queries.
- Every relevant insert, delete, or indexed-column update must also update a B-tree, increasing write work.
- Index pages consume disk space and memory cache.
- The event index supports `endpointId` alone or `endpointId` with `receivedAt` ordering, but not a global `receivedAt`-only query efficiently because `endpointId` is its leading column.
- No indexes were added for `method`, `path`, JSON headers, raw bodies, or speculative full-text search because no current named query justifies them.

## Rollback

Prisma migrations are forward-only. To reverse this change while keeping migration history consistent, remove both `@@index` declarations from the schema and create a new migration. Its inverse SQL should be:

```sql
DROP INDEX IF EXISTS "WebhookEvent_endpointId_receivedAt_idx";
DROP INDEX IF EXISTS "WebhookEndpoint_userId_idx";
```

The indexes contain no application data, so dropping them changes query performance but does not remove table rows.

## Cleanup

The benchmark rows were removed in one transaction:

```sql
BEGIN;

DELETE FROM "WebhookEvent"
WHERE path LIKE '/benchmark/%';

DELETE FROM "User"
WHERE email LIKE 'index-user-%@example.com';

COMMIT;
```

Deleting the generated users cascaded to their generated endpoints. Verification returned zero benchmark events, users, and endpoints while preserving the original exercise user and endpoint.
