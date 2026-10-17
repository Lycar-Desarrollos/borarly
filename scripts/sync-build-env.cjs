// Syncs Cloudflare Build Environment Variables into .env.production
// so that both Next.js build and @opennextjs/cloudflare runtime (next-env.mjs)
// receive all configured variables automatically.
const fs = require('node:fs');
const path = require('node:path');

const envLocalPath = path.join(process.cwd(), '.env.local');
const envProdPath = path.join(process.cwd(), '.env.production');

// Only generate .env.production in CI / Cloudflare Builds when .env.local is not present
if (!fs.existsSync(envLocalPath) && !fs.existsSync(envProdPath)) {
  const prefixes = ['NEXT_PUBLIC_', 'SYSCOM_', 'SMTP_', 'PAYPAL_', 'SALES_NOTIFICATION_EMAIL'];
  const lines = [];

  for (const [key, rawValue] of Object.entries(process.env)) {
    if (typeof rawValue !== 'string' || !rawValue) continue;
    if (prefixes.some((prefix) => key.startsWith(prefix))) {
      // Strip accidental surrounding single or double quotes entered in dashboard UI
      const cleanValue = rawValue.trim().replace(/^['"]|['"]$/g, '');
      lines.push(`${key}=${JSON.stringify(cleanValue)}`);
    }
  }

  if (lines.length > 0) {
    fs.writeFileSync(envProdPath, lines.join('\n') + '\n', 'utf8');
    console.log(`[sync-build-env] Wrote ${lines.length} variables to .env.production for OpenNext runtime.`);
  }
}
