# Native data loading
- Share only in-flight user-scoped file/profile reads, and refresh on focus/resume; settled plan data must not be permanently cached because website upgrades must appear in the app.
- Associate async file/profile/avatar state with its account/path and reject stale completions so account changes cannot display previous-user data.
- Read owned files in stable, bounded backend pages until complete; do not derive storage or category totals from a truncated page. Large libraries still require a separately staged aggregate/lazy-list rollout.