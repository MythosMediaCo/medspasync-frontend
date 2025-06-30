'use client';

import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Button } from '@/components/atoms/Button';

const ResultsContainer = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
`;

const ProgressBar = styled.div`
  width: 100%;
  max-width: 400px;
  margin: 0 auto 3rem;
  background: ${({ theme }) => theme.colors.gray[100]};
  border-radius: 0.75rem;
  height: 8px;
  overflow: hidden;
`;

const ProgressFill = styled(motion.div)`
  height: 100%;
  background: ${({ theme }) => theme.colors.primary[600]};
  border-radius: 0.75rem;
`;

const SectionTitle = styled.h2`
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-size: 1.875rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-bottom: 1rem;
  text-align: center;
`;

const SectionSubtitle = styled.p`
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-size: 1.125rem;
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-bottom: 3rem;
  text-align: center;
  line-height: 1.5;
`;

const ResultsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
`;

const ResultCard = styled.div`
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  text-align: center;
`;

const MetricValue = styled.div`
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-size: 2.5rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary[600]};
  margin-bottom: 0.5rem;
`;

const MetricLabel = styled.div`
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.gray[700]};
  margin-bottom: 1rem;
`;

const MetricDescription = styled.p`
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.gray[500]};
  line-height: 1.5;
`;

const SavingsHighlight = styled.div`
  background: ${({ theme }) => theme.colors.gray[50]};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: 0.75rem;
  padding: 2rem;
  margin-bottom: 3rem;
  text-align: center;
`;

const SavingsTitle = styled.h3`
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-size: 1.5rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-bottom: 1rem;
`;

const SavingsAmount = styled.div`
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-size: 3rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary[600]};
  margin-bottom: 0.5rem;
`;

const SavingsPeriod = styled.div`
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-size: 1.125rem;
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-bottom: 1.5rem;
`;

const BenefitsList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 3rem;
`;

const BenefitItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: 0.5rem;
`;

const BenefitIcon = styled.div`
  width: 24px;
  height: 24px;
  background: ${({ theme }) => theme.colors.primary[600]};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  flex-shrink: 0;
`;

const BenefitText = styled.span`
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.gray[700]};
  font-weight: 500;
`;

const ActionsContainer = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
`;

interface ResultsComparisonProps {
  onComplete: () => void;
}

const benefits = [
  'Eliminate manual data entry errors',
  'Real-time reconciliation updates',
  'Automated customer notifications',
  'Comprehensive audit trails',
  'Reduced staff training time',
  'Improved customer satisfaction',
  'Better compliance reporting',
  'Scalable for growth'
];

export function ResultsComparison({ onComplete }: ResultsComparisonProps) {
  return (
    <ResultsContainer>
      <ProgressBar>
        <ProgressFill
          initial={{ width: '75%' }}
          animate={{ width: '75%' }}
          transition={{ duration: 0.5 }}
        />
      </ProgressBar>

      <SectionTitle>Your Results with MedspaSync Pro</SectionTitle>
      <SectionSubtitle>
        See the dramatic improvements in efficiency and cost savings
      </SectionSubtitle>

      <ResultsGrid>
        <ResultCard>
          <MetricValue>95%</MetricValue>
          <MetricLabel>Time Reduction</MetricLabel>
          <MetricDescription>
            From 8+ hours to under 30 minutes for monthly reconciliation
          </MetricDescription>
        </ResultCard>

        <ResultCard>
          <MetricValue>$2,400</MetricValue>
          <MetricLabel>Annual Savings</MetricLabel>
          <MetricDescription>
            Based on $30/hour staff cost and 8 hours saved monthly
          </MetricDescription>
        </ResultCard>

        <ResultCard>
          <MetricValue>99.9%</MetricValue>
          <MetricLabel>Accuracy Rate</MetricLabel>
          <MetricDescription>
            Eliminate human errors in point calculations and reconciliations
          </MetricDescription>
        </ResultCard>
      </ResultsGrid>

      <SavingsHighlight>
        <SavingsTitle>Your Monthly Savings</SavingsTitle>
        <SavingsAmount>$200</SavingsAmount>
        <SavingsPeriod>per month in staff time</SavingsPeriod>
        <p style={{ color: '#64748b', fontSize: '0.875rem', lineHeight: '1.5' }}>
          Plus improved customer satisfaction and reduced compliance risks
        </p>
      </SavingsHighlight>

      <SectionTitle style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>
        Additional Benefits
      </SectionTitle>
      
      <BenefitsList>
        {benefits.map((benefit, index) => (
          <BenefitItem key={index}>
            <BenefitIcon>✓</BenefitIcon>
            <BenefitText>{benefit}</BenefitText>
          </BenefitItem>
        ))}
      </BenefitsList>

      <ActionsContainer>
        <Button variant="primary" size="large" onClick={onComplete}>
          Get Started Today
        </Button>
        <Button variant="secondary" size="large">
          Schedule a Demo
        </Button>
      </ActionsContainer>
    </ResultsContainer>
  );
} 