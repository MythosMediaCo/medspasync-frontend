'use client';

import React from 'react';
import styled from 'styled-components';
import { Navigation } from '@/components/organisms/Navigation';
import { Button } from '@/components/atoms/Button';
import { Footer } from '@/components/organisms/Footer';

const CustomersContainer = styled.div`
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

const StatsSection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
  margin-bottom: 4rem;
`;

const StatCard = styled.div`
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: 0.75rem;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const StatValue = styled.div`
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-size: 2.5rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary[600]};
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.div`
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.gray[700]};
  font-weight: 500;
`;

const TestimonialsSection = styled.div`
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

const TestimonialsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
`;

const TestimonialCard = styled.div`
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: 0.75rem;
  padding: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const TestimonialText = styled.p`
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.gray[700]};
  line-height: 1.6;
  margin-bottom: 1.5rem;
  font-style: italic;
`;

const TestimonialAuthor = styled.div`
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-size: 1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-bottom: 0.25rem;
`;

const TestimonialRole = styled.div`
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.gray[500]};
`;

const CaseStudiesSection = styled.div`
  margin-bottom: 4rem;
`;

const CaseStudyCard = styled.div`
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: 0.75rem;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const CaseStudyTitle = styled.h3`
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-size: 1.25rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-bottom: 1rem;
`;

const CaseStudyDescription = styled.p`
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.gray[500]};
  line-height: 1.5;
  margin-bottom: 1.5rem;
`;

const CaseStudyMetrics = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const Metric = styled.div`
  text-align: center;
  padding: 1rem;
  background: ${({ theme }) => theme.colors.gray[50]};
  border-radius: 0.5rem;
`;

const MetricValue = styled.div`
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-size: 1.5rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary[600]};
  margin-bottom: 0.25rem;
`;

const MetricLabel = styled.div`
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.gray[500]};
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

const stats = [
  { value: '95%', label: 'Time Reduction' },
  { value: '$2.4M', label: 'Annual Savings' },
  { value: '500+', label: 'Happy Customers' },
  { value: '99.9%', label: 'Accuracy Rate' }
];

const testimonials = [
  {
    text: "MedspaSync Pro transformed our reconciliation process. We went from spending 12 hours weekly to just 1 hour, and the accuracy is incredible.",
    author: "Sarah Johnson",
    role: "Practice Manager",
    practice: "Aesthetic Med Spa"
  },
  {
    text: "The automated reconciliation has eliminated errors and saved us thousands in staff time. It&apos;s been a game-changer for our practice.",
    author: "Dr. Michael Chen",
    role: "Owner",
    practice: "Premier Aesthetics"
  },
  {
    text: "Setup was incredibly easy and the support team was amazing. We&apos;re catching transactions we used to miss and our customers are happier.",
    author: "Lisa Rodriguez",
    role: "Office Administrator",
    practice: "Glow Medical Spa"
  }
];

const caseStudies = [
  {
    title: "Multi-Location Medical Spa Chain",
    description: "A growing chain with 5 locations was struggling with inconsistent reconciliation processes and high error rates.",
    metrics: [
      { value: "90%", label: "Time Reduction" },
      { value: "$180K", label: "Annual Savings" },
      { value: "0", label: "Reconciliation Errors" }
    ]
  },
  {
    title: "Single Location Practice",
    description: "A busy single-location practice was spending 15+ hours monthly on manual reconciliation and customer service issues.",
    metrics: [
      { value: "95%", label: "Time Reduction" },
      { value: "$24K", label: "Annual Savings" },
      { value: "100%", label: "Customer Satisfaction" }
    ]
  }
];

export default function CustomersPage() {
  return (
    <>
      <Navigation />
      <CustomersContainer>
        <PageTitle>Success Stories</PageTitle>
        <PageSubtitle>
          See how medical spas are transforming their operations with MedspaSync Pro
        </PageSubtitle>

        <StatsSection>
          {stats.map((stat, index) => (
            <StatCard key={index}>
              <StatValue>{stat.value}</StatValue>
              <StatLabel>{stat.label}</StatLabel>
            </StatCard>
          ))}
        </StatsSection>

        <TestimonialsSection>
          <SectionTitle>What Our Customers Say</SectionTitle>
          <TestimonialsGrid>
            {testimonials.map((testimonial, index) => (
              <TestimonialCard key={index}>
                <TestimonialText>&ldquo;{testimonial.text}&rdquo;</TestimonialText>
                <TestimonialAuthor>{testimonial.author}</TestimonialAuthor>
                <TestimonialRole>{testimonial.role}, {testimonial.practice}</TestimonialRole>
              </TestimonialCard>
            ))}
          </TestimonialsGrid>
        </TestimonialsSection>

        <CaseStudiesSection>
          <SectionTitle>Case Studies</SectionTitle>
          {caseStudies.map((caseStudy, index) => (
            <CaseStudyCard key={index}>
              <CaseStudyTitle>{caseStudy.title}</CaseStudyTitle>
              <CaseStudyDescription>{caseStudy.description}</CaseStudyDescription>
              <CaseStudyMetrics>
                {caseStudy.metrics.map((metric, metricIndex) => (
                  <Metric key={metricIndex}>
                    <MetricValue>{metric.value}</MetricValue>
                    <MetricLabel>{metric.label}</MetricLabel>
                  </Metric>
                ))}
              </CaseStudyMetrics>
            </CaseStudyCard>
          ))}
        </CaseStudiesSection>

        <CTASection>
          <CTATitle>Join Hundreds of Successful Medical Spas</CTATitle>
          <CTADescription>
            Start your transformation today with a free demo and see how MedspaSync Pro can revolutionize your reconciliation process.
          </CTADescription>
          <ActionsContainer>
            <Button variant="primary" size="large">
              Start Free Trial
            </Button>
            <Button variant="secondary" size="large">
              Schedule Demo
            </Button>
          </ActionsContainer>
        </CTASection>
      </CustomersContainer>
      <Footer />
    </>
  );
} 