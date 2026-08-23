# PostgreSQL Fundamentals Exercise

## Setup

Run all commands from the repository root. The reset command permanently deletes all local data in `webhook_db`.

```bash
docker compose up -d
corepack pnpm --filter @webhook-center/api exec prisma migrate reset
docker compose exec postgres psql -U admin -d webhook_db
```

## Insert sample data

```sql
INSERT INTO "User" (email, "passwordHash", "updatedAt")
VALUES (
  'darkus@sql-exercise.com',
  '62161261',
  CURRENT_TIMESTAMP
)
RETURNING id;

INSERT INTO "WebhookEndpoint" ("userId", name, "captureToken", "updatedAt")
VALUES (
  (SELECT id FROM "User" WHERE email = 'darkus@sql-exercise.com'),
  'sql-exercise',
  'sql-exercise-capture-token',
  CURRENT_TIMESTAMP
)
RETURNING id;

INSERT INTO "WebhookEvent" (
  "endpointId",
  method,
  path,
  headers,
  "rawBody",
  "bodySizeBytes"
)
VALUES (
  (SELECT id FROM "WebhookEndpoint" WHERE "captureToken" = 'sql-exercise-capture-token'),
  'POST',
  '/sql-exercise',
  '{"content-type":"application/json"}'::jsonb,
  convert_to('{"message":"hello from SQL"}', 'UTF8'),
  octet_length(convert_to('{"message":"hello from SQL"}', 'UTF8'))
)
RETURNING id;
```

Parent rows are inserted before child rows so every foreign key already has a valid target. The subqueries resolve foreign keys from unique values instead of relying on sequence-generated IDs. `bodySizeBytes` is calculated from the same bytes stored in `rawBody`, which satisfies the database check constraint.

## Select and joins

The first query reads one disposable user without loading every column.

```sql
SELECT id, email, "createdAt"
FROM "User"
WHERE email = 'darkus@sql-exercise.com';
```

The next query joins the user to endpoints whose `userId` references that user.

```sql
SELECT u.email, e.name, e."captureToken"
FROM "User" AS u
JOIN "WebhookEndpoint" AS e
  ON u.id = e."userId"
WHERE u.email = 'darkus@sql-exercise.com';
```

The final query follows the ownership chain from user to endpoint to captured event.

```sql
SELECT u.email, e.name, e."captureToken", v.method, v.path, v."bodySizeBytes"
FROM "User" AS u
JOIN "WebhookEndpoint" AS e
  ON u.id = e."userId"
JOIN "WebhookEvent" AS v
  ON e.id = v."endpointId"
WHERE u.email = 'darkus@sql-exercise.com';
```

These are inner joins, so only matching rows appear. If one endpoint has three events, the final query returns three rows. The user and endpoint values repeat because each child event creates one row in the flat query result.

## Update and delete

```sql
UPDATE "WebhookEndpoint"
SET
  name = 'SQL exercise endpoint updated',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "captureToken" = 'sql-exercise-capture-token'
RETURNING id, name, "updatedAt";

DELETE FROM "WebhookEvent"
WHERE "endpointId" = (
  SELECT id
  FROM "WebhookEndpoint"
  WHERE "captureToken" = 'sql-exercise-capture-token'
)
AND path = '/sql-exercise'
RETURNING id;
```

The update changes only the endpoint selected by its unique capture token. The delete removes the matching child event but keeps its user and endpoint. After the delete, the three-table inner join returns no rows because there is no longer a matching event.

## Transaction rollback

```sql
BEGIN;

INSERT INTO "User" (email, "passwordHash", "updatedAt")
VALUES (
  'rollback@sql-exercise.com',
  'rollback-demo-hash',
  CURRENT_TIMESTAMP
);

INSERT INTO "WebhookEndpoint" ("userId", name, "captureToken", "updatedAt")
VALUES (
  (SELECT id FROM "User" WHERE email = 'rollback@sql-exercise.com'),
  'Rollback endpoint',
  'sql-exercise-rollback-token',
  CURRENT_TIMESTAMP
);

SELECT u.email, e.name, e."captureToken"
FROM "User" AS u
JOIN "WebhookEndpoint" AS e
  ON u.id = e."userId"
WHERE u.email = 'rollback@sql-exercise.com';

ROLLBACK;

SELECT u.email, e.name, e."captureToken"
FROM "User" AS u
JOIN "WebhookEndpoint" AS e
  ON u.id = e."userId"
WHERE u.email = 'rollback@sql-exercise.com';
```

The first select returns the temporary rows while the transaction is open. The select after `ROLLBACK` returns zero rows, proving that both related inserts were cancelled and no partial state remained.

## Constraint violations

Both statements below are expected to fail. They demonstrate that PostgreSQL protects the data even when SQL is executed without Prisma.

```sql
-- Expected: duplicate key violates the User_email_key unique constraint.
INSERT INTO "User" (email, "passwordHash", "updatedAt")
VALUES (
  'darkus@sql-exercise.com',
  'another-hash',
  CURRENT_TIMESTAMP
);

-- Expected: endpointId violates the WebhookEvent_endpointId_fkey foreign key.
INSERT INTO "WebhookEvent" (
  "endpointId",
  method,
  path,
  headers,
  "rawBody",
  "bodySizeBytes"
)
VALUES (
  999999,
  'POST',
  '/invalid-endpoint',
  '{}'::jsonb,
  convert_to('', 'UTF8'),
  0
);
```

The unique constraint prevents two accounts from using the same email. The foreign key prevents an event from referencing an endpoint that does not exist.

## Cleanup

```sql
DELETE FROM "User"
WHERE email = 'darkus@sql-exercise.com'
RETURNING id;

SELECT
  (SELECT count(*) FROM "User" WHERE email = 'darkus@sql-exercise.com') AS users,
  (SELECT count(*) FROM "WebhookEndpoint" WHERE "captureToken" = 'sql-exercise-capture-token') AS endpoints,
  (SELECT count(*) FROM "WebhookEvent" WHERE path = '/sql-exercise') AS events;
```

Deleting the disposable user also deletes its endpoints and events through `ON DELETE CASCADE`. All three counts should be zero. Generated sequence IDs are not reset, which is why the exercise uses unique values and subqueries instead of fixed IDs.

## Observations

- SQL CRUD maps to `INSERT`, `SELECT`, `UPDATE`, and `DELETE`.
- Foreign keys define the `User -> WebhookEndpoint -> WebhookEvent` ownership chain.
- Joins combine related rows by matching primary and foreign keys.
- A transaction applies all its changes together, while `ROLLBACK` applies none of them.
- Unique, foreign-key, check, and cascade constraints preserve valid relationships at the database level.
