import React from "react";

// Format markdown-like text for agent responses
export function formatMarkdown(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let inList = false;
  let isNumberedList = false;
  let listItems: React.ReactNode[] = [];

  const processList = () => {
    if (listItems.length > 0) {
      if (isNumberedList) {
        elements.push(
          <ol
            key={`list-${elements.length}`}
            className="list-decimal list-inside space-y-1.5 my-2 ml-4"
          >
            {listItems}
          </ol>
        );
      } else {
        elements.push(
          <ul
            key={`list-${elements.length}`}
            className="list-disc list-inside space-y-1.5 my-2 ml-4"
          >
            {listItems}
          </ul>
        );
      }
      listItems = [];
      inList = false;
      isNumberedList = false;
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Headers
    if (trimmed.startsWith("### ")) {
      processList();
      elements.push(
        <h3
          key={`h3-${index}`}
          className="font-semibold text-base mt-4 mb-2 text-foreground"
        >
          {trimmed.slice(4)}
        </h3>
      );
    } else if (trimmed.startsWith("## ")) {
      processList();
      elements.push(
        <h2
          key={`h2-${index}`}
          className="font-bold text-lg mt-5 mb-3 text-foreground"
        >
          {trimmed.slice(3)}
        </h2>
      );
    } else if (trimmed.startsWith("# ")) {
      processList();
      elements.push(
        <h1
          key={`h1-${index}`}
          className="font-bold text-xl mt-6 mb-4 text-foreground"
        >
          {trimmed.slice(2)}
        </h1>
      );
    }
    // Section headers (text ending with colon, not part of a list, and not too long)
    else if (
      trimmed.endsWith(":") &&
      !trimmed.match(/^[-*]\s+/) &&
      !trimmed.match(/^\d+\.\s+/) &&
      trimmed.length < 100 &&
      trimmed.length > 3
    ) {
      processList();
      elements.push(
        <h3
          key={`section-${index}`}
          className="font-semibold text-base mt-4 mb-2 text-foreground"
        >
          {trimmed}
        </h3>
      );
    }
    // Bullet points
    else if (trimmed.match(/^[-*]\s+/)) {
      if (!inList || isNumberedList) {
        processList();
        inList = true;
        isNumberedList = false;
      }
      const content = trimmed.replace(/^[-*]\s+/, "");
      listItems.push(
        <li key={`item-${listItems.length}`} className="text-sm mb-1">
          {formatInlineMarkdown(content)}
        </li>
      );
    }
    // Numbered lists
    else if (trimmed.match(/^\d+\.\s+/)) {
      if (!inList || !isNumberedList) {
        processList();
        inList = true;
        isNumberedList = true;
      }
      const content = trimmed.replace(/^\d+\.\s+/, "");
      listItems.push(
        <li key={`item-${listItems.length}`} className="text-sm mb-1">
          {formatInlineMarkdown(content)}
        </li>
      );
    }
    // Regular paragraphs
    else if (trimmed) {
      processList();
      elements.push(
        <p key={`p-${index}`} className="mb-2 text-sm leading-relaxed">
          {formatInlineMarkdown(trimmed)}
        </p>
      );
    } else {
      processList();
      // Add spacing for empty lines (but avoid consecutive breaks)
      if (elements.length > 0) {
        const lastElement = elements[elements.length - 1];
        if (
          !React.isValidElement(lastElement) ||
          (React.isValidElement(lastElement) && lastElement.type !== "br")
        ) {
          elements.push(<br key={`br-${index}`} />);
        }
      }
    }
  });

  processList();
  return elements.length > 0
    ? elements
    : [
        <p key="empty" className="text-sm">
          {text}
        </p>,
      ];
}

