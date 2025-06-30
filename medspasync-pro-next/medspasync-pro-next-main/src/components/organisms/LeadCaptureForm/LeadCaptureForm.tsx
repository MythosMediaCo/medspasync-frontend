'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/atoms/Button';

const FormContainer = styled.div`
  background: ${({ theme }) => theme.colors.background};
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  max-width: 600px;
  margin: 0 auto;
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const FormTitle = styled.h2`
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-size: 1.5rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-bottom: 0.5rem;
  text-align: center;
`;

const FormSubtitle = styled.p`
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-bottom: 2rem;
  text-align: center;
  line-height: 1.5;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  display: block;
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-size: 0.875rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.gray[700]};
  margin-bottom: 0.5rem;
`;

const Input = styled.input<{ $hasError?: boolean }>`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid ${({ theme, $hasError }) => $hasError ? theme.colors.semantic.error : theme.colors.gray[300]};
  border-radius: 0.5rem;
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.gray[900]};
  background: ${({ theme }) => theme.colors.background};
  transition: all 0.2s ease-out;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary[600]};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary[100]};
  }
  
  &::placeholder {
    color: ${({ theme }) => theme.colors.gray[300]};
  }
`;

const Select = styled.select<{ $hasError?: boolean }>`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid ${({ theme, $hasError }) => $hasError ? theme.colors.semantic.error : theme.colors.gray[300]};
  border-radius: 0.5rem;
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.gray[900]};
  background: ${({ theme }) => theme.colors.background};
  transition: all 0.2s ease-out;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary[600]};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary[100]};
  }
`;

const TextArea = styled.textarea<{ $hasError?: boolean }>`
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-size: 1rem;
  padding: 0.75rem;
  border: 1px solid ${({ theme, $hasError }) => $hasError ? theme.colors.semantic.error : theme.colors.gray[300]};
  border-radius: 0.5rem;
  background: ${({ theme }) => theme.colors.background};
  resize: vertical;
  min-height: 100px;
  transition: all 0.2s ease-out;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary[500]};
    box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
  }
  
  &::placeholder {
    color: ${({ theme }) => theme.colors.gray[300]};
  }
`;

const ErrorMessage = styled.span`
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.semantic.error};
`;

const SuccessMessage = styled.div`
  background: ${({ theme }) => theme.colors.semantic.success};
  color: white;
  padding: 1rem;
  border-radius: 0.5rem;
  text-align: center;
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-size: 1rem;
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const FullWidthButton = styled(Button)`
  width: 100%;
`;

const formSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  practiceName: z.string().min(1, 'Practice name is required'),
  practiceType: z.enum(['single-location', 'multi-location', 'franchise-group']),
  currentReconciliationTime: z.enum(['0-5', '5-10', '10-15', '15+']),
  rewardsPrograms: z.array(z.string()).min(1, 'Please select at least one rewards program'),
  monthlyTransactions: z.enum(['0-500', '500-1000', '1000-2000', '2000+']),
  painPoints: z.string().min(10, 'Please describe your current challenges (minimum 10 characters)'),
  timeline: z.enum(['immediately', 'within-30-days', 'within-90-days', 'exploring']),
  source: z.enum(['google', 'social-media', 'referral', 'industry-event', 'other'])
});

type FormData = z.infer<typeof formSchema>;

interface LeadCaptureFormProps {
  onSuccess?: (data: FormData) => void;
  variant?: 'modal' | 'page' | 'inline';
}

