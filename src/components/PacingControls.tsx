
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PacingOption } from "@/types";

interface PacingControlsProps {
  currentPacing: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export const PacingControls = ({
  currentPacing,
  onChange,
  disabled = false,
}: PacingControlsProps) => {
  const pacingOptions: PacingOption[] = [
    { value: 0.5, label: "0.5 calls/sec" },
    { value: 1, label: "1 call/sec" },
    { value: 2, label: "2 calls/sec" },
    { value: 5, label: "5 calls/sec" },
    { value: 10, label: "10 calls/sec" },
  ];

  const handleChange = (value: string) => {
    const numValue = parseFloat(value);
    onChange(numValue);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-gray-700">Pacing:</span>
      <Select
        value={currentPacing.toString()}
        onValueChange={handleChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Select pacing" />
        </SelectTrigger>
        <SelectContent>
          {pacingOptions.map((option) => (
            <SelectItem key={option.value} value={option.value.toString()}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