// Format inline markdown (bold, links, URLs)
function formatInlineMarkdown(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  const processedIndices: Array<{ start: number; end: number; type: string }> =
    [];

  // Match markdown links [text](url)
  const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match: RegExpExecArray | null;

  while ((match = markdownLinkRegex.exec(text)) !== null) {
    processedIndices.push({
      start: match.index,
      end: match.index + match[0].length,
      type: "markdown-link",
    });
  }

  // Match bold text **text**
  const boldRegex = /\*\*(.+?)\*\*/g;
  while ((match = boldRegex.exec(text)) !== null) {
    // Check if this bold text overlaps with a link
    const overlaps = processedIndices.some(
      (p) => match!.index < p.end && match!.index + match![0].length > p.start
    );
    if (!overlaps) {
      processedIndices.push({
        start: match.index,
        end: match.index + match[0].length,
        type: "bold",
      });
    }
  }

  // Match URLs (http/https)
  const urlRegex = /(https?:\/\/[^\s\)]+)/g;
  while ((match = urlRegex.exec(text)) !== null) {
    // Check if this URL is already part of a markdown link
    const isInMarkdownLink = processedIndices.some(
      (p) =>
        p.type === "markdown-link" &&
        match!.index >= p.start &&
        match!.index < p.end
    );
    if (!isInMarkdownLink) {
      processedIndices.push({
        start: match.index,
        end: match.index + match[0].length,
        type: "url",
      });
    }
  }

  // Sort by start index
  processedIndices.sort((a, b) => a.start - b.start);

  // Process all matches
  processedIndices.forEach((processed) => {
    // Add text before the match
    if (processed.start > lastIndex) {
      parts.push(text.slice(lastIndex, processed.start));
    }

    const matchText = text.slice(processed.start, processed.end);

    if (processed.type === "markdown-link") {
      const linkMatch = matchText.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        parts.push(
          <a
            key={`link-${parts.length}`}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            {linkMatch[1]}
          </a>
        );
      }
    } else if (processed.type === "bold") {
      const boldMatch = matchText.match(/\*\*(.+?)\*\*/);
      if (boldMatch) {
        parts.push(
          <strong key={`bold-${parts.length}`} className="font-semibold">
            {boldMatch[1]}
          </strong>
        );
      }
    } else if (processed.type === "url") {
      parts.push(
        <a
          key={`url-${parts.length}`}
          href={matchText}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline break-all"
        >
          {matchText}
        </a>
      );
    }

    lastIndex = processed.end;
  });

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

// Parse and format observation content (especially search results)
export function formatObservation(content: string): React.ReactNode {
  // Check if it looks like search results with numbered format
  // Pattern: "1. **Title** Description\nURL"
  const lines = content.split("\n");
  const searchResults: Array<{
    title: string;
    description: string;
    url: string;
  }> = [];
  let currentResult: {
    title: string;
    description: string;
    url: string;
  } | null = null;

  for (const line of lines) {
    const numberedMatch = line.match(/^(\d+)\.\s+\*\*([^*]+)\*\*(.*)$/);
    if (numberedMatch) {
      // Save previous result if exists
      if (currentResult) {
        searchResults.push(currentResult);
      }
      // Start new result
      const restOfLine = numberedMatch[3].trim();
      currentResult = {
        title: numberedMatch[2],
        description: restOfLine,
        url: "",
      };
    } else if (currentResult) {
      // Check if this line is a URL (handle "URL:" prefix)
      const urlMatch = line.match(/(?:URL:\s*)?(https?:\/\/[^\s]+)/i);
      if (urlMatch) {
        currentResult.url = urlMatch[1];
        searchResults.push(currentResult);
        currentResult = null;
      } else if (line.trim() && !line.trim().match(/^URL:/i)) {
        // Add to description (skip lines that are just "URL:")
        currentResult.description +=
          (currentResult.description ? " " : "") + line.trim();
      }
    }
  }

  // Add last result if exists
  if (currentResult) {
    searchResults.push(currentResult);
  }

  if (searchResults.length > 0) {
    // Format as search result cards
    return (
      <div className="space-y-3">
        {searchResults.map((result, index) => (
          <div
            key={index}
            className="border border-border/40 rounded-lg p-3.5 bg-background/50 hover:bg-background/70 hover:border-border/60 transition-all"
          >
            <div className="flex items-start gap-2.5">
              <span className="text-xs font-semibold text-muted-foreground mt-0.5 flex-shrink-0 w-5">
                {index + 1}.
              </span>
              <div className="flex-1 min-w-0">
                {result.title && (
                  <h4 className="font-semibold text-sm text-foreground mb-1.5 leading-snug">
                    {result.title}
                  </h4>
                )}
                {result.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                    {result.description}
                  </p>
                )}
                {result.url && (
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 hover:underline break-all font-medium group"
                  >
                    <svg
                      className="h-3.5 w-3.5 flex-shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                    <span className="truncate max-w-full">{result.url}</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Regular observation text - detect and convert URLs to links
  return formatTextWithLinks(content);
}

// Format text with clickable links
function formatTextWithLinks(text: string): React.ReactNode {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = urlRegex.exec(text)) !== null) {
    // Add text before the URL
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    // Add clickable link
    const url = match[1];
    parts.push(
      <a
        key={`link-${parts.length}`}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline break-all"
      >
        {url}
      </a>
    );
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return (
    <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
      {parts.length > 0 ? parts : text}
    </div>
  );
}
