<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Application rules
- Centralize brand, operator contacts and the verified public host in src/lib/site.ts; keep intended domains separate to avoid unverified canonical and app links.
- Use Brand and LegalFooter for shared branding and legal navigation; legal claims must match shipped functionality.
- Generate leaf metadata through pageHead with noindex on personal/share pages; sitemap lists only public editorial pages.
- Fetch shared-file details and start countdowns only inside the native app because browser share links only offer installation.
