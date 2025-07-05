/**
 * Real-time Dashboard API for MedSpa Analytics Pro
 * WebSocket + Server-Sent Events for real-time updates
 * Performance target: <200ms response time for standard queries
 */

import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';
import crypto from 'crypto';

interface DashboardMetrics {
  totalAppointments: number;
  todayAppointments: number;
  pendingAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  totalRevenue: number;
  todayRevenue: number;
  averageAppointmentValue: number;
  patientSatisfaction: number;
  staffUtilization: number;
  treatmentPerformance: Array<{
    treatmentName: string;
    count: number;
    revenue: number;
    satisfaction: number;
  }>;
  realTimeUpdates: Array<{
    timestamp: Date;
    type: string;
    message: string;
    severity: 'info' | 'warning' | 'error';
  }>;
}

interface AppointmentStream {
  id: string;
  patientName: string;
  treatmentName: string;
  scheduledAt: Date;
  status: string;
  staffName: string;
  amount: number;
  duration: number;
}

interface RevenueAnalytics {
  daily: Array<{
    date: string;
    revenue: number;
    appointments: number;
    averageValue: number;
  }>;
  weekly: Array<{
    week: string;
    revenue: number;
    appointments: number;
    growth: number;
  }>;
  monthly: Array<{
    month: string;
    revenue: number;
    appointments: number;
    growth: number;
  }>;
  byTreatment: Array<{
    treatmentName: string;
    revenue: number;
    count: number;
    averageValue: number;
    growth: number;
  }>;
}

interface PatientAnalytics {
  totalPatients: number;
  newPatients: number;
  returningPatients: number;
  patientSegments: Array<{
    segment: string;
    count: number;
    percentage: number;
    averageValue: number;
  }>;
  topPatients: Array<{
    patientId: string;
    patientName: string;
    totalSpent: number;
    visitCount: number;
    lastVisit: Date;
  }>;
  patientRetention: {
    rate: number;
    trend: number;
    factors: string[];
  };
}

interface StaffAnalytics {
  totalStaff: number;
  activeStaff: number;
  utilization: Array<{
    staffId: string;
    staffName: string;
    utilization: number;
    appointments: number;
    revenue: number;
    satisfaction: number;
  }>;
  performance: Array<{
    staffId: string;
    staffName: string;
    completedAppointments: number;
    totalRevenue: number;
    averageRating: number;
    efficiency: number;
  }>;
}

export class RealTimeDashboardAPI {
  private prisma: PrismaClient;
  private redis: Redis;
  private eventEmitter: EventEmitter;
  private activeConnections: Map<string, any> = new Map();
  private readonly CACHE_TTL = 300; // 5 minutes
  // private readonly STREAM_KEY = 'dashboard:updates';
  private readonly MAX_CONNECTIONS = 1000;

  constructor() {
    this.prisma = new PrismaClient();
    this.redis = new Redis({
      host: process.env['REDIS_HOST'] || 'localhost',
      port: parseInt(process.env['REDIS_PORT'] || '6379'),
      password: process.env['REDIS_PASSWORD'] || '',
      db: parseInt(process.env['REDIS_DB'] || '12'), // Separate DB for dashboard
      maxRetriesPerRequest: 3
    });

    this.eventEmitter = new EventEmitter();
    this.eventEmitter.setMaxListeners(this.MAX_CONNECTIONS);

    this.initializeDashboard();
  }

  /**
   * Initialize dashboard
   */
  private async initializeDashboard(): Promise<void> {
    try {
      // Start real-time update stream
      this.startRealTimeUpdates();
      
      // Initialize cache with initial data
      await this.initializeCache();
      
      console.log('✅ Real-time Dashboard API initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Dashboard API:', error);
      throw error;
    }
  }

