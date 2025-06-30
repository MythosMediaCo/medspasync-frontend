'use client';

import React from 'react';
import styled from 'styled-components';
import { Navigation } from '@/components/organisms/Navigation';
import { Button } from '@/components/atoms/Button';
import { Footer } from '@/components/organisms/Footer';
import { StripeCheckout } from '@/components/molecules/StripeCheckout';

const PricingContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const PageTitle = styled.h1`
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-size: 2.25rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray[900]};
  text-align: center;
  margin-bottom: 1rem;
`;

const PageSubtitle = styled.p`
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-size: 1.125rem;
  color: ${({ theme }) => theme.colors.gray[500]};
  text-align: center;
  margin-bottom: 3rem;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.5;
`;

const PricingGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
`;

const PricingCard = styled.div<{ $featured?: boolean }>`
  background: ${({ $featured }) => $featured ? '#ffffff' : '#ffffff'};
  border: 2px solid ${({ theme, $featured }) => $featured ? theme.colors.primary[600] : theme.colors.gray[300]};
  border-radius: 0.75rem;
  padding: 2rem;
  position: relative;
  box-shadow: ${({ $featured }) => $featured ? '0 10px 25px rgba(2, 132, 199, 0.15)' : '0 1px 3px rgba(0, 0, 0, 0.1)'};
  transition: all 0.2s ease-out;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: ${({ $featured }) => $featured ? '0 20px 40px rgba(2, 132, 199, 0.2)' : '0 8px 25px rgba(0, 0, 0, 0.15)'};
  }
`;

const FeaturedBadge = styled.div`
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: ${({ theme }) => theme.colors.primary[600]};
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 1rem;
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-size: 0.875rem;
  font-weight: 600;
`;

const ComingSoonBadge = styled.div`
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: ${({ theme }) => theme.colors.gray[500]};
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 1rem;
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-size: 0.875rem;
  font-weight: 600;
`;

const DisabledCard = styled(PricingCard)`
  opacity: 0.6;
  pointer-events: none;
`;

const PlanName = styled.h3`
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-size: 1.5rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-bottom: 0.5rem;
  text-align: center;
`;

const PlanPrice = styled.div`
  text-align: center;
  margin-bottom: 1.5rem;
`;

const PriceAmount = styled.div`
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-size: 3rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary[600]};
  line-height: 1;
`;

const PricePeriod = styled.div`
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-top: 0.25rem;
`;

const PlanDescription = styled.p`
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.gray[500]};
  text-align: center;
  margin-bottom: 2rem;
  line-height: 1.5;
`;

const FeaturesList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 2rem 0;
`;

const FeatureItem = styled.li`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0;
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.gray[700]};
`;

const FeatureIcon = styled.div`
  width: 16px;
  height: 16px;
  background: ${({ theme }) => theme.colors.primary[600]};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 8px;
  flex-shrink: 0;
`;

const CTAButton = styled(Button)`
  width: 100%;
  margin-top: auto;
`;

const GuaranteeSection = styled.div`
  background: ${({ theme }) => theme.colors.gray[50]};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: 0.75rem;
  padding: 2rem;
  text-align: center;
  margin-bottom: 3rem;
`;

const GuaranteeTitle = styled.h3`
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-size: 1.25rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-bottom: 1rem;
`;

const GuaranteeText = styled.p`
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.gray[500]};
  line-height: 1.5;
`;

const FAQSection = styled.div`
  margin-top: 4rem;
`;

const FAQTitle = styled.h2`
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-size: 1.875rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray[900]};
  text-align: center;
  margin-bottom: 2rem;
`;

const FAQGrid = styled.div`
  display: grid;
  gap: 1.5rem;
  max-width: 800px;
  margin: 0 auto;
`;

const FAQItem = styled.div`
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: 0.5rem;
  padding: 1.5rem;
`;

const FAQQuestion = styled.h4`
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-size: 1.125rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-bottom: 0.75rem;
`;

const FAQAnswer = styled.p`
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.gray[500]};
  line-height: 1.5;
`;

