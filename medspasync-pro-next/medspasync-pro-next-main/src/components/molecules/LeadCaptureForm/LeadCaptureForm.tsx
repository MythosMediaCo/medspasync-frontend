'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import { Button } from '@/components/atoms/Button';

interface LeadCaptureFormProps {
  className?: string;
}

interface FormData {
  name: string;
  email: string;
  spaName: string;
  phone?: string;
}

const FormContainer = styled.form`
  max-width: 600px;
  margin: 0 auto;
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: 0.75rem;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  
  @media (max-width: 768px) {
    padding: 1.5rem;
  }
`;

const FormTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray[900]};
  margin: 0 0 0.5rem 0;
  text-align: center;
`;

const FormSubtitle = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.gray[500]};
  margin: 0 0 2rem 0;
  text-align: center;
  line-height: 1.5;
`;

const FormSection = styled.div`
  margin-bottom: 2rem;
  
  .section-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.gray[900]};
    margin-bottom: 1rem;
  }
`;

const FormField = styled.div`
  margin-bottom: 1.5rem;
  
  label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: ${({ theme }) => theme.colors.gray[700]};
    margin-bottom: 0.5rem;
  }
  
  input, textarea, select {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid ${({ theme }) => theme.colors.gray[300]};
    border-radius: 0.5rem;
    font-size: 1rem;
    transition: all 0.2s ease-out;
    background: ${({ theme }) => theme.colors.background};
    color: ${({ theme }) => theme.colors.gray[900]};
    
    &:focus {
      outline: none;
      border-color: ${({ theme }) => theme.colors.primary[500]};
      box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
    }
    
    &::placeholder {
      color: ${({ theme }) => theme.colors.gray[500]};
    }
    
    &:disabled {
      background: ${({ theme }) => theme.colors.gray[50]};
      color: ${({ theme }) => theme.colors.gray[500]};
      cursor: not-allowed;
    }
  }
  
  .field-error {
    font-size: 0.75rem;
    color: ${({ theme }) => theme.colors.semantic.error};
    margin-top: 0.25rem;
  }
  
  .field-help {
    font-size: 0.75rem;
    color: ${({ theme }) => theme.colors.gray[500]};
    margin-top: 0.25rem;
  }
`;

const FormActions = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const FormDescription = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.gray[500]};
  margin: 0 0 2rem 0;
  text-align: center;
  line-height: 1.5;
`;

export function LeadCaptureForm({ className }: LeadCaptureFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    spaName: '',
    phone: ''
  });
  
  const [errors, setErrors] = useState<Partial<FormData>>({});

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <FormContainer className={className}>
      <FormTitle>Get Started with MedspaSync Pro</FormTitle>
      <FormSubtitle>
        Join our pilot program and be among the first to experience automated rewards reconciliation.
      </FormSubtitle>
      
      <FormSection>
        <div className="section-title">Contact Information</div>
        
        <FormField>
          <label htmlFor="name">Full Name *</label>
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Enter your full name"
          />
          {errors.name && <div className="field-error">{errors.name}</div>}
        </FormField>
        
        <FormField>
          <label htmlFor="email">Email Address *</label>
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="Enter your email address"
          />
          {errors.email && <div className="field-error">{errors.email}</div>}
        </FormField>
        
        <FormField>
          <label htmlFor="phone">Phone Number</label>
          <input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            placeholder="Enter your phone number (optional)"
          />
          <div className="field-help">We&apos;ll only use this to schedule your demo</div>
        </FormField>
      </FormSection>
      
      <FormSection>
        <div className="section-title">Spa Information</div>
        
        <FormField>
          <label htmlFor="spaName">Spa Name *</label>
          <input
            id="spaName"
            type="text"
            value={formData.spaName}
            onChange={(e) => handleInputChange('spaName', e.target.value)}
            placeholder="Enter your spa name"
          />
          {errors.spaName && <div className="field-error">{errors.spaName}</div>}
        </FormField>
      </FormSection>
      
      <FormDescription>
        We&apos;ll send you a personalized demo and ROI calculation based on your practice size.
      </FormDescription>
      
      <FormActions>
        <Button
          type="submit"
          variant="primary"
          size="large"
          style={{ minWidth: '200px' }}
        >
          Get Started
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="large"
        >
          Schedule Demo
        </Button>
      </FormActions>
    </FormContainer>
  );
} 