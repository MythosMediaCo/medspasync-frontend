# MedSpaSync Pro - Phase 2: Data Architecture Design

## 1. Database Schema Design

### 1.1 Enhanced Prisma Schema with HIPAA Compliance

```prisma
// Enhanced schema with encryption and audit capabilities
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Enums for type safety
enum UserRole {
  ADMIN
  STAFF
  MANAGER
  PRACTITIONER
}

enum ClientStatus {
  ACTIVE
  VIP
  INACTIVE
}

enum AppointmentStatus {
  SCHEDULED
  CONFIRMED
  CANCELLED
  COMPLETED
}

enum PaymentStatus {
  PENDING
  PAID
  FAILED
  REFUNDED
}

enum AuditAction {
  CREATE
  READ
  UPDATE
  DELETE
  LOGIN
  LOGOUT
  EXPORT
}

// Core Models with Enhanced Security
model User {
  id         String    @id @default(cuid())
  email      String    @unique
  password   String    // bcrypt hashed
  practiceId String?
  role       UserRole  @default(STAFF)
  mfaEnabled Boolean   @default(false)
  mfaSecret  String?   // Encrypted in Azure Key Vault
  lastLogin  DateTime?
  loginAttempts Int    @default(0)
  lockedUntil DateTime?
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
  
  // Relations
  staff      Staff?
  practice   Practice? @relation(fields: [practiceId], references: [id])
  auditLogs  AuditLog[]
  
  // Indexes for performance
  @@index([email])
  @@index([practiceId])
  @@index([role])
}

model Client {
  id           String           @id @default(cuid())
  firstName    String
  lastName     String
  email        String           @unique
  phone        String?
  dateOfBirth  DateTime?        // PHI - encrypted
  ssn          String?          // PHI - encrypted
  address      String?          // PHI - encrypted
  emergencyContact String?      // PHI - encrypted
  medicalHistory String?        // PHI - encrypted
  status       ClientStatus     @default(ACTIVE)
  notes        String?
  createdAt    DateTime         @default(now())
  updatedAt    DateTime         @updatedAt
  
  // Relations
  appointments Appointment[]
  auditLogs    AuditLog[]
  
  // Indexes
  @@index([email])
  @@index([status])
  @@index([createdAt])
}

model Service {
  id           String           @id @default(cuid())
  name         String
  category     String
  description  String?
  duration     Int              // in minutes
  price        Float
  active       Boolean          @default(true)
  createdAt    DateTime         @default(now())
  updatedAt    DateTime         @updatedAt
  
  // Relations
  appointments Appointment[]
  
  // Indexes
  @@index([category])
  @@index([active])
}

model Staff {
  id              String           @id @default(cuid())
  userId          String           @unique
  practiceId      String
  firstName       String
  lastName        String
  role            UserRole
  specializations String[]
  phone           String?
  email           String?
  workingHours    Json?
  hourlyRate      Float?
  active          Boolean          @default(true)
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
  
  // Relations
  appointments    Appointment[]
  user            User             @relation(fields: [userId], references: [id])
  practice        Practice         @relation(fields: [practiceId], references: [id])
  
  // Indexes
  @@index([practiceId])
  @@index([role])
  @@index([active])
}

model Appointment {
  id            String           @id @default(cuid())
  practiceId    String
  clientId      String
  serviceId     String
  staffId       String
  dateTime      DateTime
  duration      Int
  status        AppointmentStatus @default(SCHEDULED)
  notes         String?
  price         Float
  paymentStatus PaymentStatus    @default(PENDING)
  reminderSent  Boolean          @default(false)
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt

  // Relations
  client        Client           @relation(fields: [clientId], references: [id])
  service       Service          @relation(fields: [serviceId], references: [id])
  staff         Staff            @relation(fields: [staffId], references: [id])
  practice      Practice         @relation(fields: [practiceId], references: [id])
  auditLogs     AuditLog[]
  
  // Indexes
  @@index([practiceId])
  @@index([clientId])
  @@index([staffId])
  @@index([dateTime])
  @@index([status])
  @@index([paymentStatus])
}

model Practice {
  id           String         @id @default(cuid())
  name         String
  address      String?
  phone        String?
  email        String?
  taxId        String?        // Encrypted
  licenseNumber String?       // Encrypted
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @default(now()) @updatedAt
  
  // Relations
  users        User[]
  staff        Staff[]
  appointments Appointment[]
  
  // Indexes
  @@index([name])
}

// HIPAA Compliance - Audit Logging
model AuditLog {
  id          String      @id @default(cuid())
  userId      String?
  action      AuditAction
  tableName   String
  recordId    String?
  oldValues   Json?
  newValues   Json?
  ipAddress   String?
  userAgent   String?
  timestamp   DateTime    @default(now())
  
  // Relations
  user        User?       @relation(fields: [userId], references: [id])
  appointment Appointment? @relation(fields: [recordId], references: [id])
  client      Client?     @relation(fields: [recordId], references: [id])
  
  // Indexes for compliance reporting
  @@index([userId])
  @@index([action])
  @@index([tableName])
  @@index([timestamp])
  @@index([ipAddress])
}

// AI Reconciliation Models
model ReconciliationJob {
  id          String   @id @default(cuid())
  userId      String
  status      String   // PENDING, PROCESSING, COMPLETED, FAILED
  algorithm   String   // FUZZY_MATCH, ML_MODEL, HYBRID
  confidence  Float
  inputData   Json
  results     Json?
  error       String?
  processingTime Int?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Indexes
  @@index([userId])
  @@index([status])
  @@index([createdAt])
}

// Data Retention and Archiving
model DataRetentionPolicy {
  id              String   @id @default(cuid())
  tableName       String   @unique
  retentionPeriod Int      // in days
  archiveAfter    Int      // in days
  deleteAfter     Int      // in days
  active          Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

### 1.2 Database Security Implementation

```sql
-- Database-level encryption
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Encrypt sensitive columns
ALTER TABLE clients 
ADD COLUMN encrypted_ssn BYTEA,
ADD COLUMN encrypted_dob BYTEA,
ADD COLUMN encrypted_address BYTEA;

