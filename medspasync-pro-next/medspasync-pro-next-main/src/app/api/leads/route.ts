import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/database';
import { sendEmail, createLeadNotificationEmail, createWelcomeEmail } from '@/lib/email';
import { addToCRM, CRMContact } from '@/lib/crm';
import { PracticeType, ReconciliationTime, TransactionVolume, Timeline, LeadSource, LeadStatus } from '@prisma/client';

// Validation schema for lead data
const leadSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  practiceName: z.string().min(1, 'Practice name is required'),
  practiceType: z.enum(['single-location', 'multi-location', 'franchise-group']),
  currentReconciliationTime: z.enum(['0-5', '5-10', '10-15', '15+']),
  rewardsPrograms: z.array(z.string()).min(1, 'At least one rewards program must be selected'),
  monthlyTransactions: z.enum(['0-500', '500-1000', '1000-2000', '2000+']),
  painPoints: z.string().min(10, 'Please describe your challenges (minimum 10 characters)'),
  timeline: z.enum(['immediately', 'within-30-days', 'within-90-days', 'exploring']),
  source: z.enum(['google', 'social-media', 'referral', 'industry-event', 'other']),
  timestamp: z.string(),
  status: z.string()
});

type LeadData = z.infer<typeof leadSchema>;

// Transform form data to database format
function transformToDatabaseFormat(data: LeadData) {
  const practiceTypeMap: Record<string, PracticeType> = {
    'single-location': 'SINGLE_LOCATION',
    'multi-location': 'MULTI_LOCATION',
    'franchise-group': 'FRANCHISE_GROUP',
  };

  const reconciliationTimeMap: Record<string, ReconciliationTime> = {
    '0-5': 'ZERO_TO_FIVE',
    '5-10': 'FIVE_TO_TEN',
    '10-15': 'TEN_TO_FIFTEEN',
    '15+': 'FIFTEEN_PLUS',
  };

  const transactionVolumeMap: Record<string, TransactionVolume> = {
    '0-500': 'ZERO_TO_FIVE_HUNDRED',
    '500-1000': 'FIVE_HUNDRED_TO_ONE_THOUSAND',
    '1000-2000': 'ONE_THOUSAND_TO_TWO_THOUSAND',
    '2000+': 'TWO_THOUSAND_PLUS',
  };

  const timelineMap: Record<string, Timeline> = {
    'immediately': 'IMMEDIATELY',
    'within-30-days': 'WITHIN_30_DAYS',
    'within-90-days': 'WITHIN_90_DAYS',
    'exploring': 'EXPLORING',
  };

  const sourceMap: Record<string, LeadSource> = {
    'google': 'GOOGLE',
    'social-media': 'SOCIAL_MEDIA',
    'referral': 'REFERRAL',
    'industry-event': 'INDUSTRY_EVENT',
    'other': 'OTHER',
  };

  return {
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    practiceName: data.practiceName,
    practiceType: practiceTypeMap[data.practiceType],
    currentReconciliationTime: reconciliationTimeMap[data.currentReconciliationTime],
    rewardsPrograms: data.rewardsPrograms,
    monthlyTransactions: transactionVolumeMap[data.monthlyTransactions],
    painPoints: data.painPoints,
    timeline: timelineMap[data.timeline],
    source: sourceMap[data.source],
    status: 'NEW' as LeadStatus,
  };
}

// Transform data for CRM
function transformToCRMFormat(data: LeadData): CRMContact {
  return {
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone,
    company: data.practiceName,
    customFields: {
      practiceType: data.practiceType,
      reconciliationTime: data.currentReconciliationTime,
      rewardsPrograms: data.rewardsPrograms.join(', '),
      monthlyTransactions: data.monthlyTransactions,
      timeline: data.timeline,
      source: data.source,
      painPoints: data.painPoints,
    },
    tags: ['early-access', 'pilot-program', 'medical-spa'],
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the request body
    const validatedData = leadSchema.parse(body);
    
    // Check if lead already exists
    const existingLead = await prisma.lead.findUnique({
      where: { email: validatedData.email }
    });
    
    if (existingLead) {
      return NextResponse.json(
        { success: false, message: 'A lead with this email already exists' },
        { status: 409 }
      );
    }
    
    // Save to database
    const dbData = transformToDatabaseFormat(validatedData);
    const savedLead = await prisma.lead.create({
      data: dbData
    });
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Lead saved to database:', savedLead.id);
    }
    
    // Send notification email to team
    try {
      const notificationEmail = createLeadNotificationEmail(validatedData);
      await sendEmail({
        to: process.env.EMAIL_TO_ADDRESS || 'leads@medspasyncpro.com',
        subject: notificationEmail.subject,
        html: notificationEmail.html,
      });
      
      // Update database to mark email as sent
      await prisma.lead.update({
        where: { id: savedLead.id },
        data: { 
          emailSent: true,
          emailSentAt: new Date()
        }
      });
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Notification email sent successfully');
      }
    } catch (emailError) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to send notification email:', emailError);
      }
      // Don't fail the entire request if email fails
    }
    
    // Send welcome email to lead
    try {
      const welcomeEmail = createWelcomeEmail(validatedData);
      await sendEmail({
        to: validatedData.email,
        subject: welcomeEmail.subject,
        html: welcomeEmail.html,
      });
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Welcome email sent to lead');
      }
    } catch (emailError) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to send welcome email:', emailError);
      }
      // Don't fail the entire request if email fails
    }
    
    // Add to CRM
    try {
      const crmData = transformToCRMFormat(validatedData);
      const crmResult = await addToCRM(crmData);
      
      if (crmResult.success && crmResult.contactId) {
        // Update database with CRM ID
        await prisma.lead.update({
          where: { id: savedLead.id },
          data: { crmId: crmResult.contactId }
        });
        
        if (process.env.NODE_ENV === 'development') {
          console.log('Lead added to CRM successfully:', crmResult.contactId);
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.warn('CRM integration failed:', crmResult.error);
        }
      }
    } catch (crmError) {
      if (process.env.NODE_ENV === 'development') {
        console.error('CRM integration error:', crmError);
      }
      // Don't fail the entire request if CRM fails
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Application submitted successfully',
      leadId: savedLead.id
    });
    
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Lead submission error:', error);
    }
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid form data', 
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 