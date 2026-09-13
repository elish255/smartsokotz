# Smart Soko — Shopflix catalog sync

The category currently exposes 162 pages of Mobile Phone Accessories. Run `bun run sync:shopflix` (or `npm run sync:shopflix`) to fetch all 162 pages and write the current product names/prices/source URLs to `src/data/shopflix-accessories.json`.

This sync intentionally does not copy Shopflix product descriptions or images into the project. Use product media only if you have permission/license to reuse it.
