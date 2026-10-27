# Deploy ORBIT to Cloudflare (branch: cloudflare-host)
Static site served by a Cloudflare Worker with static assets. Only address: your custom domain, behind Cloudflare Access.

## What this branch adds
| File | Purpose |
|---|---|
| `wrangler.jsonc` | Worker config. Serves only `orbit.ncscdude.com`. workers.dev and preview URLs are off. |
| `scripts/deploy-orbit.ps1` | One-step deploy for Windows PowerShell |
| `public/_headers` | Security headers: no outside hosts, no framing, no search indexing |
| `public/robots.txt` | Blocks crawlers |
| `src/guardrails/hosting.test.ts` | Fails the gates if any of the above is weakened |

## Fast path (one script)
1. **Domain active.** `ncscdude.com` shows **Active** in the Cloudflare dashboard.
2. **Create the Access gate.** Dashboard > Zero Trust > Access > Applications > Add an application > Self-hosted.
   - Hostname: `orbit.ncscdude.com`
   - Policy: Allow. Include: Emails. List each person by email.
   - Login method: One-time PIN.
3. **Put both files in Downloads:** `deploy-orbit.ps1` and `orbit-cloudflare-host-v2.bundle`.
4. **Run it in PowerShell.** Copy: `powershell -ExecutionPolicy Bypass -File "$HOME\Downloads\deploy-orbit.ps1"`
5. **Answer the prompts.** Log in to Cloudflare if a browser opens, type YES at the Access question, and choose whether to push to GitHub.
6. **Verify in a private window:** `https://orbit.ncscdude.com` shows the Cloudflare Access sign-in, then ORBIT.

The script stops with a plain message if any step fails. Local edits are saved aside with `git stash`, never deleted.
Add `-SkipAcceptance` to the command if the Playwright browser cannot download on that machine.

## Manual path
| Step | PowerShell, in C:\dev\orbit |
|---|---|
| Update code | `git pull --ff-only "$HOME\Downloads\orbit-cloudflare-host-v2.bundle" cloudflare-host` |
| Install | `npm ci` |
| Gates | `npm run gates` |
| Log in | `npx wrangler login` |
| Deploy | `npm run deploy` |

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
