'use client';

import styled, { css } from 'styled-components';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  style?: React.CSSProperties;
}

const StyledButton = styled.button<{
  $variant?: 'primary' | 'secondary' | 'ghost';
  $size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 0.5rem;
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease-out;
  text-decoration: none;
  outline: none;
  min-height: 44px; /* Accessibility touch target */
  
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary[500]};
    outline-offset: 2px;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none !important;
  }

  ${({ $variant = 'primary', theme }) => {
    switch ($variant) {
      case 'primary':
        return css`
          background: ${theme.colors.primary[600]};
          color: white;
          padding: 0.75rem 1.5rem;
          font-size: 1rem;
          line-height: 1.5;
          
          &:hover:not(:disabled) {
            background: ${theme.colors.primary[700]};
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(2, 132, 199, 0.15);
          }
          
          &:active:not(:disabled) {
            transform: translateY(0);
          }
          
          &:disabled {
            background: ${theme.colors.gray[300]};
            cursor: not-allowed;
            transform: none;
          }
        `;
      
      case 'secondary':
        return css`
          background: transparent;
          color: ${theme.colors.primary[600]};
          border: 2px solid ${theme.colors.primary[600]};
          padding: 0.75rem 1.5rem;
          font-size: 1rem;
          line-height: 1.5;
          
          &:hover:not(:disabled) {
            background: ${theme.colors.primary[50]};
            border-color: ${theme.colors.primary[700]};
          }
          
          &:disabled {
            color: ${theme.colors.gray[300]};
            border-color: ${theme.colors.gray[300]};
            cursor: not-allowed;
          }
        `;
      
      case 'ghost':
        return css`
          background: transparent;
          color: ${theme.colors.gray[700]};
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
          font-weight: 500;
          line-height: 1.5;
          
          &:hover:not(:disabled) {
            background: ${theme.colors.gray[100]};
            color: ${theme.colors.gray[900]};
          }
          
          &:disabled {
            color: ${theme.colors.gray[300]};
            cursor: not-allowed;
          }
        `;
      
      default:
        return css``;
    }
  }}

  ${({ $size }) => {
    switch ($size) {
      case 'small':
        return css`
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
          min-height: 36px;
        `;
      
      case 'large':
        return css`
          padding: 1rem 2rem;
          font-size: 1.125rem;
          min-height: 52px;
        `;
      
      default:
        return css``;
    }
  }}
`;

export function Button({
  variant = 'primary',
  size = 'medium',
  disabled = false,
  children,
  onClick,
  type = 'button',
  className,
  style,
  ...props
}: ButtonProps) {
  return (
    <StyledButton
      $variant={variant}
      $size={size}
      disabled={disabled}
      onClick={onClick}
      type={type}
      className={className}
      style={style}
      {...props}
    >
      {children}
    </StyledButton>
  );
} 