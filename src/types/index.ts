export interface CalculationResult {
  mvar: number;
  isValid: boolean;
  error?: string;
}

export interface InputValues {
  mw: string;
  mva: string;
  today33?: string;
  previous33?: string;
  today132?: string;
  previous132?: string;
}

export interface ConsumptionInputs {
  today33: string;
  previous33: string;
  today132: string;
  previous132: string;
  adjustment: 'Auto' | 'Equal' | '100' | '200' | '300' | '400' | '500';
}

export interface ConsumptionResults {
  diff33: number;
  net33: number;
  today132_adj: number;
  diff132: number;
  net132: number;
  displayedDifference: number;
  isValid: boolean;
  error?: string;
}

export type Theme = 'default' | 'light' | 'dark';

export type NumpadType = 'mw' | 'mva' | 'today33' | 'previous33' | 'today132' | 'previous132' | null;

export type InputFieldType = keyof InputValues | keyof ConsumptionInputs;

export interface AuditLog {
  timestamp: string;
  today132_adj: number;
  adjustment: string;
  originalToday132: number;
  net33: number;
  net132: number;
}