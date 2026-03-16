import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type InvoiceType = 'invoice' | 'receipt' | 'invoice_receipt';
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  sessionIds: Types.ObjectId[];
}

export interface InvoiceDocument extends Document {
  therapistId: Types.ObjectId;
  patientId: Types.ObjectId;
  invoiceNumber: string;
  issueDate: Date;
  dueDate?: Date;
  therapistName?: string;
  therapistLicense?: string;
  businessNumber?: string;
  vatNumber?: string;
  therapistAddress?: string;
  patientName?: string;
  patientAddress?: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  type: InvoiceType;
  status: InvoiceStatus;
  paidAt?: Date;
  paidAmount?: number;
  pdfUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceLineItemSchema = new Schema<InvoiceLineItem>(
  {
    description: { type: String, required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    sessionIds: [{ type: Schema.Types.ObjectId, ref: 'TreatmentSession' }],
  },
  { _id: false }
);

const InvoiceSchema = new Schema<InvoiceDocument>(
  {
    therapistId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    invoiceNumber: { type: String, required: true },
    issueDate: { type: Date, required: true },
    dueDate: Date,
    therapistName: String,
    therapistLicense: String,
    businessNumber: String,
    vatNumber: String,
    therapistAddress: String,
    patientName: String,
    patientAddress: String,
    lineItems: { type: [InvoiceLineItemSchema], default: [] },
    subtotal: { type: Number, required: true },
    vatRate: { type: Number, default: 0.18 },
    vatAmount: { type: Number, required: true },
    total: { type: Number, required: true },
    type: {
      type: String,
      enum: ['invoice', 'receipt', 'invoice_receipt'],
      default: 'invoice_receipt',
    },
    status: {
      type: String,
      enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
      default: 'draft',
    },
    paidAt: Date,
    paidAmount: Number,
    pdfUrl: String,
  },
  { timestamps: true }
);

// Unique invoice number per therapist
InvoiceSchema.index({ therapistId: 1, invoiceNumber: 1 }, { unique: true });

export const Invoice: Model<InvoiceDocument> =
  mongoose.models.Invoice ?? mongoose.model<InvoiceDocument>('Invoice', InvoiceSchema);
