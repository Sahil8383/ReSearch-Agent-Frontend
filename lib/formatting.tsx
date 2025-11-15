import React from "react";

// Format markdown-like text for agent responses
export function formatMarkdown(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let inList = false;
  let listItems: React.ReactNode[] = [];

  const processList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul
          key={`list-${elements.length}`}
          className="list-disc list-inside space-y-1 my-2 ml-4"
        >
          {listItems}
        </ul>
      );
      listItems = [];
      inList = false;
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
    // Bullet points
    else if (trimmed.match(/^[-*]\s+/)) {
      if (!inList) {
        processList();
        inList = true;
      }
      const content = trimmed.replace(/^[-*]\s+/, "");
      listItems.push(
        <li key={`item-${listItems.length}`} className="text-sm">
          {formatInlineMarkdown(content)}
        </li>
      );
    }
    // Numbered lists
    else if (trimmed.match(/^\d+\.\s+/)) {
      if (!inList) {
        processList();
        inList = true;
      }
      const content = trimmed.replace(/^\d+\.\s+/, "");
      listItems.push(
        <li key={`item-${listItems.length}`} className="text-sm">
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

// Format inline markdown (bold, links)
function formatInlineMarkdown(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  // Match bold text **text**
  const boldRegex = /\*\*(.+?)\*\*/g;
  let match;

  while ((match = boldRegex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    // Add bold text
    parts.push(
      <strong key={`bold-${parts.length}`} className="font-semibold">
        {match[1]}
      </strong>
    );
    lastIndex = match.index + match[0].length;
  }

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
      // Check if this line is a URL
      const urlMatch = line.match(/(https?:\/\/[^\s]+)/);
      if (urlMatch) {
        currentResult.url = urlMatch[1];
        searchResults.push(currentResult);
        currentResult = null;
      } else if (line.trim()) {
        // Add to description
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
            className="border border-border/40 rounded-lg p-3 bg-background/50 hover:bg-background/70 transition-colors"
          >
            <div className="flex items-start gap-2">
              <span className="text-xs font-semibold text-muted-foreground mt-0.5 flex-shrink-0">
                {index + 1}.
              </span>
              <div className="flex-1 min-w-0">
                {result.title && (
                  <h4 className="font-semibold text-sm text-foreground mb-1">
                    {result.title}
                  </h4>
                )}
                {result.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed mb-1">
                    {result.description}
                  </p>
                )}
                {result.url && (
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline break-all"
                  >
                    {result.url}
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Regular observation text
  return (
    <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
      {content}
    </div>
  );
}
