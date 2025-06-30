'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Button } from '@/components/atoms/Button';

const SimulationContainer = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
`;

const ProgressBar = styled.div`
  width: 100%;
  max-width: 400px;
  margin: 0 auto 3rem;
  background: ${({ theme }) => theme.colors.gray[100]};
  border-radius: 0.75rem;
  height: 8px;
  overflow: hidden;
`;

const ProgressFill = styled(motion.div)`
  height: 100%;
  background: ${({ theme }) => theme.colors.primary[600]};
  border-radius: 0.75rem;
`;

const SectionTitle = styled.h2`
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-size: 1.875rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-bottom: 1rem;
  text-align: center;
`;

const SectionSubtitle = styled.p`
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-size: 1.125rem;
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-bottom: 3rem;
  text-align: center;
  line-height: 1.5;
`;

const SimulationGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 3rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const SimulationCard = styled.div`
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const CardTitle = styled.h3`
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-size: 1.25rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray[900]};
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const TaskList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const TaskItem = styled.div<{ $isCompleted: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: ${({ theme, $isCompleted }) => 
    $isCompleted ? theme.colors.gray[50] : theme.colors.background};
  border: 1px solid ${({ theme, $isCompleted }) => 
    $isCompleted ? theme.colors.gray[200] : theme.colors.gray[300]};
  border-radius: 0.5rem;
  transition: all 0.2s ease-out;
`;

const TaskCheckbox = styled.div<{ $isCompleted: boolean }>`
  width: 20px;
  height: 20px;
  border: 2px solid ${({ theme, $isCompleted }) => 
    $isCompleted ? theme.colors.primary[600] : theme.colors.gray[300]};
  border-radius: 4px;
  background: ${({ theme, $isCompleted }) => 
    $isCompleted ? theme.colors.primary[600] : 'transparent'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  flex-shrink: 0;
`;

const TaskText = styled.span<{ $isCompleted: boolean }>`
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-size: 0.875rem;
  color: ${({ theme, $isCompleted }) => 
    $isCompleted ? theme.colors.gray[500] : theme.colors.gray[700]};
  text-decoration: ${({ $isCompleted }) => $isCompleted ? 'line-through' : 'none'};
  flex: 1;
`;

const TimeEstimate = styled.div`
  font-family: ${({ theme }) => theme.typography.fontFamilies.primary};
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.gray[500]};
  margin-top: 0.5rem;
  text-align: right;
`;

const ActionsContainer = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
`;

interface CurrentStateSimulationProps {
  onComplete: () => void;
}

const manualTasks = [
  { id: 1, text: 'Export transaction data from POS system', time: '15 min' },
  { id: 2, text: 'Download loyalty program reports', time: '10 min' },
  { id: 3, text: 'Cross-reference customer accounts', time: '45 min' },
  { id: 4, text: 'Identify discrepancies in point calculations', time: '30 min' },
  { id: 5, text: 'Contact customers about missing rewards', time: '60 min' },
  { id: 6, text: 'Update customer accounts manually', time: '45 min' },
  { id: 7, text: 'Document all changes for audit trail', time: '20 min' },
  { id: 8, text: 'Generate reconciliation report', time: '15 min' }
];

const automatedTasks = [
  { id: 1, text: 'Automatic data synchronization', time: '2 min' },
  { id: 2, text: 'Real-time point calculation', time: 'Instant' },
  { id: 3, text: 'Discrepancy detection & alerts', time: '5 min' },
  { id: 4, text: 'Customer notification system', time: 'Instant' },
  { id: 5, text: 'Automated account updates', time: '5 min' },
  { id: 6, text: 'Audit trail generation', time: 'Instant' },
  { id: 7, text: 'Report generation & delivery', time: '2 min' }
];

export function CurrentStateSimulation({ onComplete }: CurrentStateSimulationProps) {
  const [completedManualTasks, setCompletedManualTasks] = useState<number[]>([]);
  const [completedAutomatedTasks, setCompletedAutomatedTasks] = useState<number[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  const totalManualTime = manualTasks.reduce((sum, task) => sum + parseInt(task.time), 0);
  const totalAutomatedTime = automatedTasks.reduce((sum, task) => 
    sum + (task.time === 'Instant' ? 0 : parseInt(task.time)), 0);

  const handleStartSimulation = () => {
    setIsSimulating(true);
    setCompletedManualTasks([]);
    setCompletedAutomatedTasks([]);
    
    // Simulate manual process
    manualTasks.forEach((task, index) => {
      setTimeout(() => {
        setCompletedManualTasks(prev => [...prev, task.id]);
      }, (index + 1) * 1000);
    });

    // Simulate automated process (faster)
    automatedTasks.forEach((task, index) => {
      setTimeout(() => {
        setCompletedAutomatedTasks(prev => [...prev, task.id]);
      }, (index + 1) * 300);
    });

    // Complete simulation after all tasks
    setTimeout(() => {
      setIsSimulating(false);
    }, Math.max(manualTasks.length * 1000, automatedTasks.length * 300) + 1000);
  };

  const handleContinue = () => {
    onComplete();
  };

  return (
    <SimulationContainer>
      <ProgressBar>
        <ProgressFill
          initial={{ width: '50%' }}
          animate={{ width: '50%' }}
          transition={{ duration: 0.5 }}
        />
      </ProgressBar>

      <SectionTitle>Current State vs. Automated Solution</SectionTitle>
      <SectionSubtitle>
        Watch how MedspaSync Pro transforms your monthly reconciliation process
      </SectionSubtitle>

      <SimulationGrid>
        <SimulationCard>
          <CardTitle>
            <span>⏰</span>
            Manual Process (Current)
          </CardTitle>
          <TaskList>
            {manualTasks.map((task) => (
              <TaskItem key={task.id} $isCompleted={completedManualTasks.includes(task.id)}>
                <TaskCheckbox $isCompleted={completedManualTasks.includes(task.id)}>
                  {completedManualTasks.includes(task.id) && '✓'}
                </TaskCheckbox>
                <TaskText $isCompleted={completedManualTasks.includes(task.id)}>
                  {task.text}
                </TaskText>
              </TaskItem>
            ))}
          </TaskList>
          <TimeEstimate>Total Time: ~{totalManualTime} minutes</TimeEstimate>
        </SimulationCard>

        <SimulationCard>
          <CardTitle>
            <span>⚡</span>
            Automated Process (MedspaSync Pro)
          </CardTitle>
          <TaskList>
            {automatedTasks.map((task) => (
              <TaskItem key={task.id} $isCompleted={completedAutomatedTasks.includes(task.id)}>
                <TaskCheckbox $isCompleted={completedAutomatedTasks.includes(task.id)}>
                  {completedAutomatedTasks.includes(task.id) && '✓'}
                </TaskCheckbox>
                <TaskText $isCompleted={completedAutomatedTasks.includes(task.id)}>
                  {task.text}
                </TaskText>
              </TaskItem>
            ))}
          </TaskList>
          <TimeEstimate>Total Time: ~{totalAutomatedTime} minutes</TimeEstimate>
        </SimulationCard>
      </SimulationGrid>

      <ActionsContainer>
        {!isSimulating && completedManualTasks.length === 0 && (
          <Button variant="primary" size="large" onClick={handleStartSimulation}>
            Start Simulation
          </Button>
        )}
        
        {!isSimulating && completedManualTasks.length > 0 && (
          <Button variant="primary" size="large" onClick={handleContinue}>
            Continue to Results
          </Button>
        )}
      </ActionsContainer>
    </SimulationContainer>
  );
} 