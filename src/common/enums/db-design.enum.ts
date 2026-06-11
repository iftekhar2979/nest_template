export enum DepartmentType {
  SALES = 'sales',
  OPERATIONS = 'operations',
}

export enum BillingType {
  ONE_TIME = 'one_time',
  MONTHLY_RECURRING = 'monthly_recurring',
  HYBRID = 'hybrid',
}

export enum SubscriptionInterval {
  ONE_TIME = 'one_time',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  PAST_DUE = 'past_due',
  TRIALING = 'trialing',
  PAUSED = 'paused',
}

export enum ProjectStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  ON_HOLD = 'on_hold',
  COMPLETE = 'complete',
}

export enum MessageChannel {
  SALES_CLIENT = 'sales_client',
  INTERNAL_PROJECT = 'internal_project',
  GENERAL_DM = 'general_dm',
}

export enum BookingStatus {
  REQUESTED = 'requested',
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export enum AnalyticsPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

export enum OfferStatus {
  PENDING = 'pending',
  PAYMENT_PROCESSING = 'payment_processing',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  EXPIRED = 'expired',
}

export enum PaymentSourceType {
  CUSTOM_OFFER = 'custom_offer',
  SUBSCRIPTION_PLAN = 'subscription_plan',
}

export enum TransactionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
}

export enum ProjectMemberRole {
  OPERATION_LEADER = 'operation_leader',
  SALES_LEADER = 'sales_leader',
  SALES_MEMBER = 'sales_member',
  OPERATION_MEMBER = 'operation_member',
  HTO = 'hto',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}
