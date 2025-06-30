'use client';

import styled from 'styled-components';
import { motion, easeOut } from 'framer-motion';
import { Button } from '@/components/atoms/Button';

interface HeroSectionProps {
  className?: string;
}

const HeroContainer = styled.section`
  background: ${({ theme }) => theme.colors.background};
  padding: 5rem 0 4rem 0;
  text-align: center;
  
  @media (max-width: 768px) {
    padding: 3rem 0 2rem 0;
  }
`;

const HeroContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  
  @media (max-width: 768px) {
    padding: 0 1rem;
  }
`;

const HeroTitle = styled.h1`
  font-size: 3rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray[900]};
  line-height: 1.25;
  margin: 0 0 1.5rem 0;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
  
  @media (max-width: 768px) {
    font-size: 1.875rem;
  }
`;

const HeroSubtitle = styled.p`
  font-size: 1.25rem;
  color: ${({ theme }) => theme.colors.gray[500]};
  line-height: 1.625;
  margin: 0 0 2rem 0;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  
  @media (max-width: 768px) {
    font-size: 1.125rem;
  }
`;

const HeroCTA = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 3rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
  }
`;

const HeroStats = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  max-width: 600px;
  margin: 0 auto;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
`;

const StatItem = styled.div`
  text-align: center;
  
  .stat-number {
    font-size: 2.25rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.primary[600]};
    line-height: 1.25;
    margin-bottom: 0.5rem;
  }
  
  .stat-label {
    font-size: 0.875rem;
    color: ${({ theme }) => theme.colors.gray[500]};
    line-height: 1.5;
  }
`;

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const pageTransition = {
  duration: 0.3,
  ease: easeOut
};

const containerVariants = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export function HeroSection({ className }: HeroSectionProps) {
  return (
    <HeroContainer className={className}>
      <HeroContent>
        <motion.div
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={pageTransition}
        >
          <HeroTitle>
            Stop Wasting 10+ Hours Monthly on{' '}
            <span style={{ color: '#0284c7' }}>Rewards Reconciliation</span>
          </HeroTitle>
          
          <HeroSubtitle>
            MedspaSync Pro automates loyalty program reconciliation with 90% accuracy, 
            saving medical spas 8-15 hours monthly while eliminating costly errors.
          </HeroSubtitle>
          
          <HeroCTA>
            <Button variant="primary" size="large">
              Try Live Demo
            </Button>
            <Button variant="secondary" size="large">
              View Pricing
            </Button>
          </HeroCTA>
        </motion.div>
        
        <motion.div
          variants={containerVariants}
          initial="initial"
          animate="animate"
        >
          <HeroStats>
            <motion.div variants={pageVariants}>
              <StatItem>
                <div className="stat-number">90%</div>
                <div className="stat-label">Accuracy Rate</div>
              </StatItem>
            </motion.div>
            
            <motion.div variants={pageVariants}>
              <StatItem>
                <div className="stat-number">8-15</div>
                <div className="stat-label">Hours Saved Monthly</div>
              </StatItem>
            </motion.div>
            
            <motion.div variants={pageVariants}>
              <StatItem>
                <div className="stat-number">$2K+</div>
                <div className="stat-label">Monthly Savings</div>
              </StatItem>
            </motion.div>
          </HeroStats>
        </motion.div>
      </HeroContent>
    </HeroContainer>
  );
} 