## Mobile review rules
- Samples never create authentication and real sessions take precedence, preventing preview data from impersonating an account.
- Keep Profile and Upload styles scoped and use reusable typed file rows for consistent preview visuals without changing production screens.
- The review shell owns one bounded scrolling main and a separate non-overlay navigation row so navigation never covers content.
- Hand real mutations off to existing authenticated screens so preview samples cannot modify accounts or storage.
- Never import from the Expo tree; browser preview compilation must remain independent of native configuration.