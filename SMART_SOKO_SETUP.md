# SMART SOKO — Account, Delivery & Payment setup

## 1. Supabase
Run `supabase/SMART_SOKO_SHARED.sql` once in the Supabase project you want SMART SOKO to use.

It creates:
- `profiles` for registered customers
- `delivery_addresses` for saved delivery addresses
- `orders` and `order_items` for checkout history
- an `auth.users` trigger that automatically creates/updates the customer profile
- RLS policies so customers can only read their own records

The app uses Supabase Auth email/password. Full name and phone are stored in `profiles`.

## 2. Vercel variables
Browser-safe:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Server-only:
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY` OR `SUPABASE_SERVICE_ROLE_KEY`
- `FIMIPAY_API_KEY` (server-side payment provider key)
- `FIMIPAY_CURRENCY=TZS` (server-side)
- `FIMIPAY_CREATE_PAYMENT_URL=https://fimipay.com/api/v1/payment/create_order` (server-side)
- `FIMIPAY_ORDER_STATUS_URL=https://fimipay.com/api/v1/payment/order_status` (server-side)


Do not prefix secret keys with `VITE_`.

## 3. Delivery
Delivery origin is Kariakoo Market, Dar es Salaam.

Delivery uses configured district distance estimates and does not require an external maps API.
Rate: `TZS 2,000 / km`, rounded up to the next whole kilometre.
For Dar es Salaam, minimum delivery fees are:
- Ilala: 5,000
- Kinondoni: 7,000
- Temeke: 10,000
- Ubungo: 7,000
- Kigamboni: 12,000

For other regions, the region minimum in `src/data/tanzania.ts` is used. The distance calculation can still produce a higher amount.

The Pay button remains disabled until the delivery details are complete and the delivery estimate is calculated.

## 4. Cart + registration
The cart is persisted in browser localStorage. If a visitor presses `Weka kikapuni` while not logged in:
1. the selected product is stored as a pending cart item;
2. the visitor is sent to `/register`;
3. after login, the pending product is automatically added to the cart;
4. leaving and returning to the site keeps the local cart.

## 5. Payment
The checkout payment service is used only for the payment push. The request contains the final product subtotal + delivery fee.
Payment status is checked through the provider order-status endpoint.

## Registration error repair

Kama `/auth/v1/signup` inarudisha `500` na ujumbe `Database error saving new user`, tumia:

`supabase/SMART_SOKO_REGISTRATION_REPAIR.sql`

SQL hii inarekebisha `public.profiles` na trigger ya `auth.users` bila kufuta `auth.users`. Baada ya ku-run SQL, jaribu registration tena.
