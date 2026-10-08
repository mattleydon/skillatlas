# Migration baseline

The canonical account migration sequence is:

1. `20260812031320_create_member_profiles.sql` — PR2 country catalogue and minimal member profiles.
2. `20260814225124_extended_identity_privacy.sql` — PR3A case-preserved identity, private profile fields, ordered Heritage, owner-only raw access, and the public-safe member RPC.
3. `20261007054039_profile_extended_identity_v2.sql` — optional avatar, ordered canonical Favourite Games, Platforms and Gaming Since; privacy-filtered public projection, owner-scoped avatar Storage policies and cleanup-before-deletion guard.
4. `20261008004116_profile_identity_geography.sql` — separate Profile identity-place catalogue (195 sovereign + four UK constituent countries), unchanged values/privacy, retargeted Profile foreign keys and public projection metadata. Competitive geography stays 195.

Migration history is append-only. Do not rename, replace, or rewrite an applied migration after review.

The hosted `skillatlas_page_comments` table remains outside this repository baseline because its exact hosted schema, grants, and RLS policies have not been established through an approved reproducible migration. Do not add a speculative replacement.

Every future migration must include reviewed RLS, privilege, integrity, and leakage tests in the same pull request. Ordinary development must use the local Supabase stack and must not link to or push changes to a hosted project.
