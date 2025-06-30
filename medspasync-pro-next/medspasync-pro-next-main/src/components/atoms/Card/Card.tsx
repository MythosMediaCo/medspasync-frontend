'use client';

import styled from 'styled-components';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
}

const StyledCard = styled.div<CardProps>`
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

export function Card({
  children,
  className,
  onClick,
  interactive = false,
  ...props
}: CardProps) {
  return (
    <StyledCard
      className={className}
      onClick={onClick}
      interactive={interactive}
      {...props}
    >
      {children}
    </StyledCard>
  );
} 