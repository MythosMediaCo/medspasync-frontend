'use client';

import React from 'react';
import styled from 'styled-components';
import { Navigation } from '@/components/organisms/Navigation';
import { Button } from '@/components/atoms/Button';
import { Footer } from '@/components/organisms/Footer';

const ResourcesContainer = styled.div`
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

const ResourcesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 4rem;
`;

const ResourceCard = styled.div`
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: 0.75rem;
  padding: 2rem;
  cursor: pointer;
  transition: all 0.2s ease-out;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    border-color: ${({ theme }) => theme.colors.primary[600]};
  }
`;

const ResourceIcon = styled.div`
  width: 64px;
  height: 64px;
  background: ${({ theme }) => theme.colors.primary[600]};
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
`;

const ResourceTitle = styled.h3`
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-size: 1.25rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-bottom: 0.75rem;
`;

const ResourceDescription = styled.p`
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.gray[500]};
  line-height: 1.5;
  margin-bottom: 1rem;
`;

const ResourceMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const ResourceType = styled.span`
  background: ${({ theme }) => theme.colors.gray[100]};
  padding: 0.25rem 0.5rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.gray[700]};
`;

const WebinarSection = styled.div`
  margin-bottom: 4rem;
`;

const SectionTitle = styled.h2`
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-size: 1.875rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray[900]};
  text-align: center;
  margin-bottom: 3rem;
`;

const WebinarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
`;

const WebinarCard = styled.div`
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: 0.75rem;
  overflow: hidden;
  transition: all 0.2s ease-out;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }
`;

const WebinarThumbnail = styled.div`
  width: 100%;
  height: 200px;
  background: ${({ theme }) => theme.colors.gray[100]};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.gray[500]};
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-size: 1.125rem;
`;

const WebinarInfo = styled.div`
  padding: 1.5rem;
`;

const WebinarTitle = styled.h3`
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-size: 1.125rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-bottom: 0.5rem;
`;

const WebinarDescription = styled.p`
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.gray[500]};
  line-height: 1.5;
  margin-bottom: 1rem;
`;

const WebinarDuration = styled.div`
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const IntegrationSection = styled.div`
  margin-bottom: 4rem;
`;

const IntegrationGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
`;

const IntegrationCard = styled.div`
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: 0.75rem;
  padding: 1.5rem;
  text-align: center;
  transition: all 0.2s ease-out;
  
  &:hover {
    border-color: ${({ theme }) => theme.colors.primary[600]};
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const IntegrationLogo = styled.div`
  width: 80px;
  height: 80px;
  background: ${({ theme }) => theme.colors.gray[100]};
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-size: 1.5rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const IntegrationName = styled.h3`
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-size: 1.125rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-bottom: 0.5rem;
`;

const IntegrationStatus = styled.div`
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.semantic.success};
  font-weight: 500;
`;

const CTASection = styled.div`
  text-align: center;
  background: ${({ theme }) => theme.colors.gray[50]};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: 0.75rem;
  padding: 3rem;
  margin-bottom: 3rem;
`;

const CTATitle = styled.h2`
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-size: 1.875rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-bottom: 1rem;
`;

const CTADescription = styled.p`
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-bottom: 2rem;
  line-height: 1.5;
`;

const ActionsContainer = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
`;

interface Resource {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: string;
  duration?: string;
  category: string;
}

const resources: Resource[] = [
  {
    id: '1',
    title: 'Getting Started Guide',
    description: 'Learn how to set up MedspaSync Pro and connect your first integrations.',
    icon: '📚',
    type: 'Guide',
    duration: '15 min read',
    category: 'Setup'
  },
  {
    id: '2',
    title: 'Best Practices for Reconciliation',
    description: 'Discover proven strategies to optimize your reconciliation process.',
    icon: '⚡',
    type: 'Guide',
    duration: '20 min read',
    category: 'Process'
  },
  {
    id: '3',
    title: 'Integration Troubleshooting',
    description: 'Common issues and solutions for POS system integrations.',
    icon: '🔧',
    type: 'Troubleshooting',
    duration: '10 min read',
    category: 'Technical'
  },
  {
    id: '4',
    title: 'ROI Calculator Guide',
    description: 'How to use our ROI calculator to measure your savings.',
    icon: '💰',
    type: 'Tool',
    duration: '5 min read',
    category: 'Analytics'
  },
  {
    id: '5',
    title: 'Security & Compliance',
    description: 'Understanding our security measures and HIPAA compliance.',
    icon: '🔒',
    type: 'Guide',
    duration: '12 min read',
    category: 'Security'
  },
  {
    id: '6',
    title: 'API Documentation',
    description: 'Technical documentation for custom integrations.',
    icon: '📖',
    type: 'Documentation',
    duration: '30 min read',
    category: 'Technical'
  }
];

