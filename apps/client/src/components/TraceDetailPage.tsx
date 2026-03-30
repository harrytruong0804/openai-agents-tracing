import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  RefreshCw,
  Box,
  MessageSquare,
  Code,
  Clock,
} from 'lucide-react';
import { tracesApi } from '../api';
import type { Trace, Span } from '../types';
import { Button } from '@/components/ui/button';
import { codeToHtml } from 'shiki';
import { useTheme } from '@/components/theme-provider';

const HandoffIcon = () => (
  <svg
    width="1em"
    height="1em"
    viewBox="0 0 12 12"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M8.64645 1.64645C8.84171 1.45118 9.15829 1.45118 9.35355 1.64645L10.8536 3.14645C11.0488 3.34171 11.0488 3.65829 10.8536 3.85355L9.35355 5.35355C9.15829 5.54882 8.84171 5.54882 8.64645 5.35355C8.45118 5.15829 8.45118 4.84171 8.64645 4.64645L9.29289 4H8.99411C8.60343 4 8.48958 4.00321 8.38788 4.02763C8.28584 4.05213 8.18829 4.09253 8.09882 4.14736C8.00964 4.20201 7.92687 4.28024 7.65061 4.5565L3.5565 8.65061C3.54433 8.66277 3.53233 8.67478 3.52049 8.68664C3.29609 8.91125 3.12654 9.08097 2.92368 9.20528C2.74473 9.31494 2.54964 9.39575 2.34557 9.44474C2.11421 9.50029 1.87233 9.50017 1.55179 9.50002C1.53475 9.50001 1.51749 9.5 1.5 9.5C1.22386 9.5 1 9.27614 1 9C1 8.72386 1.22386 8.5 1.5 8.5C1.89503 8.5 2.01052 8.49676 2.11213 8.47237C2.21416 8.44787 2.31171 8.40747 2.40118 8.35264C2.49036 8.29799 2.57313 8.21976 2.84939 7.9435L6.9435 3.84939C6.95567 3.83723 6.96767 3.82522 6.97951 3.81336C7.20391 3.58875 7.37346 3.41903 7.57632 3.29472C7.75527 3.18506 7.95036 3.10425 8.15443 3.05526C8.38578 2.99972 8.62567 2.99983 8.94317 2.99998C8.95993 2.99999 8.97691 3 8.99411 3H9.29289L8.64645 2.35355C8.45118 2.15829 8.45118 1.84171 8.64645 1.64645ZM2.11213 3.52763C2.01052 3.50324 1.89503 3.5 1.5 3.5C1.22386 3.5 1 3.27614 1 3C1 2.72386 1.22386 2.5 1.5 2.5C1.51749 2.5 1.53475 2.49999 1.55178 2.49998C1.87233 2.49983 2.11421 2.49971 2.34557 2.55526C2.54964 2.60425 2.74473 2.68506 2.92368 2.79472C3.12654 2.91903 3.29609 3.08875 3.52049 3.31336C3.53233 3.32522 3.54433 3.33723 3.5565 3.34939L4.35355 4.14645C4.54882 4.34171 4.54882 4.65829 4.35355 4.85355C4.15829 5.04882 3.84171 5.04882 3.64645 4.85355L2.84939 4.0565C2.57313 3.78024 2.49036 3.70201 2.40118 3.64736C2.31171 3.59253 2.21416 3.55213 2.11213 3.52763ZM8.64645 6.64645C8.84171 6.45118 9.15829 6.45118 9.35355 6.64645L10.8536 8.14645C11.0488 8.34171 11.0488 8.65829 10.8536 8.85355L9.35355 10.3536C9.15829 10.5488 8.84171 10.5488 8.64645 10.3536C8.45118 10.1583 8.45118 9.84171 8.64645 9.64645L9.29289 9H8.99411C8.97691 9 8.95993 9.00001 8.94317 9.00002C8.62567 9.00017 8.38578 9.00028 8.15443 8.94474C7.95036 8.89575 7.75527 8.81494 7.57632 8.70528C7.37346 8.58097 7.20391 8.41125 6.97951 8.18664C6.96767 8.17478 6.95567 8.16277 6.9435 8.15061L6.64645 7.85355C6.45118 7.65829 6.45118 7.34171 6.64645 7.14645C6.84171 6.95118 7.15829 6.95118 7.35355 7.14645L7.65061 7.4435C7.92687 7.71976 8.00964 7.79799 8.09882 7.85264C8.18829 7.90747 8.28584 7.94787 8.38787 7.97237C8.48958 7.99679 8.60343 8 8.99411 8H9.29289L8.64645 7.35355C8.45118 7.15829 8.45118 6.84171 8.64645 6.64645Z" />
  </svg>
);

const HighlightedJSON = ({ data, theme }: { data: any; theme: string }) => {
  const [highlighted, setHighlighted] = useState<string>('');

  useEffect(() => {
    const highlight = async () => {
      const jsonString = JSON.stringify(data, null, 2);
      const html = await codeToHtml(jsonString, {
        lang: 'json',
        theme: theme === 'dark' ? 'github-dark' : 'github-light',
      });
      setHighlighted(html);
    };
    highlight();
  }, [data, theme]);

  if (!highlighted) {
    return (
      <pre className="text-xs bg-muted p-3 rounded border border-border overflow-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
    );
  }

  return (
    <div
      className="text-xs rounded border border-border overflow-auto bg-muted [&>pre]:!bg-transparent [&>pre]:!p-3 [&>pre]:!m-0 [&>pre]:!rounded [&_code]:!bg-transparent"
      dangerouslySetInnerHTML={{ __html: highlighted }}
    />
  );
};

