# SMART SOKO — Account, Delivery & FimiPay setup

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
- `FIMIPAY_API_KEY`
- `FIMIPAY_CURRENCY=TZS`
- `FIMIPAY_CREATE_PAYMENT_URL=https://fimipay.com/api/v1/payment/create_order`
- `FIMIPAY_ORDER_STATUS_URL=https://fimipay.com/api/v1/payment/order_status`

Do not prefix secret keys with `VITE_`.

## 3. Delivery
Delivery is calculated offline from Kariakoo using predefined delivery zones.

No Google Maps API key or Google Cloud billing is required.

Rate: `TZS 2,000 / estimated km`.
Dar es Salaam district estimates:
- Ilala: 3 km
- Kinondoni: 8 km
- Temeke: 10 km
- Ubungo: 12 km
- Kigamboni: 15 km

Other regions use a predefined regional delivery distance. The value is an estimate for pricing, not live road distance.

The Pay button remains disabled until the delivery details are complete and the offline delivery calculation succeeds.

## 4. Cart + registration
The cart is persisted in browser localStorage. If a visitor presses `Weka kikapuni` while not logged in:
1. the selected product is stored as a pending cart item;
2. the visitor is sent to `/register`;
3. after login, the pending product is automatically added to the cart;
4. leaving and returning to the site keeps the local cart.

## 5. FimiPay
FimiPay is used only for the checkout payment push. The request contains the final product subtotal + delivery fee.
Payment status is checked through the FimiPay order-status endpoint.

## Registration error repair

Kama `/auth/v1/signup` inarudisha `500` na ujumbe `Database error saving new user`, tumia:

`supabase/SMART_SOKO_REGISTRATION_REPAIR.sql`

SQL hii inarekebisha `public.profiles` na trigger ya `auth.users` bila kufuta `auth.users`. Baada ya ku-run SQL, jaribu registration tena.