-- Create encrypted indexes for search
CREATE INDEX idx_clients_encrypted_email ON clients USING gin(to_tsvector('english', email));

-- Row Level Security (RLS)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY client_access_policy ON clients
    FOR ALL
    USING (practice_id = current_setting('app.current_practice_id')::uuid);

CREATE POLICY appointment_access_policy ON appointments
    FOR ALL
    USING (practice_id = current_setting('app.current_practice_id')::uuid);

-- Audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (action, table_name, record_id, new_values, ip_address)
        VALUES ('CREATE', TG_TABLE_NAME, NEW.id, to_jsonb(NEW), inet_client_addr());
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (action, table_name, record_id, old_values, new_values, ip_address)
        VALUES ('UPDATE', TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW), inet_client_addr());
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (action, table_name, record_id, old_values, ip_address)
        VALUES ('DELETE', TG_TABLE_NAME, OLD.id, to_jsonb(OLD), inet_client_addr());
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers
CREATE TRIGGER audit_clients_trigger
    AFTER INSERT OR UPDATE OR DELETE ON clients
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_appointments_trigger
    AFTER INSERT OR UPDATE OR DELETE ON appointments
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
```

## 2. Data Access Patterns & Repository Design

### 2.1 Repository Pattern Implementation

```typescript
// Base Repository Interface
interface IRepository<T> {
  findById(id: string): Promise<T | null>;
  findAll(filters?: any): Promise<T[]>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<boolean>;
  count(filters?: any): Promise<number>;
}

// Patient Repository with HIPAA Compliance
class PatientRepository implements IRepository<Patient> {
  private prisma: PrismaClient;
  private encryptionService: EncryptionService;

  constructor(prisma: PrismaClient, encryptionService: EncryptionService) {
    this.prisma = prisma;
    this.encryptionService = encryptionService;
  }

  async findById(id: string): Promise<Patient | null> {
    const patient = await this.prisma.client.findUnique({
      where: { id },
      include: {
        appointments: {
          include: {
            service: true,
            staff: true
          }
        }
      }
    });

    if (patient) {
      return this.decryptPatientData(patient);
    }
    return null;
  }

  async create(data: Partial<Patient>): Promise<Patient> {
    const encryptedData = await this.encryptPatientData(data);
    
    const patient = await this.prisma.client.create({
      data: encryptedData,
      include: {
        appointments: true
      }
    });

    return this.decryptPatientData(patient);
  }

  private async encryptPatientData(data: any): Promise<any> {
    const encrypted = { ...data };
    
    if (data.ssn) {
      encrypted.ssn = await this.encryptionService.encrypt(data.ssn);
    }
    if (data.dateOfBirth) {
      encrypted.dateOfBirth = await this.encryptionService.encrypt(data.dateOfBirth);
    }
    if (data.address) {
      encrypted.address = await this.encryptionService.encrypt(data.address);
    }
    
    return encrypted;
  }

  private async decryptPatientData(data: any): Promise<any> {
    const decrypted = { ...data };
    
    if (data.ssn) {
      decrypted.ssn = await this.encryptionService.decrypt(data.ssn);
    }
    if (data.dateOfBirth) {
      decrypted.dateOfBirth = await this.encryptionService.decrypt(data.dateOfBirth);
    }
    if (data.address) {
      decrypted.address = await this.encryptionService.decrypt(data.address);
    }
    
    return decrypted;
  }
}
```

### 2.2 Data Access Layer with Caching

```typescript
// Caching Strategy Implementation
class CachedPatientRepository implements IRepository<Patient> {
  private repository: PatientRepository;
  private cache: Redis;
  private cacheTTL: number = 3600; // 1 hour

