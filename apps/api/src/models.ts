import mongoose from 'mongoose';

// Span Error Schema
const spanErrorSchema = new mongoose.Schema(
  {
    message: { type: String, required: true },
    data: { type: Map, of: mongoose.Schema.Types.Mixed },
  },
  { _id: false }
);

// Span Schema (embedded in Trace)
const spanSchema = new mongoose.Schema(
  {
    object: { type: String, required: true, enum: ['trace.span'] },
    id: { type: String, required: true },
    trace_id: { type: String, required: true },
    parent_id: { type: String, default: null },
    started_at: { type: Date, default: null },
    ended_at: { type: Date, default: null },
    span_data: { type: Map, of: mongoose.Schema.Types.Mixed, required: true },
    error: { type: spanErrorSchema, default: null },
  },
  { _id: false }
);

const traceSchema = new mongoose.Schema(
  {
    object: { type: String, required: true, enum: ['trace'], default: 'trace' },
    id: { type: String, required: true, unique: true, index: true },
    workflow_name: { type: String, required: true, index: true },
    group_id: { type: String, default: null, index: true },
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: undefined,
    },
    spans: { type: [spanSchema], default: [] },
  },
  {
    timestamps: true,
  }
);

traceSchema.index({ workflow_name: 1, createdAt: -1 });
traceSchema.index({ group_id: 1, createdAt: -1 });
traceSchema.index({ 'spans.id': 1 });

export const Trace = mongoose.model('Trace', traceSchema);
