import React, { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  oneDark,
  oneLight,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  Eye,
  EyeOff,
  FileText,
  Hash,
  Layers,
  Search,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMobile } from "@/hooks/use_mobile";
import { useTheme } from "@/hooks/use_theme";

interface DocFile {
  name: string;
  path: string;
  title: string;
  content?: string;
  lastUpdated?: string;
  version?: string;
  category?: string;
}

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

/**
 * Extract table of contents from markdown content
 */
function extractTOC(content: string): TOCItem[] {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const toc: TOCItem[] = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    toc.push({ id, text, level });
  }

  return toc;
}

/**
 * Categorize document from metadata or filename
 */
function categorizeDoc(name: string, content: string): string {
  // Extract from metadata (preferred)
  const categoryMatch = content.match(/\*\*Category:\*\*\s+(.+)/i);
  if (categoryMatch) {
    return categoryMatch[1].trim();
  }

  // Infer from filename
  const keywords = {
    Platform: ["PLATFORM", "INTRODUCTION", "OVERVIEW", "README"],
    Developer: ["DEVELOPER", "ONBOARDING", "NODE", "ACCESS"],
    Marketing: ["MARKETING", "BLOG", "LANDING", "QUICK_START"],
    Updates: ["UPDATE", "SUMMARY", "WEB5", "MOBILE", "COMPLETE", "DOCS"],
  };

  for (const [category, words] of Object.entries(keywords)) {
    if (words.some((word) => name.toUpperCase().includes(word))) {
      return category;
    }
  }

  return "General";
}

/**
 * Get category color
 */
function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    Platform:
      "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
    Developer:
      "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    Marketing:
      "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
    Updates:
      "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  };

  return (
    colors[category] ||
    "bg-zinc-500/10 text-zinc-700 dark:text-zinc-400 border-zinc-500/20"
  );
}

/**
 * Docs Application
 */
