'use client';

import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import styled from 'styled-components';
import { Button } from '@/components/atoms/Button';

const CheckoutContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const CheckoutButton = styled(Button)`
  width: 100%;
  position: relative;
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;
  margin-right: 0.5rem;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

interface StripeCheckoutProps {
  priceId: string;
  customerEmail?: string;
  practiceName?: string;
  children: React.ReactNode;
  className?: string;
}

// Initialize Stripe (you'll need to add your publishable key to .env.local)
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export function StripeCheckout({ 
  priceId, 
  customerEmail, 
  practiceName, 
  children, 
  className 
}: StripeCheckoutProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          customerEmail,
          practiceName,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { sessionId } = await response.json();
      const stripe = await stripePromise;

      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      const { error } = await stripe.redirectToCheckout({
        sessionId,
      });

      if (error) {
        console.error('Stripe checkout error:', error);
        alert('Payment failed. Please try again.');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CheckoutContainer className={className}>
      <CheckoutButton
        variant="primary"
        size="large"
        onClick={handleCheckout}
        disabled={isLoading}
      >
        {isLoading && <LoadingSpinner />}
        {children}
      </CheckoutButton>
    </CheckoutContainer>
  );
} 