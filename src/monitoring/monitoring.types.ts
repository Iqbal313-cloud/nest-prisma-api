export interface MonitoringSummary {
  database: {
    name: string;
    size: string;
  };

  connections: {
    total: number;
    active: number;
    idle: number;
  };

  queries: {
    totalCalls: number;
    totalExecutionTimeMs: number;
    averageExecutionTimeMs: number;
  };

  generatedAt: string;
}
