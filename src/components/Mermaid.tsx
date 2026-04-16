import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'neutral',
  securityLevel: 'loose',
  suppressErrorRendering: true,
  logLevel: 'error',
  maxTextSize: 100000,
  htmlLabels: true,
  flowchart: {
    htmlLabels: true,
    curve: 'basis',
    nodeSpacing: 60,
    rankSpacing: 60,
    padding: 20,
  },
  themeCSS: `
    .node rect, .node circle, .node ellipse, .node polygon, .node path {
      fill: #f8f4e6;
      stroke: #d7c4bb;
      stroke-width: 1px;
    }
    .edgePath .path {
      stroke: #9b7cb9;
      stroke-width: 1.5px;
    }
    .edgeLabel {
      background-color: transparent;
      color: #333333;
      p {
        background-color: transparent !important;
      }
    }
    .label {
      color: #333333;
    }
    .cluster rect {
      fill: #f8f4e6;
      stroke: #d7c4bb;
      stroke-width: 1px;
    }
    .actor {
      fill: #f8f4e6;
      stroke: #d7c4bb;
      stroke-width: 1px;
    }
    text.actor {
      fill: #333333;
      stroke: none;
    }
    .messageText {
      fill: #333333;
      stroke: none;
    }
    .messageLine0, .messageLine1 {
      stroke: #9b7cb9;
    }
    .noteText {
      fill: #333333;
    }
    [data-theme="dark"] .node rect,
    [data-theme="dark"] .node circle,
    [data-theme="dark"] .node ellipse,
    [data-theme="dark"] .node polygon,
    [data-theme="dark"] .node path {
      fill: #222222;
      stroke: #5d4037;
    }
    [data-theme="dark"] .edgePath .path {
      stroke: #9370db;
    }
    [data-theme="dark"] .edgeLabel {
      background-color: transparent;
      color: #f0f0f0;
    }
    [data-theme="dark"] .label {
      color: #f0f0f0;
    }
    [data-theme="dark"] .cluster rect {
      fill: #222222;
      stroke: #5d4037;
    }
    [data-theme="dark"] .flowchart-link {
      stroke: #9370db;
    }
    [data-theme="dark"] .actor {
      fill: #222222;
      stroke: #5d4037;
    }
    [data-theme="dark"] text.actor {
      fill: #f0f0f0;
      stroke: none;
    }
    [data-theme="dark"] .messageText {
      fill: #f0f0f0;
      stroke: none;
      font-weight: 500;
    }
    [data-theme="dark"] .messageLine0, [data-theme="dark"] .messageLine1 {
      stroke: #9370db;
      stroke-width: 1.5px;
    }
    [data-theme="dark"] .noteText {
      fill: #f0f0f0;
    }
    [data-theme="dark"] #sequenceNumber {
      fill: #f0f0f0;
    }
    [data-theme="dark"] text.sequenceText {
      fill: #f0f0f0;
      font-weight: 500;
    }
    [data-theme="dark"] text.loopText, [data-theme="dark"] text.loopText tspan {
      fill: #f0f0f0;
    }
    [data-theme="dark"] .messageText, [data-theme="dark"] text.sequenceText {
      paint-order: stroke;
      stroke: #1a1a1a;
      stroke-width: 2px;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    text[text-anchor][dominant-baseline],
    text[text-anchor][alignment-baseline],
    .nodeLabel,
    .edgeLabel,
    .label,
    text {
      fill: #777 !important;
    }
    [data-theme="dark"] text[text-anchor][dominant-baseline],
    [data-theme="dark"] text[text-anchor][alignment-baseline],
    [data-theme="dark"] .nodeLabel,
    [data-theme="dark"] .edgeLabel,
    [data-theme="dark"] .label,
    [data-theme="dark"] text {
      fill: #f0f0f0 !important;
    }
    .clickable {
      transition: all 0.3s ease;
    }
    .clickable:hover {
      transform: scale(1.03);
      cursor: pointer;
    }
    .clickable:hover > * {
      filter: brightness(0.95);
    }
  `,
  fontFamily: 'var(--font-geist-sans), var(--font-serif-jp), sans-serif',
  fontSize: 12,
});

interface MermaidProps {
  chart: string;
  className?: string;
  zoomingEnabled?: boolean;
  deferUntilVisible?: boolean;
  estimatedHeight?: number;
}

const DEFAULT_ESTIMATED_HEIGHT = 280;

const FullScreenModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ isOpen, onClose, children }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setZoom(1);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <div
        ref={modalRef}
        className="card-japanese flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg bg-[var(--card-bg)] shadow-custom"
      >
        <div className="flex items-center justify-between border-b border-[var(--border-color)] p-4">
          <div className="font-medium text-[var(--foreground)]">Diagram</div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                className="rounded-md border border-[var(--border-color)] p-2 text-[var(--foreground)] transition-colors hover:bg-[var(--accent-primary)]/10"
                aria-label="Zoom out"
                type="button"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  <line x1="8" y1="11" x2="14" y2="11"></line>
                </svg>
              </button>
              <span className="text-sm text-[var(--muted)]">{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom(Math.min(2, zoom + 0.1))}
                className="rounded-md border border-[var(--border-color)] p-2 text-[var(--foreground)] transition-colors hover:bg-[var(--accent-primary)]/10"
                aria-label="Zoom in"
                type="button"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  <line x1="11" y1="8" x2="11" y2="14"></line>
                  <line x1="8" y1="11" x2="14" y2="11"></line>
                </svg>
              </button>
              <button
                onClick={() => setZoom(1)}
                className="rounded-md border border-[var(--border-color)] p-2 text-[var(--foreground)] transition-colors hover:bg-[var(--accent-primary)]/10"
                aria-label="Reset zoom"
                type="button"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path>
                  <path d="M21 3v5h-5"></path>
                </svg>
              </button>
            </div>
            <button
              onClick={onClose}
              className="rounded-md border border-[var(--border-color)] p-2 text-[var(--foreground)] transition-colors hover:bg-[var(--accent-primary)]/10"
              aria-label="Close"
              type="button"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center overflow-auto bg-[var(--background)]/50 p-6">
          <div
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
              transition: 'transform 0.3s ease-out',
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