export function LeadCaptureForm({ onSuccess }: LeadCaptureFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<FormData>({
    resolver: zodResolver(formSchema)
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setError(null); // Clear any previous errors
    
    try {
      // TODO: Replace with actual API endpoint
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          source: 'website',
          timestamp: new Date().toISOString(),
          status: 'new'
        }),
      });

      if (response.ok) {
        setIsSuccess(true);
        reset();
        onSuccess?.(data);
        
        // Reset success message after 5 seconds
        setTimeout(() => setIsSuccess(false), 5000);
      } else {
        throw new Error('Failed to submit form');
      }
    } catch (error) {
      // Log error in development only
      if (process.env.NODE_ENV === 'development') {
        console.error('Form submission error:', error);
      }
      setError('Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <FormContainer>
        <SuccessMessage>
          Thank you! We&apos;ll be in touch within 24 hours to discuss how MedspaSync Pro can help your practice.
        </SuccessMessage>
      </FormContainer>
    );
  }

  return (
    <FormContainer>
      <FormTitle>Get Started with MedspaSync Pro</FormTitle>
      <FormSubtitle>
        Join our pilot program and be among the first to experience automated rewards reconciliation.
      </FormSubtitle>
      
      {error && (
        <ErrorMessage style={{ marginBottom: '1rem', textAlign: 'center' }}>
          {error}
        </ErrorMessage>
      )}
      
      <Form onSubmit={handleSubmit(onSubmit)}>
        <FormGroup>
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            type="text"
            placeholder="Enter your first name"
            $hasError={!!errors.firstName}
            {...register('firstName')}
          />
          {errors.firstName && <ErrorMessage>{errors.firstName.message}</ErrorMessage>}
        </FormGroup>

        <FormGroup>
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            type="text"
            placeholder="Enter your last name"
            $hasError={!!errors.lastName}
            {...register('lastName')}
          />
          {errors.lastName && <ErrorMessage>{errors.lastName.message}</ErrorMessage>}
        </FormGroup>

        <FormGroup>
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email address"
            $hasError={!!errors.email}
            {...register('email')}
          />
          {errors.email && <ErrorMessage>{errors.email.message}</ErrorMessage>}
        </FormGroup>

        <FormGroup>
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="Enter your phone number"
            $hasError={!!errors.phone}
            {...register('phone')}
          />
          {errors.phone && <ErrorMessage>{errors.phone.message}</ErrorMessage>}
        </FormGroup>

        <FormGroup>
          <Label htmlFor="practiceName">Practice Name *</Label>
          <Input
            id="practiceName"
            type="text"
            placeholder="Enter your practice name"
            $hasError={!!errors.practiceName}
            {...register('practiceName')}
          />
          {errors.practiceName && <ErrorMessage>{errors.practiceName.message}</ErrorMessage>}
        </FormGroup>

        <FormGroup>
          <Label htmlFor="practiceType">Practice Type *</Label>
          <Select
            id="practiceType"
            $hasError={!!errors.practiceType}
            {...register('practiceType')}
          >
            <option value="">Select practice type</option>
            <option value="single-location">Single Location</option>
            <option value="multi-location">Multi-Location</option>
            <option value="franchise-group">Franchise Group</option>
          </Select>
          {errors.practiceType && <ErrorMessage>{errors.practiceType.message}</ErrorMessage>}
        </FormGroup>

        <FormGroup>
          <Label htmlFor="currentReconciliationTime">Current Monthly Hours on Reconciliation *</Label>
          <Select
            id="currentReconciliationTime"
            $hasError={!!errors.currentReconciliationTime}
            {...register('currentReconciliationTime')}
          >
            <option value="">Select time range</option>
            <option value="0-5">0-5 hours</option>
            <option value="5-10">5-10 hours</option>
            <option value="10-15">10-15 hours</option>
            <option value="15+">15+ hours</option>
          </Select>
          {errors.currentReconciliationTime && <ErrorMessage>{errors.currentReconciliationTime.message}</ErrorMessage>}
        </FormGroup>

        <FormGroup>
          <Label htmlFor="monthlyTransactions">Monthly Transactions *</Label>
          <Select
            id="monthlyTransactions"
            $hasError={!!errors.monthlyTransactions}
            {...register('monthlyTransactions')}
          >
            <option value="">Select transaction volume</option>
            <option value="0-500">0-500</option>
            <option value="500-1000">500-1,000</option>
            <option value="1000-2000">1,000-2,000</option>
            <option value="2000+">2,000+</option>
          </Select>
          {errors.monthlyTransactions && <ErrorMessage>{errors.monthlyTransactions.message}</ErrorMessage>}
        </FormGroup>

        <FormGroup>
          <Label htmlFor="painPoints">Current Challenges *</Label>
          <TextArea
            id="painPoints"
            placeholder="Describe your current reconciliation challenges and pain points..."
            $hasError={!!errors.painPoints}
            {...register('painPoints')}
          />
          {errors.painPoints && <ErrorMessage>{errors.painPoints.message}</ErrorMessage>}
        </FormGroup>

        <FormGroup>
          <Label htmlFor="timeline">Implementation Timeline *</Label>
          <Select
            id="timeline"
            $hasError={!!errors.timeline}
            {...register('timeline')}
          >
            <option value="">Select timeline</option>
            <option value="immediately">Immediately</option>
            <option value="within-30-days">Within 30 days</option>
            <option value="within-90-days">Within 90 days</option>
            <option value="exploring">Just exploring</option>
          </Select>
          {errors.timeline && <ErrorMessage>{errors.timeline.message}</ErrorMessage>}
        </FormGroup>

        <FormGroup>
          <Label htmlFor="source">How did you hear about us? *</Label>
          <Select
            id="source"
            $hasError={!!errors.source}
            {...register('source')}
          >
            <option value="">Select source</option>
            <option value="google">Google Search</option>
            <option value="social-media">Social Media</option>
            <option value="referral">Referral</option>
            <option value="industry-event">Industry Event</option>
            <option value="other">Other</option>
          </Select>
          {errors.source && <ErrorMessage>{errors.source.message}</ErrorMessage>}
        </FormGroup>

        <FullWidthButton
          type="submit"
          variant="primary"
          size="large"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <LoadingSpinner />
              Submitting...
            </>
          ) : (
            'Get Started'
          )}
        </FullWidthButton>
      </Form>
    </FormContainer>
  );
} 