const webinars = [
  {
    id: '1',
    title: 'MedspaSync Pro Deep Dive',
    description: 'A comprehensive overview of all features and capabilities.',
    duration: '45 minutes',
    thumbnail: '🎥'
  },
  {
    id: '2',
    title: 'Automating Your Reconciliation Process',
    description: 'Step-by-step walkthrough of setting up automated workflows.',
    duration: '30 minutes',
    thumbnail: '⚙️'
  },
  {
    id: '3',
    title: 'Advanced Analytics & Reporting',
    description: 'Learn how to leverage data insights for business growth.',
    duration: '40 minutes',
    thumbnail: '📊'
  }
];

const integrations = [
  { name: 'Square', logo: '💳', status: 'Available' },
  { name: 'Clover', logo: '📱', status: 'Available' },
  { name: 'QuickBooks', logo: '📊', status: 'Available' },
  { name: 'Xero', logo: '📈', status: 'Coming Soon' },
  { name: 'Stripe', logo: '💳', status: 'Available' },
  { name: 'PayPal', logo: '💰', status: 'Coming Soon' }
];

export default function ResourcesPage() {
  return (
    <>
      <Navigation />
      <ResourcesContainer>
        <PageTitle>Resources & Documentation</PageTitle>
        <PageSubtitle>
          Everything you need to get the most out of MedspaSync Pro
        </PageSubtitle>

        <ResourcesGrid>
          {resources.map((resource) => (
            <ResourceCard key={resource.id}>
              <ResourceIcon>{resource.icon}</ResourceIcon>
              <ResourceTitle>{resource.title}</ResourceTitle>
              <ResourceDescription>{resource.description}</ResourceDescription>
              <ResourceMeta>
                <ResourceType>{resource.type}</ResourceType>
                {resource.duration && <span>{resource.duration}</span>}
              </ResourceMeta>
            </ResourceCard>
          ))}
        </ResourcesGrid>

        <WebinarSection>
          <SectionTitle>Featured Webinars</SectionTitle>
          <WebinarGrid>
            {webinars.map((webinar) => (
              <WebinarCard key={webinar.id}>
                <WebinarThumbnail>{webinar.thumbnail}</WebinarThumbnail>
                <WebinarInfo>
                  <WebinarTitle>{webinar.title}</WebinarTitle>
                  <WebinarDescription>{webinar.description}</WebinarDescription>
                  <WebinarDuration>{webinar.duration}</WebinarDuration>
                </WebinarInfo>
              </WebinarCard>
            ))}
          </WebinarGrid>
        </WebinarSection>

        <IntegrationSection>
          <SectionTitle>Supported Integrations</SectionTitle>
          <IntegrationGrid>
            {integrations.map((integration, index) => (
              <IntegrationCard key={index}>
                <IntegrationLogo>{integration.logo}</IntegrationLogo>
                <IntegrationName>{integration.name}</IntegrationName>
                <IntegrationStatus>{integration.status}</IntegrationStatus>
              </IntegrationCard>
            ))}
          </IntegrationGrid>
        </IntegrationSection>

        <CTASection>
          <CTATitle>Need Help Getting Started?</CTATitle>
          <CTADescription>
            Our team is here to help you succeed. Schedule a personalized demo or contact our support team.
          </CTADescription>
          <ActionsContainer>
            <Button variant="primary" size="large">
              Schedule Demo
            </Button>
            <Button variant="secondary" size="large">
              Contact Support
            </Button>
          </ActionsContainer>
        </CTASection>
      </ResourcesContainer>
      <Footer />
    </>
  );
} 