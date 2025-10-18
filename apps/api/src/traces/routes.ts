import { Router, type Request, type Response } from 'express';
import { validateZod } from '../validate.middleware';
import { authenticateApiKey } from '../api-key.middleware';
import { authenticateJwt } from '../auth.middleware';
import {
  BodySchema,
  SearchQuerySchema,
  type TracePayload,
  type SpanPayload,
  IdSchema,
} from './types';
import { Trace, Span } from '../models';

const router = Router();

router.post(
  '/event',
  authenticateApiKey,
  validateZod(BodySchema, 'body'),
  async (req: Request, res: Response) => {
    const events: Array<TracePayload | SpanPayload> = req.body.data;

    try {
      console.log(`Received ${events.length} items`);

      const traces = events.filter(
        (e): e is TracePayload => e.object === 'trace'
      );
      const spans = events.filter(
        (e): e is SpanPayload => e.object === 'trace.span'
      );

      const operations: Promise<any>[] = [];

      for (const trace of traces) {
        operations.push(
          Trace.findOneAndUpdate(
            { id: trace.id },
            {
              $setOnInsert: {
                object: trace.object,
                id: trace.id,
                workflow_name: trace.workflow_name,
                group_id: trace.group_id,
                metadata: trace.metadata,
              },
            },
            { upsert: true, new: true }
          )
        );
      }

      for (const span of spans) {
        operations.push(
          Span.findOneAndUpdate(
            { id: span.id },
            { ...span },
            { upsert: true, new: true }
          )
        );
      }

      await Promise.all(operations);

      return res.status(201).json({
        success: true,
        traces: traces.length,
        spans: spans.length,
      });
    } catch (error) {
      console.error('Error saving events:', error);
      return res.status(500).json({
        error: 'Failed to save events',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

router.get('/', authenticateJwt(), async (req: Request, res: Response) => {
  const queryWithMetadata = { ...req.query };
  const metadataParams: Record<string, string> = {};

  for (const [key, value] of Object.entries(queryWithMetadata)) {
    if (key.startsWith('metadata.') && typeof value === 'string') {
      const metadataKey = key.replace('metadata.', '');
      metadataParams[metadataKey] = value;
      delete queryWithMetadata[key];
    }
  }

  if (Object.keys(metadataParams).length > 0) {
    queryWithMetadata.metadata = metadataParams;
  }

  const validation = SearchQuerySchema.safeParse(queryWithMetadata);
  if (!validation.success) {
    return res.status(400).json({
      error: validation.error.issues,
    });
  }

  const {
    trace_id,
    group_id,
    workflow_name,
    metadata,
    start_date,
    end_date,
    page,
    limit,
    sort,
  } = validation.data;
  const skip = (page - 1) * limit;

  try {
    const filter: any = {};

    if (trace_id) {
      filter.id = trace_id;
    }

    if (group_id) {
      filter.group_id = group_id;
    }

    if (workflow_name) {
      filter.workflow_name = { $regex: workflow_name, $options: 'i' };
    }

    if (metadata) {
      for (const [key, value] of Object.entries(metadata)) {
        filter[`metadata.${key}`] = value;
      }
    }

    if (start_date || end_date) {
      filter.createdAt = {};
      if (start_date) {
        filter.createdAt.$gte = new Date(start_date);
      }
      if (end_date) {
        filter.createdAt.$lte = new Date(end_date);
      }
    }

    const sortField = sort.startsWith('-') ? sort.slice(1) : sort;
    const sortOrder = sort.startsWith('-') ? -1 : 1;
    const sortObj: any = { [sortField]: sortOrder };

    const pipeline = [
      { $match: filter },
      { $sort: sortObj },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: 'spans',
          localField: 'id',
          foreignField: 'trace_id',
          as: 'spans',
        },
      },
      {
        $addFields: {
          flow: {
            $map: {
              input: {
                $filter: {
                  input: {
                    $sortArray: {
                      input: '$spans',
                      sortBy: { started_at: 1 },
                    },
                  },
                  as: 'span',
                  cond: {
                    $eq: [
                      { $ifNull: ['$$span.span_data.type', null] },
                      'agent',
                    ],
                  },
                },
              },
              as: 'agentSpan',
              in: { $ifNull: ['$$agentSpan.span_data.name', 'Unknown'] },
            },
          },
          handoffs_count: {
            $max: [
              0,
              {
                $subtract: [
                  {
                    $size: {
                      $filter: {
                        input: '$spans',
                        as: 'span',
                        cond: {
                          $eq: [
                            { $ifNull: ['$$span.span_data.type', null] },
                            'agent',
                          ],
                        },
                      },
                    },
                  },
                  1,
                ],
              },
            ],
          },
          tools_count: {
            $size: {
              $filter: {
                input: '$spans',
                as: 'span',
                cond: {
                  $eq: [
                    { $ifNull: ['$$span.span_data.type', null] },
                    'function',
                  ],
                },
              },
            },
          },
          execution_time: {
            $let: {
              vars: {
                sortedSpans: {
                  $sortArray: {
                    input: '$spans',
                    sortBy: { started_at: 1 },
                  },
                },
              },
              in: {
                $let: {
                  vars: {
                    firstStart: {
                      $arrayElemAt: ['$$sortedSpans.started_at', 0],
                    },
                    lastSpan: {
                      $arrayElemAt: ['$$sortedSpans', -1],
                    },
                  },
                  in: {
                    $cond: {
                      if: {
                        $and: [
                          { $ne: ['$$lastSpan.ended_at', null] },
                          { $ne: ['$$firstStart', null] },
                        ],
                      },
                      then: {
                        $subtract: [
                          { $toLong: '$$lastSpan.ended_at' },
                          { $toLong: '$$firstStart' },
                        ],
                      },
                      else: 'N/A',
                    },
                  },
                },
              },
            },
          },
        },
      },
      {
        $project: {
          spans: 0,
        },
      },
    ];

    const traces = await Trace.aggregate(pipeline);
    const total = await Trace.countDocuments(filter);

    return res.status(200).json({
      data: traces,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching traces:', error);
    return res.status(500).json({
      error: 'Failed to fetch traces',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get(
  '/:id',
  authenticateJwt(),
  validateZod(IdSchema, 'params'),
  async (req: Request, res: Response) => {
    try {
      const pipeline = [
        { $match: { id: req.params.id } },
        {
          $lookup: {
            from: 'spans',
            localField: 'id',
            foreignField: 'trace_id',
            as: 'spans',
          },
        },
        {
          $addFields: {
            flow: {
              $map: {
                input: {
                  $filter: {
                    input: {
                      $sortArray: {
                        input: '$spans',
                        sortBy: { started_at: 1 },
                      },
                    },
                    as: 'span',
                    cond: {
                      $eq: [
                        { $ifNull: ['$$span.span_data.type', null] },
                        'agent',
                      ],
                    },
                  },
                },
                as: 'agentSpan',
                in: { $ifNull: ['$$agentSpan.span_data.name', 'Unknown'] },
              },
            },
            handoffs_count: {
              $max: [
                0,
                {
                  $subtract: [
                    {
                      $size: {
                        $filter: {
                          input: '$spans',
                          as: 'span',
                          cond: {
                            $eq: [
                              { $ifNull: ['$$span.span_data.type', null] },
                              'agent',
                            ],
                          },
                        },
                      },
                    },
                    1,
                  ],
                },
              ],
            },
            tools_count: {
              $size: {
                $filter: {
                  input: '$spans',
                  as: 'span',
                  cond: {
                    $eq: [
                      { $ifNull: ['$$span.span_data.type', null] },
                      'function',
                    ],
                  },
                },
              },
            },
            execution_time: {
              $let: {
                vars: {
                  sortedSpans: {
                    $sortArray: {
                      input: '$spans',
                      sortBy: { started_at: 1 },
                    },
                  },
                },
                in: {
                  $let: {
                    vars: {
                      firstStart: {
                        $arrayElemAt: ['$$sortedSpans.started_at', 0],
                      },
                      lastSpan: {
                        $arrayElemAt: ['$$sortedSpans', -1],
                      },
                    },
                    in: {
                      $cond: {
                        if: {
                          $and: [
                            { $ne: ['$$lastSpan.ended_at', null] },
                            { $ne: ['$$firstStart', null] },
                          ],
                        },
                        then: {
                          $subtract: [
                            { $toLong: '$$lastSpan.ended_at' },
                            { $toLong: '$$firstStart' },
                          ],
                        },
                        else: 'N/A',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      ];

      const result = await Trace.aggregate(pipeline);

      if (!result || result.length === 0) {
        return res.status(404).json({
          error: 'Trace not found',
        });
      }

      return res.status(200).json({ data: result[0] });
    } catch (error) {
      console.error('Error fetching trace:', error);
      return res.status(500).json({
        error: 'Failed to fetch trace',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

export default router;
