# Jimsengdle

Daily games platform for the boys. First game: **Jimsongdle** — guess the song from a clip.

## Song Seeding

Songs are pre-seeded per day using `scripts/seed-songs.ts`. It calls iTunes (metadata) and YouTube (video ID) for each song.

**iTunes rate limit: ~20 req/min per IP.** Do NOT use a VPN. If rate limited:

1. Stop the script completely
2. Wait 15–20 minutes for the IP to cool down
3. Re-run from the date it failed:

```powershell
npx tsx scripts/seed-songs.ts --start=YYYY-MM-DD --days=100
```

Options:
- `--start=YYYY-MM-DD` — date to seed from (default: today)
- `--days=N` — number of days to seed (default: 1)

The script upserts — safe to re-run, won't duplicate existing days.

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