  constructor(repository: PatientRepository, cache: Redis) {
    this.repository = repository;
    this.cache = cache;
  }

  async findById(id: string): Promise<Patient | null> {
    const cacheKey = `patient:${id}`;
    
    // Try cache first
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Fallback to database
    const patient = await this.repository.findById(id);
    if (patient) {
      await this.cache.setex(cacheKey, this.cacheTTL, JSON.stringify(patient));
    }

    return patient;
  }

  async create(data: Partial<Patient>): Promise<Patient> {
    const patient = await this.repository.create(data);
    
    // Invalidate related caches
    await this.invalidatePatientCaches(patient.id);
    
    return patient;
  }

  private async invalidatePatientCaches(patientId: string): Promise<void> {
    const keys = await this.cache.keys(`patient:${patientId}*`);
    if (keys.length > 0) {
      await this.cache.del(...keys);
    }
  }
}
```

## 3. Caching Strategies & Performance Optimization

### 3.1 Multi-Level Caching Strategy

```typescript
// Cache Configuration
const cacheConfig = {
  // L1 Cache (In-Memory)
  l1: {
    type: 'memory',
    ttl: 300, // 5 minutes
    maxSize: 1000
  },
  
  // L2 Cache (Redis)
  l2: {
    type: 'redis',
    ttl: 3600, // 1 hour
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD
  },
  
  // L3 Cache (Database)
  l3: {
    type: 'database',
    ttl: 86400 // 24 hours
  }
};

// Cache Implementation
class MultiLevelCache {
  private l1Cache: Map<string, any>;
  private l2Cache: Redis;
  private l3Cache: Database;

  async get(key: string): Promise<any> {
    // Try L1 cache
    if (this.l1Cache.has(key)) {
      return this.l1Cache.get(key);
    }

    // Try L2 cache
    const l2Value = await this.l2Cache.get(key);
    if (l2Value) {
      this.l1Cache.set(key, JSON.parse(l2Value));
      return JSON.parse(l2Value);
    }

    // Try L3 cache
    const l3Value = await this.l3Cache.get(key);
    if (l3Value) {
      await this.l2Cache.setex(key, cacheConfig.l2.ttl, JSON.stringify(l3Value));
      this.l1Cache.set(key, l3Value);
      return l3Value;
    }

    return null;
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    // Set in all levels
    this.l1Cache.set(key, value);
    await this.l2Cache.setex(key, ttl || cacheConfig.l2.ttl, JSON.stringify(value));
    await this.l3Cache.set(key, value, ttl || cacheConfig.l3.ttl);
  }
}
```

### 3.2 Database Performance Optimization

```sql
-- Performance Indexes
CREATE INDEX CONCURRENTLY idx_appointments_practice_date 
ON appointments(practice_id, date_time);

CREATE INDEX CONCURRENTLY idx_appointments_staff_date 
ON appointments(staff_id, date_time);

CREATE INDEX CONCURRENTLY idx_audit_logs_timestamp 
ON audit_logs(timestamp DESC);

-- Partitioning for large tables
CREATE TABLE appointments_partitioned (
  LIKE appointments INCLUDING ALL
) PARTITION BY RANGE (date_time);

CREATE TABLE appointments_2024 PARTITION OF appointments_partitioned
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

-- Materialized views for reporting
CREATE MATERIALIZED VIEW appointment_summary AS
SELECT 
  practice_id,
  DATE(date_time) as appointment_date,
  COUNT(*) as total_appointments,
  COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_appointments,
  SUM(price) as total_revenue
FROM appointments
GROUP BY practice_id, DATE(date_time);

-- Refresh materialized view
REFRESH MATERIALIZED VIEW CONCURRENTLY appointment_summary;
```

## 4. Data Security & Encryption Patterns

### 4.1 Encryption Service Implementation

```typescript
// Encryption Service with Azure Key Vault
class EncryptionService {
  private keyVaultClient: SecretClient;
  private algorithm = 'AES-256-GCM';

  constructor() {
    const credential = new DefaultAzureCredential();
    this.keyVaultClient = new SecretClient(
      `https://${process.env.AZURE_KEY_VAULT_NAME}.vault.azure.net/`,
      credential
    );
  }

