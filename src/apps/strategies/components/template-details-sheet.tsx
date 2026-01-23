/**
 * Template Details Sheet Component
 * Displays full template information including documentation
 * Aligned with OpenAPI specification
 */

import { useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle,
  ChevronRight,
  Clock,
  FileText,
  HelpCircle,
  Info,
  Lightbulb,
  Loader2,
  Lock,
  Settings,
  Shield,
  Sparkles,
  Star,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useStrategyStore } from "../store";
import {
  DIFFICULTY_CONFIG,
  RISK_LEVEL_CONFIG,
  type StrategyTemplate,
  type StrategyTemplateSummary,
} from "../types";

interface TemplateDetailsSheetProps {
  template: StrategyTemplateSummary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateStrategy: (template: StrategyTemplate) => void;
}

export function TemplateDetailsSheet({
  template,
  open,
  onOpenChange,
  onCreateStrategy,
}: TemplateDetailsSheetProps) {
  const {
    selectedTemplate,
    templateLoading,
    templateError,
    getTemplate,
    clearSelectedTemplate,
  } = useStrategyStore();

  // Load full template when opened
  useEffect(() => {
    if (open && template && (!selectedTemplate || selectedTemplate.id !== template.id)) {
      getTemplate(template.id);
    }
  }, [open, template, selectedTemplate, getTemplate]);

  // Clear on close
  useEffect(() => {
    if (!open) {
      clearSelectedTemplate();
    }
  }, [open, clearSelectedTemplate]);

  const fullTemplate = selectedTemplate?.id === template?.id ? selectedTemplate : null;
  const difficultyConfig = template ? DIFFICULTY_CONFIG[template.difficulty] : null;
  const riskConfig = template ? RISK_LEVEL_CONFIG[template.riskLevel] : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl p-0 flex flex-col gap-0 overflow-hidden">
        {template && (
          <>
            {/* Header */}
            <SheetHeader className="p-6 pb-4 flex-shrink-0 border-b">
              <div className="flex items-start gap-3">
                {template.icon && (
                  <span className="text-4xl">{template.icon}</span>
                )}
                <div className="flex-1 min-w-0">
                  <SheetTitle className="text-xl">{template.name}</SheetTitle>
                  <SheetDescription className="mt-1">
                    {template.description}
                  </SheetDescription>
                  <div className="flex items-center gap-3 mt-3">
                    <Badge variant="outline">{template.domain}</Badge>
                    {difficultyConfig && (
                      <div className="flex items-center gap-1 text-xs">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              "w-3.5 h-3.5",
                              i < difficultyConfig.stars
                                ? "fill-yellow-500 text-yellow-500"
                                : "text-muted-foreground/30"
                            )}
                          />
                        ))}
                        <span className="ml-1 text-muted-foreground">
                          {difficultyConfig.label}
                        </span>
                      </div>
                    )}
                    {riskConfig && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className={`w-2 h-2 rounded-full ${riskConfig.bgColor}`} />
                        <span className={riskConfig.color}>{riskConfig.label} Risk</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </SheetHeader>

            {/* Content */}
            <div className="flex-1 min-h-0 overflow-hidden">
              {templateLoading ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">Loading template details...</p>
                </div>
              ) : templateError ? (
                <div className="flex flex-col items-center justify-center h-full p-6">
                  <AlertTriangle className="w-8 h-8 text-destructive mb-3" />
                  <p className="text-sm text-destructive text-center">{templateError}</p>
                </div>
              ) : fullTemplate ? (
                <Tabs defaultValue="overview" className="h-full flex flex-col">
                  <TabsList className="mx-6 mt-4 flex-shrink-0">
                    <TabsTrigger value="overview" className="gap-1.5">
                      <Info className="w-4 h-4" />
                      Overview
                    </TabsTrigger>
                    <TabsTrigger value="config" className="gap-1.5">
                      <Settings className="w-4 h-4" />
                      Configuration
                    </TabsTrigger>
                    <TabsTrigger value="docs" className="gap-1.5">
                      <BookOpen className="w-4 h-4" />
                      Documentation
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="flex-1 min-h-0 mt-0 data-[state=active]:flex data-[state=active]:flex-col">
                    <OverviewTab template={fullTemplate} />
                  </TabsContent>

                  <TabsContent value="config" className="flex-1 min-h-0 mt-0 data-[state=active]:flex data-[state=active]:flex-col">
                    <ConfigTab template={fullTemplate} />
                  </TabsContent>

                  <TabsContent value="docs" className="flex-1 min-h-0 mt-0 data-[state=active]:flex data-[state=active]:flex-col">
                    <DocumentationTab template={fullTemplate} />
                  </TabsContent>
                </Tabs>
              ) : null}
            </div>

            {/* Footer */}
            {fullTemplate && (
              <div className="p-6 pt-4 border-t flex-shrink-0">
                <Button
                  className="w-full gap-2"
                  size="lg"
                  onClick={() => onCreateStrategy(fullTemplate)}
                >
                  Create Strategy
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ============================================================================
// Overview Tab
// ============================================================================

function OverviewTab({ template }: { template: StrategyTemplate }) {
  const hasRequirements = template.requirements && (
    template.requirements.supportedExchanges?.length ||
    template.requirements.accountTypes?.length ||
    template.requirements.requiredPermissions?.length ||
    template.requirements.minimumBalance
  );

  return (
    <ScrollArea className="flex-1 h-full">
      <div className="p-6 space-y-6">
        {/* Tags */}
        {template.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {template.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Setup Time */}
        {template.estimatedSetupTime && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            Estimated setup time: {template.estimatedSetupTime}
          </div>
        )}

        {/* Requirements */}
        {hasRequirements && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Supported Exchanges */}
              {template.requirements?.supportedExchanges && template.requirements.supportedExchanges.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-muted-foreground" />
                    Supported Exchanges
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {template.requirements.supportedExchanges.map((exchange) => (
                      <Badge key={exchange} variant="outline" className="text-xs">
                        {exchange}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Account Types */}
              {template.requirements?.accountTypes && template.requirements.accountTypes.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-muted-foreground" />
                    Account Types
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {template.requirements.accountTypes.map((type) => (
                      <Badge key={type} variant="outline" className="text-xs">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Required Permissions */}
              {template.requirements?.requiredPermissions && template.requirements.requiredPermissions.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-muted-foreground" />
                    Required Permissions
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {template.requirements.requiredPermissions.map((perm) => (
                      <Badge key={perm} variant="outline" className="text-xs">
                        {perm}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Minimum Balance */}
              {template.requirements?.minimumBalance && (
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Minimum Balance
                  </h4>
                  <p className="text-sm">
                    ${template.requirements.minimumBalance.toLocaleString()}
                  </p>
                </div>
              )}

              {/* Min Accounts */}
              {template.requirements?.minAccounts && template.requirements.minAccounts > 1 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">
                    Minimum Accounts Required
                  </h4>
                  <p className="text-sm">{template.requirements.minAccounts}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Quick Overview from Docs */}
        {template.documentation?.overview && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {template.documentation.overview}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Risk Warning */}
        {template.documentation?.riskWarning && (
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-amber-600 dark:text-amber-500">
                <AlertTriangle className="w-4 h-4" />
                Risk Warning
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none text-amber-700 dark:text-amber-400">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {template.documentation.riskWarning}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tasks Info */}
        {template.tasks && template.tasks.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Automated Tasks ({template.tasks.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {template.tasks.map((task) => (
                  <div key={task.id} className="p-2 rounded bg-muted/50">
                    <p className="text-sm font-medium">{task.name}</p>
                    {task.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {task.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
}

// ============================================================================
// Configuration Tab (Updated for nested fields in groups)
// ============================================================================

function ConfigTab({ template }: { template: StrategyTemplate }) {
  const { groups } = template.configSchema || { groups: [] };

  // Check if any group has fields
  const hasFields = groups.some(g => g.fields && g.fields.length > 0);
  const totalFields = groups.reduce((acc, g) => acc + (g.fields?.length ?? 0), 0);

  return (
    <ScrollArea className="flex-1 h-full">
      <div className="p-6 space-y-4">
        <p className="text-sm text-muted-foreground">
          {hasFields 
            ? `This strategy requires ${totalFields} configuration parameters:`
            : "Configuration parameters for this strategy:"
          }
        </p>

        {/* Iterate through groups - fields are nested inside each group */}
        {groups.map((group) => {
          const hasGroupFields = group.fields && group.fields.length > 0;

          return (
            <Card key={group.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  {group.label}
                </CardTitle>
                {group.description && (
                  <p className="text-sm text-muted-foreground">{group.description}</p>
                )}
              </CardHeader>
              {hasGroupFields ? (
                <CardContent>
                  <div className="space-y-3">
                    {group.fields!.map((field) => (
                      <div
                        key={field.id}
                        className="flex items-start justify-between py-2 border-b last:border-0"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{field.label}</span>
                            {field.required && (
                              <Badge variant="destructive" className="text-[10px] px-1 py-0">
                                Required
                              </Badge>
                            )}
                            {field.advanced && (
                              <Badge variant="outline" className="text-[10px] px-1 py-0">
                                <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                                Advanced
                              </Badge>
                            )}
                          </div>
                          {field.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {field.description}
                            </p>
                          )}
                        </div>
                        <div className="text-right text-sm text-muted-foreground ml-4">
                          <Badge variant="outline" className="text-xs">
                            {field.type}
                          </Badge>
                          {field.default !== undefined && (
                            <p className="text-xs mt-1">
                              Default: {String(field.default)}
                            </p>
                          )}
                          {(field.min !== undefined || field.max !== undefined) && (
                            <p className="text-xs mt-0.5 text-muted-foreground">
                              {field.min !== undefined && `Min: ${field.min}`}
                              {field.min !== undefined && field.max !== undefined && " | "}
                              {field.max !== undefined && `Max: ${field.max}`}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              ) : (
                <CardContent>
                  <p className="text-xs text-muted-foreground italic">
                    Configuration fields pending backend implementation
                  </p>
                </CardContent>
              )}
            </Card>
          );
        })}

        {/* Show message if no groups at all */}
        {groups.length === 0 && (
          <div className="text-center py-8">
            <Settings className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Configuration schema not yet available
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Backend needs to provide configSchema.groups with fields
            </p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

// ============================================================================
// Documentation Tab
// ============================================================================

function DocumentationTab({ template }: { template: StrategyTemplate }) {
  const docs = template.documentation;

  if (!docs) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <BookOpen className="w-8 h-8 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">No documentation available</p>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 h-full">
      <div className="p-6 space-y-6">
        {/* How it Works */}
        {docs.howItWorks && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="w-4 h-4" />
                How It Works
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {docs.howItWorks}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Best Practices */}
        {docs.bestPractices && docs.bestPractices.length > 0 && (
          <Card className="border-blue-500/30 bg-blue-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-blue-600 dark:text-blue-500">
                <Lightbulb className="w-4 h-4" />
                Best Practices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {docs.bestPractices.map((practice, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span>{practice}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Examples */}
        {docs.examples && docs.examples.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Configuration Examples
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {docs.examples.map((example, i) => (
                <div key={i} className="p-3 rounded-lg bg-muted/50">
                  <h4 className="font-medium text-sm mb-1">{example.title}</h4>
                  <p className="text-xs text-muted-foreground mb-2">
                    {example.description}
                  </p>
                  <pre className="text-xs bg-background rounded p-2 overflow-x-auto">
                    {JSON.stringify(example.config, null, 2)}
                  </pre>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* FAQ */}
        {docs.faq && docs.faq.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <HelpCircle className="w-4 h-4" />
                FAQ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {docs.faq.map((item, i) => (
                  <AccordionItem key={i} value={`faq-${i}`}>
                    <AccordionTrigger className="text-sm text-left">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
}