export default function TraceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [trace, setTrace] = useState<Trace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSpans, setExpandedSpans] = useState<Set<string>>(new Set());
  const [selectedSpan, setSelectedSpan] = useState<string | null>(null);
  const [showProperties, setShowProperties] = useState(true);
  const [showMetadata, setShowMetadata] = useState(true);
  const [showInput, setShowInput] = useState(true);
  const [showOutput, setShowOutput] = useState(true);
  const [showAgents, setShowAgents] = useState(true);
  const [showHandoffAgents, setShowHandoffAgents] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [hiddenSpanTypes, setHiddenSpanTypes] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; spanName: string; spanType: string } | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayedSpan, setDisplayedSpan] = useState<string | null>(null);

  const loadTrace = async () => {
    if (!id) return;

    setLoading(true);
    setError(null);
    try {
      const response = await tracesApi.getTraceById(id);
      setTrace(response.data);
      // Auto-expand all spans initially
      if (response.data.spans) {
        const spanIds = new Set(response.data.spans.map((s) => s.id));
        setExpandedSpans(spanIds);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trace');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrace();
    setDisplayedSpan(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (selectedSpan === displayedSpan) return;

    setIsTransitioning(true);
    const timer = setTimeout(() => {
      setDisplayedSpan(selectedSpan);
      setIsTransitioning(false);
    }, 150);
    return () => clearTimeout(timer);
  }, [selectedSpan, displayedSpan]);

  const toggleSpan = (spanId: string) => {
    setExpandedSpans((prev) => {
      const next = new Set(prev);
      if (next.has(spanId)) {
        next.delete(spanId);
      } else {
        next.add(spanId);
      }
      return next;
    });
  };

  const copyToClipboard = (text: string, id?: string) => {
    navigator.clipboard.writeText(text);
    const key = id || text.slice(0, 20);
    setCopiedId(key);
    setTimeout(() => setCopiedId((prev) => (prev === key ? null : prev)), 2000);
  };

  const getSpanIcon = (type: string) => {
    switch (type) {
      case 'agent':
        return <Box className="w-4 h-4" />;
      case 'generation':
        return <MessageSquare className="w-4 h-4" />;
      case 'function':
        return <Code className="w-4 h-4" />;
      case 'handoff':
        return <HandoffIcon />;
      default:
        return <Box className="w-4 h-4" />;
    }
  };

  const getTimelineColor = (type: string): string => {
    switch (type) {
      case 'agent':
        return 'bg-sky-500';
      case 'generation':
        return 'bg-gray-400';
      case 'function':
        return 'bg-teal-500';
      case 'handoff':
        return 'bg-orange-500';
      default:
        return 'bg-primary';
    }
  };

  const getIconBackgroundColor = (type: string): string => {
    switch (type) {
      case 'agent':
        return 'bg-sky-500/10';
      case 'generation':
        return 'bg-gray-400/10';
      case 'function':
        return 'bg-teal-500/10';
      case 'handoff':
        return 'bg-orange-500/10';
      default:
        return 'bg-primary/10';
    }
  };

  const getIconTextColor = (type: string): string => {
    switch (type) {
      case 'agent':
        return 'text-sky-500';
      case 'generation':
        return 'text-gray-400';
      case 'function':
        return 'text-teal-500';
      case 'handoff':
        return 'text-orange-500';
      default:
        return 'text-primary';
    }
  };

  const getSpanDurationMs = (span: Span): number => {
    if (!span.started_at || !span.ended_at) return 0;
    return new Date(span.ended_at).getTime() - new Date(span.started_at).getTime();
  };

  const formatDuration = (span: Span): string => {
    return `${getSpanDurationMs(span).toLocaleString()} ms`;
  };

  const formatTimestamp = (dateStr: string | null): string => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  };

  const getSelectedSpanObject = (): Span | null => {
    if (!displayedSpan || !trace?.spans) return null;
    return trace.spans.find((s) => s.id === displayedSpan) || null;
  };

  const getSpanDurationPercentage = (span: Span): number => {
    if (!trace?.spans || !span.started_at || !span.ended_at) return 0;

    const allTimes = trace.spans
      .filter((s) => s.started_at && s.ended_at)
      .map((s) => ({
        start: new Date(s.started_at!).getTime(),
        end: new Date(s.ended_at!).getTime(),
      }));

    if (allTimes.length === 0) return 0;

    const minStart = Math.min(...allTimes.map((t) => t.start));
    const maxEnd = Math.max(...allTimes.map((t) => t.end));
    const totalDuration = maxEnd - minStart;

    const spanDuration =
      new Date(span.ended_at).getTime() - new Date(span.started_at).getTime();
    return (spanDuration / totalDuration) * 100;
  };

  const getSpanOffset = (span: Span): number => {
    if (!trace?.spans || !span.started_at) return 0;

    const allTimes = trace.spans
      .filter((s) => s.started_at && s.ended_at)
      .map((s) => ({
        start: new Date(s.started_at!).getTime(),
        end: new Date(s.ended_at!).getTime(),
      }));

    if (allTimes.length === 0) return 0;

    const minStart = Math.min(...allTimes.map((t) => t.start));
    const maxEnd = Math.max(...allTimes.map((t) => t.end));
    const totalDuration = maxEnd - minStart;

    const spanStart = new Date(span.started_at).getTime();
    const offset = spanStart - minStart;
    return (offset / totalDuration) * 100;
  };

  const buildSpanTree = (spans: Span[]) => {
    const spanMap = new Map<string, Span & { children: Span[] }>();
    const rootSpans: (Span & { children: Span[] })[] = [];

    // Initialize map
    spans.forEach((span) => {
      spanMap.set(span.id, { ...span, children: [] });
    });

    // Build tree
    spans.forEach((span) => {
      const spanWithChildren = spanMap.get(span.id)!;
      if (span.parent_id) {
        const parent = spanMap.get(span.parent_id);
        if (parent) {
          parent.children.push(spanWithChildren);
        } else {
          rootSpans.push(spanWithChildren);
        }
      } else {
        rootSpans.push(spanWithChildren);
      }
    });

    return rootSpans;
  };

  const renderSpanTree = (
    spans: (Span & { children: Span[] })[],
    depth = 0
  ) => {
    return spans.filter((span) => {
      if (hiddenSpanTypes.size === 0) return true;
      const name = span.span_data?.name || span.span_data?.type || '';
      return !hiddenSpanTypes.has(name);
    }).map((span) => {
      const isExpanded = expandedSpans.has(span.id);
      const hasChildren = span.children && span.children.length > 0;
      const spanType = span.span_data?.type || 'unknown';
      let durationPercentage = Math.max(getSpanDurationPercentage(span), 0.5);
      let offsetPercentage = getSpanOffset(span);
      const startsAtBeginning = offsetPercentage <= 1;
      const reachesEnd = offsetPercentage + durationPercentage >= 99;

      const getRoundedClass = () => {
        // To display the item even if it has a duration of less than 1%
        // This is to avoid the item from being hidden if it has a duration of less than 1%
        if (durationPercentage <= 1) {
          durationPercentage = 3;
        }
        // To display the item at the beginning and end of the timeline
        // This is to avoid the item from being hidden if it has a duration of less than 1%
        if (startsAtBeginning && reachesEnd) {
          durationPercentage = 100;
          offsetPercentage = 0;
          return 'rounded-[50px]';
        }
        if (startsAtBeginning) return 'rounded-l-[50px] rounded-r-[10px]';
        if (reachesEnd) return 'rounded-r-[50px] rounded-l-[10px]';
        return 'rounded-[1px]';
      };

      return (
        <li
          key={span.id}
          className="relative border-t border-muted first:border-t-0"
        >
          <div
            className={`flex items-center gap-2 py-2 pl-2 pr-4 hover:bg-accent/50 cursor-pointer transition-colors ${
              selectedSpan === span.id ? 'bg-accent' : ''
            }`}
            style={{ paddingLeft: `${depth * 20 + 8}px` }}
            onClick={() =>
              setSelectedSpan(selectedSpan === span.id ? null : span.id)
            }
            onContextMenu={(e) => {
              e.preventDefault();
              const name = span.span_data?.name || span.span_data?.type || '';
              if (name) {
                setContextMenu({ x: e.clientX, y: e.clientY, spanName: name, spanType: spanType });
              }
            }}
          >
            {hasChildren && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSpan(span.id);
                }}
                className="p-0.5 hover:bg-accent rounded"
              >
                <ChevronRight
                  className={`w-3 h-3 text-muted-foreground transition-transform duration-200 ${
                    isExpanded ? 'rotate-90' : 'rotate-0'
                  }`}
                />
              </button>
            )}
            {!hasChildren && <div className="w-4" />}

            <div
              className={`p-1 rounded-lg ${getIconBackgroundColor(
                spanType
              )} ${getIconTextColor(spanType)}`}
            >
              {getSpanIcon(spanType)}
            </div>

            <span className="flex-1 text-sm truncate">
              {spanType === 'handoff' ? (
                <>
                  Handoff
                  <ChevronRight className="inline w-3 h-3 mx-1 text-muted-foreground/100" />
                  {span.span_data?.to_agent || 'Unknown'}
                </>
              ) : (
                span.span_data?.name || spanType
              )}
            </span>

            <span className="text-xs text-muted-foreground min-w-[60px] text-right pr-1">
              {formatDuration(span)}
            </span>

            {/* Timing Bar */}
            <div className="w-[200px] h-[9px] bg-gray-900 dark:bg-gray-700 rounded-full relative flex-shrink-0 flex items-center px-0.5">
              <div
                className={`absolute h-[6px] ${getRoundedClass()} ${getTimelineColor(
                  spanType
                )}`}
                style={{
                  width: `calc(${durationPercentage}% - 3px)`,
                  left: `calc(${offsetPercentage}% + 1.5px)`,
                }}
              />
            </div>
          </div>

          {hasChildren && (
            <div
              className={`transition-all duration-300 ${
                isExpanded ? 'opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
              }`}
            >
              <ul
                className={`relative transition-transform duration-300 ${
                  isExpanded ? 'translate-y-0' : '-translate-y-2'
                }`}
              >
                {renderSpanTree(
                  span.children as (Span & { children: Span[] })[],
                  depth + 1
                )}
              </ul>
            </div>
          )}
        </li>
      );
    });
  };

  if (loading) {
    return (
      <div className="flex-1 bg-background flex items-center justify-center h-screen">
        <div className="text-muted-foreground">Loading trace...</div>
      </div>
    );
  }

  if (error || !trace) {
    return (
      <div className="flex-1 bg-background flex flex-col items-center justify-center gap-4 h-screen">
        <div className="text-destructive">{error || 'Trace not found'}</div>
        <Button onClick={() => navigate('/traces')}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Traces
        </Button>
      </div>
    );
  }

  const spanTree = trace.spans
    ? buildSpanTree(
        [...trace.spans].sort((a, b) => {
          const aTime = a.started_at ? new Date(a.started_at).getTime() : 0;
          const bTime = b.started_at ? new Date(b.started_at).getTime() : 0;
          return aTime - bTime;
        })
      )
    : [];

  return (
    <div className="flex-1 bg-background h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-border bg-card/50 px-10 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/traces')}
              className="h-8 w-8 flex-shrink-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-lg font-semibold flex-shrink-0">Traces</span>
            <span className="text-lg text-muted-foreground select-none flex-shrink-0">
              /
            </span>
            <span className="text-lg font-semibold truncate">
              {trace.workflow_name}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(trace.id, 'trace-id-header')}
              className="gap-3 flex-shrink-0"
            >
              <div className="relative w-3 h-3 flex items-center justify-center">
                <Copy
                  className={`w-3 h-3 absolute transition-all duration-200 ${
                    copiedId === 'trace-id-header' ? 'opacity-0 scale-50' : 'opacity-100 scale-100'
                  }`}
                />
                <Check
                  className={`w-3 h-3 absolute transition-all duration-300 delay-150 ${
                    copiedId === 'trace-id-header' ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                  }`}
                />
              </div>
              <span className="text-xs font-mono max-w-[200px] truncate">
                {trace.id}
              </span>
            </Button>
          </div>

          {hiddenSpanTypes.size > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setHiddenSpanTypes(new Set())}
              className="gap-1.5 text-muted-foreground"
            >
              Show all ({hiddenSpanTypes.size} hidden)
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={loadTrace}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Spans Tree */}
        <div className="flex-1 overflow-auto border-r border-border">
          <ul>
            {spanTree.length > 0 ? (
              renderSpanTree(spanTree)
            ) : (
              <li className="text-sm text-muted-foreground p-4 border-b border-border">
                No spans found
              </li>
            )}
          </ul>
        </div>

        {/* Right Panel - Properties */}
        <div className="w-[600px] overflow-auto bg-card/30">
          <div
            className={`transition-all duration-200 ${
              isTransitioning
                ? 'opacity-0 -translate-y-1'
                : 'opacity-100 translate-y-0'
            }`}
          >
            {selectedSpan && getSelectedSpanObject()
              ? renderSpanDetails(getSelectedSpanObject()!)
              : renderTraceDetails()}
          </div>
        </div>
      </div>
      {/* Context Menu */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu(null)}
            onContextMenu={(e) => { e.preventDefault(); setContextMenu(null); }}
          />
          <div
            className="fixed z-50 bg-popover border border-border rounded-lg shadow-lg py-1 min-w-[200px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
              onClick={() => {
                setHiddenSpanTypes((prev) => {
                  const next = new Set(prev);
                  next.add(contextMenu.spanName);
                  return next;
                });
                setContextMenu(null);
              }}
            >
              Hide all <span className="font-mono text-muted-foreground">{contextMenu.spanName}</span>
            </button>
            {hiddenSpanTypes.size > 0 && (
              <button
                className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors border-t border-border"
                onClick={() => {
                  setHiddenSpanTypes(new Set());
                  setContextMenu(null);
                }}
              >
                Show all hidden ({hiddenSpanTypes.size})
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );

  function renderTraceDetails() {
    return (
      <>
        {/* Properties Section */}
        <div className="space-y-3">
          <div className="px-8 py-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Properties</h3>
              <button
                onClick={() => setShowProperties(!showProperties)}
                className="p-1 hover:bg-accent rounded transition-colors"
              >
                <ChevronRight
                  className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                    showProperties ? 'rotate-90' : 'rotate-0'
                  }`}
                />
              </button>
            </div>

            <div
              className={`transition-all duration-300 ${
                showProperties
                  ? 'opacity-100'
                  : 'max-h-0 opacity-0 overflow-hidden'
              }`}
            >
              <div
                className={`space-y-3 transition-transform duration-300 ${
                  showProperties ? 'translate-y-0 pt-2' : '-translate-y-2 pt-0'
                }`}
              >
                <div className="flex justify-between items-center gap-2">
                  <span className="text-sm text-muted-foreground">ID</span>
                  <button
                    onClick={() => copyToClipboard(trace?.id || '', 'trace-id-prop')}
                    className="text-sm font-mono max-w-[240px] truncate hover:text-primary transition-colors flex items-center gap-2 group"
                  >
                    <span className="truncate relative pb-0.5 before:absolute before:bottom-0 before:left-0 before:right-0 before:h-[1px] before:bg-transparent group-hover:before:bg-[length:4px_1px] group-hover:before:bg-[repeating-linear-gradient(to_right,currentColor_0,currentColor_1px,transparent_1px,transparent_4px)]">
                      {trace?.id || 'N/A'}
                    </span>
                    <div className="relative w-3 h-3 flex-shrink-0 flex items-center justify-center">
                      <Copy
                        className={`w-3 h-3 absolute transition-all duration-200 ${
                          copiedId === 'trace-id-prop'
                            ? 'opacity-0 scale-50'
                            : 'opacity-100 scale-100'
                        }`}
                      />
                      <Check
                        className={`w-3 h-3 absolute transition-all duration-300 delay-150 ${
                          copiedId === 'trace-id-prop'
                            ? 'opacity-100 scale-100'
                            : 'opacity-0 scale-50'
                        }`}
                      />
                    </div>
                  </button>
                </div>

                <div className="flex justify-between items-start">
                  <span className="text-sm text-muted-foreground">
                    Workflow name
                  </span>
                  <span className="text-sm truncate max-w-[270px]">
                    {trace?.workflow_name || 'N/A'}
                  </span>
                </div>

                <div className="flex justify-between items-start">
                  <span className="text-sm text-muted-foreground">
                    Group ID
                  </span>
                  <span className="text-sm truncate max-w-[270px]">
                    {trace?.group_id || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Separator */}
        <div className="w-full h-px bg-border" />

        {/* Metadata Section */}
        <div className="space-y-3">
          <div className="px-8 py-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Metadata</h3>
              <button
                onClick={() => setShowMetadata(!showMetadata)}
                className="p-1 hover:bg-accent rounded transition-colors"
              >
                <ChevronRight
                  className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                    showMetadata ? 'rotate-90' : 'rotate-0'
                  }`}
                />
              </button>
            </div>

            <div
              className={`transition-all duration-300 ${
                showMetadata
                  ? 'opacity-100'
                  : 'max-h-0 opacity-0 overflow-hidden'
              }`}
            >
              <div
                className={`transition-transform duration-300 ${
                  showMetadata ? 'translate-y-0 pt-2' : '-translate-y-2 pt-0'
                }`}
              >
                {trace &&
                trace.metadata &&
                Object.keys(trace.metadata).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(trace.metadata).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex justify-between items-start"
                      >
                        <span className="text-sm text-muted-foreground">
                          {key}
                        </span>
                        <span className="text-sm max-w-[200px] truncate">
                          {typeof value === 'object'
                            ? JSON.stringify(value)
                            : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    No metadata entries
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Separator */}
        <div className="w-full h-px bg-border" />

        {/* Token Usage Summary Section */}
        {trace?.spans && (() => {
          const generationSpans = trace.spans.filter(
            (s) => s.span_data?.type === 'generation' && s.span_data?.usage
          );
          if (generationSpans.length === 0) return null;

          const totals = generationSpans.reduce(
            (acc, s) => {
              const u = s.span_data.usage;
              acc.input += u.input_tokens || 0;
              acc.output += u.output_tokens || 0;
              acc.cached += u.input_tokens_details?.cached_tokens || 0;
              acc.reasoning += u.output_tokens_details?.reasoning_tokens || 0;
              return acc;
            },
            { input: 0, output: 0, cached: 0, reasoning: 0 }
          );
          const total = totals.input + totals.output;

          return (
            <div className="space-y-3">
              <div className="px-8 py-6">
                <h3 className="text-sm font-semibold mb-3">Token Usage</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Input tokens</span>
                    <span className="text-sm">{totals.input.toLocaleString()}</span>
                  </div>
                  {totals.cached > 0 && (
                    <div className="flex justify-between items-center pl-3">
                      <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                        Cached
                      </span>
                      <span className="text-xs text-blue-500 dark:text-blue-400 font-medium">
                        {totals.cached.toLocaleString()}
                        <span className="text-muted-foreground font-normal ml-1">
                          ({Math.round((totals.cached / totals.input) * 100)}%)
                        </span>
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Output tokens</span>
                    <span className="text-sm">{totals.output.toLocaleString()}</span>
                  </div>
                  {totals.reasoning > 0 && (
                    <div className="flex justify-between items-center pl-3">
                      <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        Reasoning
                      </span>
                      <span className="text-xs text-amber-500 dark:text-amber-400 font-medium">
                        {totals.reasoning.toLocaleString()}
                        <span className="text-muted-foreground font-normal ml-1">
                          ({Math.round((totals.reasoning / totals.output) * 100)}%)
                        </span>
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-1 border-t border-border/50">
                    <span className="text-sm text-muted-foreground">Total tokens</span>
                    <span className="text-sm font-medium">{total.toLocaleString()}</span>
                  </div>

                  {/* Visual breakdown bar */}
                  <div className="pt-2">
                    <div className="h-2 rounded-full bg-muted overflow-hidden flex">
                      {totals.cached > 0 && (
                        <div
                          className="h-full bg-blue-400"
                          style={{ width: `${(totals.cached / total) * 100}%` }}
                          title={`Cached: ${totals.cached.toLocaleString()}`}
                        />
                      )}
                      <div
                        className="h-full bg-emerald-500"
                        style={{ width: `${((totals.input - totals.cached) / total) * 100}%` }}
                        title={`Input (non-cached): ${(totals.input - totals.cached).toLocaleString()}`}
                      />
                      {totals.reasoning > 0 && (
                        <div
                          className="h-full bg-amber-400"
                          style={{ width: `${(totals.reasoning / total) * 100}%` }}
                          title={`Reasoning: ${totals.reasoning.toLocaleString()}`}
                        />
                      )}
                      <div
                        className="h-full bg-violet-500"
                        style={{ width: `${((totals.output - totals.reasoning) / total) * 100}%` }}
                        title={`Output: ${(totals.output - totals.reasoning).toLocaleString()}`}
                      />
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                      {totals.cached > 0 && (
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-blue-400" />
                          Cached
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        Input
                      </span>
                      {totals.reasoning > 0 && (
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-amber-400" />
                          Reasoning
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-violet-500" />
                        Output
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </>
    );
  }

  function renderSpanDetails(span: Span) {
    const spanType = span.span_data?.type || 'unknown';

    return (
      <>
        {/* Span Header */}
        <div className="border-b border-muted">
          <div className="px-8 py-6">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-foreground">
                {spanType === 'handoff' ? (
                  <span className="flex items-center gap-2">
                    Handoff
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    {span.span_data?.to_agent || 'Unknown'}
                  </span>
                ) : spanType === 'generation' ? (
                  'Generation span'
                ) : (
                  span.span_data?.name || spanType
                )}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <div
                    className={`p-1.5 rounded-md ${getIconBackgroundColor(
                      spanType
                    )} ${getIconTextColor(spanType)}`}
                  >
                    {getSpanIcon(spanType)}
                  </div>
                  <span className="capitalize text-muted-foreground">
                    {spanType}
                  </span>
                </div>
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  {formatDuration(span)}
                </span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(span.id, 'span-id')}
                className="h-6 px-2 gap-1.5"
              >
                <div className="relative w-3 h-3 flex items-center justify-center">
                  <Copy
                    className={`w-3 h-3 absolute transition-all duration-200 ${
                      copiedId === 'span-id' ? 'opacity-0 scale-50' : 'opacity-100 scale-100'
                    }`}
                  />
                  <Check
                    className={`w-3 h-3 absolute transition-all duration-300 delay-150 ${
                      copiedId === 'span-id' ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                    }`}
                  />
                </div>
                <span className="text-xs font-mono max-w-[300px] truncate">
                  {span.id}
                </span>
              </Button>
            </div>
          </div>
        </div>

        {/* Properties Section */}
        <div className="space-y-3">
          <div className="px-8 py-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Properties</h3>
              <button
                onClick={() => setShowProperties(!showProperties)}
                className="p-1 hover:bg-accent rounded transition-colors"
              >
                <ChevronRight
                  className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                    showProperties ? 'rotate-90' : 'rotate-0'
                  }`}
                />
              </button>
            </div>

            <div
              className={`transition-all duration-300 ${
                showProperties
                  ? 'opacity-100'
                  : 'max-h-0 opacity-0 overflow-hidden'
              }`}
            >
              <div
                className={`space-y-3 transition-transform duration-300 ${
                  showProperties ? 'translate-y-0 pt-2' : '-translate-y-2 pt-0'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Created</span>
                  <span className="text-sm">
                    {formatTimestamp(span.started_at)}
                  </span>
                </div>

                {spanType === 'generation' && span.span_data?.model && (
                  <>
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Model
                      </span>
                      <button
                        onClick={() =>
                          copyToClipboard(span.span_data?.model || '', 'model')
                        }
                        className="text-sm font-mono max-w-[270px] truncate hover:text-primary transition-colors flex items-center gap-2 group"
                      >
                        <span className="truncate relative pb-0.5 before:absolute before:bottom-0 before:left-0 before:right-0 before:h-[1px] before:bg-transparent group-hover:before:bg-[length:4px_1px] group-hover:before:bg-[repeating-linear-gradient(to_right,currentColor_0,currentColor_1px,transparent_1px,transparent_4px)]">
                          {span.span_data.model}
                        </span>
                        <div className="relative w-3 h-3 flex-shrink-0 flex items-center justify-center">
                          <Copy
                            className={`w-3 h-3 absolute transition-all duration-200 ${
                              copiedId === 'model'
                                ? 'opacity-0 scale-50'
                                : 'opacity-100 scale-100'
                            }`}
                          />
                          <Check
                            className={`w-3 h-3 absolute transition-all duration-300 delay-150 ${
                              copiedId === 'model'
                                ? 'opacity-100 scale-100'
                                : 'opacity-0 scale-50'
                            }`}
                          />
                        </div>
                      </button>
                    </div>
                    {span.span_data?.usage && (() => {
                      const usage = span.span_data.usage;
                      const inputTokens = usage.input_tokens || 0;
                      const outputTokens = usage.output_tokens || 0;
                      const cachedTokens = usage.input_tokens_details?.cached_tokens || 0;
                      const reasoningTokens = usage.output_tokens_details?.reasoning_tokens || 0;
                      const totalTokens = inputTokens + outputTokens;

                      return (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">
                              Input tokens
                            </span>
                            <span className="text-sm">
                              {inputTokens.toLocaleString()}
                            </span>
                          </div>
                          {cachedTokens > 0 && (
                            <div className="flex justify-between items-center pl-3">
                              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                Cached
                              </span>
                              <span className="text-xs text-blue-500 dark:text-blue-400 font-medium">
                                {cachedTokens.toLocaleString()}
                                <span className="text-muted-foreground font-normal ml-1">
                                  ({Math.round((cachedTokens / inputTokens) * 100)}%)
                                </span>
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">
                              Output tokens
                            </span>
                            <span className="text-sm">
                              {outputTokens.toLocaleString()}
                            </span>
                          </div>
                          {reasoningTokens > 0 && (
                            <div className="flex justify-between items-center pl-3">
                              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                Reasoning
                              </span>
                              <span className="text-xs text-amber-500 dark:text-amber-400 font-medium">
                                {reasoningTokens.toLocaleString()}
                                <span className="text-muted-foreground font-normal ml-1">
                                  ({Math.round((reasoningTokens / outputTokens) * 100)}%)
                                </span>
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between items-center pt-1 border-t border-border/50">
                            <span className="text-sm text-muted-foreground">
                              Total tokens
                            </span>
                            <span className="text-sm font-medium">
                              {totalTokens.toLocaleString()}
                            </span>
                          </div>
                        </>
                      );
                    })()}
                  </>
                )}

                {spanType === 'agent' && span.span_data?.output_type && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Output type
                    </span>
                    <span className="text-sm">
                      {span.span_data.output_type}
                    </span>
                  </div>
                )}

                {spanType === 'agent' && span.span_data?.usage && (() => {
                  const usage = span.span_data.usage;
                  const inputTokens = usage.input_tokens || 0;
                  const outputTokens = usage.output_tokens || 0;
                  const cachedTokens = usage.input_tokens_details?.cached_tokens || 0;
                  const reasoningTokens = usage.output_tokens_details?.reasoning_tokens || 0;
                  const totalTokens = inputTokens + outputTokens;

                  return (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          Input tokens
                        </span>
                        <span className="text-sm">
                          {inputTokens.toLocaleString()}
                        </span>
                      </div>
                      {cachedTokens > 0 && (
                        <div className="flex justify-between items-center pl-3">
                          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                            Cached
                          </span>
                          <span className="text-xs text-blue-500 dark:text-blue-400 font-medium">
                            {cachedTokens.toLocaleString()}
                            <span className="text-muted-foreground font-normal ml-1">
                              ({Math.round((cachedTokens / inputTokens) * 100)}%)
                            </span>
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          Output tokens
                        </span>
                        <span className="text-sm">
                          {outputTokens.toLocaleString()}
                        </span>
                      </div>
                      {reasoningTokens > 0 && (
                        <div className="flex justify-between items-center pl-3">
                          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            Reasoning
                          </span>
                          <span className="text-xs text-amber-500 dark:text-amber-400 font-medium">
                            {reasoningTokens.toLocaleString()}
                            <span className="text-muted-foreground font-normal ml-1">
                              ({Math.round((reasoningTokens / outputTokens) * 100)}%)
                            </span>
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-1 border-t border-border/50">
                        <span className="text-sm text-muted-foreground">
                          Total tokens
                        </span>
                        <span className="text-sm font-medium">
                          {totalTokens.toLocaleString()}
                        </span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>

        {spanType === 'agent' &&
          span.span_data?.handoffs &&
          span.span_data.handoffs.length > 0 && (
            <>
              <div className="w-full h-px bg-border" />
              <div className="space-y-3">
                <div className="px-8 py-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Handoffs</h3>
                    <button
                      onClick={() => setShowAgents(!showAgents)}
                      className="p-1 hover:bg-accent rounded transition-colors"
                    >
                      <ChevronRight
                        className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                          showAgents ? 'rotate-90' : 'rotate-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div
                    className={`transition-all duration-300 ${
                      showAgents
                        ? 'opacity-100'
                        : 'max-h-0 opacity-0 overflow-hidden'
                    }`}
                  >
                    <div
                      className={`transition-transform duration-300 ${
                        showAgents
                          ? 'translate-y-0 pt-2'
                          : '-translate-y-2 pt-0'
                      }`}
                    >
                      <div className="flex flex-col gap-2">
                        {span.span_data.handoffs.map(
                          (handoff: string, index: number) => (
                            <div key={index} className="text-sm">
                              {handoff}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

        {spanType === 'generation' && span.span_data?.input && (
          <>
            <div className="w-full h-px bg-border" />
            <div className="space-y-3">
              <div className="px-8 py-6">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-semibold">Input</h3>
                  <button
                    onClick={() => setShowInput(!showInput)}
                    className="p-1 hover:bg-accent rounded transition-colors"
                  >
                    <ChevronRight
                      className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                        showInput ? 'rotate-90' : 'rotate-0'
                      }`}
                    />
                  </button>
                </div>

                <div
                  className={`transition-all duration-300 ${
                    showInput
                      ? 'opacity-100'
                      : 'max-h-0 opacity-0 overflow-hidden'
                  }`}
                >
                  <div
                    className={`transition-transform duration-300 flex flex-col gap-2 ${
                      showInput ? 'translate-y-0 pt-2' : '-translate-y-2 pt-0'
                    }`}
                  >
                    {Array.isArray(span.span_data.input) &&
                      span.span_data.input.map(
                        (message: any, index: number) => (
                          <div key={index}>
                            <HighlightedJSON data={message} theme={theme} />
                          </div>
                        )
                      )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {spanType === 'generation' && span.span_data?.output && (
          <>
            <div className="w-full h-px bg-border" />
            <div className="space-y-3">
              <div className="px-8 py-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold mb-2">Output</h3>
                  <button
                    onClick={() => setShowOutput(!showOutput)}
                    className="p-1 hover:bg-accent rounded transition-colors"
                  >
                    <ChevronRight
                      className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                        showOutput ? 'rotate-90' : 'rotate-0'
                      }`}
                    />
                  </button>
                </div>

                <div
                  className={`transition-all duration-300 ${
                    showOutput
                      ? 'opacity-100'
                      : 'max-h-0 opacity-0 overflow-hidden'
                  }`}
                >
                  <div
                    className={`transition-transform duration-300 flex flex-col gap-2 ${
                      showOutput ? 'translate-y-0 pt-2' : '-translate-y-2 pt-0'
                    }`}
                  >
                    {Array.isArray(span.span_data.output) &&
                      span.span_data.output.map(
                        (output: any, index: number) => (
                          <div key={index}>
                            <HighlightedJSON data={output} theme={theme} />
                          </div>
                        )
                      )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {spanType === 'function' && (
          <>
            {span.span_data?.input && (
              <>
                <div className="w-full h-px bg-border" />
                <div className="space-y-3">
                  <div className="px-8 py-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold">Input</h3>
                      <button onClick={() => copyToClipboard(typeof span.span_data.input === 'string' ? span.span_data.input : JSON.stringify(span.span_data.input, null, 2), 'sec-input')} className="p-1 hover:bg-accent rounded transition-colors" title="Copy"><div className="relative w-3.5 h-3.5"><Copy className={`w-3.5 h-3.5 absolute transition-all duration-200 text-muted-foreground ${copiedId === 'sec-input' ? 'opacity-0 scale-50' : 'opacity-100 scale-100'}`} /><Check className={`w-3.5 h-3.5 absolute transition-all duration-300 delay-150 text-muted-foreground ${copiedId === 'sec-input' ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} /></div></button>
                    </div>
                    <HighlightedJSON
                      data={(() => { try { return JSON.parse(span.span_data.input); } catch { return span.span_data.input; } })()}
                      theme={theme}
                    />
                  </div>
                </div>
              </>
            )}
            {span.span_data?.output && (
              <>
                <div className="w-full h-px bg-border" />
                <div className="space-y-3">
                  <div className="px-8 py-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold">Output</h3>
                      <button onClick={() => copyToClipboard(typeof span.span_data.output === 'string' ? span.span_data.output : JSON.stringify(span.span_data.output, null, 2), 'sec-fn-output')} className="p-1 hover:bg-accent rounded transition-colors" title="Copy"><div className="relative w-3.5 h-3.5"><Copy className={`w-3.5 h-3.5 absolute transition-all duration-200 text-muted-foreground ${copiedId === 'sec-fn-output' ? 'opacity-0 scale-50' : 'opacity-100 scale-100'}`} /><Check className={`w-3.5 h-3.5 absolute transition-all duration-300 delay-150 text-muted-foreground ${copiedId === 'sec-fn-output' ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} /></div></button>
                    </div>
                    <HighlightedJSON
                      data={(() => { try { return JSON.parse(span.span_data.output); } catch { return span.span_data.output; } })()}
                      theme={theme}
                    />
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {spanType === 'response' && (
          <>
            {span.span_data?.model && (
              <>
                <div className="w-full h-px bg-border" />
                <div className="px-8 py-4">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">Model</span>
                    <span className="font-mono">{span.span_data.model}</span>
                    {span.span_data?.usage && (() => {
                      const usage = span.span_data.usage;
                      const cached = usage.input_tokens_details?.cached_tokens || 0;
                      return (
                        <span className="text-muted-foreground ml-auto flex items-center gap-1.5">
                          {usage.input_tokens?.toLocaleString()} in
                          {cached > 0 && (
                            <span className="text-blue-500 dark:text-blue-400 text-xs">
                              ({cached.toLocaleString()} cached)
                            </span>
                          )}
                          {' / '}
                          {usage.output_tokens?.toLocaleString()} out
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </>
            )}
            {span.span_data?.reasoning && (
              <>
                <div className="w-full h-px bg-border" />
                <div className="space-y-3">
                  <div className="px-8 py-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold">Reasoning</h3>
                      <button onClick={() => copyToClipboard(span.span_data.reasoning, 'sec-reasoning')} className="p-1 hover:bg-accent rounded transition-colors" title="Copy"><div className="relative w-3.5 h-3.5"><Copy className={`w-3.5 h-3.5 absolute transition-all duration-200 text-muted-foreground ${copiedId === 'sec-reasoning' ? 'opacity-0 scale-50' : 'opacity-100 scale-100'}`} /><Check className={`w-3.5 h-3.5 absolute transition-all duration-300 delay-150 text-muted-foreground ${copiedId === 'sec-reasoning' ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} /></div></button>
                    </div>
                    <pre className="text-sm whitespace-pre-wrap text-muted-foreground bg-muted/50 rounded-lg p-4 max-h-96 overflow-auto">{span.span_data.reasoning}</pre>
                  </div>
                </div>
              </>
            )}
            {span.span_data?.output && (
              <>
                <div className="w-full h-px bg-border" />
                <div className="space-y-3">
                  <div className="px-8 py-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold">Output</h3>
                      <button onClick={() => copyToClipboard(span.span_data.output, 'sec-output')} className="p-1 hover:bg-accent rounded transition-colors" title="Copy"><div className="relative w-3.5 h-3.5"><Copy className={`w-3.5 h-3.5 absolute transition-all duration-200 text-muted-foreground ${copiedId === 'sec-output' ? 'opacity-0 scale-50' : 'opacity-100 scale-100'}`} /><Check className={`w-3.5 h-3.5 absolute transition-all duration-300 delay-150 text-muted-foreground ${copiedId === 'sec-output' ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} /></div></button>
                    </div>
                    <pre className="text-sm whitespace-pre-wrap bg-muted/50 rounded-lg p-4 max-h-96 overflow-auto">{span.span_data.output}</pre>
                  </div>
                </div>
              </>
            )}
            {span.span_data?.tool_calls && span.span_data.tool_calls.length > 0 && (
              <>
                <div className="w-full h-px bg-border" />
                <div className="space-y-3">
                  <div className="px-8 py-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold">Tool Calls</h3>
                      <button onClick={() => copyToClipboard(JSON.stringify(span.span_data.tool_calls, null, 2), 'sec-toolcalls')} className="p-1 hover:bg-accent rounded transition-colors" title="Copy"><div className="relative w-3.5 h-3.5"><Copy className={`w-3.5 h-3.5 absolute transition-all duration-200 text-muted-foreground ${copiedId === 'sec-toolcalls' ? 'opacity-0 scale-50' : 'opacity-100 scale-100'}`} /><Check className={`w-3.5 h-3.5 absolute transition-all duration-300 delay-150 text-muted-foreground ${copiedId === 'sec-toolcalls' ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} /></div></button>
                    </div>
                    <HighlightedJSON data={span.span_data.tool_calls} theme={theme} />
                  </div>
                </div>
              </>
            )}
            {span.span_data?.input && (
              <>
                <div className="w-full h-px bg-border" />
                <div className="space-y-3">
                  <div className="px-8 py-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold">Input</h3>
                      <button onClick={() => copyToClipboard(typeof span.span_data.input === 'string' ? span.span_data.input : JSON.stringify(span.span_data.input, null, 2), 'sec-input')} className="p-1 hover:bg-accent rounded transition-colors" title="Copy"><div className="relative w-3.5 h-3.5"><Copy className={`w-3.5 h-3.5 absolute transition-all duration-200 text-muted-foreground ${copiedId === 'sec-input' ? 'opacity-0 scale-50' : 'opacity-100 scale-100'}`} /><Check className={`w-3.5 h-3.5 absolute transition-all duration-300 delay-150 text-muted-foreground ${copiedId === 'sec-input' ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} /></div></button>
                    </div>
                    {typeof span.span_data.input === 'string' ? (
                      <pre className="text-sm whitespace-pre-wrap bg-muted/50 rounded-lg p-4 max-h-96 overflow-auto">{span.span_data.input}</pre>
                    ) : (
                      <HighlightedJSON data={span.span_data.input} theme={theme} />
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {spanType === 'mcp_tools' && (
          <>
            {span.span_data?.server && (
              <>
                <div className="w-full h-px bg-border" />
                <div className="px-8 py-4">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Server</span>
                    <span className="font-mono ml-3">{span.span_data.server}</span>
                  </div>
                </div>
              </>
            )}
            {span.span_data?.result && (
              <>
                <div className="w-full h-px bg-border" />
                <div className="space-y-3">
                  <div className="px-8 py-6">
                    <h3 className="text-sm font-semibold mb-3">Tools ({span.span_data.result.length})</h3>
                    <div className="flex flex-wrap gap-2">
                      {span.span_data.result.map((tool: string, i: number) => (
                        <span key={i} className="text-xs font-mono px-2 py-1 rounded bg-muted">{tool}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {spanType === 'handoff' && (
          <>
            <div className="w-full h-px bg-border" />
            <div className="space-y-3">
              <div className="px-8 py-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Agents</h3>
                  <button
                    onClick={() => setShowHandoffAgents(!showHandoffAgents)}
                    className="p-1 hover:bg-accent rounded transition-colors"
                  >
                    <ChevronRight
                      className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                        showHandoffAgents ? 'rotate-90' : 'rotate-0'
                      }`}
                    />
                  </button>
                </div>

                <div
                  className={`transition-all duration-300 ${
                    showHandoffAgents
                      ? 'opacity-100'
                      : 'max-h-0 opacity-0 overflow-hidden'
                  }`}
                >
                  <div
                    className={`space-y-2 transition-transform duration-300 ${
                      showHandoffAgents
                        ? 'translate-y-0 pt-2'
                        : '-translate-y-2 pt-0'
                    }`}
                  >
                    {span.span_data?.from_agent && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-3 h-3 rounded-full border-2 border-current" />
                        {span.span_data.from_agent}
                      </div>
                    )}
                    {span.span_data?.to_agent && (
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="w-3 h-3" />
                        {span.span_data.to_agent}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </>
    );
  }
}