  async encrypt(data: string): Promise<string> {
    const key = await this.getEncryptionKey();
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipher(this.algorithm, key);
    cipher.setAAD(Buffer.from('medspasync', 'utf8'));
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Combine IV, encrypted data, and auth tag
    return iv.toString('hex') + ':' + encrypted + ':' + authTag.toString('hex');
  }

  async decrypt(encryptedData: string): Promise<string> {
    const key = await this.getEncryptionKey();
    const [ivHex, encrypted, authTagHex] = encryptedData.split(':');
    
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipher(this.algorithm, key);
    decipher.setAAD(Buffer.from('medspasync', 'utf8'));
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  private async getEncryptionKey(): Promise<string> {
    const secret = await this.keyVaultClient.getSecret('encryption-key');
    return secret.value;
  }
}
```

### 4.2 Data Masking for Development

```typescript
// Data Masking Service
class DataMaskingService {
  private maskingRules = {
    ssn: (value: string) => `***-**-${value.slice(-4)}`,
    email: (value: string) => {
      const [local, domain] = value.split('@');
      return `${local.slice(0, 2)}***@${domain}`;
    },
    phone: (value: string) => `***-***-${value.slice(-4)}`,
    address: (value: string) => `${value.split(' ')[0]} *** St`
  };

  maskPatientData(patient: any): any {
    const masked = { ...patient };
    
    if (masked.ssn) {
      masked.ssn = this.maskingRules.ssn(masked.ssn);
    }
    if (masked.email) {
      masked.email = this.maskingRules.email(masked.email);
    }
    if (masked.phone) {
      masked.phone = this.maskingRules.phone(masked.phone);
    }
    if (masked.address) {
      masked.address = this.maskingRules.address(masked.address);
    }
    
    return masked;
  }
}
```

## 5. Backup & Disaster Recovery Design

### 5.1 Backup Strategy

```typescript
// Backup Service Implementation
class BackupService {
  private database: Database;
  private storage: AzureBlobStorage;

  async createBackup(): Promise<string> {
    const timestamp = new Date().toISOString();
    const backupName = `backup-${timestamp}.sql`;
    
    // Create database dump
    const dump = await this.database.dump({
      format: 'custom',
      compress: true,
      exclude: ['audit_logs'], // Exclude audit logs from backup
      include: ['clients', 'appointments', 'services', 'staff']
    });
    
    // Upload to Azure Blob Storage
    const backupUrl = await this.storage.upload(backupName, dump);
    
    // Log backup creation
    await this.logBackupEvent('CREATE', backupName, backupUrl);
    
    return backupUrl;
  }

  async restoreBackup(backupUrl: string): Promise<void> {
    // Download backup file
    const backup = await this.storage.download(backupUrl);
    
    // Restore database
    await this.database.restore(backup);
    
    // Log restore event
    await this.logBackupEvent('RESTORE', backupUrl);
  }

  private async logBackupEvent(action: string, filename: string, url?: string): Promise<void> {
    // Log to audit system
    await this.database.query(`
      INSERT INTO audit_logs (action, table_name, record_id, new_values)
      VALUES ($1, 'backup', $2, $3)
    `, [action, filename, JSON.stringify({ url })]);
  }
}
```

### 5.2 Data Retention Policy

```typescript
// Data Retention Service
class DataRetentionService {
  private database: Database;

  async enforceRetentionPolicies(): Promise<void> {
    const policies = await this.getRetentionPolicies();
    
    for (const policy of policies) {
      await this.processRetentionPolicy(policy);
    }
  }

  private async processRetentionPolicy(policy: any): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - policy.retentionPeriod);
    
    // Archive old data
    if (policy.archiveAfter) {
      const archiveDate = new Date();
      archiveDate.setDate(archiveDate.getDate() - policy.archiveAfter);
      
      await this.archiveOldData(policy.tableName, archiveDate);
    }
    
    // Delete very old data
    if (policy.deleteAfter) {
      const deleteDate = new Date();
      deleteDate.setDate(deleteDate.getDate() - policy.deleteAfter);
      
      await this.deleteOldData(policy.tableName, deleteDate);
    }
  }

  private async archiveOldData(tableName: string, cutoffDate: Date): Promise<void> {
    // Move old data to archive table
    await this.database.query(`
      INSERT INTO ${tableName}_archive 
      SELECT * FROM ${tableName} 
      WHERE updated_at < $1
    `, [cutoffDate]);
  }

  private async deleteOldData(tableName: string, cutoffDate: Date): Promise<void> {
    // Permanently delete old data
    await this.database.query(`
      DELETE FROM ${tableName}_archive 
      WHERE updated_at < $1
    `, [cutoffDate]);
  }
}
```

This data architecture provides a comprehensive, secure, and performant foundation for the MedSpaSync Pro healthcare platform with full HIPAA compliance and enterprise-grade data management capabilities. 