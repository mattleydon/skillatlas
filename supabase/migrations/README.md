# Migration baseline

The canonical account migration sequence is:

1. `20260812031320_create_member_profiles.sql` — PR2 country catalogue and minimal member profiles.
2. `20260814225124_extended_identity_privacy.sql` — PR3A case-preserved identity, private profile fields, ordered Heritage, owner-only raw access, and the public-safe member RPC.

Migration history is append-only. Do not rename, replace, or rewrite an applied migration after review.

The hosted `skillatlas_page_comments` table remains outside this repository baseline because its exact hosted schema, grants, and RLS policies have not been established through an approved reproducible migration. Do not add a speculative replacement.

Every future migration must include reviewed RLS, privilege, integrity, and leakage tests in the same pull request. Ordinary development must use the local Supabase stack and must not link to or push changes to a hosted project.
