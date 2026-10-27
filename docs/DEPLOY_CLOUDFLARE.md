# Deploy ORBIT to Cloudflare (branch: cloudflare-host)
Static site served by a Cloudflare Worker with static assets. Only address: your custom domain, behind Cloudflare Access.

## What this branch adds
| File | Purpose |
|---|---|
| `wrangler.jsonc` | Worker config. workers.dev and preview URLs are off. One custom-domain route. |
| `public/_headers` | Security headers: no outside hosts, no framing, no search indexing |
| `public/robots.txt` | Blocks crawlers |
| `src/guardrails/hosting.test.ts` | Fails the gates if any of the above is weakened |

## Order of operations (PowerShell, in C:\dev\orbit)
1. **Domain active in Cloudflare.** In the dashboard, your domain must show **Active** (nameservers pointed to Cloudflare).
2. **Get the branch.** Copy: `git fetch "$HOME\Downloads\orbit-cloudflare-host.bundle" cloudflare-host:cloudflare-host`
3. **Switch to it.** Copy: `git checkout cloudflare-host`
4. **Install.** Copy: `npm install`
5. **Set your hostname.** In `wrangler.jsonc`, change `orbit.YOUR-DOMAIN` to your real hostname, for example `orbit.ncscdude.com`.
6. **Run the gates.** Copy: `npm run gates`
7. **Commit and push.** Copy: `git commit -am "Set Cloudflare hostname"` then `git push -u origin cloudflare-host`
8. **Create the Access gate first.** Dashboard > Zero Trust > Access > Applications > Add an application > Self-hosted.
   - Hostname: the same one as step 5.
   - Policy: Allow. Include: Emails. List each person by email.
   - Login method: One-time PIN.
9. **Log Wrangler in.** Copy: `npx wrangler login` (a browser opens; approve).
10. **Check, then deploy.** Copy: `npm run deploy:check` then `npm run deploy`
11. **Verify in a private browser window.** Open your hostname. You should see the Cloudflare Access sign-in, not ORBIT. Sign in, then ORBIT loads.

If step 8 will not accept the hostname before it exists, do step 10 first and finish step 8 right after. The data is fictional, so the short gap is low risk.

## Keep these Cloudflare features off
They inject outside scripts, which the security headers will block:
- Web Analytics (automatic setup)
- Rocket Loader
- Email Address Obfuscation

## Optional: deploy on every push
Dashboard > Workers & Pages > Create > Import a repository > `orbit-envision`.
- Branch: `cloudflare-host`
- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`

## NIPR access
A new domain is often uncategorized and may be blocked by the NIPR web isolation service until categorized. Request categorization through your help desk early.

## Limits
- Cloudflare Access free plan covers up to 50 users.
- This is a demo with fictional data. Real personnel data does not go here.
