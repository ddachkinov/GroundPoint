# DNS Setup for groundpoint.net - Quick Reference

## STEP 1: Add DNS A Records (5 minutes)

### Access Your Shared Hosting Control Panel

Login to your hosting provider's control panel (cPanel, Plesk, or custom dashboard)

---

### Add These 3 A Records:

```
Record 1:
  Type: A
  Host: @
  Points To: YOUR_DROPLET_IP
  TTL: 3600 (or Auto)

Record 2:
  Type: A
  Host: www
  Points To: YOUR_DROPLET_IP
  TTL: 3600 (or Auto)

Record 3:
  Type: A
  Host: api
  Points To: YOUR_DROPLET_IP
  TTL: 3600 (or Auto)
```

**Important:** Replace `YOUR_DROPLET_IP` with your actual DigitalOcean droplet IP address

**Example:** If your droplet IP is `143.198.123.45`, then:
- @ → 143.198.123.45
- www → 143.198.123.45
- api → 143.198.123.45

---

### Visual Guide:

```
┌─────────────────────────────────────────────┐
│         DNS A Record Configuration          │
├──────────┬──────────┬──────────────────────┤
│   Type   │   Host   │      Points To       │
├──────────┼──────────┼──────────────────────┤
│    A     │    @     │  143.198.123.45     │
│    A     │   www    │  143.198.123.45     │
│    A     │   api    │  143.198.123.45     │
└──────────┴──────────┴──────────────────────┘
```

---

### What Each Record Does:

- **@ (root)** → Points `groundpoint.net` to your server
- **www** → Points `www.groundpoint.net` to your server
- **api** → Points `api.groundpoint.net` to your server

---

### Common Control Panel Instructions:

#### cPanel:
1. Find **"Zone Editor"** or **"Advanced DNS Zone Editor"**
2. Select `groundpoint.net` domain
3. Click **"+ A Record"** for each record
4. Fill in Host and Points To
5. Click **"Add Record"**

#### Plesk:
1. Go to **"Websites & Domains"**
2. Click **"DNS Settings"** for groundpoint.net
3. Click **"Add Record"**
4. Select **A** type
5. Enter host and IP address

#### GoDaddy:
1. **"My Products"** → **"DNS"**
2. Find groundpoint.net → **"Manage DNS"**
3. Scroll to **"Records"**
4. Click **"Add"** for each A record

#### Namecheap:
1. **"Domain List"** → **"Manage"**
2. **"Advanced DNS"** tab
3. **"Add New Record"**
4. Select **A Record** type

---

### Verify DNS Propagation

**Wait 10-30 minutes**, then check:

#### Option 1: Online Tool
Visit: https://dnschecker.org
- Enter: `groundpoint.net`
- Type: A
- Should show your droplet IP

Also check:
- `www.groundpoint.net`
- `api.groundpoint.net`

#### Option 2: Command Line
```bash
# Check each domain
dig +short groundpoint.net
dig +short www.groundpoint.net
dig +short api.groundpoint.net

# All should return: YOUR_DROPLET_IP
```

---

### ✅ Checklist

Before proceeding to deployment, verify:

- [ ] Added A record for `@` → Droplet IP
- [ ] Added A record for `www` → Droplet IP
- [ ] Added A record for `api` → Droplet IP
- [ ] Waited 10-30 minutes for DNS propagation
- [ ] Verified all 3 domains resolve to droplet IP

---

### Troubleshooting

**DNS not updating?**
- Wait up to 1 hour for full propagation
- Clear your local DNS cache:
  ```bash
  # Windows
  ipconfig /flushdns

  # Mac
  sudo dscacheutil -flushcache

  # Linux
  sudo systemd-resolve --flush-caches
  ```

**"Domain already exists" error?**
- You may need to remove domain from hosting account first
- Or contact support to enable external DNS management

**Still seeing old shared hosting site?**
- DNS still propagating - wait longer
- Check you edited the correct domain
- Verify droplet IP is correct

---

## Once DNS is Ready → Proceed to Deployment!

When all 3 DNS records resolve correctly, you're ready to run the deployment script on your DigitalOcean droplet.

**Next:** Follow `EXACT_COMMANDS.md` for deployment steps
