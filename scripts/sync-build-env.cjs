// Syncs Cloudflare Build Environment Variables into .env.production
// so that both Next.js build and @opennextjs/cloudflare runtime (next-env.mjs)
// receive all configured variables automatically.
const fs = require('node:fs');
const path = require('node:path');

const envLocalPath = path.join(process.cwd(), '.env.local');
const envProdPath = path.join(process.cwd(), '.env.production');

// Only generate .env.production and inject wrangler.jsonc vars in CI / Cloudflare Builds when .env.local is not present
if (!fs.existsSync(envLocalPath)) {
  const prefixes = ['NEXT_PUBLIC_', 'SYSCOM_', 'RESEND_', 'SMTP_', 'PAYPAL_', 'SALES_NOTIFICATION_EMAIL'];
  const lines = [];
  const runtimeVars = {};

  for (const [key, rawValue] of Object.entries(process.env)) {
    if (typeof rawValue !== 'string' || !rawValue) continue;
    if (prefixes.some((prefix) => key.startsWith(prefix))) {
      // Strip accidental surrounding single or double quotes entered in dashboard UI
      const cleanValue = rawValue.trim().replace(/^['"]|['"]$/g, '');
      lines.push(`${key}=${JSON.stringify(cleanValue)}`);
      runtimeVars[key] = cleanValue;
    }
  }

  if (lines.length > 0) {
    fs.writeFileSync(envProdPath, lines.join('\n') + '\n', 'utf8');
    console.log(`[sync-build-env] Wrote ${lines.length} variables to .env.production.`);
  }

  const wranglerPath = path.join(process.cwd(), 'wrangler.jsonc');
  if (fs.existsSync(wranglerPath) && Object.keys(runtimeVars).length > 0) {
    try {
      const wranglerRaw = fs.readFileSync(wranglerPath, 'utf8');
      const wranglerConfig = JSON.parse(wranglerRaw);
      wranglerConfig.vars = { ...(wranglerConfig.vars || {}), ...runtimeVars };
      fs.writeFileSync(wranglerPath, JSON.stringify(wranglerConfig, null, 2) + '\n', 'utf8');
      console.log(`[sync-build-env] Injected ${Object.keys(runtimeVars).length} runtime vars into wrangler.jsonc.`);
    } catch (err) {
      console.warn('[sync-build-env] Could not update wrangler.jsonc:', err);
    }
  }
}
