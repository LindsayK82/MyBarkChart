# MyBarkChart — Account Deletion (TEST BUILD)

## IMPORTANT: do not deploy before checking cascades
1. Run `account-deletion-preflight.sql` in Supabase SQL Editor (read-only).
2. Check that all references from public data to auth.users use `ON DELETE CASCADE`.
   Verify `profiles`, `pets`, `pet_clinics`, plus all five pet medical tables are covered.
   Also verify `pets` and all dependent rows cascade on pet deletion.
3. Confirm the `pet-photos` storage bucket exists, is private, and stores images under `{userId}/{petId}/...`.
4. Back up disposable test data and test this first with Socks, never Sparky.

## Edge Function setup
1. Supabase Dashboard → Edge Functions → New Function, name it exactly `delete-my-account`.
2. Paste `supabase/functions/delete-my-account/index.ts` into the function and deploy.
   Alternatively, using Supabase CLI: `supabase functions deploy delete-my-account`.
3. Keep Verify JWT ENABLED; use dashboard default secrets `SUPABASE_URL`,
   `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` in server environment.
   The service-role key must NEVER be copied into GitHub Pages HTML/JS.
4. Deploy the updated site `profile.html` via GitHub Pages.
5. Test from Socks's account, using email + DELETE confirmation.

## Expected deletion
- Storage objects under the deleting user's user-ID prefix removed.
- Auth user deleted, and rows removed by verified foreign-key cascades.
- Browser signs out and redirects home.
- Sparky's account remains unaffected.
- Verify in Supabase Auth Users and database tables after the test.
- Do not confuse "deleted profile row" with a removed Auth account.

## Cautions
- Storage deletion and Auth account deletion are not a single transaction.
  If the latter fails after photos are removed, some photos may already be gone.
  Function reports failure; contact support. A durable deletion-job architecture
  would be better before large-scale rollout.
- This endpoint requires a valid authenticated JWT, but does not perform
  password reauthentication. Consider recent-login confirmation for production.
- Frontend redirect includes `?accountDeleted=1` but the homepage currently does
  not display a dedicated confirmation banner.
- The function is locked to the current GitHub Pages origin. Change it before using a custom domain.
- Existing uploaded photo keys in other locations/buckets are not deleted.
- All user files from the original ZIP are preserved EXCEPT `.git` metadata
  (excluded from the generated distribution ZIP for cleanliness).
