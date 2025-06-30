# Stripe Setup Guide

## Environment Variables

Create a `.env.local` file in your project root with the following variables:

```bash
# Stripe Configuration
# Get these from your Stripe Dashboard: https://dashboard.stripe.com/apikeys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here

# Stripe Price IDs
# Create these in your Stripe Dashboard: https://dashboard.stripe.com/products
STRIPE_STARTER_PRICE_ID=price_your_starter_price_id_here
```

## Stripe Dashboard Setup

### 1. Create a Stripe Account
- Go to [stripe.com](https://stripe.com) and create an account
- Complete the account verification process

### 2. Get API Keys
- Go to [Stripe Dashboard > API Keys](https://dashboard.stripe.com/apikeys)
- Copy your **Publishable Key** and **Secret Key**
- Add them to your `.env.local` file

### 3. Create Products and Prices
- Go to [Stripe Dashboard > Products](https://dashboard.stripe.com/products)
- Create a new product called "MedspaSync Pro Starter"
- Set the price to $99/month (recurring)
- Copy the **Price ID** (starts with `price_`)
- Add it to your `.env.local` file as `STRIPE_STARTER_PRICE_ID`

### 4. Update the Pricing Page
- Open `src/app/pricing/page.tsx`
- Replace `'price_starter_monthly'` with your actual Stripe Price ID

## Testing

### Test Mode
- Use test card numbers from [Stripe's test documentation](https://stripe.com/docs/testing)
- Recommended test card: `4242 4242 4242 4242`
- Any future expiry date and any 3-digit CVC

### Webhook Setup (Optional)
For production, you'll want to set up webhooks to handle subscription events:
- Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
- Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
- Select events: `checkout.session.completed`, `customer.subscription.created`

## Production Deployment

### 1. Switch to Live Keys
- Replace test keys with live keys in your production environment
- Update the Price ID to your live Price ID

### 2. Update Success URL
- In `src/app/api/create-checkout-session/route.ts`
- Update the `success_url` to your production domain

### 3. Environment Variables
- Add the environment variables to your hosting platform (Netlify, Vercel, etc.)
- Never commit `.env.local` to version control

## Security Notes

- Keep your secret key secure and never expose it in client-side code
- Use environment variables for all sensitive configuration
- The publishable key is safe to use in client-side code
- Always use HTTPS in production 