const Mermaid: React.FC<MermaidProps> = ({
  chart,
  className = '',
  zoomingEnabled = false,
  deferUntilVisible = true,
  estimatedHeight = DEFAULT_ESTIMATED_HEIGHT,
}) => {
  const [svg, setSvg] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasEnteredViewport, setHasEnteredViewport] = useState(!deferUntilVisible);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const mermaidRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(`mermaid-${Math.random().toString(36).substring(2, 9)}`);
  const panZoomInstanceRef = useRef<{ destroy?: () => void } | null>(null);

  useEffect(() => {
    if (!deferUntilVisible) {
      setHasEnteredViewport(true);
      return;
    }

    const node = containerRef.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        const nextVisible = entries.some(entry => entry.isIntersecting);
        if (nextVisible) {
          setHasEnteredViewport(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '320px 0px',
      }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [deferUntilVisible]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const updateTheme = () => {
      const explicitTheme = document.documentElement.getAttribute('data-theme');
      if (explicitTheme === 'dark') {
        setIsDarkMode(true);
        return;
      }

      setIsDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
    };

    updateTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleColorSchemeChange = () => updateTheme();
    const mutationObserver = new MutationObserver(() => updateTheme());

    mediaQuery.addEventListener('change', handleColorSchemeChange);
    mutationObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => {
      mediaQuery.removeEventListener('change', handleColorSchemeChange);
      mutationObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!svg || !zoomingEnabled || !containerRef.current) {
      return;
    }

    let isDisposed = false;

    const initializePanZoom = async () => {
      const svgElement = containerRef.current?.querySelector('svg');
      if (!svgElement || isDisposed) {
        return;
      }

      svgElement.style.maxWidth = 'none';
      svgElement.style.width = '100%';
      svgElement.style.height = '100%';

      try {
        const svgPanZoom = (await import('svg-pan-zoom')).default;
        panZoomInstanceRef.current?.destroy?.();
        panZoomInstanceRef.current = svgPanZoom(svgElement, {
          zoomEnabled: true,
          controlIconsEnabled: true,
          fit: true,
          center: true,
          minZoom: 0.1,
          maxZoom: 10,
          zoomScaleSensitivity: 0.3,
        });
      } catch (loadError) {
        console.error('Failed to load svg-pan-zoom:', loadError);
      }
    };

    const timer = window.setTimeout(() => {
      void initializePanZoom();
    }, 100);

    return () => {
      isDisposed = true;
      window.clearTimeout(timer);
      panZoomInstanceRef.current?.destroy?.();
      panZoomInstanceRef.current = null;
    };
  }, [svg, zoomingEnabled]);

  useEffect(() => {
    if (!chart || !hasEnteredViewport) {
      return;
    }

    let isMounted = true;
    const renderId = `${idRef.current}-${isDarkMode ? 'dark' : 'light'}-${Math.random().toString(36).slice(2, 6)}`;
    const timer = window.setTimeout(async () => {
      if (!isMounted) {
        return;
      }

      try {
        setError(null);
        setSvg('');

        const { svg: renderedSvg } = await mermaid.render(renderId, chart);

        if (!isMounted) {
          return;
        }

        const themedSvg = isDarkMode
          ? renderedSvg.replace('<svg ', '<svg data-theme="dark" ')
          : renderedSvg.replace(' data-theme="dark"', '');

        setSvg(themedSvg);
      } catch (renderError) {
        console.error('Mermaid rendering error:', renderError);
        const errorMessage = renderError instanceof Error ? renderError.message : String(renderError);

        if (!isMounted) {
          return;
        }

        setError(`Failed to render diagram: ${errorMessage}`);

        if (mermaidRef.current) {
          mermaidRef.current.innerHTML = `
            <div class="mb-1 text-xs text-red-500 dark:text-red-400">Syntax error in diagram</div>
            <pre class="overflow-auto rounded bg-gray-100 p-2 text-xs dark:bg-gray-800">${chart}</pre>
          `;
        }
      }
    }, 16);

    return () => {
      isMounted = false;
      window.clearTimeout(timer);
    };
  }, [chart, hasEnteredViewport, isDarkMode]);

  const handleDiagramClick = () => {
    if (!error && svg) {
      setIsFullscreen(true);
    }
  };

  const containerStyle = { minHeight: `${estimatedHeight}px` };

  if (error) {
    return (
      <div
        className={`rounded-md border border-[var(--highlight)]/30 bg-[var(--highlight)]/5 p-4 ${className}`}
        style={containerStyle}
      >
        <div className="mb-3 flex items-center">
          <div className="flex items-center text-xs font-medium text-[var(--highlight)]">
            <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Diagram rendering error
          </div>
        </div>
        <div ref={mermaidRef} className="overflow-auto text-xs"></div>
      </div>
    );
  }

  if (!svg) {
    return (
      <div
        ref={containerRef}
        className={`flex items-center justify-center rounded-md border border-dashed border-[var(--border-color)]/70 bg-[var(--background)]/40 p-4 ${className}`}
        style={containerStyle}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-[var(--accent-primary)]/70"></div>
            <div className="delay-75 h-2 w-2 animate-pulse rounded-full bg-[var(--accent-primary)]/70"></div>
            <div className="delay-150 h-2 w-2 animate-pulse rounded-full bg-[var(--accent-primary)]/70"></div>
          </div>
          <div className="max-w-sm text-xs text-[var(--muted)]">
            {hasEnteredViewport
              ? 'Rendering diagram...'
              : 'Diagram rendering is deferred until this section is near the viewport.'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        ref={containerRef}
        className={`w-full max-w-full ${zoomingEnabled ? 'h-[600px] p-4' : ''}`}
        style={containerStyle}
      >
        <div className={`group relative ${zoomingEnabled ? 'h-full rounded-lg border-2 border-black/10' : ''}`}>
          <div
            className={`my-2 flex cursor-pointer justify-center overflow-auto rounded-md text-center transition-shadow duration-200 hover:shadow-md ${className} ${zoomingEnabled ? 'h-full' : ''}`}
            dangerouslySetInnerHTML={{ __html: svg }}
            onClick={zoomingEnabled ? undefined : handleDiagramClick}
            title={zoomingEnabled ? undefined : 'Click to view fullscreen'}
          />

          {!zoomingEnabled && (
            <div className="pointer-events-none absolute top-2 right-2 flex items-center gap-1.5 rounded-md bg-gray-700/70 p-1.5 text-xs text-white opacity-0 shadow-md transition-opacity duration-200 group-hover:opacity-100 dark:bg-gray-900/70">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                <line x1="11" y1="8" x2="11" y2="14"></line>
                <line x1="8" y1="11" x2="14" y2="11"></line>
              </svg>
              <span>Click to zoom</span>
            </div>
          )}
        </div>
      </div>

      {!zoomingEnabled && (
        <FullScreenModal
          isOpen={isFullscreen}
          onClose={() => setIsFullscreen(false)}
        >
          <div dangerouslySetInnerHTML={{ __html: svg }} />
        </FullScreenModal>
      )}
    </>
  );
};

export default Mermaid;
