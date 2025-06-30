'use client';

import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Navigation } from '@/components/organisms/Navigation';
import { Button } from '@/components/atoms/Button';
import { Footer } from '@/components/organisms/Footer';

const SuccessContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 4rem 2rem;
  text-align: center;
`;

const SuccessIcon = styled.div`
  width: 80px;
  height: 80px;
  background: ${({ theme }) => theme.colors.semantic.success};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 2rem;
  color: white;
  font-size: 2rem;
`;

const SuccessTitle = styled.h1`
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-size: 2.5rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-bottom: 1rem;
`;

const SuccessSubtitle = styled.p`
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-size: 1.25rem;
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-bottom: 3rem;
  line-height: 1.5;
`;

const NextStepsSection = styled.div`
  background: ${({ theme }) => theme.colors.gray[50]};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: 0.75rem;
  padding: 2rem;
  margin-bottom: 3rem;
  text-align: left;
`;

const NextStepsTitle = styled.h2`
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-size: 1.5rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-bottom: 1.5rem;
`;

const StepsList = styled.ol`
  list-style: none;
  counter-reset: step-counter;
  padding: 0;
`;

const StepItem = styled.li`
  counter-increment: step-counter;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.5rem;
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.gray[700]};
  line-height: 1.5;

  &::before {
    content: counter(step-counter);
    background: ${({ theme }) => theme.colors.primary[600]};
    color: white;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.875rem;
    font-weight: 600;
    flex-shrink: 0;
    margin-top: 0.125rem;
  }
`;

const ActionsContainer = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
`;

export default function SuccessPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time for better UX
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <>
        <Navigation />
        <SuccessContainer>
          <div>Loading...</div>
        </SuccessContainer>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navigation />
      <SuccessContainer>
        <SuccessIcon>✓</SuccessIcon>
        <SuccessTitle>Welcome to MedspaSync Pro!</SuccessTitle>
        <SuccessSubtitle>
          Your subscription has been activated successfully. You&apos;re now ready to transform your rewards reconciliation process.
        </SuccessSubtitle>

        <NextStepsSection>
          <NextStepsTitle>What happens next?</NextStepsTitle>
          <StepsList>
            <StepItem>
              <div>
                <strong>Account Setup (24-48 hours)</strong><br />
                Our team will reach out to help you set up your account and integrate with your existing systems.
              </div>
            </StepItem>
            <StepItem>
              <div>
                <strong>Data Migration</strong><br />
                We&apos;ll help you import your existing customer data and rewards program information.
              </div>
            </StepItem>
            <StepItem>
              <div>
                <strong>Staff Training</strong><br />
                Your team will receive comprehensive training on using MedspaSync Pro effectively.
              </div>
            </StepItem>
            <StepItem>
              <div>
                <strong>Go Live</strong><br />
                Start automating your reconciliation process and see immediate time savings.
              </div>
            </StepItem>
          </StepsList>
        </NextStepsSection>

        <ActionsContainer>
          <Button variant="primary" size="large">
            Schedule Onboarding Call
          </Button>
          <Button variant="secondary" size="large">
            View Documentation
          </Button>
        </ActionsContainer>
      </SuccessContainer>
      <Footer />
    </>
  );
} 