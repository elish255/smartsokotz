# SMART SOKO — Account & Payment setup

## 1. Supabase
Run `supabase/SMART_SOKO_SHARED.sql` once in the Supabase project you want SMART SOKO to use.

It creates `profiles`, `orders`, `order_items`, the profile trigger, and RLS policies. Guest checkout requires `user_id` in `orders` to allow NULL, so run `supabase/SMART_SOKO_GUEST_CHECKOUT.sql` once after the shared schema is installed. Existing registered orders remain linked to their users.

## 2. Vercel variables
Browser-safe:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Server-only:
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY` OR `SUPABASE_SERVICE_ROLE_KEY`
- `SPLASHPAY_API_KEY` (server-side SplashPay API key)
- `SPLASHPAY_API_SECRET` (server-side SplashPay API secret)
- Payment endpoints are configured in `api/payment.ts`; no webhook is used.


Do not prefix secret keys with `VITE_`.

## 3. Cart + checkout
The cart is stored in browser localStorage and supports products from every catalog without depending on an external Shopify cart. Customers do not need to register or log in to pay. Checkout only asks for full name and the phone number to receive the mobile-money payment push. Delivery distance and delivery charges are not calculated.

## 4. Payment
The checkout payment service starts the payment push for the product subtotal only; there is no delivery-distance step.
Payment status is checked through the SplashPay `payments/check-status` endpoint.

## Registration error repair

Kama `/auth/v1/signup` inarudisha `500` na ujumbe `Database error saving new user`, tumia:

`supabase/SMART_SOKO_REGISTRATION_REPAIR.sql`

SQL hii inarekebisha `public.profiles` na trigger ya `auth.users` bila kufuta `auth.users`. Baada ya ku-run SQL, jaribu registration tena.
