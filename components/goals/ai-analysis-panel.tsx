"use client";

import { GoalQualityReport, getScoreColor, getScoreBgColor } from "@/lib/cerebras/goalScorer";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CheckCircle2, AlertCircle, Sparkles } from "lucide-react";

interface AIAnalysisPanelProps {
  isOpen: boolean;
  onClose: () => void;
  report: GoalQualityReport | null;
  isLoading?: boolean;
}

export function AIAnalysisPanel({
  isOpen,
  onClose,
  report,
  isLoading = false,
}: AIAnalysisPanelProps) {
  if (!report && !isLoading) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:w-[500px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            AI Goal Quality Analysis
          </SheetTitle>
        </SheetHeader>

        {isLoading ? (
          <div className="space-y-4 mt-6">
            <div className="animate-pulse space-y-3">
              <div className="h-24 bg-muted rounded-lg"></div>
              <div className="h-12 bg-muted rounded-lg"></div>
              <div className="h-12 bg-muted rounded-lg"></div>
            </div>
          </div>
        ) : report ? (
          <div className="space-y-6 mt-6">
            {/* Overall Score */}
            <div className={`rounded-lg p-6 ${getScoreBgColor(report.overallScore)}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Overall Goal Health</p>
                  <p className={`text-4xl font-bold mt-2 ${getScoreColor(report.overallScore)}`}>
                    {report.overallScore}/10
                  </p>
                </div>
                <div className="w-24 h-24 rounded-full border-4 border-current flex items-center justify-center">
                  <span className={`text-2xl font-bold ${getScoreColor(report.overallScore)}`}>
                    {Math.round((report.overallScore / 10) * 100)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-foreground">{report.summary}</p>
            </div>

            {/* Per-Goal Breakdown */}
            <div>
              <h3 className="font-semibold mb-3">Goal Breakdown</h3>
              <Accordion type="single" collapsible className="space-y-2">
                {report.goals.map((goal) => (
                  <AccordionItem key={goal.goalIndex} value={`goal-${goal.goalIndex}`}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3 text-left">
                        <Badge
                          variant={goal.score >= 7 ? "default" : goal.score >= 5 ? "secondary" : "destructive"}
                          className="min-w-fit"
                        >
                          {goal.score}/10
                        </Badge>
                        <span className="text-sm font-medium">Goal {goal.goalIndex + 1}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                      {/* Strengths */}
                      <div>
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                          Strengths
                        </h4>
                        <ul className="space-y-1">
                          {goal.strengths.map((strength, idx) => (
                            <li key={idx} className="text-sm text-muted-foreground">
                              • {strength}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Suggestions */}
                      <div>
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          Suggestions for Improvement
                        </h4>
                        <ul className="space-y-1">
                          {goal.suggestions.map((suggestion, idx) => (
                            <li key={idx} className="text-sm text-muted-foreground">
                              • {suggestion}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            {/* Footer Note */}
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-xs text-blue-900 dark:text-blue-100">
                💡 <strong>Tip:</strong> Use these insights to refine your goals before submission. The suggestions are
                guidance only — you can apply them at your discretion.
              </p>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
