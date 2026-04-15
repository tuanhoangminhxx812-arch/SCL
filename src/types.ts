export interface ProjectData {
  id: string;
  code: string;
  name: string;
  decision: string;
  content: string;
  schedule: string;
  year: string;
  estimatedValue: number;
  category: string;
  status: string;
  executedValue: number;
  settlementValue: number;
}

export interface SummaryData {
  totalEstimated: number;
  totalExecuted: number;
  totalSettlement: number;
  estimatedByCategory: Record<string, number>;
  executedByCategory: Record<string, number>;
  countByStatus: Record<string, number>;
  estimatedByStatus: Record<string, number>;
}
