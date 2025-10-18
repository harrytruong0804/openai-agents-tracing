import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { codeToHtml } from 'shiki';
import { useTheme } from '@/components/theme-provider';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

type Language = 'typescript' | 'python';

export default function SetupPage() {
  const { theme } = useTheme();
  const [selectedLanguage, setSelectedLanguage] =
    useState<Language>('typescript');
  const [highlightedCode, setHighlightedCode] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const typescriptCode = `const tracingExporter = new OpenAITracingExporter({
  endpoint: '<YOUR_SERVER_URL>/traces/event',
});
const batchTraceProcessor = new BatchTraceProcessor(tracingExporter);
setTraceProcessors([batchTraceProcessor]);`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(typescriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (selectedLanguage === 'typescript') {
      codeToHtml(typescriptCode, {
        lang: 'typescript',
        theme: theme === 'dark' ? 'github-dark' : 'github-light',
      }).then((html) => {
        setHighlightedCode(html);
      });
    }
  }, [selectedLanguage, theme]);

  return (
    <div className="flex-1 bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Setup</h1>
          <p className="text-muted-foreground">
            Full-stack tracing for OpenAI Agents
          </p>
        </div>

        <div className="mb-6 space-y-4">
          <p className="text-foreground">
            Welcome to OpenAI Tracing Dashboard! This is a cloud and on-premise
            deployable full-stack tracing application for agents that supports
            OpenAI agent libraries.
          </p>
          <p className="text-muted-foreground">
            You first need to deploy your instance or use the cloud version of
            the app. Then go to the start of your code and paste the following
            code below to the top of it:
          </p>
        </div>

        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="flex border-b border-border">
            <Button
              variant="ghost"
              onClick={() => setSelectedLanguage('typescript')}
              className={`rounded-none border-b-2 ${
                selectedLanguage === 'typescript'
                  ? 'border-primary bg-accent'
                  : 'border-transparent'
              }`}
            >
              TypeScript
            </Button>
            <Button
              variant="ghost"
              onClick={() => setSelectedLanguage('python')}
              className={`rounded-none border-b-2 ${
                selectedLanguage === 'python'
                  ? 'border-primary bg-accent'
                  : 'border-transparent'
              }`}
            >
              Python
            </Button>
          </div>

          <div className="p-6">
            {selectedLanguage === 'typescript' && (
              <div className="relative group">
                <button
                  onClick={copyToClipboard}
                  className="absolute top-3 right-3 p-2 rounded-md bg-muted hover:bg-accent border border-border transition-colors z-10"
                >
                  <div className="relative w-4 h-4 flex items-center justify-center">
                    <Copy
                      className={`w-4 h-4 absolute transition-all duration-200 ${
                        copied ? 'opacity-0 scale-50' : 'opacity-100 scale-100'
                      }`}
                    />
                    <Check
                      className={`w-4 h-4 absolute transition-all duration-300 delay-150 ${
                        copied ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                      }`}
                    />
                  </div>
                </button>
                <div
                  className="rounded-lg overflow-x-auto [&>pre]:!bg-muted [&>pre]:!p-4 [&>pre]:!m-0 [&>pre]:!border [&>pre]:!border-border"
                  dangerouslySetInnerHTML={{ __html: highlightedCode }}
                />
              </div>
            )}

            {selectedLanguage === 'python' && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  Python support coming soon...
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6">
          <p className="text-muted-foreground">
            After adding the code, run your workflow and check the{' '}
            <Link
              to="/traces"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              Traces
              <ExternalLink className="w-3 h-3" />
            </Link>{' '}
            page to see your data. Note that traces may take up to a minute to
            appear, as the OpenAI agent library sends events in batches after
            execution.
          </p>
        </div>

        <div className="mt-6 text-center">
          <p className="text-lg font-medium text-foreground">
            Done! You're ready to go. 🎉
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Start building with full visibility into your agent workflows.
          </p>
        </div>
      </div>
    </div>
  );
}
