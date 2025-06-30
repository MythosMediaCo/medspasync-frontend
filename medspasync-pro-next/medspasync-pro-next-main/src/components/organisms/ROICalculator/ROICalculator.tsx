'use client';

import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/atoms/Card';
import { Button } from '@/components/atoms/Button';

const CalculatorContainer = styled.section`
  padding: 5rem 0;
  background: ${({ theme }) => theme.colors.surface};
  max-width: 1200px;
  margin: 0 auto;
  padding-left: 2rem;
  padding-right: 2rem;
  
  @media (max-width: 768px) {
    padding-left: 1rem;
    padding-right: 1rem;
    padding: 3rem 0;
  }
`;

const CalculatorHeader = styled.div`
  text-align: center;
  margin-bottom: 4rem;
`;

const CalculatorTitle = styled.h2`
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-size: 2.25rem;
  line-height: 1.25;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-bottom: 1rem;
  
  @media (max-width: 768px) {
    font-size: 1.875rem;
  }
`;

const CalculatorSubtitle = styled.p`
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-size: 1.25rem;
  line-height: 1.25;
  color: ${({ theme }) => theme.colors.gray[500]};
  max-width: 600px;
  margin: 0 auto;
  
  @media (max-width: 768px) {
    font-size: 1.125rem;
  }
`;

const CalculatorGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  margin-bottom: 3rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
`;

const InputSection = styled(Card)`
  padding: 2rem;
`;

const InputGroup = styled.div`
  margin-bottom: 2rem;
`;

const InputLabel = styled.label`
  display: block;
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-size: 1rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-bottom: 0.5rem;
`;

const SliderContainer = styled.div`
  position: relative;
  margin-bottom: 1rem;
`;

const Slider = styled.input`
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: ${({ theme }) => theme.colors.gray[300]};
  outline: none;
  -webkit-appearance: none;
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.primary[600]};
    cursor: pointer;
    transition: transform 0.2s ease-out;
    
    &:hover {
      transform: scale(1.1);
    }
  }
  
  &::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.primary[600]};
    cursor: pointer;
    border: none;
    transition: transform 0.2s ease-out;
    
    &:hover {
      transform: scale(1.1);
    }
  }
`;

const SliderValue = styled.span`
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-size: 1.25rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.primary[600]};
`;

const ResultsSection = styled(Card)`
  padding: 2rem;
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary[600]} 0%, ${({ theme }) => theme.colors.primary[700]} 100%);
  color: white;
`;

const ResultItem = styled(motion.div)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  
  &:last-child {
    border-bottom: none;
  }
`;

const ResultLabel = styled.span`
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-size: 1rem;
  opacity: 0.9;
`;

const ResultValue = styled.span`
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-size: 1.25rem;
  font-weight: 600;
`;

const CTASection = styled.div`
  text-align: center;
  margin-top: 3rem;
`;

const SavingsHighlight = styled(motion.div)`
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  margin: 1.5rem 0;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
`;

const SavingsAmount = styled.div`
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-size: 3rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary[600]};
  margin-bottom: 0.5rem;
  
  @media (max-width: 768px) {
    font-size: 2.25rem;
  }
`;

const SavingsLabel = styled.div`
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.gray[500]};
`;

interface CalculatorInputs {
  practiceSize: number;
  currentHours: number;
  hourlyRate: number;
}

export function ROICalculator() {
  const [inputs, setInputs] = useState<CalculatorInputs>({
    practiceSize: 500,
    currentHours: 8,
    hourlyRate: 25
  });

  const results = useMemo(() => {
    const monthlyHours = inputs.currentHours * 4;
    const monthlyCost = monthlyHours * inputs.hourlyRate;
    const annualCost = monthlyCost * 12;
    
    // Calculate savings with MedspaSync Pro (90% time reduction)
    const timeReduction = 0.9;
    const monthlySavings = monthlyCost * timeReduction;
    const annualSavings = annualCost * timeReduction;
    
    return {
      monthlyCost,
      annualCost,
      monthlySavings,
      annualSavings,
      timeSaved: monthlyHours * timeReduction
    };
  }, [inputs]);

  const handleInputChange = (field: keyof CalculatorInputs, value: number) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  return (
    <CalculatorContainer>
      <CalculatorHeader>
        <CalculatorTitle>Calculate Your ROI</CalculatorTitle>
        <CalculatorSubtitle>
          See how much time and money MedspaSync Pro can save your practice
        </CalculatorSubtitle>
      </CalculatorHeader>

      <CalculatorGrid>
        <InputSection>
          <InputGroup>
            <InputLabel>Practice Size (Patients)</InputLabel>
            <SliderContainer>
              <Slider
                type="range"
                min="100"
                max="2000"
                step="100"
                value={inputs.practiceSize}
                onChange={(e) => handleInputChange('practiceSize', parseInt(e.target.value))}
              />
            </SliderContainer>
            <SliderValue>{inputs.practiceSize.toLocaleString()} patients</SliderValue>
          </InputGroup>

          <InputGroup>
            <InputLabel>Current Monthly Hours Spent on Reconciliation</InputLabel>
            <SliderContainer>
              <Slider
                type="range"
                min="2"
                max="20"
                step="1"
                value={inputs.currentHours}
                onChange={(e) => handleInputChange('currentHours', parseInt(e.target.value))}
              />
            </SliderContainer>
            <SliderValue>{inputs.currentHours} hours/month</SliderValue>
          </InputGroup>

          <InputGroup>
            <InputLabel>Staff Hourly Rate ($)</InputLabel>
            <SliderContainer>
              <Slider
                type="range"
                min="15"
                max="50"
                step="5"
                value={inputs.hourlyRate}
                onChange={(e) => handleInputChange('hourlyRate', parseInt(e.target.value))}
              />
            </SliderContainer>
            <SliderValue>${inputs.hourlyRate}/hour</SliderValue>
          </InputGroup>
        </InputSection>

        <ResultsSection>
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: '600' }}>
            Your Savings with MedspaSync Pro
          </h3>
          
          <AnimatePresence>
            <ResultItem
              key="monthly-cost"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ResultLabel>Current Monthly Cost</ResultLabel>
              <ResultValue>${results.monthlyCost.toLocaleString()}</ResultValue>
            </ResultItem>

            <ResultItem
              key="monthly-savings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <ResultLabel>Monthly Savings</ResultLabel>
              <ResultValue>${results.monthlySavings.toLocaleString()}</ResultValue>
            </ResultItem>

            <ResultItem
              key="annual-savings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <ResultLabel>Annual Savings</ResultLabel>
              <ResultValue>${results.annualSavings.toLocaleString()}</ResultValue>
            </ResultItem>

            <ResultItem
              key="time-saved"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <ResultLabel>Time Saved Monthly</ResultLabel>
              <ResultValue>{results.timeSaved.toFixed(1)} hours</ResultValue>
            </ResultItem>
          </AnimatePresence>
        </ResultsSection>
      </CalculatorGrid>

      <SavingsHighlight
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <SavingsAmount>${results.annualSavings.toLocaleString()}</SavingsAmount>
        <SavingsLabel>Potential Annual Savings</SavingsLabel>
      </SavingsHighlight>

      <CTASection>
        <Button variant="primary" size="large">
          Start Your Free Trial
        </Button>
      </CTASection>
    </CalculatorContainer>
  );
} 