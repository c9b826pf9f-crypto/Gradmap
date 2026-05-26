# GradMap — Deployment Guide

## What you have
- `public/index.html` — The full frontend app
- `api/create-checkout.js` — Creates Stripe payment sessions
- `api/verify-session.js` — Verifies payment after Stripe redirect
- `api/careers.js` — AI career results (preview + full)
- `api/parse-linkedin.js` — Parses LinkedIn profile info

---

## Step 1 — Get your accounts (all free)

1. **GitHub** → github.com → Create free account → New repository → name it `gradmap` → upload all these files
2. **Vercel** → vercel.com → Sign up with GitHub → Import your gradmap repo → Deploy (takes 60 seconds)
3. **Stripe** → stripe.com → Create account → Verify your bank details (needed to receive payments)
4. **Anthropic** → console.anthropic.com → Create API key → Add £10 credit (lasts thousands of searches)

---

## Step 2 — Set your environment variables in Vercel

Go to: Vercel Dashboard → Your Project → Settings → Environment Variables

Add these 4 variables:

| Name | Value | Where to find it |
|------|-------|-----------------|
| `ANTHROPIC_API_KEY` | `sk-ant-...` | console.anthropic.com → API Keys |
| `STRIPE_SECRET_KEY` | `sk_live_...` | stripe.com → Developers → API Keys |
| `STRIPE_PUBLISHABLE_KEY` | `pk_live_...` | stripe.com → Developers → API Keys |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | stripe.com → Webhooks (see Step 3) |
| `FRONTEND_URL` | `https://your-app.vercel.app` | Your Vercel deployment URL |

---

## Step 3 — Update the frontend with your keys

In `public/index.html`, find these two lines and replace:

```js
const API_BASE = 'https://your-app.vercel.app'; // ← your Vercel URL
const STRIPE_PK = 'pk_live_YOUR_KEY_HERE';       // ← your Stripe publishable key
```

---

## Step 4 — Buy your domain (optional but recommended)

1. Go to namecheap.com → search `gradmap.co.uk` (≈ £8/year)
2. Buy it
3. In Vercel: Settings → Domains → Add Domain → follow DNS instructions
4. Done — your app is live at gradmap.co.uk

---

## Step 5 — Test a payment

1. Use Stripe's test card: `4242 4242 4242 4242`, any future expiry, any CVC
2. Make sure you see the success page and results unlock
3. Switch Stripe from **Test** to **Live** mode (toggle in Stripe dashboard)
4. Change `pk_test_` → `pk_live_` and `sk_test_` → `sk_live_` in your env vars

---

## Your costs

| Service | Cost |
|---------|------|
| Vercel hosting | Free |
| Domain | ≈ £8/year |
| Stripe fees | 1.4% + 20p per transaction (~23p on £1) |
| Anthropic API | ≈ £0.002 per search (basically free) |
| **You keep per £1 payment** | **≈ £0.77** |

At 100 students/day: ≈ £77/day = £2,300/month

---

## Scaling up

- **Database**: Add Vercel KV (free tier) to store tokens properly
- **Email receipts**: Add Resend.com (free tier) to email results after payment
- **LinkedIn OAuth**: Apply for LinkedIn API access to auto-import profiles
- **University deals**: Sell bulk access to career centres at £500–£2000/year

---

## File structure
```
gradmap/
├── api/
│   ├── careers.js          ← AI results
│   ├── create-checkout.js  ← Stripe payment
│   ├── verify-session.js   ← Payment verification
│   └── parse-linkedin.js   ← LinkedIn parsing
├── public/
│   └── index.html          ← The app
├── vercel.json             ← Routing config
└── package.json
```
