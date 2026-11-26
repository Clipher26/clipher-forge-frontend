export interface TickerData {
  symbol: string;
  lastPrice: string;
  prevPrice24h: string;
  turnover24h: string;
  volume24h: string;
  highPrice24h: string;
  lowPrice24h: string;
}

export interface CryptoCardProps {
  ticker: TickerData;
}

export interface ApiResponse {
  success: boolean;
  data: TickerData[];
  timestamp: number;
}

export interface WithdrawRecord {
  id: string;
  status: 'Processing' | 'Successful' | 'Failed';
  amount: string;
  time: string;
}

export interface TransactionRecord {
  id: string;
  category: string;
  amount: string | number;
  time?: string;
  createdAt?: string;
  type: 'credit' | 'debit';
  status?: string;
}

export interface TradeRecord {
  id: string;
  symbol: string;
  direction: 'CALL' | 'PUT';
  amount: number;
  entryPrice: string;
  status: 'Settled' | 'Pending' | 'Lost';
  time?: string;
  createdAt?: string;
  timestamp?: number;
}

export interface SignalRecord {
  id: string;
  symbol: string;
  direction: 'CALL' | 'PUT';
  entryPrice: string;
  targetPrice: string;
  stopLoss: string;
  confidence: string;
  analysis: string;
  period: string;
  yield: string;
  timestamp: number;
  time: string;
  isActive?: boolean;
  expiresAt?: string;
  createdAt?: string;
  createdBy?: string;
  signalSource?: string;
}

export interface OtpRequest {
  phone: string;
  email: string;
  code: string | null;
  timestamp: number;
}

export interface WithdrawalAuthRequest {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  code: string | null;
  timestamp: number;
}

export interface NotificationRecord {
  id: string;
  userId: string;
  senderId?: string | null;
  title: string;
  message: string;
  type: 'message' | 'withdrawal_rejected' | 'withdrawal_success' | 'deposit_success' | 'system';
  isRead: boolean;
  metadata?: string | null;
  createdAt?: string;
  time?: string;
}

export interface User {
  id: string;
  name: string;
  type: string;
  role: string;
  balance: number;
  frozenBalance?: number;   // locked by VIP purchases — cannot trade or withdraw
  unlockBalance?: number;   // daily VIP earnings — used for withdrawals
  totalRecharge: number;
  totalWithdraw: number;
  referralCount: number;
  rechargedReferrals: number;
  invitationCode: string;
  salaryClaimed?: boolean;
  salaryStatus?: 'Pending' | 'Approved' | 'Terminated';
  welcomeBonusClaimed?: boolean;
  isWithdrawalBlocked?: boolean;
  isTradingBlocked?: boolean;
  isRechargeBlocked?: boolean;
  withdrawalMethod?: string;
  withdrawalPin?: string;   // hashed withdrawal PIN (sha256)
  isAdmin?: boolean;
  adminRole?: 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR' | 'SUPPORT';
  // VIP approval gate: false => only VIP1 purchasable until admin approves higher tiers
  vipApproved?: boolean;
  // Anti-fraud fields
  isValidated?: boolean;
  validationType?: string;
  idNumber?: string;
  deviceInfo?: string;
  phone?: string;
  email?: string;
  password?: string;
}

export interface VipTier {
  id: string;
  level: number;
  name: string;
  price: string;
  dailyEarning: string;
  image?: string;
  isActive?: boolean;
}

export interface Investment {
  id: string;
  userId: string;
  tierId: string;
  tierLevel: number;
  tierName: string;
  price: string;
  dailyEarning: string;
  status: 'Active' | 'Cancelled' | 'Expired';
  frozenAt?: string;
  lastPayout?: string;
  nextPayoutAt?: string | null;
  expiresAt?: string;
  isActive?: boolean;
  totalEarned?: string;
  createdAt?: string;
}