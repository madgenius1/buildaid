import { getBaseline, Stage } from "./baseline";

export interface Alert {
  id: string;
  materialId: string;
  materialName: string;
  type:
    | "usage_high"
    | "delivery_mismatch"
    | "negative_remaining"
    | "used_more_than_delivered"
    | "budget_warning"
    | "budget_exceeded";
  message: string;
  severity: "warning" | "critical";
}

interface MaterialData {
  id: string;
  name: string;
  unit: string;
  purchased: number;
  delivered: number;
  used: number;
}

interface ProjectData {
  area: number;
  stage: Stage;
  budget: number;
}

function fmtKsh(n: number): string {
  if (n >= 1_000_000) return `KSh ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `KSh ${(n / 1_000).toFixed(0)}K`;
  return `KSh ${n.toFixed(0)}`;
}

export function computeAlerts(
  materials: MaterialData[],
  project: ProjectData,
  totalSpent = 0
): Alert[] {
  const alerts: Alert[] = [];

  // Budget alerts
  if (project.budget > 0) {
    const pct = totalSpent / project.budget;
    if (totalSpent > project.budget) {
      alerts.push({
        id: "budget-exceeded",
        materialId: "",
        materialName: "Budget",
        type: "budget_exceeded",
        message: `Budget exceeded — you've spent ${fmtKsh(totalSpent - project.budget)} over your ${fmtKsh(project.budget)} budget`,
        severity: "critical",
      });
    } else if (pct > 0.85) {
      alerts.push({
        id: "budget-warning",
        materialId: "",
        materialName: "Budget",
        type: "budget_warning",
        message: `${Math.round(pct * 100)}% of budget used — only ${fmtKsh(project.budget - totalSpent)} remaining`,
        severity: "warning",
      });
    }
  }

  // Material alerts
  for (const mat of materials) {
    if (mat.purchased === 0 && mat.delivered === 0 && mat.used === 0) continue;

    const remaining = mat.purchased - mat.used;

    if (remaining < 0) {
      alerts.push({
        id: `neg-${mat.id}`,
        materialId: mat.id,
        materialName: mat.name,
        type: "negative_remaining",
        message: `${mat.name}: You've used more than you purchased — check your records`,
        severity: "critical",
      });
    }

    if (mat.used > mat.delivered && mat.delivered > 0) {
      alerts.push({
        id: `udel-${mat.id}`,
        materialId: mat.id,
        materialName: mat.name,
        type: "used_more_than_delivered",
        message: `${mat.name}: Usage doesn't match deliveries — possible theft or waste`,
        severity: "critical",
      });
    }

    if (mat.purchased > 0 && mat.delivered < mat.purchased * 0.9) {
      const missing = mat.purchased - mat.delivered;
      alerts.push({
        id: `del-${mat.id}`,
        materialId: mat.id,
        materialName: mat.name,
        type: "delivery_mismatch",
        message: `${mat.name}: ${missing} ${mat.unit} purchased but not yet delivered — ${mat.purchased} bought, only ${mat.delivered} confirmed`,
        severity: "warning",
      });
    }

    if (project.area > 0 && mat.used > 0) {
      const baseline = getBaseline(mat.name, project.stage);
      if (baseline) {
        const usagePerM2 = mat.used / project.area;
        if (usagePerM2 > baseline.max * 1.2) {
          alerts.push({
            id: `high-${mat.id}`,
            materialId: mat.id,
            materialName: mat.name,
            type: "usage_high",
            message: `${mat.name}: Usage rate higher than expected for ${project.stage} — check for waste`,
            severity: "warning",
          });
        }
      }
    }
  }

  return alerts;
}
