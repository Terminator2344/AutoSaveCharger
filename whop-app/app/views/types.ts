export type Company = {
  id: string;
  title?: string;
  [key: string]: unknown;
};

export type User = {
  id: string;
  name?: string | null;
  username?: string | null;
  email?: string | null;
  image_url?: string | null;
  [key: string]: unknown;
};

export type Access = {
  has_access: boolean;
  [key: string]: unknown;
};

export interface DashboardViewProps {
  company: Company | null;
  user: User | null;
  access: Access | null;
  from?: string;
  to?: string;
  failed?: number;
  recoveredTotal?: number;
  recoveredByClick?: number;
  recoveredByWindow?: number;
  recoveryRate?: string;
  topChannel?: string;
  revenueCents?: number;
  clicksCount?: number;
  clickWindowRatio?: string;
  timeToRecover?: string | null;
  lostRevenue?: string;
  topConversionChannel?: string;
  topConversionRate?: string;
  revenueByDay?: Record<string, number>;
  channelRecoveries?: { channel: string; _count: number }[];
  channelClicks?: { channel: string; _count: number }[];
}

