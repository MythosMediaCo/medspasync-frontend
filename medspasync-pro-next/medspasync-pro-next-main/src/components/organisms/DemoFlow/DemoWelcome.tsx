'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Button } from '@/components/atoms/Button';

const WelcomeContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
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

const WelcomeTitle = styled.h1`
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-size: 2.25rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-bottom: 1rem;
  
  @media (max-width: 768px) {
    font-size: 1.875rem;
  }
`;

const WelcomeSubtitle = styled.p`
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-size: 1.25rem;
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-bottom: 3rem;
  line-height: 1.5;
  
  @media (max-width: 768px) {
    font-size: 1.125rem;
  }
`;

const PracticeTypeSection = styled.div`
  margin-bottom: 3rem;
`;

const SectionTitle = styled.h2`
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-size: 1.5rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-bottom: 1.5rem;
`;

const PracticeTypeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const PracticeTypeCard = styled.div<{ $isSelected: boolean }>`
  padding: 1.5rem;
  border: 2px solid ${({ theme, $isSelected }) => 
    $isSelected ? theme.colors.primary[600] : theme.colors.gray[300]};
  border-radius: 0.75rem;
  background: ${({ theme, $isSelected }) => 
    $isSelected ? theme.colors.primary[50] : theme.colors.background};
  cursor: pointer;
  transition: all 0.2s ease-out;
  
  &:hover {
    border-color: ${({ theme }) => theme.colors.primary[600]};
    background: ${({ theme }) => theme.colors.primary[50]};
  }
`;

const PracticeTypeTitle = styled.h3<{ $isSelected: boolean }>`
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-size: 1.125rem;
  font-weight: 600;
  color: ${({ theme, $isSelected }) => 
    $isSelected ? theme.colors.primary[600] : theme.colors.gray[900]};
  margin-bottom: 0.5rem;
`;

const PracticeTypeDescription = styled.p`
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.gray[500]};
  line-height: 1.5;
`;

const CurrentChallengesSection = styled.div`
  margin-bottom: 3rem;
`;

const ChallengesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const ChallengeCard = styled.div<{ $isSelected: boolean }>`
  padding: 1rem;
  border: 2px solid ${({ theme, $isSelected }) => 
    $isSelected ? theme.colors.primary[600] : theme.colors.gray[300]};
  border-radius: 0.5rem;
  background: ${({ theme, $isSelected }) => 
    $isSelected ? theme.colors.primary[50] : theme.colors.background};
  cursor: pointer;
  transition: all 0.2s ease-out;
  
  &:hover {
    border-color: ${({ theme }) => theme.colors.primary[600]};
    background: ${({ theme }) => theme.colors.primary[50]};
  }
`;

const ChallengeText = styled.span<{ $isSelected: boolean }>`
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-size: 0.875rem;
  color: ${({ theme, $isSelected }) => 
    $isSelected ? theme.colors.primary[600] : theme.colors.gray[700]};
  font-weight: 500;
`;

const ActionsContainer = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
`;

interface DemoWelcomeProps {
  onComplete: (data: { practiceType: string; challenges: string[] }) => void;
}

const practiceTypes = [
  {
    id: 'single-location',
    title: 'Single Location',
    description: 'One medical spa with focused operations'
  },
  {
    id: 'multi-location',
    title: 'Multi-Location',
    description: 'Multiple locations under one brand'
  },
  {
    id: 'franchise-group',
    title: 'Franchise Group',
    description: 'Franchise operations with multiple owners'
  }
];

const commonChallenges = [
  'Manual reconciliation takes 8+ hours monthly',
  'Errors in reward point calculations',
  'Difficulty tracking customer loyalty',
  'Staff time wasted on administrative tasks',
  'Inconsistent reconciliation processes',
  'Customer complaints about reward accuracy',
  'Difficulty scaling with growth',
  'Lack of real-time reporting'
];

export function DemoWelcome({ onComplete }: DemoWelcomeProps) {
  const [selectedPracticeType, setSelectedPracticeType] = useState('');
  const [selectedChallenges, setSelectedChallenges] = useState<string[]>([]);

  const handlePracticeTypeSelect = (type: string) => {
    setSelectedPracticeType(type);
  };

  const handleChallengeToggle = (challenge: string) => {
    setSelectedChallenges(prev => 
      prev.includes(challenge)
        ? prev.filter(c => c !== challenge)
        : [...prev, challenge]
    );
  };

  const handleContinue = () => {
    if (selectedPracticeType && selectedChallenges.length > 0) {
      onComplete({
        practiceType: selectedPracticeType,
        challenges: selectedChallenges
      });
    }
  };

  const canContinue = selectedPracticeType && selectedChallenges.length > 0;

  return (
    <WelcomeContainer>
      <ProgressBar>
        <ProgressFill
          initial={{ width: '25%' }}
          animate={{ width: '25%' }}
          transition={{ duration: 0.5 }}
        />
      </ProgressBar>

      <WelcomeTitle>Welcome to MedspaSync Pro Demo</WelcomeTitle>
      <WelcomeSubtitle>
        Let&apos;s personalize your demo experience by understanding your practice and challenges
      </WelcomeSubtitle>

      <PracticeTypeSection>
        <SectionTitle>What type of practice do you operate?</SectionTitle>
        <PracticeTypeGrid>
          {practiceTypes.map((type) => (
            <PracticeTypeCard
              key={type.id}
              $isSelected={selectedPracticeType === type.id}
              onClick={() => handlePracticeTypeSelect(type.id)}
            >
              <PracticeTypeTitle $isSelected={selectedPracticeType === type.id}>
                {type.title}
              </PracticeTypeTitle>
              <PracticeTypeDescription>
                {type.description}
              </PracticeTypeDescription>
            </PracticeTypeCard>
          ))}
        </PracticeTypeGrid>
      </PracticeTypeSection>

      <CurrentChallengesSection>
        <SectionTitle>What challenges are you currently facing?</SectionTitle>
        <ChallengesGrid>
          {commonChallenges.map((challenge) => (
            <ChallengeCard
              key={challenge}
              $isSelected={selectedChallenges.includes(challenge)}
              onClick={() => handleChallengeToggle(challenge)}
            >
              <ChallengeText $isSelected={selectedChallenges.includes(challenge)}>
                {challenge}
              </ChallengeText>
            </ChallengeCard>
          ))}
        </ChallengesGrid>
      </CurrentChallengesSection>

      <ActionsContainer>
        <Button
          variant="primary"
          size="large"
          onClick={handleContinue}
          disabled={!canContinue}
        >
          Continue to Demo
        </Button>
      </ActionsContainer>
    </WelcomeContainer>
  );
} 