  /**
   * Start real-time updates
   */
  private startRealTimeUpdates(): void {
    // Subscribe to real-time events
    this.eventEmitter.on('appointment_updated', (data) => {
      this.broadcastUpdate('appointment_updated', data);
    });

    this.eventEmitter.on('revenue_updated', (data) => {
      this.broadcastUpdate('revenue_updated', data);
    });

    this.eventEmitter.on('patient_registered', (data) => {
      this.broadcastUpdate('patient_registered', data);
    });

    // Periodic cache refresh
    setInterval(async () => {
      await this.refreshCache();
    }, 60000); // Refresh every minute
  }

  /**
   * Initialize cache with initial data
   */
  private async initializeCache(): Promise<void> {
    try {
      // Cache dashboard metrics
      const metrics = await this.calculateDashboardMetrics();
      await this.redis.setex('dashboard:metrics', this.CACHE_TTL, JSON.stringify(metrics));
      
      // Cache appointment stream
      const appointments = await this.getAppointmentStream();
      await this.redis.setex('dashboard:appointments', this.CACHE_TTL, JSON.stringify(appointments));
      
      // Cache revenue analytics
      const revenue = await this.getRevenueAnalytics();
      await this.redis.setex('dashboard:revenue', this.CACHE_TTL, JSON.stringify(revenue));
      
      // Cache patient analytics
      const patients = await this.getPatientAnalytics();
      await this.redis.setex('dashboard:patients', this.CACHE_TTL, JSON.stringify(patients));
      
      // Cache staff analytics
      const staff = await this.getStaffAnalytics();
      await this.redis.setex('dashboard:staff', this.CACHE_TTL, JSON.stringify(staff));
      
    } catch (error) {
      console.error('Error initializing cache:', error);
    }
  }

  /**
   * Refresh cache data
   */
  private async refreshCache(): Promise<void> {
    try {
      await this.initializeCache();
    } catch (error) {
      console.error('Error refreshing cache:', error);
    }
  }

  /**
   * Get dashboard metrics
   */
  async getDashboardMetrics(practiceId: string): Promise<DashboardMetrics> {
    const startTime = performance.now();
    
    try {
      // Try to get from cache first
      const cached = await this.redis.get(`dashboard:metrics:${practiceId}`);
      if (cached) {
        return JSON.parse(cached);
      }
      
      // Calculate fresh metrics
      const metrics = await this.calculateDashboardMetrics();
      
      // Cache the result
      await this.redis.setex(`dashboard:metrics:${practiceId}`, this.CACHE_TTL, JSON.stringify(metrics));
      
      const processingTime = performance.now() - startTime;
      if (processingTime > 200) {
        console.warn(`Dashboard metrics exceeded target: ${processingTime.toFixed(2)}ms`);
      }
      
      return metrics;
      
    } catch (error) {
      console.error('Error getting dashboard metrics:', error);
      throw error;
    }
  }

  /**
   * Calculate dashboard metrics
   */
  private async calculateDashboardMetrics(): Promise<DashboardMetrics> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
    
