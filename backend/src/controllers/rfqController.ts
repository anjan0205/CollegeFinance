import { Request, Response } from 'express';

export interface RFQItem {
  id: string;
  rfqNumber: string;
  prId: string;
  prNumber: string;
  departmentId: string;
  departmentName: string;
  title: string;
  vendorIds: string[];
  dueDate: string;
  status: 'OPEN' | 'CLOSED' | 'AWARDED' | 'CANCELLED';
  createdAt: string;
  quotes: QuoteItem[];
  selectedQuoteId?: string;
}

export interface QuoteItem {
  id: string;
  rfqId: string;
  vendorId: string;
  vendorName: string;
  lineItems: {
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  totalAmount: number;
  deliveryDays: number;
  submittedAt: string;
  isSelected?: boolean;
  justificationForNonLowest?: string;
}

// In-memory data store for RFQs and Quotes (integrated with persistent fallback)
let mockRFQs: RFQItem[] = [
  {
    id: 'rfq-2026-001',
    rfqNumber: 'RFQ-2026-0001',
    prId: 'pr-2026-0042',
    prNumber: 'PR-2026-0042',
    departmentId: 'dept-cse',
    departmentName: 'Computer Science & Engineering',
    title: 'High Performance AI Computing Lab Workstations',
    vendorIds: ['v-tech-01', 'v-dell-02', 'v-hp-03'],
    dueDate: '2026-10-15',
    status: 'OPEN',
    createdAt: new Date().toISOString(),
    quotes: [
      {
        id: 'quote-001',
        rfqId: 'rfq-2026-001',
        vendorId: 'v-tech-01',
        vendorName: 'Apex Tech Solutions',
        lineItems: [
          { description: 'GPU Workstations Core i9 / RTX 4090', quantity: 5, unitPrice: 185000, totalPrice: 925000 }
        ],
        totalAmount: 925000,
        deliveryDays: 7,
        submittedAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 'quote-002',
        rfqId: 'rfq-2026-001',
        vendorId: 'v-dell-02',
        vendorName: 'Dell Enterprise Systems',
        lineItems: [
          { description: 'GPU Workstations Core i9 / RTX 4090', quantity: 5, unitPrice: 192000, totalPrice: 960000 }
        ],
        totalAmount: 960000,
        deliveryDays: 5,
        submittedAt: new Date(Date.now() - 43200000).toISOString()
      }
    ]
  }
];

export const getRFQs = (req: Request, res: Response) => {
  try {
    return res.status(200).json({ success: true, data: mockRFQs });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getRFQById = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const rfq = mockRFQs.find((r) => r.id === id || r.rfqNumber === id);
    if (!rfq) {
      return res.status(404).json({ success: false, message: 'RFQ not found' });
    }
    return res.status(200).json({ success: true, data: rfq });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createRFQ = (req: Request, res: Response) => {
  try {
    const { prId, prNumber, departmentId, departmentName, title, vendorIds, dueDate } = req.body;

    if (!prId || !vendorIds || vendorIds.length === 0) {
      return res.status(400).json({ success: false, message: 'prId and vendorIds are required' });
    }

    const rfqNumber = `RFQ-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newRFQ: RFQItem = {
      id: `rfq-${Date.now()}`,
      rfqNumber,
      prId,
      prNumber: prNumber || 'PR-2026-EXT',
      departmentId: departmentId || 'dept-general',
      departmentName: departmentName || 'General Procurement',
      title: title || 'Procurement Request',
      vendorIds,
      dueDate: dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      status: 'OPEN',
      createdAt: new Date().toISOString(),
      quotes: []
    };

    mockRFQs.unshift(newRFQ);
    return res.status(201).json({ success: true, data: newRFQ, message: 'RFQ created successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const submitQuote = (req: Request, res: Response) => {
  try {
    const { rfqId, vendorId, vendorName, lineItems, totalAmount, deliveryDays } = req.body;

    const rfq = mockRFQs.find((r) => r.id === rfqId || r.rfqNumber === rfqId);
    if (!rfq) {
      return res.status(404).json({ success: false, message: 'RFQ not found' });
    }

    const newQuote: QuoteItem = {
      id: `quote-${Date.now()}`,
      rfqId: rfq.id,
      vendorId: vendorId || 'v-generic',
      vendorName: vendorName || 'Vendor Partner',
      lineItems: lineItems || [],
      totalAmount: totalAmount || 0,
      deliveryDays: deliveryDays || 7,
      submittedAt: new Date().toISOString()
    };

    rfq.quotes.push(newQuote);
    return res.status(201).json({ success: true, data: newQuote, message: 'Quote submitted successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const selectWinningQuote = (req: Request, res: Response) => {
  try {
    const { rfqId, quoteId, justificationForNonLowest } = req.body;

    const rfq = mockRFQs.find((r) => r.id === rfqId || r.rfqNumber === rfqId);
    if (!rfq) {
      return res.status(404).json({ success: false, message: 'RFQ not found' });
    }

    const quote = rfq.quotes.find((q) => q.id === quoteId);
    if (!quote) {
      return res.status(404).json({ success: false, message: 'Quote not found' });
    }

    // Check if this quote is lowest price
    const lowestPrice = Math.min(...rfq.quotes.map((q) => q.totalAmount));
    if (quote.totalAmount > lowestPrice && !justificationForNonLowest) {
      return res.status(400).json({
        success: false,
        message: 'Selection justification comment is required when selecting a quote higher than the lowest price'
      });
    }

    rfq.quotes.forEach((q) => {
      q.isSelected = q.id === quoteId;
      if (q.id === quoteId && justificationForNonLowest) {
        q.justificationForNonLowest = justificationForNonLowest;
      }
    });

    rfq.selectedQuoteId = quoteId;
    rfq.status = 'AWARDED';

    // Generate PO reference metadata
    const generatedPO = {
      poNumber: `PO-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      prId: rfq.prId,
      rfqId: rfq.id,
      vendorId: quote.vendorId,
      vendorName: quote.vendorName,
      totalAmount: quote.totalAmount,
      expectedDelivery: new Date(Date.now() + quote.deliveryDays * 86400000).toISOString().split('T')[0],
      status: 'ISSUED',
      createdAt: new Date().toISOString()
    };

    return res.status(200).json({
      success: true,
      message: 'Winning quote selected and Purchase Order (PO) generated successfully',
      data: { rfq, generatedPO }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
