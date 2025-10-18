import 'dotenv/config';
import mongoose from 'mongoose';
import { Trace, Span } from './models';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/traces';

const DAYS_TO_GENERATE = parseInt(process.env.SEED_DAYS || '365');
const TRACES_PER_DAY = parseInt(process.env.SEED_TRACES_PER_DAY || '16');
const SPANS_PER_TRACE = parseInt(process.env.SEED_SPANS_PER_TRACE || '8');
const BATCH_SIZE = 1000;

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    console.log('Cleaning up traces with no spans...');
    const allTraces = await Trace.find().lean();
    const tracesWithNoSpans = [];
    
    for (const trace of allTraces) {
      const spanCount = await Span.countDocuments({ trace_id: trace.id });
      if (spanCount === 0 && trace.id.includes('seed')) {
        tracesWithNoSpans.push(trace.id);
      }
    }
    
    if (tracesWithNoSpans.length > 0) {
      await Trace.deleteMany({ id: { $in: tracesWithNoSpans } });
      console.log(`Deleted ${tracesWithNoSpans.length} orphaned traces`);
    }

    const existingTraces = await Trace.find().limit(5).lean();
    const existingSpans = await Span.find().limit(20).lean();

    if (existingTraces.length === 0) {
      console.log('No existing traces found. Please create at least one trace first.');
      process.exit(1);
    }

    console.log(`Found ${existingTraces.length} traces and ${existingSpans.length} spans to use as templates`);

    const tracesToInsert: any[] = [];
    const spansToInsert: any[] = [];

    console.log('\n📊 Configuration:');
    console.log(`  Days: ${DAYS_TO_GENERATE}`);
    console.log(`  Traces per day: ~${TRACES_PER_DAY}`);
    console.log(`  Spans per trace: ~${SPANS_PER_TRACE}`);
    console.log(`  Batch size: ${BATCH_SIZE}`);
    console.log(`  Estimated total: ~${DAYS_TO_GENERATE * TRACES_PER_DAY} traces, ~${DAYS_TO_GENERATE * TRACES_PER_DAY * SPANS_PER_TRACE} spans\n`);

    console.log(`Generating data...`);

    for (let day = 0; day < DAYS_TO_GENERATE; day++) {
      const date = new Date();
      date.setDate(date.getDate() - (DAYS_TO_GENERATE - day));
      
      const dailyTraces = Math.floor(Math.random() * 5) + TRACES_PER_DAY - 2;

      for (let t = 0; t < dailyTraces; t++) {
        const templateTrace = existingTraces[Math.floor(Math.random() * existingTraces.length)];
        const traceId = `trace_seed_${day}_${t}_${Math.random().toString(36).substr(2, 16)}`;
        
        const traceDate = new Date(date);
        traceDate.setHours(Math.floor(Math.random() * 24));
        traceDate.setMinutes(Math.floor(Math.random() * 60));
        traceDate.setSeconds(Math.floor(Math.random() * 60));

        const newTrace = {
          object: 'trace',
          id: traceId,
          workflow_name: templateTrace.workflow_name,
          group_id: templateTrace.group_id,
          metadata: templateTrace.metadata,
          createdAt: traceDate,
          updatedAt: traceDate,
        };

        tracesToInsert.push(newTrace);

        const spansForThisTrace = Math.floor(Math.random() * 3) + SPANS_PER_TRACE - 1;
        const spanIds: string[] = [];
        
        for (let s = 0; s < spansForThisTrace; s++) {
          const templateSpan = existingSpans[Math.floor(Math.random() * existingSpans.length)];
          const spanId = `span_seed_${day}_${t}_${s}_${Math.random().toString(36).substr(2, 16)}`;
          spanIds.push(spanId);
          
          const spanStartDate = new Date(traceDate.getTime() + s * 1000);
          const spanEndDate = new Date(spanStartDate.getTime() + Math.floor(Math.random() * 3000) + 500);

          const spanData: any = {};
          Object.keys(templateSpan.span_data || {}).forEach(key => {
            spanData[key] = (templateSpan.span_data as any).get ? (templateSpan.span_data as any).get(key) : (templateSpan.span_data as any)[key];
          });
          
          if (spanData.type === 'generation' || Math.random() > 0.5) {
            spanData.type = 'generation';
            spanData.usage = {
              input_tokens: Math.floor(Math.random() * 1000) + 100,
              output_tokens: Math.floor(Math.random() * 500) + 50,
            };
            
            const models = [
              'google.generative-ai:gemini-2.0-flash',
              'openai:gpt-4-turbo',
              'openai:gpt-4',
              'openai:gpt-3.5-turbo',
              'anthropic:claude-3-opus',
              'anthropic:claude-3-sonnet',
            ];
            spanData.model = models[Math.floor(Math.random() * models.length)];
          }

          const newSpan = {
            object: 'trace.span',
            id: spanId,
            trace_id: traceId,
            parent_id: s === 0 ? null : spanIds[s - 1],
            started_at: spanStartDate,
            ended_at: spanEndDate,
            span_data: spanData,
            error: null,
            createdAt: spanStartDate,
            updatedAt: spanEndDate,
          };

          spansToInsert.push(newSpan);
        }
      }

      if (day % 30 === 0) {
        console.log(`Generated ${day} days...`);
      }
    }

    console.log(`\nPrepared ${tracesToInsert.length} traces and ${spansToInsert.length} spans`);

    console.log('\nInserting traces in batches...');
    let totalTracesInserted = 0;
    for (let i = 0; i < tracesToInsert.length; i += BATCH_SIZE) {
      const batch = tracesToInsert.slice(i, i + BATCH_SIZE);
      try {
        await Trace.insertMany(batch, { ordered: false });
        totalTracesInserted += batch.length;
        console.log(`  Inserted ${totalTracesInserted}/${tracesToInsert.length} traces...`);
      } catch (err: any) {
        console.error(`  Error in batch ${i}-${i + BATCH_SIZE}:`, err.message);
      }
    }
    console.log(`✅ Total traces inserted: ${totalTracesInserted}`);

    console.log('\nInserting spans in batches...');
    let totalSpansInserted = 0;
    for (let i = 0; i < spansToInsert.length; i += BATCH_SIZE) {
      const batch = spansToInsert.slice(i, i + BATCH_SIZE);
      try {
        await Span.insertMany(batch, { ordered: false });
        totalSpansInserted += batch.length;
        console.log(`  Inserted ${totalSpansInserted}/${spansToInsert.length} spans...`);
      } catch (err: any) {
        console.error(`  Error in batch ${i}-${i + BATCH_SIZE}:`, err.message);
      }
    }
    console.log(`✅ Total spans inserted: ${totalSpansInserted}`);

    const finalTraceCount = await Trace.countDocuments({ id: { $regex: /^trace_seed/ } });
    const finalSpanCount = await Span.countDocuments({ id: { $regex: /^span_seed/ } });
    
    console.log('\n🎉 Seed process completed!');
    console.log(`Seeded traces in DB: ${finalTraceCount}`);
    console.log(`Seeded spans in DB: ${finalSpanCount}`);
    console.log(`Date range: ${DAYS_TO_GENERATE} days`);

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error seeding data:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seed();

