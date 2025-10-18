import mongoose from 'mongoose';
import { Roles } from './auth.middleware';

const spanErrorSchema = new mongoose.Schema(
  {
    message: { type: String, required: true },
    data: { type: Map, of: mongoose.Schema.Types.Mixed },
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
  },
  {
    timestamps: true,
  }
);

traceSchema.index({ workflow_name: 1, createdAt: -1 });
traceSchema.index({ group_id: 1, createdAt: -1 });

const spanSchema = new mongoose.Schema(
  {
    object: { type: String, required: true, enum: ['trace.span'] },
    id: { type: String, required: true, unique: true, index: true },
    trace_id: { type: String, required: true, index: true },
    parent_id: { type: String, default: null, index: true },
    started_at: { type: Date, default: null },
    ended_at: { type: Date, default: null },
    span_data: { type: Map, of: mongoose.Schema.Types.Mixed, required: true },
    error: { type: spanErrorSchema, default: null },
  },
  {
    timestamps: true,
  }
);

spanSchema.index({ trace_id: 1, started_at: 1 });

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    role: { type: String, required: true, enum: Object.values(Roles) },
  },
  { timestamps: true }
);

userSchema.index({ username: 1 });

const apiKeySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    keyHash: { type: String, required: true, unique: true },
    prefix: { type: String, required: true },
    suffix: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: { type: Date, default: null },
    lastUsedAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

apiKeySchema.index({ keyHash: 1 });
apiKeySchema.index({ createdBy: 1 });
apiKeySchema.index({ isActive: 1, expiresAt: 1 });

export const Trace = mongoose.model('Trace', traceSchema);
export const Span = mongoose.model('Span', spanSchema);
export const User = mongoose.model('User', userSchema);
export const ApiKey = mongoose.model('ApiKey', apiKeySchema);
