export interface CrmSalesActivityRecord {
  id: string;
  activityNumber: string;
  activityType: string;
  customerName: string;
  subject: string;
  owner: string;
  dueAt: string;
  linkedReference: string;
  status: string;
}

export interface CustomerProfitabilityRecord {
  id: string;
  customerCode: string;
  customerName: string;
  segment: string;
  revenue: number;
  grossMarginPercent: number;
  outstandingAmount: number;
  openTickets: number;
  status: string;
}

export interface VendorPerformanceRecord {
  id: string;
  vendorCode: string;
  vendorName: string;
  category: string;
  performanceScore: number;
  onTimeDeliveryPercent: number;
  qualityAcceptancePercent: number;
  averageLeadTimeDays: number;
  status: string;
}

export interface SupplierDeliveryRecord {
  id: string;
  deliveryNumber: string;
  vendorName: string;
  poNumber: string;
  material: string;
  expectedAt: string;
  delayedDays: number;
  value: number;
  status: string;
}

export interface PurchaseHistoryRecord {
  id: string;
  poNumber: string;
  vendorName: string;
  category: string;
  orderedAt: string;
  amount: number;
  receiptStatus: string;
  invoiceStatus: string;
}

export interface VendorComplianceDocument {
  id: string;
  documentNumber: string;
  vendorName: string;
  documentType: string;
  validUntil: string;
  ownerRole: string;
  status: string;
}

export interface RelationshipEnterpriseDemoData {
  crmActivities: CrmSalesActivityRecord[];
  customerProfitability: CustomerProfitabilityRecord[];
  vendorPerformance: VendorPerformanceRecord[];
  supplierDeliveries: SupplierDeliveryRecord[];
  purchaseHistory: PurchaseHistoryRecord[];
  vendorDocuments: VendorComplianceDocument[];
}

