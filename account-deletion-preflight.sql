-- Read-only preflight: verify auth.users references cascade.
-- Every reference to auth.users(id) used for user-owned data should be ON DELETE CASCADE.
SELECT
  con.conrelid::regclass AS referencing_table,
  con.conname AS foreign_key,
  pg_get_constraintdef(con.oid) AS definition
FROM pg_constraint con
WHERE con.contype = 'f'
  AND con.confrelid = 'auth.users'::regclass
ORDER BY referencing_table::text, foreign_key;

-- Also check any user ID ownership columns and their policies manually.
-- Do not deploy the delete-my-account Edge Function until the relevant
-- foreign keys cascade and test-only data is available.
