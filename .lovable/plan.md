# Move login + database to VPS, files to Cloudflare R2 (no forgot-password)

VPS: 4 GB RAM, 1 CPU, 48 GB disk — enough for a self-hosted backend.

## Steps
1. Install Docker on the VPS and run a self-hosted backend (same system the app already uses: database + login + API), so app code barely changes. Add 2 GB swap for safety on 1 CPU.
2. Restore the backup (users list, files list, views, earnings, withdrawals, referrals, admin roles, all functions/rules) into the VPS database.
3. Recreate user accounts with the same IDs and emails so earnings stay linked. Passwords cannot be copied, so each old user gets a temporary password; admin (owner) sets new passwords from the admin panel. No forgot-password emails.
4. Files: new uploads go straight to Cloudflare R2 bucket `tanyora-files` using signed upload/download links from the VPS server. Copy the 2 existing files from current storage to R2.
5. Point app.tanyora.com and the website to the VPS backend, rebuild, deploy with PM2/Nginx, add HTTPS for an `api.tanyora.com` subdomain (needs one GoDaddy A record).
6. Test end to end: signup, login, upload, share link, views counting, earnings, withdrawal, admin panel.
7. Nightly database backup on the VPS.

## What the owner must do
- Add GoDaddy A record: `api` → 187.127.128.30.
- Publish the app once more after switch so the Play Store app uses the new backend.

## Risks
- Old users must use a new password (set by admin).
- 1 CPU may be slow under heavy traffic; upgrade VPS later if needed.
- Lovable Cloud stays untouched until the VPS version is fully verified.