const relationshipEnterpriseDemoData: RelationshipEnterpriseDemoData = {
  crmActivities: [
    {
      id: "crm-act-001",
      activityNumber: "ACT-260531-041",
      activityType: "CUSTOMER_MEETING",
      customerName: "Northstar Retail",
      subject: "Finance operations expansion commercial review",
      owner: "Ananya Desai",
      dueAt: "2026-06-01T11:00:00+05:30",
      linkedReference: "CRM-OPP-2401",
      status: "SCHEDULED",
    },
    {
      id: "crm-act-002",
      activityNumber: "ACT-260531-040",
      activityType: "COLLECTION_FOLLOW_UP",
      customerName: "Apex Distribution",
      subject: "Resolve milestone acceptance dispute and collection block",
      owner: "Vikram Rao",
      dueAt: "2026-05-31T16:30:00+05:30",
      linkedReference: "SUP-CUST-5102",
      status: "ATTENTION",
    },
    {
      id: "crm-act-003",
      activityNumber: "ACT-260531-039",
      activityType: "PROPOSAL_SUBMISSION",
      customerName: "Orion Foods",
      subject: "Submit plant automation commercial proposal",
      owner: "Ananya Desai",
      dueAt: "2026-06-02T14:00:00+05:30",
      linkedReference: "CRM-LEAD-1001",
      status: "IN_PROGRESS",
    },
    {
      id: "crm-act-004",
      activityNumber: "ACT-260531-038",
      activityType: "DISCOVERY_CALL",
      customerName: "Kaveri Exports",
      subject: "Review export compliance workflow requirements",
      owner: "Rohan Mehta",
      dueAt: "2026-06-03T10:30:00+05:30",
      linkedReference: "CRM-LEAD-1003",
      status: "SCHEDULED",
    },
  ],
  customerProfitability: [
    {
      id: "profit-001",
      customerCode: "CUST-NORTHSTAR",
      customerName: "Northstar Retail",
      segment: "Enterprise",
      revenue: 8420000,
      grossMarginPercent: 28.4,
      outstandingAmount: 940000,
      openTickets: 1,
      status: "HEALTHY",
    },
    {
      id: "profit-002",
      customerCode: "CUST-APEX",
      customerName: "Apex Distribution",
      segment: "Strategic",
      revenue: 6180000,
      grossMarginPercent: 17.8,
      outstandingAmount: 1260000,
      openTickets: 1,
      status: "MARGIN_WATCH",
    },
    {
      id: "profit-003",
      customerCode: "CUST-METROFAB",
      customerName: "Metro Fabricators",
      segment: "Growth",
      revenue: 3560000,
      grossMarginPercent: 24.6,
      outstandingAmount: 410000,
      openTickets: 0,
      status: "HEALTHY",
    },
  ],
  vendorPerformance: [
    {
      id: "vendor-score-001",
      vendorCode: "VEN-TECHNOVA",
      vendorName: "TechNova Systems",
      category: "IT hardware",
      performanceScore: 92,
      onTimeDeliveryPercent: 96,
      qualityAcceptancePercent: 98,
      averageLeadTimeDays: 9,
      status: "PREFERRED",
    },
    {
      id: "vendor-score-002",
      vendorCode: "VEN-SHAKTI",
      vendorName: "Shakti Industrial Supplies",
      category: "Industrial supplies",
      performanceScore: 74,
      onTimeDeliveryPercent: 82,
      qualityAcceptancePercent: 91,
      averageLeadTimeDays: 14,
      status: "WATCH",
    },
    {
      id: "vendor-score-003",
      vendorCode: "VEN-GREENLINE",
      vendorName: "Greenline Logistics",
      category: "Logistics",
      performanceScore: 61,
      onTimeDeliveryPercent: 76,
      qualityAcceptancePercent: 94,
      averageLeadTimeDays: 6,
      status: "RISK_REVIEW",
    },
  ],
  supplierDeliveries: [
    {
      id: "delivery-001",
      deliveryNumber: "ASN-260531-118",
      vendorName: "Shakti Industrial Supplies",
      poNumber: "PO-45091",
      material: "Servo Motor Kit 750W",
      expectedAt: "2026-05-31T10:00:00+05:30",
      delayedDays: 1,
      value: 1152000,
      status: "DELAYED",
    },
    {
      id: "delivery-002",
      deliveryNumber: "ASN-260530-117",
      vendorName: "Greenline Logistics",
      poNumber: "PO-45087",
      material: "Export dispatch lane allocation",
      expectedAt: "2026-05-30T15:00:00+05:30",
      delayedDays: 2,
      value: 286000,
      status: "COMPLIANCE_BLOCK",
    },
    {
      id: "delivery-003",
      deliveryNumber: "ASN-260531-116",
      vendorName: "TechNova Systems",
      poNumber: "PO-45088",
      material: "PLC Controller 24 I/O",
      expectedAt: "2026-06-01T12:00:00+05:30",
      delayedDays: 0,
      value: 1024000,
      status: "ON_TRACK",
    },
  ],
  purchaseHistory: [
    {
      id: "purchase-001",
      poNumber: "PO-45091",
      vendorName: "Shakti Industrial Supplies",
      category: "Motion control",
      orderedAt: "2026-05-24T10:30:00+05:30",
      amount: 1152000,
      receiptStatus: "DELAYED",
      invoiceStatus: "PENDING",
    },
    {
      id: "purchase-002",
      poNumber: "PO-45088",
      vendorName: "TechNova Systems",
      category: "Automation",
      orderedAt: "2026-05-23T11:00:00+05:30",
      amount: 1024000,
      receiptStatus: "QUALITY_HOLD",
      invoiceStatus: "BLOCKED",
    },
    {
      id: "purchase-003",
      poNumber: "PO-45079",
      vendorName: "Shakti Industrial Supplies",
      category: "Packaging",
      orderedAt: "2026-05-20T09:15:00+05:30",
      amount: 259000,
      receiptStatus: "RECEIVED",
      invoiceStatus: "MATCHED",
    },
    {
      id: "purchase-004",
      poNumber: "PO-45073",
      vendorName: "TechNova Systems",
      category: "Motion control",
      orderedAt: "2026-05-18T14:20:00+05:30",
      amount: 1152000,
      receiptStatus: "RECEIVED",
      invoiceStatus: "MATCHED",
    },
  ],
  vendorDocuments: [
    {
      id: "vendor-doc-001",
      documentNumber: "DOC-GST-TECH-2026",
      vendorName: "TechNova Systems",
      documentType: "GST_REGISTRATION",
      validUntil: "2027-03-31",
      ownerRole: "Vendor compliance analyst",
      status: "VALID",
    },
    {
      id: "vendor-doc-002",
      documentNumber: "DOC-INS-GREEN-2026",
      vendorName: "Greenline Logistics",
      documentType: "TRANSIT_INSURANCE",
      validUntil: "2026-06-03",
      ownerRole: "Supplier relationship manager",
      status: "EXPIRING",
    },
    {
      id: "vendor-doc-003",
      documentNumber: "DOC-GST-SHAKTI-2026",
      vendorName: "Shakti Industrial Supplies",
      documentType: "GST_CERTIFICATE",
      validUntil: "2027-03-31",
      ownerRole: "Vendor compliance analyst",
      status: "REVIEW_PENDING",
    },
    {
      id: "vendor-doc-004",
      documentNumber: "DOC-BANK-TECH-2026",
      vendorName: "TechNova Systems",
      documentType: "BANK_VALIDATION",
      validUntil: "2027-05-31",
      ownerRole: "Finance manager",
      status: "VALIDATION_PENDING",
    },
  ],
};

export function getRelationshipEnterpriseDemoData(): RelationshipEnterpriseDemoData {
  return relationshipEnterpriseDemoData;
}