    // Get appointment counts
    const appointmentCounts = await this.prisma.appointment.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    });
    
    const todayAppointments = await this.prisma.appointment.count({
      where: {
        dateTime: {
          gte: startOfDay,
          lt: endOfDay
        }
      }
    });
    
    // Get revenue data
    const revenueData = await this.prisma.appointment.aggregate({
      _sum: {
        price: true
      },
      _avg: {
        price: true
      }
    });
    
    const todayRevenue = await this.prisma.appointment.aggregate({
      where: {
        dateTime: {
          gte: startOfDay,
          lt: endOfDay
        }
      },
      _sum: {
        price: true
      }
    });
    
    // Get treatment performance
    const treatmentPerformance = await this.prisma.appointment.groupBy({
      by: ['serviceId'],
      _count: {
        id: true
      },
      _sum: {
        price: true
      }
    });
    
    // Calculate metrics
    const totalAppointments = appointmentCounts.reduce((sum, item) => sum + (item._count?.id || 0), 0);
    const pendingAppointments = appointmentCounts.find(item => item.status === 'SCHEDULED')?._count?.id || 0;
    const completedAppointments = appointmentCounts.find(item => item.status === 'COMPLETED')?._count?.id || 0;
    const cancelledAppointments = appointmentCounts.find(item => item.status === 'CANCELLED')?._count?.id || 0;
    
    const totalRevenue = revenueData._sum.price || 0;
    const averageAppointmentValue = revenueData._avg?.price || 0;
    const todayRevenueAmount = todayRevenue._sum?.price || 0;
    
    // Calculate patient satisfaction (simulated)
    const patientSatisfaction = 0.85 + Math.random() * 0.1; // 85-95%
    
    // Calculate staff utilization (simulated)
    const staffUtilization = 0.75 + Math.random() * 0.2; // 75-95%
    
    // Get treatment performance details
    const treatmentDetails = await Promise.all(
      treatmentPerformance.map(async (treatment) => {
        const service = await this.prisma.service.findUnique({
          where: { id: treatment.serviceId }
        });
        
        return {
          treatmentName: service?.name || 'Unknown',
          count: treatment._count.id,
          revenue: treatment._sum.price || 0,
          satisfaction: 0.8 + Math.random() * 0.2 // 80-100%
        };
      })
    );
    
    // Get real-time updates
    const realTimeUpdates = await this.getRealTimeUpdates();
    
    return {
      totalAppointments,
      todayAppointments,
      pendingAppointments,
      completedAppointments,
      cancelledAppointments,
      totalRevenue,
      todayRevenue: todayRevenueAmount,
      averageAppointmentValue,
      patientSatisfaction: Math.round(patientSatisfaction * 100) / 100,
      staffUtilization: Math.round(staffUtilization * 100) / 100,
      treatmentPerformance: treatmentDetails,
      realTimeUpdates
    };
  }

  /**
   * Get appointment stream for real-time updates
   */
  async getAppointmentStream(): Promise<AppointmentStream[]> {
    try {
      const appointments = await this.prisma.appointment.findMany({
        where: {
          dateTime: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        include: {
          service: true,
          client: true
        },
        orderBy: {
          dateTime: 'desc'
        },
        take: 50
      });
      
      return appointments.map(apt => ({
        id: apt.id,
        patientName: apt.clientId || 'Unknown',
        treatmentName: apt.serviceId || 'Unknown',
        scheduledAt: apt.dateTime,
        status: apt.status,
        staffName: apt.staffId, // In production, this would be joined with staff table
        amount: apt.price || 0,
        duration: apt.duration || 60,
        dateTime: apt.dateTime
      }));
      
    } catch (error) {
      console.error('Error getting appointment stream:', error);
      return [];
    }
  }

  /**
   * Get revenue analytics
   */
  async getRevenueAnalytics(period: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<RevenueAnalytics> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (period) {
        case 'daily':
          startDate.setDate(endDate.getDate() - 30); // Last 30 days
          break;
        case 'weekly':
          startDate.setDate(endDate.getDate() - 90); // Last 90 days
          break;
        case 'monthly':
          startDate.setDate(endDate.getDate() - 365); // Last year
          break;
      }
      
      const appointments = await this.prisma.appointment.findMany({
        where: {
          dateTime: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          service: true
        },
        orderBy: {
          dateTime: 'asc'
        }
      });
      
      // Group by period
      const grouped = this.groupAppointmentsByPeriod(appointments);
      
      // Calculate analytics
      const daily = this.calculateDailyRevenue(grouped.daily);
      const weekly = this.calculateWeeklyRevenue(grouped.weekly);
      const monthly = this.calculateMonthlyRevenue(grouped.monthly);
      const byTreatment = await this.calculateTreatmentRevenue(appointments);
      
      return {
        daily,
        weekly,
        monthly,
        byTreatment
      };
      
    } catch (error) {
      console.error('Error getting revenue analytics:', error);
      return {
        daily: [],
        weekly: [],
        monthly: [],
        byTreatment: []
      };
    }
  }

  /**
   * Get patient analytics
   */
  async getPatientAnalytics(): Promise<PatientAnalytics> {
    try {
      const patients = await this.prisma.client.findMany({
        include: {
          appointments: {
            include: {
              service: true
            }
          }
        }
      });
      
      const totalPatients = patients.length;
      const newPatients = patients.filter(p => {
        const firstAppointment = p.appointments[0];
        if (!firstAppointment) return false;
        const daysSinceFirst = (Date.now() - firstAppointment.dateTime.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceFirst <= 30;
      }).length;
      
      const returningPatients = totalPatients - newPatients;
      
      // Calculate patient segments
      const segments = this.calculatePatientSegments(patients);
      
      // Get top patients
      const topPatients = this.getTopPatients(patients);
      
      // Calculate retention rate
      const retention = this.calculatePatientRetention();
      
      return {
        totalPatients,
        newPatients,
        returningPatients,
        patientSegments: segments,
        topPatients,
        patientRetention: retention
      };
      
    } catch (error) {
      console.error('Error getting patient analytics:', error);
      return {
        totalPatients: 0,
        newPatients: 0,
        returningPatients: 0,
        patientSegments: [],
        topPatients: [],
        patientRetention: {
          rate: 0,
          trend: 0,
          factors: []
        }
      };
    }
  }

  /**
   * Get staff analytics
   */
  async getStaffAnalytics(): Promise<StaffAnalytics> {
    try {
      // In production, this would query a staff table
      // For now, we'll simulate staff data
      const staffData = [
        { id: 'staff1', name: 'Dr. Smith', utilization: 0.85, appointments: 45, revenue: 15000, satisfaction: 4.8, efficiency: 0.92 },
        { id: 'staff2', name: 'Dr. Johnson', utilization: 0.78, appointments: 38, revenue: 12000, satisfaction: 4.6, efficiency: 0.88 },
        { id: 'staff3', name: 'Nurse Wilson', utilization: 0.92, appointments: 52, revenue: 8000, satisfaction: 4.9, efficiency: 0.95 }
      ];
      
      const totalStaff = staffData.length;
      const activeStaff = staffData.filter(s => s.utilization > 0.5).length;
      
      return {
        totalStaff,
        activeStaff,
        utilization: staffData.map(s => ({
          staffId: s.id,
          staffName: s.name,
          utilization: s.utilization,
          appointments: s.appointments,
          revenue: s.revenue,
          satisfaction: s.satisfaction
        })),
        performance: staffData.map(s => ({
          staffId: s.id,
          staffName: s.name,
          completedAppointments: s.appointments,
          totalRevenue: s.revenue,
          averageRating: s.satisfaction,
          efficiency: s.efficiency
        }))
      };
      
    } catch (error) {
      console.error('Error getting staff analytics:', error);
      return {
        totalStaff: 0,
        activeStaff: 0,
        utilization: [],
        performance: []
      };
    }
  }

  /**
   * Subscribe to real-time updates
   */
  subscribeToUpdates(connectionId: string, callback: (update: any) => void): void {
    if (this.activeConnections.size >= this.MAX_CONNECTIONS) {
      throw new Error('Maximum connections reached');
    }
    
    this.activeConnections.set(connectionId, callback);
    
    // Send initial data
    this.sendInitialData(connectionId);
  }

  /**
   * Unsubscribe from updates
   */
  unsubscribeFromUpdates(connectionId: string): void {
    this.activeConnections.delete(connectionId);
  }

  /**
   * Broadcast update to all connected clients
   */
  private broadcastUpdate(type: string, data: any): void {
    const update = {
      type,
      data,
      timestamp: new Date(),
      id: crypto.randomUUID()
    };
    
    this.activeConnections.forEach((callback, connectionId) => {
      try {
        callback(update);
      } catch (error) {
        console.error(`Error sending update to ${connectionId}:`, error);
        this.activeConnections.delete(connectionId);
      }
    });
  }

  /**
   * Send initial data to new connection
   */
  private async sendInitialData(connectionId: string): Promise<void> {
    try {
      const callback = this.activeConnections.get(connectionId);
      if (!callback) return;
      
      const initialData = {
        type: 'initial_data',
        data: {
          metrics: await this.getDashboardMetrics(''),
          appointments: await this.getAppointmentStream(),
          revenue: await this.getRevenueAnalytics(),
          patients: await this.getPatientAnalytics(),
          staff: await this.getStaffAnalytics()
        },
        timestamp: new Date(),
        id: crypto.randomUUID()
      };
      
      callback(initialData);
      
    } catch (error) {
      console.error(`Error sending initial data to ${connectionId}:`, error);
    }
  }

  /**
   * Get real-time updates
   */
  private async getRealTimeUpdates(): Promise<Array<{
    timestamp: Date;
    type: string;
    message: string;
    severity: 'info' | 'warning' | 'error';
  }>> {
    // In production, this would get actual real-time updates
    // For now, return simulated updates
    return [
      {
        timestamp: new Date(),
        type: 'appointment_created',
        message: 'New appointment scheduled for tomorrow',
        severity: 'info'
      },
      {
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        type: 'revenue_milestone',
        message: 'Daily revenue target achieved',
        severity: 'info'
      },
      {
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        type: 'patient_feedback',
        message: 'New 5-star review received',
        severity: 'info'
      }
    ];
  }

  // Utility methods for analytics calculations
  private groupAppointmentsByPeriod(appointments: any[]): any {
    const grouped: any = { daily: {}, weekly: {}, monthly: {} };
    
    appointments.forEach(apt => {
      const date = new Date(apt.dateTime);
      const dayKey = date.toISOString().split('T')[0];
      const weekKey = this.getWeekKey(date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (dayKey && !grouped.daily[dayKey]) grouped.daily[dayKey] = [];
      if (dayKey) grouped.daily[dayKey].push(apt);
      
      if (!grouped.weekly[weekKey]) grouped.weekly[weekKey] = [];
      if (!grouped.monthly[monthKey]) grouped.monthly[monthKey] = [];
      
      grouped.weekly[weekKey].push(apt);
      grouped.monthly[monthKey].push(apt);
    });
    
    return grouped;
  }

  private getWeekKey(date: Date): string {
    const year = date.getFullYear();
    const week = Math.ceil((date.getTime() - new Date(year, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
    return `${year}-W${String(week).padStart(2, '0')}`;
  }

  private calculateDailyRevenue(dailyData: any): Array<{ date: string; revenue: number; appointments: number; averageValue: number }> {
    return Object.entries(dailyData).map(([date, appointments]: [string, any]) => {
      const revenue = appointments.reduce((sum: number, apt: any) => sum + (apt.price || 0), 0);
      const count = appointments.length;
      const averageValue = count > 0 ? revenue / count : 0;
      
      return {
        date,
        revenue,
        appointments: count,
        averageValue
      };
    }).sort((a, b) => a.date.localeCompare(b.date));
  }

  private calculateWeeklyRevenue(weeklyData: any): Array<{ week: string; revenue: number; appointments: number; growth: number }> {
    return Object.entries(weeklyData).map(([week, appointments]: [string, any]) => {
      const revenue = appointments.reduce((sum: number, apt: any) => sum + (apt.price || 0), 0);
      const count = appointments.length;
      const growth = Math.random() * 0.2 - 0.1; // Simulated growth
      
      return {
        week,
        revenue,
        appointments: count,
        growth
      };
    }).sort((a, b) => a.week.localeCompare(b.week));
  }

  private calculateMonthlyRevenue(monthlyData: any): Array<{ month: string; revenue: number; appointments: number; growth: number }> {
    return Object.entries(monthlyData).map(([month, appointments]: [string, any]) => {
      const revenue = appointments.reduce((sum: number, apt: any) => sum + (apt.price || 0), 0);
      const count = appointments.length;
      const growth = Math.random() * 0.3 - 0.15; // Simulated growth
      
      return {
        month,
        revenue,
        appointments: count,
        growth
      };
    }).sort((a, b) => a.month.localeCompare(b.month));
  }

  private async calculateTreatmentRevenue(appointments: any[]): Promise<Array<{
    treatmentName: string;
    revenue: number;
    count: number;
    averageValue: number;
    growth: number;
  }>> {
    const treatmentMap = new Map();
    
    appointments.forEach(apt => {
      const treatmentName = apt.service?.name || 'Unknown';
      if (!treatmentMap.has(treatmentName)) {
        treatmentMap.set(treatmentName, { revenue: 0, count: 0 });
      }
      
      const treatment = treatmentMap.get(treatmentName);
      treatment.revenue += apt.price || 0;
      treatment.count += 1;
    });
    
    return Array.from(treatmentMap.entries()).map(([name, data]: [string, any]) => ({
      treatmentName: name,
      revenue: data.revenue,
      count: data.count,
      averageValue: data.count > 0 ? data.revenue / data.count : 0,
      growth: Math.random() * 0.4 - 0.2 // Simulated growth
    })).sort((a, b) => b.revenue - a.revenue);
  }

  private calculatePatientSegments(patients: any[]): Array<{
    segment: string;
    count: number;
    percentage: number;
    averageValue: number;
  }> {
    const segments = [
      { name: 'High-Value', count: 0, totalValue: 0 },
      { name: 'Regular', count: 0, totalValue: 0 },
      { name: 'Occasional', count: 0, totalValue: 0 }
    ];
    
    patients.forEach(patient => {
      const totalSpent = patient.appointments.reduce((sum: number, apt: any) => sum + (apt.price || 0), 0);
      const visitCount = patient.appointments.length;
      
      if (totalSpent > 5000 && visitCount > 8) {
        if (segments[0]) segments[0].count++;
        if (segments[0]) segments[0].totalValue += totalSpent;
      } else if (totalSpent > 1000 && visitCount > 3) {
        if (segments[1]) segments[1].count++;
        if (segments[1]) segments[1].totalValue += totalSpent;
      } else {
        if (segments[2]) segments[2].count++;
        if (segments[2]) segments[2].totalValue += totalSpent;
      }
    });
    
    const totalPatients = patients.length;
    
    return segments.map(segment => ({
      segment: segment.name,
      count: segment.count,
      percentage: totalPatients > 0 ? (segment.count / totalPatients) * 100 : 0,
      averageValue: segment.count > 0 ? segment.totalValue / segment.count : 0
    }));
  }

  private getTopPatients(patients: any[]): Array<{
    patientId: string;
    patientName: string;
    totalSpent: number;
    visitCount: number;
    lastVisit: Date;
  }> {
    return patients
      .map(patient => {
        const totalSpent = patient.appointments.reduce((sum: number, apt: any) => sum + (apt.price || 0), 0);
        const visitCount = patient.appointments.length;
        const lastVisit = patient.appointments[0]?.dateTime || new Date();
        
        return {
          patientId: patient.id,
          patientName: `${patient.encryptedFirstName || 'Unknown'} ${patient.encryptedLastName || ''}`,
          totalSpent,
          visitCount,
          lastVisit
        };
      })
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);
  }

  private calculatePatientRetention(): {
    rate: number;
    trend: number;
    factors: string[];
  } {
    // Simulated retention calculation
    const retentionRate = 0.78 + Math.random() * 0.15; // 78-93%
    const trend = Math.random() * 0.1 - 0.05; // -5% to +5%
    
    const factors = [
      'High patient satisfaction scores',
      'Effective follow-up communication',
      'Quality treatment outcomes',
      'Convenient appointment scheduling'
    ];
    
    return {
      rate: Math.round(retentionRate * 100) / 100,
      trend: Math.round(trend * 100) / 100,
      factors
    };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; connections: number; cacheStatus: string }> {
    try {
      await this.redis.ping();
      await this.prisma.$queryRaw`SELECT 1`;
      
      return {
        status: 'healthy',
        connections: this.activeConnections.size,
        cacheStatus: 'operational'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        connections: this.activeConnections.size,
        cacheStatus: 'error'
      };
    }
  }
} 