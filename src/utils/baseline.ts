export type Stage = "Foundation" | "Walling" | "Roofing" | "Finishing";

export interface UsageRange {
  min: number;
  max: number;
  unit: string;
}

const BASELINES: Record<string, Partial<Record<Stage, UsageRange>>> = {
  cement: {
    Foundation: { min: 0.4, max: 0.6, unit: "bags/m²" },
    Walling: { min: 0.5, max: 0.7, unit: "bags/m²" },
    Roofing: { min: 0.2, max: 0.4, unit: "bags/m²" },
    Finishing: { min: 0.3, max: 0.5, unit: "bags/m²" },
  },
  sand: {
    Foundation: { min: 0.06, max: 0.08, unit: "m³/m²" },
    Walling: { min: 0.04, max: 0.06, unit: "m³/m²" },
    Finishing: { min: 0.02, max: 0.04, unit: "m³/m²" },
  },
  steel: {
    Foundation: { min: 3, max: 5, unit: "kg/m²" },
    Walling: { min: 2, max: 3, unit: "kg/m²" },
    Roofing: { min: 4, max: 7, unit: "kg/m²" },
  },
  ballast: {
    Foundation: { min: 0.08, max: 0.12, unit: "m³/m²" },
  },
};

export function getBaseline(
  materialName: string,
  stage: Stage
): UsageRange | null {
  const key = materialName.toLowerCase();
  return BASELINES[key]?.[stage] ?? null;
}
