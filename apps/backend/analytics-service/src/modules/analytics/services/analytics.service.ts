import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@omnicommerce/database';

export interface TelemetryMetricDto {
  eventType: string;
  sourceService: string;
  timestamp?: string;
  payload: Record<string, any>;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  // In-memory aggregations for hyper-table simulations & fallback metrics
  private rawEvents: Array<{ id: string; eventType: string; source: string; payload: any; timestamp: Date }> = [];
  private orderMetrics = {
    totalPlacedCount: 0,
    totalPlacedGmv: 0,
    totalPaidCount: 0,
    netRevenue: 0,
    cancelledRefundedAmount: 0,
  };
  private uniqueVisitors = new Set<string>();
  private customerCount = 0;
  private productCount = 0;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * ANL-UC-01 & ANL-UC-05 & ANL-BR-07: Ingest telemetry & scrub PII
   */
  async ingestMetric(data: TelemetryMetricDto): Promise<any> {
    const scrubbedPayload = this.scrubPii(data.payload || {});
    const record = {
      id: `metric_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      eventType: data.eventType,
      source: data.sourceService || 'system',
      payload: scrubbedPayload,
      timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
    };

    this.rawEvents.push(record);
    this.logger.log(`[ANL-UC-01] Metric ingested: ${data.eventType} from ${record.source}`);

    // Process event-specific aggregation side-effects
    this.processEventAggregation(data.eventType, scrubbedPayload);

    return { ingested: true, id: record.id };
  }

  /**
   * ANL-UC-02 & ANL-BR-03: Compute Gross Merchandise Value (GMV)
   * GMV = SUM(Total Amount of All Placed Orders)
   */
  async getGmv(startDate?: string, endDate?: string): Promise<any> {
    let filteredEvents = this.rawEvents.filter((e) => e.eventType === 'order.created');
    if (startDate) {
      filteredEvents = filteredEvents.filter((e) => e.timestamp >= new Date(startDate));
    }
    if (endDate) {
      filteredEvents = filteredEvents.filter((e) => e.timestamp <= new Date(endDate));
    }

    const calculatedGmv = filteredEvents.reduce((acc, curr) => acc + (Number(curr.payload.totalAmount) || 0), 0);
    const totalGmv = calculatedGmv || this.orderMetrics.totalPlacedGmv;

    return {
      metric: 'Gross Merchandise Value (GMV)',
      gmv: Number(totalGmv.toFixed(2)),
      currency: 'USD',
      totalPlacedOrders: filteredEvents.length || this.orderMetrics.totalPlacedCount,
    };
  }

  /**
   * ANL-UC-03 & ANL-BR-04 & ANL-BR-05: Compute Net Revenue, Seller Earnings, & AOV
   * Net Revenue = SUM(Paid Orders) - SUM(Cancelled/Refunded Amounts)
   * AOV = Net Revenue / Total Paid Orders Count
   */
  async getNetRevenue(startDate?: string, endDate?: string): Promise<any> {
    let paidEvents = this.rawEvents.filter((e) => e.eventType === 'order.paid' || e.eventType === 'payment.completed');
    let cancelledEvents = this.rawEvents.filter((e) => e.eventType === 'order.cancelled' || e.eventType === 'payment.refunded');

    if (startDate) {
      const start = new Date(startDate);
      paidEvents = paidEvents.filter((e) => e.timestamp >= start);
      cancelledEvents = cancelledEvents.filter((e) => e.timestamp >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      paidEvents = paidEvents.filter((e) => e.timestamp <= end);
      cancelledEvents = cancelledEvents.filter((e) => e.timestamp <= end);
    }

    const grossPaid = paidEvents.reduce((acc, curr) => acc + (Number(curr.payload.amount || curr.payload.totalAmount) || 0), 0);
    const totalRefunded = cancelledEvents.reduce((acc, curr) => acc + (Number(curr.payload.amount || curr.payload.totalAmount) || 0), 0);

    const netRevenue = (grossPaid || this.orderMetrics.netRevenue) - totalRefunded;
    const paidCount = paidEvents.length || this.orderMetrics.totalPaidCount || 1;
    const aov = netRevenue > 0 ? netRevenue / paidCount : 0;

    return {
      metric: 'Net Revenue & Financial Summary',
      grossPaid: Number(grossPaid.toFixed(2)),
      totalRefunded: Number(totalRefunded.toFixed(2)),
      netRevenue: Number(netRevenue.toFixed(2)),
      aov: Number(aov.toFixed(2)),
      sellerEarnings: Number((netRevenue * 0.85).toFixed(2)), // 85% payout to merchants
      platformCommission: Number((netRevenue * 0.15).toFixed(2)), // 15% platform commission
      currency: 'USD',
    };
  }

  /**
   * ANL-UC-04 & ANL-BR-06: Calculate Conversion Rate & Funnel
   * Conversion Rate = (Total Placed Orders / Unique Visitor Sessions) * 100
   */
  async getConversionRate(): Promise<any> {
    const totalVisitors = Math.max(this.uniqueVisitors.size, 100); // Default baseline visitor count
    const totalOrders = this.orderMetrics.totalPlacedCount;
    const conversionRate = (totalOrders / totalVisitors) * 100;

    return {
      metric: 'Storefront Conversion Rate & Funnel',
      uniqueVisitors: totalVisitors,
      totalOrdersPlaced: totalOrders,
      totalOrdersPaid: this.orderMetrics.totalPaidCount,
      conversionRatePercentage: Number(conversionRate.toFixed(2)),
    };
  }

  /**
   * Comprehensive Dashboard Metrics Summary
   */
  async getDashboardSummary(): Promise<any> {
    const gmvData = await this.getGmv();
    const revenueData = await this.getNetRevenue();
    const conversionData = await this.getConversionRate();

    return {
      gmv: gmvData.gmv,
      netRevenue: revenueData.netRevenue,
      aov: revenueData.aov,
      conversionRatePercentage: conversionData.conversionRatePercentage,
      totalCustomers: this.customerCount,
      totalActiveProducts: this.productCount,
      totalEventsProcessed: this.rawEvents.length,
    };
  }

  /**
   * ANL-BR-07: Scrub PII (Personally Identifiable Information) from Telemetry Payloads
   */
  private scrubPii(payload: Record<string, any>): Record<string, any> {
    const sanitized = { ...payload };
    const piiFields = ['email', 'firstName', 'lastName', 'phone', 'phoneNumber', 'recipientName', 'streetAddress', 'password', 'creditCard'];

    for (const field of piiFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * ANL-BR-09 through ANL-BR-13: Event-Driven Processing Side-Effects
   */
  private processEventAggregation(eventType: string, payload: Record<string, any>): void {
    if (payload.visitorId || payload.sessionId) {
      this.uniqueVisitors.add(payload.visitorId || payload.sessionId);
    }

    switch (eventType) {
      case 'order.created': // ANL-BR-09
        this.orderMetrics.totalPlacedCount += 1;
        this.orderMetrics.totalPlacedGmv += Number(payload.totalAmount) || 0;
        break;
      case 'order.paid': // ANL-BR-10
      case 'payment.completed':
        this.orderMetrics.totalPaidCount += 1;
        this.orderMetrics.netRevenue += Number(payload.amount || payload.totalAmount) || 0;
        break;
      case 'order.cancelled': // ANL-BR-11
      case 'payment.refunded':
        this.orderMetrics.cancelledRefundedAmount += Number(payload.amount || payload.totalAmount) || 0;
        break;
      case 'user.registered': // ANL-BR-12
      case 'auth.user.registered':
        this.customerCount += 1;
        break;
      case 'product.created': // ANL-BR-13
        this.productCount += 1;
        break;
    }
  }
}
