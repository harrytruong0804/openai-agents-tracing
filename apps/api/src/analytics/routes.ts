import { Router, type Request, type Response } from 'express';
import { authenticateJwt } from '../auth.middleware';
import { validateZod } from '../validate.middleware';
import { AnalyticsQuerySchema } from './types';
import { Span, Trace } from '../models';

const router = Router();

router.get(
  '/overview',
  authenticateJwt(),
  validateZod(AnalyticsQuerySchema, 'query'),
  async (req: Request, res: Response) => {
    try {
      const { start_date, end_date } = req.query as any;
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);

      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const prevStartDate = new Date(startDate);
      prevStartDate.setDate(prevStartDate.getDate() - daysDiff);

      const [currentPeriod, previousPeriod, totalTraces] = await Promise.all([
        Span.aggregate([
          {
            $match: {
              createdAt: { $gte: startDate, $lte: endDate },
              'span_data.type': 'generation',
            },
          },
          {
            $addFields: {
              calculatedCost: {
                $multiply: [
                  {
                    $add: [
                      { $ifNull: ['$span_data.usage.input_tokens', 0] },
                      { $ifNull: ['$span_data.usage.output_tokens', 0] },
                    ],
                  },
                  0.005,
                ],
              },
            },
          },
          {
            $group: {
              _id: null,
              totalInputTokens: { $sum: { $ifNull: ['$span_data.usage.input_tokens', 0] } },
              totalOutputTokens: { $sum: { $ifNull: ['$span_data.usage.output_tokens', 0] } },
              totalRequests: { $sum: 1 },
              totalCost: { $sum: '$calculatedCost' },
            },
          },
        ]),
        Span.aggregate([
          {
            $match: {
              createdAt: { $gte: prevStartDate, $lt: startDate },
              'span_data.type': 'generation',
            },
          },
          {
            $addFields: {
              calculatedCost: {
                $multiply: [
                  {
                    $add: [
                      { $ifNull: ['$span_data.usage.input_tokens', 0] },
                      { $ifNull: ['$span_data.usage.output_tokens', 0] },
                    ],
                  },
                  0.005,
                ],
              },
            },
          },
          {
            $group: {
              _id: null,
              totalCost: { $sum: '$calculatedCost' },
            },
          },
        ]),
        Trace.countDocuments({
          createdAt: { $gte: startDate, $lte: endDate },
        }),
      ]);

      const current = currentPeriod[0] || {
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalRequests: 0,
        totalCost: 0,
      };

      const previous = previousPeriod[0] || { totalCost: 0 };
      const costChange = previous.totalCost > 0
        ? ((current.totalCost - previous.totalCost) / previous.totalCost) * 100
        : 0;

      return res.status(200).json({
        totalInputTokens: current.totalInputTokens,
        totalOutputTokens: current.totalOutputTokens,
        totalTokens: current.totalInputTokens + current.totalOutputTokens,
        totalRequests: current.totalRequests,
        totalTraces,
        totalCost: current.totalCost,
        previousPeriod: {
          totalCost: previous.totalCost,
          costChange,
        },
      });
    } catch (error) {
      console.error('Error fetching analytics overview:', error);
      return res.status(500).json({
        error: 'Failed to fetch analytics overview',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

router.get(
  '/time-series',
  authenticateJwt(),
  validateZod(AnalyticsQuerySchema, 'query'),
  async (req: Request, res: Response) => {
    try {
      const { start_date, end_date, granularity } = req.query as any;
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);

      const dateFormat = granularity === 'hour' ? '%Y-%m-%dT%H:00:00' : '%Y-%m-%d';

      const [spanData, traceData] = await Promise.all([
        Span.aggregate([
          {
            $match: {
              createdAt: { $gte: startDate, $lte: endDate },
              'span_data.type': 'generation',
            },
          },
          {
            $addFields: {
              calculatedCost: {
                $multiply: [
                  {
                    $add: [
                      { $ifNull: ['$span_data.usage.input_tokens', 0] },
                      { $ifNull: ['$span_data.usage.output_tokens', 0] },
                    ],
                  },
                  0.005,
                ],
              },
            },
          },
          {
            $group: {
              _id: {
                date: { $dateToString: { format: dateFormat, date: '$createdAt' } },
              },
              inputTokens: { $sum: { $ifNull: ['$span_data.usage.input_tokens', 0] } },
              outputTokens: { $sum: { $ifNull: ['$span_data.usage.output_tokens', 0] } },
              requests: { $sum: 1 },
              cost: { $sum: '$calculatedCost' },
              models: {
                $push: {
                  model: '$span_data.model',
                  cost: '$calculatedCost',
                },
              },
            },
          },
          { $sort: { '_id.date': 1 } },
        ]),
        Trace.aggregate([
          {
            $match: {
              createdAt: { $gte: startDate, $lte: endDate },
            },
          },
          {
            $group: {
              _id: {
                date: { $dateToString: { format: dateFormat, date: '$createdAt' } },
              },
              traces: { $sum: 1 },
            },
          },
          { $sort: { '_id.date': 1 } },
        ]),
      ]);

      const traceMap = new Map(
        traceData.map((item: any) => [item._id.date, item.traces])
      );

      const data = spanData.map((item: any) => {
        const modelCosts: any = {
          gpt4: 0,
          gpt35: 0,
          claude: 0,
          gemini: 0,
          other: 0,
        };

        item.models.forEach((m: any) => {
          const model = (m.model || '').toLowerCase();
          if (model.includes('gpt-4') || model.includes('gpt4')) {
            modelCosts.gpt4 += m.cost;
          } else if (model.includes('gpt-3.5') || model.includes('gpt35')) {
            modelCosts.gpt35 += m.cost;
          } else if (model.includes('claude')) {
            modelCosts.claude += m.cost;
          } else if (model.includes('gemini')) {
            modelCosts.gemini += m.cost;
          } else {
            modelCosts.other += m.cost;
          }
        });

        return {
          date: item._id.date,
          inputTokens: item.inputTokens,
          outputTokens: item.outputTokens,
          requests: item.requests,
          traces: traceMap.get(item._id.date) || 0,
          cost: item.cost,
          ...modelCosts,
        };
      });

      return res.status(200).json({ data });
    } catch (error) {
      console.error('Error fetching analytics time series:', error);
      return res.status(500).json({
        error: 'Failed to fetch analytics time series',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

router.get(
  '/models',
  authenticateJwt(),
  validateZod(AnalyticsQuerySchema, 'query'),
  async (req: Request, res: Response) => {
    try {
      const { start_date, end_date } = req.query as any;
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);

      const modelData = await Span.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            'span_data.type': 'generation',
          },
        },
        {
          $addFields: {
            calculatedCost: {
              $multiply: [
                {
                  $add: [
                    { $ifNull: ['$span_data.usage.input_tokens', 0] },
                    { $ifNull: ['$span_data.usage.output_tokens', 0] },
                  ],
                },
                0.005,
              ],
            },
          },
        },
        {
          $group: {
            _id: '$span_data.model',
            requests: { $sum: 1 },
            inputTokens: { $sum: { $ifNull: ['$span_data.usage.input_tokens', 0] } },
            outputTokens: { $sum: { $ifNull: ['$span_data.usage.output_tokens', 0] } },
            cost: { $sum: '$calculatedCost' },
          },
        },
        { $sort: { cost: -1 } },
      ]);

      const data = modelData.map((item: any) => ({
        model: item._id || 'Unknown',
        requests: item.requests,
        inputTokens: item.inputTokens,
        outputTokens: item.outputTokens,
        totalTokens: item.inputTokens + item.outputTokens,
        cost: item.cost,
      }));

      const total = data.reduce(
        (acc, curr) => ({
          requests: acc.requests + curr.requests,
          inputTokens: acc.inputTokens + curr.inputTokens,
          outputTokens: acc.outputTokens + curr.outputTokens,
          totalTokens: acc.totalTokens + curr.totalTokens,
          cost: acc.cost + curr.cost,
        }),
        { requests: 0, inputTokens: 0, outputTokens: 0, totalTokens: 0, cost: 0 }
      );

      return res.status(200).json({ data, total });
    } catch (error) {
      console.error('Error fetching analytics models:', error);
      return res.status(500).json({
        error: 'Failed to fetch analytics models',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

export default router;

