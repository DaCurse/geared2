/**
 * Deposit.ts
 * Represents a finite resource deposit that can be extracted from.
 */

export interface DepositDefinition {
  id: string;
  resourceType: string;
  totalAmount: number;
  yieldRate: number; // Base extraction rate multiplier (e.g., 1.0 = normal, 0.5 = poor, 2.0 = rich)
}

export interface DepositData {
  id: string;
  resourceType: string;
  totalAmount: number;
  remainingAmount: number;
  yieldRate: number;
  discovered: boolean;
}

export class Deposit {
  id: string;
  resourceType: string;
  totalAmount: number;
  remainingAmount: number;
  yieldRate: number;
  discovered: boolean;

  constructor(
    id: string,
    resourceType: string,
    totalAmount: number,
    yieldRate: number = 1.0
  ) {
    this.id = id;
    this.resourceType = resourceType;
    this.totalAmount = totalAmount;
    this.remainingAmount = totalAmount;
    this.yieldRate = yieldRate;
    this.discovered = true; // Start discovered for now
  }

  /**
   * Extract resources from this deposit.
   * @param requestedAmount - Amount requested to extract
   * @returns Amount actually extracted (limited by remaining amount)
   */
  extract(requestedAmount: number): number {
    if (!this.discovered || this.remainingAmount <= 0) {
      return 0;
    }

    const extracted = Math.min(requestedAmount, this.remainingAmount);
    this.remainingAmount -= extracted;
    return extracted;
  }

  /**
   * Check if the deposit is depleted.
   */
  isDepleted(): boolean {
    return this.remainingAmount <= 0;
  }

  /**
   * Get percentage of resources remaining.
   */
  getPercentageRemaining(): number {
    return (this.remainingAmount / this.totalAmount) * 100;
  }

  /**
   * Discover this deposit (make it available for extraction).
   */
  discover(): void {
    this.discovered = true;
  }

  serialize(): DepositData {
    return {
      id: this.id,
      resourceType: this.resourceType,
      totalAmount: this.totalAmount,
      remainingAmount: this.remainingAmount,
      yieldRate: this.yieldRate,
      discovered: this.discovered,
    };
  }

  static deserialize(data: DepositData): Deposit {
    const deposit = new Deposit(
      data.id,
      data.resourceType,
      data.totalAmount,
      data.yieldRate
    );
    deposit.remainingAmount = data.remainingAmount;
    deposit.discovered = data.discovered;
    return deposit;
  }
}
