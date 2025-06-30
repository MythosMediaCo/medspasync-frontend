'use client';

import styled from 'styled-components';
import { Button } from '@/components/atoms/Button';

interface FooterProps {
  className?: string;
}

const FooterContainer = styled.footer`
  background: ${({ theme }) => theme.colors.gray[50]};
  border-top: 1px solid ${({ theme }) => theme.colors.gray[200]};
  padding: 4rem 0 2rem 0;
  
  @media (max-width: 768px) {
    padding: 3rem 0 1.5rem 0;
  }
`;

const FooterContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  
  @media (max-width: 768px) {
    padding: 0 1rem;
  }
`;

const FooterGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 3rem;
  margin-bottom: 3rem;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
`;

const FooterSection = styled.div`
  h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.gray[900]};
    margin: 0 0 1rem 0;
  }
  
  p {
    font-size: 0.875rem;
    color: ${({ theme }) => theme.colors.gray[500]};
    line-height: 1.5;
    margin: 0 0 1rem 0;
  }
`;

const FooterLinks = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  
  a {
    font-size: 0.875rem;
    color: ${({ theme }) => theme.colors.gray[500]};
    text-decoration: none;
    transition: color 0.2s ease-out;
    
    &:hover {
      color: ${({ theme }) => theme.colors.primary[600]};
    }
  }
`;

const FooterBottom = styled.div`
  border-top: 1px solid ${({ theme }) => theme.colors.gray[200]};
  padding-top: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
`;

const Copyright = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.gray[500]};
  margin: 0;
`;

const SocialLinks = styled.div`
  display: flex;
  gap: 1rem;
  
  a {
    color: ${({ theme }) => theme.colors.gray[500]};
    text-decoration: none;
    transition: color 0.2s ease-out;
    
    &:hover {
      color: ${({ theme }) => theme.colors.primary[600]};
    }
  }
`;

const Logo = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-bottom: 1rem;
  
  span {
    color: ${({ theme }) => theme.colors.primary[600]};
  }
`;

export function Footer({ className }: FooterProps) {
  return (
    <FooterContainer className={className}>
      <FooterContent>
        <FooterGrid>
          <FooterSection>
            <Logo>
              Medspa<span>Sync</span> Pro
            </Logo>
            <p>
              Automating loyalty program reconciliation for medical spas with 90% accuracy. 
              Save 8-15 hours monthly while eliminating costly errors.
            </p>
            <Button variant="primary" size="small">
              Get Started
            </Button>
          </FooterSection>
          
          <FooterSection>
            <h3>Product</h3>
            <FooterLinks>
              <a href="/demo">Live Demo</a>
              <a href="/pricing">Pricing</a>
              <a href="/features">Features</a>
              <a href="/integrations">Integrations</a>
            </FooterLinks>
          </FooterSection>
          
          <FooterSection>
            <h3>Resources</h3>
            <FooterLinks>
              <a href="/docs">Documentation</a>
              <a href="/blog">Blog</a>
              <a href="/support">Support</a>
              <a href="/api">API</a>
            </FooterLinks>
          </FooterSection>
          
          <FooterSection>
            <h3>Company</h3>
            <FooterLinks>
              <a href="/about">About</a>
              <a href="/customers">Customers</a>
              <a href="/careers">Careers</a>
              <a href="/contact">Contact</a>
            </FooterLinks>
          </FooterSection>
        </FooterGrid>
        
        <FooterBottom>
          <Copyright>
            © 2024 MedspaSync Pro. All rights reserved.
          </Copyright>
          <SocialLinks>
            <a href="#" aria-label="Twitter">Twitter</a>
            <a href="#" aria-label="LinkedIn">LinkedIn</a>
            <a href="#" aria-label="GitHub">GitHub</a>
          </SocialLinks>
        </FooterBottom>
      </FooterContent>
    </FooterContainer>
  );
} 