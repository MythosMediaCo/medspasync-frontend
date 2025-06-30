'use client';

import styled from 'styled-components';

interface HealthCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

const StyledHealthCard = styled.div<HealthCardProps>`
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease-out;
  
  ${({ interactive, theme }) => interactive && `
    cursor: pointer;
    
    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      border-color: ${theme.colors.gray[300]};
      transform: translateY(-2px);
    }
    
    &:active {
      transform: translateY(0);
    }
  `}
`;

const CardHeader = styled.div<CardHeaderProps>`
  margin-bottom: 1rem;
  
  h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.gray[900]};
    margin: 0 0 0.5rem 0;
    line-height: 1.25;
  }
  
  p {
    font-size: 0.875rem;
    color: ${({ theme }) => theme.colors.gray[500]};
    margin: 0;
    line-height: 1.5;
  }
`;

export function HealthCard({
  children,
  className,
  onClick,
  interactive = false,
  ...props
}: HealthCardProps) {
  return (
    <StyledHealthCard
      className={className}
      onClick={onClick}
      interactive={interactive}
      {...props}
    >
      {children}
    </StyledHealthCard>
  );
}

HealthCard.Header = CardHeader; 