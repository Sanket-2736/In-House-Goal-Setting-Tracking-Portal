"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { AIAnalysisPanel } from "@/components/goals/ai-analysis-panel";
import { GoalQualityReport } from "@/lib/cerebras/goalScorer";
import { Trash2, Plus, Sparkles, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

const THRUST_AREAS = [
  "Strategy",
  "Operations",
  "People",
  "Finance",
  "Customer",
  "Innovation",
  "Compliance",
  "Quality",
];

const UOM_TYPES = [
  { value: "numeric_max", label: "Numeric - Higher Better" },
  { value: "numeric_min", label: "Numeric - Lower Better" },
  { value: "timeline", label: "Timeline" },
  { value: "zero", label: "Zero-Based" },
];

const goalItemSchema = z.object({
  thrustArea: z.string().min(1, "Thrust area is required"),
  title: z.string().min(1, "Goal title is required"),
  description: z.string().optional(),
  uomType: z.enum(["numeric_max", "numeric_min", "timeline", "zero"]),
  target: z.number().optional(),
  targetDate: z.string().optional(),
  weightage: z.number().min(10, "Minimum 10%").max(100, "Maximum 100%"),
});

const goalSheetSchema = z.object({
  goals: z.array(goalItemSchema).min(1, "At least one goal is required"),
});

type GoalSheetFormData = z.infer<typeof goalSheetSchema>;

export default function NewGoalSheetPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [cycleName, setCycleName] = useState<string>("");
  const [cycleId, setCycleId] = useState<string>("");
  const [analysisReport, setAnalysisReport] = useState<GoalQualityReport | null>(null);
  const [showAnalysisPanel, setShowAnalysisPanel] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<GoalSheetFormData>({
    resolver: zodResolver(goalSheetSchema),
    defaultValues: {
      goals: [
        {
          thrustArea: "",
          title: "",
          description: "",
          uomType: "numeric_max",
          target: undefined,
          targetDate: "",
          weightage: 10,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "goals",
  });

  const goals = watch("goals");
  const totalWeightage = goals.reduce((sum, goal) => sum + (goal.weightage || 0), 0);
  const weightageStatus =
    totalWeightage === 100 ? "valid" : totalWeightage > 100 ? "over" : "under";

  // Fetch active cycle
  useEffect(() => {
    const fetchCycle = async () => {
      try {
        const response = await fetch("/api/goals/cycles/active");
        if (response.ok) {
          const data = await response.json();
          setCycleName(data.data.name);
          setCycleId(data.data._id);
        }
      } catch (error) {
        console.error("Error fetching cycle:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchCycle();
    }
  }, [status]);

  const onSaveDraft = async (data: GoalSheetFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/goals/sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cycleId: cycleId,
          goals: data.goals,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Failed to save goal sheet");
        return;
      }

      toast.success("Goal sheet saved as draft");
    } catch (error) {
      toast.error("An error occurred while saving");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = async (data: GoalSheetFormData) => {
    // Validate weightage
    if (totalWeightage !== 100) {
      toast.error(`Total weightage must equal 100% (current: ${totalWeightage}%)`);
      return;
    }

    // Validate each goal has minimum weightage
    if (data.goals.some((goal) => (goal.weightage || 0) < 10)) {
      toast.error("Each goal must have at least 10% weightage");
      return;
    }

    // Show confirmation dialog
    const confirmed = window.confirm(
      "Are you sure you want to submit your goal sheet for approval? You won't be able to edit it after submission."
    );

    if (!confirmed) return;

    setIsSubmitting(true);
    try {
      // First save as draft
      const saveResponse = await fetch("/api/goals/sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cycleId: cycleId,
          goals: data.goals,
        }),
      });

      if (!saveResponse.ok) {
        throw new Error("Failed to save goal sheet");
      }

      const savedData = await saveResponse.json();

      // Then submit
      const submitResponse = await fetch("/api/goals/sheet/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goalSheetId: savedData.data._id,
        }),
      });

      if (!submitResponse.ok) {
        const error = await submitResponse.json();
        toast.error(error.error || "Failed to submit goal sheet");
        return;
      }

      toast.success("Goal sheet submitted for approval!");
      router.push("/employee/goals");
    } catch (error) {
      toast.error("An error occurred while submitting");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAnalyze = async () => {
    if (goals.length < 2) {
      toast.error("Add at least 2 goals before analyzing");
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/goals/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goals }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "AI analysis unavailable. You can still submit your goals.");
        return;
      }

      const data = await response.json();
      setAnalysisReport(data.data);
      setShowAnalysisPanel(true);
      toast.success("AI analysis complete!");
    } catch (error) {
      toast.error("AI analysis unavailable. You can still submit your goals.");
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-12 w-48" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Create Goal Sheet"
        description="Define your goals for the current cycle"
        breadcrumbs={[
          { label: "Goals", href: "/employee/goals" },
          { label: "New Goal Sheet" },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Header Section */}
        <Card>
          <CardHeader>
            <CardTitle>Goal Sheet Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Current Cycle</Label>
                <p className="text-lg font-semibold mt-2">{cycleName || "Loading..."}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Employee</Label>
                <p className="text-lg font-semibold mt-2">{session?.user?.name}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Department</Label>
                <p className="text-lg font-semibold mt-2">
                  {(session?.user as any)?.department || "Not specified"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Goals Section */}
        <Card>
          <CardHeader>
            <CardTitle>Goals</CardTitle>
            <CardDescription>Add up to 8 goals with a total weightage of 100%</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Goals List */}
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="border border-border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Goal {index + 1}</h4>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Thrust Area */}
                    <div>
                      <Label>Thrust Area *</Label>
                      <Controller
                        name={`goals.${index}.thrustArea`}
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select thrust area" />
                            </SelectTrigger>
                            <SelectContent>
                              {THRUST_AREAS.map((area) => (
                                <SelectItem key={area} value={area}>
                                  {area}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.goals?.[index]?.thrustArea && (
                        <p className="text-sm text-red-500 mt-1">
                          {errors.goals[index]?.thrustArea?.message}
                        </p>
                      )}
                    </div>

                    {/* UoM Type */}
                    <div>
                      <Label>UoM Type *</Label>
                      <Controller
                        name={`goals.${index}.uomType`}
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {UOM_TYPES.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.goals?.[index]?.uomType && (
                        <p className="text-sm text-red-500 mt-1">
                          {errors.goals[index]?.uomType?.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <Label>Goal Title *</Label>
                    <Controller
                      name={`goals.${index}.title`}
                      control={control}
                      render={({ field }) => (
                        <Input placeholder="Enter goal title" {...field} />
                      )}
                    />
                    {errors.goals?.[index]?.title && (
                      <p className="text-sm text-red-500 mt-1">
                        {errors.goals[index]?.title?.message}
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <Label>Description</Label>
                    <Controller
                      name={`goals.${index}.description`}
                      control={control}
                      render={({ field }) => (
                        <Textarea placeholder="Enter goal description" {...field} />
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Target */}
                    {goals[index]?.uomType === "timeline" ? (
                      <div>
                        <Label>Target Date *</Label>
                        <Controller
                          name={`goals.${index}.targetDate`}
                          control={control}
                          render={({ field }) => (
                            <Input type="date" {...field} />
                          )}
                        />
                      </div>
                    ) : (
                      <div>
                        <Label>Target Value *</Label>
                        <Controller
                          name={`goals.${index}.target`}
                          control={control}
                          render={({ field }) => (
                            <Input
                              type="number"
                              placeholder="Enter target"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            />
                          )}
                        />
                      </div>
                    )}

                    {/* Weightage */}
                    <div>
                      <Label>Weightage (%) *</Label>
                      <Controller
                        name={`goals.${index}.weightage`}
                        control={control}
                        render={({ field }) => (
                          <Input
                            type="number"
                            min="10"
                            max="100"
                            step="5"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        )}
                      />
                      {errors.goals?.[index]?.weightage && (
                        <p className="text-sm text-red-500 mt-1">
                          {errors.goals[index]?.weightage?.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Goal Button */}
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                append({
                  thrustArea: "",
                  title: "",
                  description: "",
                  uomType: "numeric_max",
                  target: undefined,
                  targetDate: "",
                  weightage: 10,
                })
              }
              disabled={fields.length >= 8}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Goal
            </Button>

            {/* Weightage Summary */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Weightage</span>
                <span
                  className={`text-sm font-semibold ${
                    weightageStatus === "valid"
                      ? "text-green-600"
                      : weightageStatus === "over"
                      ? "text-red-600"
                      : "text-amber-600"
                  }`}
                >
                  {totalWeightage}%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    weightageStatus === "valid"
                      ? "bg-green-500"
                      : weightageStatus === "over"
                      ? "bg-red-500"
                      : "bg-amber-500"
                  }`}
                  style={{ width: `${Math.min(totalWeightage, 100)}%` }}
                />
              </div>
              {weightageStatus !== "valid" && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {weightageStatus === "over"
                    ? `Weightage exceeds 100% by ${totalWeightage - 100}%`
                    : `Weightage is ${100 - totalWeightage}% below 100%`}
                </p>
              )}
            </div>

            {/* AI Analysis Button */}
            {goals.length >= 2 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="w-full"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing your goals...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2 text-amber-500" />
                    ✨ Analyze with AI
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleSubmit(onSaveDraft)}
            disabled={isSubmitting}
          >
            Save as Draft
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || totalWeightage !== 100}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Submit for Approval
              </>
            )}
          </Button>
        </div>
      </form>

      {/* AI Analysis Panel */}
      <AIAnalysisPanel
        isOpen={showAnalysisPanel}
        onClose={() => setShowAnalysisPanel(false)}
        report={analysisReport}
        isLoading={isAnalyzing}
      />
    </div>
  );
}
