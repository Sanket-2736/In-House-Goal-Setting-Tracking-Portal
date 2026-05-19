import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link as LinkIcon, Lock } from "lucide-react";
import { IGoalItem } from "@/lib/models";

interface SharedGoalCardProps {
  goal: IGoalItem;
  isEditable?: boolean;
  onWeightageChange?: (newWeightage: number) => void;
}

export function SharedGoalCard({
  goal,
  isEditable = false,
  onWeightageChange,
}: SharedGoalCardProps) {
  const getUoMLabel = (uomType: string) => {
    const labels: Record<string, string> = {
      numeric_min: "Numeric (Higher is Better)",
      numeric_max: "Numeric (Lower is Better)",
      timeline: "Timeline",
      zero: "Zero-Based",
    };
    return labels[uomType] || uomType;
  };

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-lg">{goal.title}</CardTitle>
              <Badge variant="outline" className="gap-1 bg-white">
                <LinkIcon className="w-3 h-3" />
                Shared Goal
              </Badge>
            </div>
            {goal.description && (
              <p className="text-sm text-gray-600">{goal.description}</p>
            )}
          </div>
          <Lock className="w-5 h-5 text-gray-400 flex-shrink-0" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Goal Details - Read Only */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <Label className="text-xs text-gray-600">Thrust Area</Label>
            <Badge variant="secondary" className="mt-1">
              {goal.thrustArea}
            </Badge>
          </div>
          <div>
            <Label className="text-xs text-gray-600">UoM Type</Label>
            <p className="text-sm font-medium mt-1">
              {getUoMLabel(goal.uomType)}
            </p>
          </div>
          <div>
            <Label className="text-xs text-gray-600">Target</Label>
            <p className="text-sm font-medium mt-1">{goal.target}</p>
          </div>
          {goal.targetDate && (
            <div>
              <Label className="text-xs text-gray-600">Target Date</Label>
              <p className="text-sm font-medium mt-1">
                {new Date(goal.targetDate).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>

        {/* Weightage - Editable */}
        <div className="pt-2 border-t">
          <Label htmlFor={`weightage-${goal._id}`} className="text-sm">
            Your Weightage (%)
            {!isEditable && <span className="text-gray-500 ml-2">(Read-only)</span>}
          </Label>
          <Input
            id={`weightage-${goal._id}`}
            type="number"
            min="0"
            max="100"
            value={goal.weightage}
            onChange={(e) => {
              if (isEditable && onWeightageChange) {
                onWeightageChange(parseFloat(e.target.value) || 0);
              }
            }}
            disabled={!isEditable}
            className="mt-2 max-w-xs"
          />
          <p className="text-xs text-gray-500 mt-1">
            {isEditable
              ? "You can adjust the weightage for your goals"
              : "This is a shared goal. Weightage is locked."}
          </p>
        </div>

        {/* Status Info */}
        <div className="text-xs text-gray-500 pt-2 border-t">
          <p>
            This goal is shared across your team. Achievement updates from the
            primary owner will sync to your sheet.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