export function Docs(): React.ReactElement {
  const isMobile = useMobile();
  const { resolvedTheme } = useTheme();
  const [docs, setDocs] = useState<DocFile[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<DocFile | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [tocOpen, setTocOpen] = useState(!isMobile);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [readingMode, setReadingMode] = useState(false);
  const [fontSize, setFontSize] = useState<"sm" | "base" | "lg">("base");
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Extract TOC
  const toc = useMemo(() => {
    if (!selectedDoc?.content) return [];
    return extractTOC(selectedDoc.content);
  }, [selectedDoc]);

  // Get prose size class
  const getProseSize = (): string => {
    if (fontSize === "sm") return "prose-sm";
    if (fontSize === "lg") return "prose-lg";
    return "prose-base";
  };

  // Toggle reading mode
  const toggleReadingMode = (): void => {
    setReadingMode(!readingMode);
    if (!readingMode) {
      setSidebarOpen(false);
      setTocOpen(false);
    } else {
      setSidebarOpen(true);
      setTocOpen(true);
    }
  };

  // Load all markdown files
  useEffect(() => {
    const loadDocs = async (): Promise<void> => {
      try {
        const docModules = import.meta.glob("@/assets/docs/*.md", {
          query: "?raw",
          import: "default",
          eager: true,
        });

        const loadedDocs: DocFile[] = [];

        for (const [path, content] of Object.entries(docModules)) {
          const fileName = path.split("/").pop() || "";
          const name = fileName.replace(".md", "");

          const titleMatch = (content as string).match(/^#\s+(.+)$/m);
          const title = titleMatch ? titleMatch[1] : name;

          const dateMatch = (content as string).match(
            /\*\*(?:Last Updated|Date):\*\*\s+(.+)/i,
          );
          const lastUpdated = dateMatch ? dateMatch[1] : undefined;

          const versionMatch = (content as string).match(
            /\*\*Version:\*\*\s+(.+)/i,
          );
          const version = versionMatch ? versionMatch[1] : undefined;

          const category = categorizeDoc(name, content as string);

          loadedDocs.push({
            name,
            path,
            title,
            content: content as string,
            lastUpdated,
            version,
            category,
          });
        }

        // Sort by category then title
        const sortedDocs = loadedDocs.sort((a, b) => {
          const preferredOrder = [
            "Platform",
            "Developer",
            "Updates",
            "Marketing",
          ];
          const catA = a.category || "General";
          const catB = b.category || "General";
          const indexA = preferredOrder.indexOf(catA);
          const indexB = preferredOrder.indexOf(catB);

          if (indexA !== -1 && indexB !== -1 && indexA !== indexB) {
            return indexA - indexB;
          }
          if (indexA !== -1 && indexB === -1) return -1;
          if (indexB !== -1 && indexA === -1) return 1;
          if (catA !== catB) return catA.localeCompare(catB);
          return a.title.localeCompare(b.title);
        });

        setDocs(sortedDocs);
        if (sortedDocs.length > 0) {
          setSelectedDoc(sortedDocs[0]);
        }
      } catch (error) {
        console.error("[Docs] Error loading:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDocs();
  }, []);

  // Filter docs
  const filteredDocs = useMemo(() => {
    let filtered = docs;

    if (selectedCategory !== "all") {
      filtered = filtered.filter((doc) => doc.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (doc) =>
          doc.title.toLowerCase().includes(query) ||
          doc.name.toLowerCase().includes(query) ||
          doc.content?.toLowerCase().includes(query),
      );
    }

    return filtered;
  }, [docs, searchQuery, selectedCategory]);

  // Get categories
  const categories = useMemo(() => {
    const cats = new Set(docs.map((doc) => doc.category || "General"));
    return ["all", ...Array.from(cats).sort()];
  }, [docs]);

  // Scroll to heading
  const scrollToHeading = (id: string): void => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground font-mono">
            Loading documentation...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex bg-background relative overflow-hidden">
      {/* Mobile Backdrop */}
      {isMobile && mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Floating Menu Button */}
      {(!sidebarOpen || (isMobile && !mobileMenuOpen)) && selectedDoc && (
        <button
          onClick={() =>
            isMobile ? setMobileMenuOpen(true) : setSidebarOpen(true)}
          className="fixed top-4 left-4 z-10 p-2.5 bg-card border border-border rounded-lg hover:bg-muted active:scale-95 transition-all shadow-lg"
        >
          <Layers className="w-5 h-5 text-amber-500" />
        </button>
      )}

      {/* Sidebar */}
      {((isMobile && mobileMenuOpen) || (!isMobile && sidebarOpen)) && (
        <div
          className={`border-r border-border flex flex-col bg-card/30 ${
            isMobile
              ? "fixed inset-y-0 left-0 w-[85%] max-w-sm z-50 shadow-2xl"
              : "w-80"
          }`}
        >
          {/* Mobile Header */}
          {isMobile && (
            <div className="p-4 border-b border-border flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-500" />
                <span className="font-semibold">Documents</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(false)}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Search and Filters */}
          <div className="p-4 border-b border-border space-y-3 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 font-mono text-sm"
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                    selectedCategory === cat
                      ? getCategoryColor(cat)
                      : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted"
                  }`}
                >
                  {cat === "all" ? "All" : cat}
                </button>
              ))}
            </div>

            <p className="text-xs text-muted-foreground font-mono">
              {filteredDocs.length}{" "}
              document{filteredDocs.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Document List */}
          <ScrollArea className="flex-1 h-0">
            <div className="p-2 min-h-full">
              {filteredDocs.map((doc) => (
                <button
                  key={doc.path}
                  onClick={() => {
                    setSelectedDoc(doc);
                    if (isMobile) setMobileMenuOpen(false);
                  }}
                  className={`group w-full text-left p-3.5 rounded-lg mb-1.5 transition-all active:scale-98 ${
                    selectedDoc?.path === doc.path
                      ? "bg-amber-500/10 border border-amber-500/20"
                      : "hover:bg-muted/70 border border-transparent"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <FileText
                      className={`w-4 h-4 mt-1 flex-shrink-0 ${
                        selectedDoc?.path === doc.path
                          ? "text-amber-500"
                          : "text-muted-foreground group-hover:text-foreground"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <h3
                        className={`text-sm font-medium mb-2 line-clamp-2 break-words ${
                          selectedDoc?.path === doc.path
                            ? "text-amber-500"
                            : "text-foreground group-hover:text-amber-500"
                        }`}
                      >
                        {doc.title}
                      </h3>
                      <div className="flex flex-wrap gap-2 text-xs">
                        {doc.category && (
                          <Badge
                            variant="outline"
                            className={`${
                              getCategoryColor(doc.category)
                            } px-2 py-0.5 text-[10px]`}
                          >
                            {doc.category}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {selectedDoc?.path === doc.path && (
                      <ChevronRight className="w-4 h-4 text-amber-500 flex-shrink-0 mt-1" />
                    )}
                  </div>
                </button>
              ))}

              {filteredDocs.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm text-muted-foreground">No documents</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedDoc
          ? (
            <>
              {/* Header */}
              <div
                className={`border-b border-border bg-card/50 flex-shrink-0 ${
                  isMobile ? "px-4 py-4" : "px-8 py-5"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  {/* Breadcrumbs */}
                  <div
                    className={`flex items-center gap-2 font-mono ${
                      isMobile ? "text-xs" : "text-sm"
                    } text-muted-foreground`}
                  >
                    {!isMobile && <Layers className="w-3.5 h-3.5" />}
                    {!isMobile && (
                      <>
                        <span>Docs</span>
                        <ChevronRight className="w-3 h-3" />
                      </>
                    )}
                    {selectedDoc.category && (
                      <>
                        <span>{selectedDoc.category}</span>
                        <ChevronRight className="w-3 h-3" />
                      </>
                    )}
                    <span className="text-foreground truncate">
                      {selectedDoc.title}
                    </span>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-2">
                    {!isMobile && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="h-8 w-8 p-0"
                      >
                        {sidebarOpen
                          ? <EyeOff className="w-4 h-4" />
                          : <Eye className="w-4 h-4" />}
                      </Button>
                    )}

                    {!isMobile && (
                      <div className="flex items-center gap-1 border border-border rounded-lg p-0.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setFontSize(
                              fontSize === "base"
                                ? "sm"
                                : fontSize === "lg"
                                ? "base"
                                : "sm",
                            )}
                          disabled={fontSize === "sm"}
                          className="h-7 w-7 p-0"
                        >
                          <ZoomOut className="w-3.5 h-3.5" />
                        </Button>
                        <span className="text-xs font-mono px-1">
                          {fontSize === "sm"
                            ? "S"
                            : fontSize === "lg"
                            ? "L"
                            : "M"}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setFontSize(
                              fontSize === "sm"
                                ? "base"
                                : fontSize === "base"
                                ? "lg"
                                : "lg",
                            )}
                          disabled={fontSize === "lg"}
                          className="h-7 w-7 p-0"
                        >
                          <ZoomIn className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}

                    {!isMobile && (
                      <Button
                        variant={readingMode ? "default" : "ghost"}
                        size="sm"
                        onClick={toggleReadingMode}
                        className="h-8 px-3 gap-1.5"
                      >
                        <BookOpen className="w-4 h-4" />
                        <span className="text-xs">
                          {readingMode ? "Exit" : "Read"}
                        </span>
                      </Button>
                    )}

                    {isMobile && toc.length > 0 && (
                      <Button
                        variant={tocOpen ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setTocOpen(!tocOpen)}
                        className="h-8 px-3 gap-1.5"
                      >
                        <Hash className="w-4 h-4" />
                        <span className="text-xs">TOC</span>
                      </Button>
                    )}
                  </div>
                </div>

                <h1
                  className={`font-bold mb-3 ${
                    isMobile ? "text-2xl" : "text-3xl"
                  }`}
                >
                  {selectedDoc.title}
                </h1>

                <div className="flex flex-wrap gap-3 text-sm">
                  {selectedDoc.category && (
                    <Badge
                      variant="outline"
                      className={getCategoryColor(selectedDoc.category)}
                    >
                      {selectedDoc.category}
                    </Badge>
                  )}
                  {selectedDoc.version && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Hash className="w-3.5 h-3.5" />
                      <span className="font-mono text-xs">
                        v{selectedDoc.version}
                      </span>
                    </div>
                  )}
                  {selectedDoc.lastUpdated && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="font-mono text-xs">
                        {selectedDoc.lastUpdated}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Mobile TOC Dropdown */}
              {isMobile && tocOpen && toc.length > 0 && (
                <div className="border-b border-border bg-muted/30 flex-shrink-0">
                  <div className="max-h-48 overflow-y-auto">
                    <div className="p-3 space-y-0.5">
                      {toc.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            scrollToHeading(item.id);
                            setTocOpen(false);
                          }}
                          className={`w-full text-left text-xs py-2 px-3 rounded active:scale-98 ${
                            item.level === 2
                              ? "font-medium bg-muted/50"
                              : "pl-6 text-muted-foreground"
                          }`}
                        >
                          {item.text}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Content Area */}
              <div className="flex-1 flex overflow-hidden min-h-0">
                {/* Main Content */}
                <div className="flex-1 min-w-0 overflow-y-auto">
                  <div
                    className={`${isMobile ? "px-4 py-6" : "px-8 py-12"} ${
                      readingMode ? "max-w-3xl" : "max-w-4xl"
                    } mx-auto`}
                  >
                    <article
                      className={`prose prose-zinc dark:prose-invert ${getProseSize()} max-w-none break-words ${
                        isMobile ? "prose-sm" : ""
                      }`}
                      style={{
                        lineHeight: fontSize === "lg" ? "1.8" : "1.7",
                        wordWrap: "break-word",
                        overflowWrap: "break-word",
                      }}
                    >
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw]}
                        components={{
                          code(props) {
                            const { inline, className, children } = props as {
                              inline?: boolean;
                              className?: string;
                              children?: React.ReactNode;
                            };
                            const match = /language-(\w+)/.exec(
                              className || "",
                            );

                            if (!inline && match) {
                              return (
                                <div className="my-6 rounded-lg border border-border shadow-sm overflow-hidden">
                                  <div className="bg-muted px-3 py-1.5 border-b border-border">
                                    <span className="text-xs text-muted-foreground font-mono">
                                      {match[1]}
                                    </span>
                                  </div>
                                  <SyntaxHighlighter
                                    style={resolvedTheme === "dark"
                                      ? oneDark
                                      : oneLight}
                                    language={match[1]}
                                    PreTag="div"
                                    customStyle={{
                                      margin: 0,
                                      borderRadius: 0,
                                      fontSize: isMobile
                                        ? "12px"
                                        : fontSize === "lg"
                                        ? "15px"
                                        : fontSize === "sm"
                                        ? "13px"
                                        : "14px",
                                      lineHeight: "1.7",
                                      padding: isMobile ? "1rem" : "1.5rem",
                                      background: resolvedTheme === "dark"
                                        ? "#282c34"
                                        : "#fafafa",
                                    } as React.CSSProperties}
                                    wrapLongLines={true}
                                  >
                                    {String(children).replace(/\n$/, "")}
                                  </SyntaxHighlighter>
                                </div>
                              );
                            }

                            return (
                              <code className="bg-muted/70 text-foreground px-2 py-0.5 rounded text-sm font-mono border border-border/50 break-all">
                                {children}
                              </code>
                            );
                          },
                          h1: ({ children }) => (
                            <h1
                              className={`font-bold border-b border-border break-words text-foreground ${
                                isMobile
                                  ? "text-2xl mt-8 mb-4 pb-3"
                                  : "text-3xl mt-12 mb-6 pb-4"
                              }`}
                            >
                              {children}
                            </h1>
                          ),
                          h2: ({ children }) => {
                            const id = String(children)
                              .toLowerCase()
                              .replace(/[^a-z0-9]+/g, "-")
                              .replace(/(^-|-$)/g, "");
                            return (
                              <h2
                                id={id}
                                className={`font-bold scroll-mt-8 break-words text-foreground ${
                                  isMobile
                                    ? "text-xl mt-8 mb-3"
                                    : "text-2xl mt-10 mb-4"
                                }`}
                              >
                                {children}
                              </h2>
                            );
                          },
                          h3: ({ children }) => {
                            const id = String(children)
                              .toLowerCase()
                              .replace(/[^a-z0-9]+/g, "-")
                              .replace(/(^-|-$)/g, "");
                            return (
                              <h3
                                id={id}
                                className={`font-semibold scroll-mt-8 break-words text-foreground ${
                                  isMobile
                                    ? "text-lg mt-6 mb-2"
                                    : "text-xl mt-8 mb-3"
                                }`}
                              >
                                {children}
                              </h3>
                            );
                          },
                          table: ({ children }) => (
                            <div
                              className={`overflow-x-auto my-8 rounded-lg border border-border ${
                                isMobile ? "-mx-4" : ""
                              }`}
                            >
                              <table className="min-w-full border-collapse">
                                {children}
                              </table>
                            </div>
                          ),
                          th: ({ children }) => (
                            <th
                              className={`border-b-2 border-border bg-muted/70 text-left font-semibold text-foreground ${
                                isMobile
                                  ? "px-3 py-2 text-xs"
                                  : "px-5 py-3.5 text-sm"
                              }`}
                            >
                              {children}
                            </th>
                          ),
                          td: ({ children }) => (
                            <td
                              className={`border-b border-border/30 text-foreground ${
                                isMobile
                                  ? "px-3 py-2 text-xs"
                                  : "px-5 py-3.5 text-sm"
                              }`}
                            >
                              {children}
                            </td>
                          ),
                          a: ({ href, children }) => (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-amber-600 dark:text-amber-500 hover:text-amber-500 dark:hover:text-amber-400 underline underline-offset-2 break-all"
                            >
                              {children}
                            </a>
                          ),
                          blockquote: ({ children }) => (
                            <blockquote
                              className={`border-l-4 border-amber-500 bg-amber-500/10 rounded-r italic text-foreground/90 ${
                                isMobile
                                  ? "pl-4 pr-3 py-3 my-4"
                                  : "pl-6 pr-4 py-4 my-6"
                              }`}
                            >
                              {children}
                            </blockquote>
                          ),
                          ul: ({ children }) => (
                            <ul
                              className={`list-disc text-foreground ${
                                isMobile
                                  ? "pl-5 my-4 space-y-2"
                                  : "pl-6 my-6 space-y-3"
                              }`}
                            >
                              {children}
                            </ul>
                          ),
                          ol: ({ children }) => (
                            <ol
                              className={`list-decimal text-foreground ${
                                isMobile
                                  ? "pl-5 my-4 space-y-2"
                                  : "pl-6 my-6 space-y-3"
                              }`}
                            >
                              {children}
                            </ol>
                          ),
                          p: ({ children }) => (
                            <p
                              className={`leading-relaxed text-foreground/90 ${
                                isMobile ? "my-4" : "my-5"
                              }`}
                            >
                              {children}
                            </p>
                          ),
                          hr: () => (
                            <hr
                              className={`border-border ${
                                isMobile ? "my-8" : "my-12"
                              }`}
                            />
                          ),
                          li: ({ children }) => (
                            <li className="my-2 leading-relaxed text-foreground">
                              {children}
                            </li>
                          ),
                          strong: ({ children }) => (
                            <strong className="font-semibold text-foreground">
                              {children}
                            </strong>
                          ),
                          em: ({ children }) => (
                            <em className="italic text-foreground">
                              {children}
                            </em>
                          ),
                        }}
                      >
                        {selectedDoc.content || ""}
                      </ReactMarkdown>
                    </article>
                  </div>
                </div>

                {/* Desktop TOC */}
                {!isMobile && !readingMode && toc.length > 0 && (
                  <div className="w-72 border-l border-border bg-card/30 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-border flex-shrink-0">
                      <button
                        onClick={() => setTocOpen(!tocOpen)}
                        className="flex items-center justify-between w-full text-sm font-semibold hover:text-amber-500"
                      >
                        <div className="flex items-center gap-2">
                          <Hash className="w-3.5 h-3.5" />
                          <span>Contents</span>
                        </div>
                        {tocOpen
                          ? <ChevronUp className="w-4 h-4" />
                          : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>

                    {tocOpen && (
                      <ScrollArea className="flex-1 h-0">
                        <div className="p-4 space-y-0.5 min-h-full">
                          {toc.map((item) => (
                            <button
                              key={item.id}
                              onClick={() => scrollToHeading(item.id)}
                              className={`w-full text-left text-xs py-2 px-3 rounded hover:bg-amber-500/10 hover:text-amber-500 ${
                                item.level === 2
                                  ? "font-medium"
                                  : "pl-6 text-muted-foreground"
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                {item.level === 2 && (
                                  <span className="text-amber-500 mt-0.5 flex-shrink-0">
                                    •
                                  </span>
                                )}
                                <span className="break-words">{item.text}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </div>
                )}
              </div>
            </>
          )
          : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="font-mono text-sm">No document selected</p>
                <p className="text-xs mt-2">Select from sidebar</p>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
