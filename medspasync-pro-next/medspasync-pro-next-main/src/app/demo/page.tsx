'use client';

import React, { useState } from 'react';
import { Navigation } from '@/components/organisms/Navigation';
import { DemoWelcome } from '@/components/organisms/DemoFlow/DemoWelcome';
import { CurrentStateSimulation } from '@/components/organisms/DemoFlow/CurrentStateSimulation';
import { ResultsComparison } from '@/components/organisms/DemoFlow/ResultsComparison';
import { LeadCaptureForm } from '@/components/organisms/LeadCaptureForm';
import { Footer } from '@/components/organisms/Footer';

type DemoStep = 'welcome' | 'current-state' | 'results' | 'next-steps';

interface UserData {
  practiceType: string;
  challenges: string[];
}

export default function DemoPage() {
  const [currentStep, setCurrentStep] = useState<DemoStep>('welcome');
  const [userData, setUserData] = useState<UserData | null>(null);

  const handleWelcomeComplete = (data: UserData) => {
    setUserData(data);
    setCurrentStep('current-state');
  };

  const handleCurrentStateComplete = () => {
    setCurrentStep('results');
  };

  const handleResultsComplete = () => {
    setCurrentStep('next-steps');
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'welcome':
        return <DemoWelcome onComplete={handleWelcomeComplete} />;
      case 'current-state':
        return userData ? (
          <CurrentStateSimulation 
            onComplete={handleCurrentStateComplete} 
          />
        ) : null;
      case 'results':
        return userData ? (
          <ResultsComparison 
            onComplete={handleResultsComplete} 
          />
        ) : null;
      case 'next-steps':
        return (
          <div style={{ 
            maxWidth: '800px', 
            margin: '0 auto', 
            padding: '80px 24px',
            textAlign: 'center'
          }}>
            <h1 style={{ 
              fontSize: '48px', 
              fontWeight: '600', 
              marginBottom: '16px',
              color: '#2C2C2C'
            }}>
              Ready to Transform Your Practice?
            </h1>
            <p style={{ 
              fontSize: '24px', 
              color: '#6B6B6B', 
              marginBottom: '48px',
              lineHeight: '1.5'
            }}>
              Join our pilot program and be among the first medical spas to experience automated reconciliation
            </p>
            <LeadCaptureForm />
          </div>
        );
      default:
        return <DemoWelcome onComplete={handleWelcomeComplete} />;
    }
  };

  return (
    <main>
      <Navigation />
      {renderCurrentStep()}
      <Footer />
    </main>
  );
} 