const plans = [
  {
    name: 'Starter',
    price: 99,
    period: 'per month',
    description: 'Perfect for single-location medical spas',
    features: [
      'Up to 500 transactions/month',
      'Basic reconciliation reports',
      'Email support',
      'Standard integrations',
      '30-day data retention'
    ],
    cta: 'Start Free Trial',
    featured: false,
    available: true,
    priceId: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID || 'price_starter_monthly'
  },
  {
    name: 'Professional',
    price: 199,
    period: 'per month',
    description: 'Ideal for growing practices with multiple locations',
    features: [
      'Up to 2,000 transactions/month',
      'Advanced analytics & reporting',
      'Priority support',
      'Custom integrations',
      '90-day data retention',
      'Multi-location management',
      'Automated customer notifications'
    ],
    cta: 'Coming Soon',
    featured: true,
    available: false
  },
  {
    name: 'Enterprise',
    price: 399,
    period: 'per month',
    description: 'For large franchise groups and enterprise clients',
    features: [
      'Unlimited transactions',
      'Custom reporting & analytics',
      'Dedicated account manager',
      'White-label solutions',
      'Unlimited data retention',
      'Advanced security features',
      'API access',
      'Custom training & onboarding'
    ],
    cta: 'Coming Soon',
    featured: false,
    available: false
  }
];

const faqs = [
  {
    question: 'How long is the free trial?',
    answer: 'We offer a 14-day free trial with full access to all features. No credit card required to start.'
  },
  {
    question: 'Can I cancel anytime?',
    answer: 'Yes, you can cancel your subscription at any time. There are no long-term contracts or cancellation fees.'
  },
  {
    question: 'What integrations are supported?',
    answer: 'We integrate with major POS systems including Square, Clover, and custom solutions. Contact us for specific integrations.'
  },
  {
    question: 'Is my data secure?',
    answer: 'Yes, we use enterprise-grade security with HIPAA compliance. All data is encrypted and stored securely.'
  },
  {
    question: 'Do you offer setup assistance?',
    answer: 'Yes, our team provides free setup assistance and training to get you started quickly and efficiently.'
  }
];

export default function PricingPage() {
  return (
    <>
      <Navigation />
      <PricingContainer>
        <PageTitle>Simple, Transparent Pricing</PageTitle>
        <PageSubtitle>
          Choose the plan that fits your practice size and needs. All plans include our core reconciliation features.
        </PageSubtitle>

        <PricingGrid>
          {plans.map((plan, index) => {
            const CardComponent = plan.available ? PricingCard : DisabledCard;
            
            return (
              <CardComponent key={index} $featured={plan.featured}>
                {plan.featured && plan.available && <FeaturedBadge>Most Popular</FeaturedBadge>}
                {!plan.available && <ComingSoonBadge>Coming Soon</ComingSoonBadge>}
                
                <PlanName>{plan.name}</PlanName>
                <PlanPrice>
                  <PriceAmount>${plan.price}</PriceAmount>
                  <PricePeriod>{plan.period}</PricePeriod>
                </PlanPrice>
                <PlanDescription>{plan.description}</PlanDescription>
                
                <FeaturesList>
                  {plan.features.map((feature, featureIndex) => (
                    <FeatureItem key={featureIndex}>
                      <FeatureIcon>✓</FeatureIcon>
                      {feature}
                    </FeatureItem>
                  ))}
                </FeaturesList>
                
                {plan.available ? (
                  <StripeCheckout
                    priceId={plan.priceId as string}
                    customerEmail=""
                    practiceName=""
                  >
                    {plan.cta}
                  </StripeCheckout>
                ) : (
                  <CTAButton variant="secondary" size="large" disabled>
                    {plan.cta}
                  </CTAButton>
                )}
              </CardComponent>
            );
          })}
        </PricingGrid>

        <GuaranteeSection>
          <GuaranteeTitle>30-Day Money-Back Guarantee</GuaranteeTitle>
          <GuaranteeText>
            Try MedspaSync Pro risk-free. If you&apos;re not completely satisfied within 30 days, 
            we&apos;ll refund your subscription, no questions asked.
          </GuaranteeText>
        </GuaranteeSection>

        <FAQSection>
          <FAQTitle>Frequently Asked Questions</FAQTitle>
          <FAQGrid>
            {faqs.map((faq, index) => (
              <FAQItem key={index}>
                <FAQQuestion>{faq.question}</FAQQuestion>
                <FAQAnswer>{faq.answer}</FAQAnswer>
              </FAQItem>
            ))}
          </FAQGrid>
        </FAQSection>
      </PricingContainer>
      <Footer />
    </>
  );
} 