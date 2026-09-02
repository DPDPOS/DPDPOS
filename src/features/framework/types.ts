/**
 * Mirrors dpdpos_backend/src/modules/framework — framework.types.ts and the
 * roadmap JSON built by domain/templates.ts buildRoadmapJson().
 */

export type MaturityLevel = "basic" | "intermediate" | "advanced";
export type DataSensitivity = "low" | "medium" | "high";

export type RoadmapPhaseName =
  | "Foundation"
  | "Operations"
  | "Governance"
  | "Oversight" // legacy snapshots
  | "Significant Fiduciary"; // legacy SDF-as-phase snapshots

export interface FrameworkProfile {
  industryProfile: string;
  maturityLevel: MaturityLevel;
  dataSensitivity: DataSensitivity;
  departmentCount: number;
  processorCount: number;
  isSdf: boolean;
}

export interface RoadmapControl {
  code: string;
  title: string;
  dueAt: string;
}

export interface RoadmapPhase {
  name: RoadmapPhaseName;
  controls: RoadmapControl[];
}

export interface RoadmapJson {
  generatedAt: string;
  profile: FrameworkProfile;
  summary: {
    controlCount: number;
    requirementCount: number;
    isSdf: boolean;
    phaseCount: number;
  };
  phases: RoadmapPhase[];
}

/** Mirrors ControlResponse / RequirementResponse in framework.types.ts. */
export interface FrameworkChildControl {
  id: string;
  organizationId: string;
  frameworkId: string;
  code: string;
  title: string;
  description: string | null;
  ownerUserId: string | null;
  dueAt: string | null;
  status: string;
  legalBasisRef: string | null;
}

export interface FrameworkChildRequirement {
  id: string;
  organizationId: string;
  frameworkId: string;
  controlId: string | null;
  code: string;
  title: string;
  description: string | null;
  legalBasisRef: string | null;
}

/** Mirrors FrameworkResponse (framework.types.ts). */
export interface FrameworkResponse {
  id: string;
  organizationId: string;
  name: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED" | string;
  industryProfile: string | null;
  maturityLevel: string | null;
  isSdf: boolean;
  roadmapJson: RoadmapJson | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  controls: FrameworkChildControl[];
  requirements: FrameworkChildRequirement[];
}
