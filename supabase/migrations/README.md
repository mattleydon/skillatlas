# Migration baseline

PR 1 intentionally adds no account-domain or public-schema migrations.

The hosted `skillatlas_page_comments` table is used by the existing page-comments client, but its exact hosted columns, grants, and RLS policies could not be established through the available safe read-only inspection. No speculative migration or policy is included here. A reviewed baseline must be captured separately before this repository claims to reproduce that existing table.

Future migrations belong in this directory as timestamped SQL files and must include reviewed RLS and database tests in the same pull request.
