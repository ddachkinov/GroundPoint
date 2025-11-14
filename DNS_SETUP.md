# DNS Setup for groundpoint.net on Shared Hosting

## Step 1: Access Your DNS Management Panel

Since groundpoint.net is on shared hosting, you'll need to access your hosting provider's control panel (cPanel, Plesk, or custom panel).

---

## Step 2: Add A Records

You need to add **3 A Records** pointing to your DigitalOcean droplet IP.

### In your DNS management panel, add these records:

| Type | Host/Name | Points To | TTL |
|------|-----------|-----------|-----|
| A | @ | YOUR_DROPLET_IP | 3600 |
| A | www | YOUR_DROPLET_IP | 3600 |
| A | api | YOUR_DROPLET_IP | 3600 |

### Example with actual IP (replace with yours):

If your DigitalOcean droplet IP is `143.198.123.45`:

| Type | Host/Name | Points To | TTL |
|------|-----------|-----------|-----|
| A | @ | 143.198.123.45 | 3600 |
| A | www | 143.198.123.45 | 3600 |
| A | api | 143.198.123.45 | 3600 |

---

## Step 3: Common DNS Panel Instructions

### cPanel (most common):

1. Login to cPanel
2. Find **"Zone Editor"** or **"Advanced DNS Zone Editor"**
3. Find groundpoint.net in the domain list
4. Click **"Manage"** or **"Edit"**
5. Click **"Add Record"** or **"+ A Record"**
6. Add each of the 3 A records above:
   - **Name**: `@` (for root domain)
   - **Address/Points to**: Your droplet IP
   - **TTL**: 3600 (or leave default)
7. Repeat for `www` and `api`

### Plesk:

1. Login to Plesk
2. Go to **"Websites & Domains"**
3. Click on groundpoint.net
4. Click **"DNS Settings"**
5. Click **"Add Record"**
6. Select **"A"** record type
7. Add each record with the droplet IP

### GoDaddy (if using GoDaddy DNS):

1. Login to GoDaddy account
2. Go to **"My Products"** → **"DNS"**
3. Find groundpoint.net and click **"Manage DNS"**
4. Scroll to **"Records"** section
5. Click **"Add"** for each A record

### Namecheap:

1. Login to Namecheap
2. Go to **"Domain List"**
3. Click **"Manage"** next to groundpoint.net
4. Click **"Advanced DNS"** tab
5. Click **"Add New Record"**
6. Add each A record

---

## Step 4: Verify DNS Configuration

After adding the records, wait 5-30 minutes for DNS propagation, then verify:

### Option A: Using Online Tools

Visit: https://dnschecker.org
- Enter: `groundpoint.net`
- Check Type: **A**
- Should show your droplet IP globally

Also check:
- `www.groundpoint.net`
- `api.groundpoint.net`

### Option B: Using Command Line

On your local computer:

```bash
# Check root domain
dig +short groundpoint.net
# Should return: YOUR_DROPLET_IP

# Check www subdomain
dig +short www.groundpoint.net
# Should return: YOUR_DROPLET_IP

# Check api subdomain
dig +short api.groundpoint.net
# Should return: YOUR_DROPLET_IP
```

Or use nslookup:

```bash
nslookup groundpoint.net
nslookup www.groundpoint.net
nslookup api.groundpoint.net
```

---

## Step 5: Remove Conflicting Records (If Any)

**Important**: If you see existing A records pointing to your shared hosting IP, you have two options:

### Option A: Complete Migration (Recommended)
- Delete the old A record for `@` (root domain)
- This moves the entire domain to DigitalOcean

### Option B: Keep Shared Hosting, Use Subdomain Only
- Keep the `@` record pointing to shared hosting
- Only add `api` subdomain pointing to DigitalOcean
- Access GroundPoint at: `api.groundpoint.net` (not ideal for users)

**I recommend Option A** - move the entire domain to DigitalOcean.

---

## Troubleshooting

### DNS Not Updating?

**Check TTL**: If there was an existing record, you need to wait for the old TTL to expire (usually 1-4 hours).

**Clear DNS Cache** on your computer:

```bash
# Windows
ipconfig /flushdns

# Mac
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder

# Linux
sudo systemd-resolve --flush-caches
```

### "Domain Already Exists" Error?

If your hosting provider shows an error, you might need to:
1. Remove the domain from your hosting account first
2. Or contact support to allow external DNS management

---

## What Happens During DNS Propagation?

- **0-5 minutes**: Your local DNS starts seeing new records
- **5-30 minutes**: Most global DNS servers updated
- **1-48 hours**: Full global propagation (rare to take this long)

During this time, some users may see the old site (shared hosting) and others may see the new site (DigitalOcean). This is normal.

---

## Quick Verification Checklist

Before running the deployment script, verify:

- [ ] `dig groundpoint.net` returns your droplet IP
- [ ] `dig www.groundpoint.net` returns your droplet IP
- [ ] `dig api.groundpoint.net` returns your droplet IP
- [ ] Or all 3 show correctly on https://dnschecker.org

Once all three are pointing to your droplet, you're ready to deploy! 🚀

---

## Next Step

Once DNS is configured and propagating, proceed to run the deployment script on your DigitalOcean droplet.
