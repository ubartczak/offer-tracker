export type ColumnId =
  | "title" | "company" | "status" | "portal"
  | "salary" | "contractType" | "location"
  | "interviewAt" | "appliedAt" | "actions";

export type ColumnConfig = {
  id: ColumnId;
  visible: boolean;
  order: number;
  width: number;
};

export const LOCKED_COLUMNS: ColumnId[] = ["title", "company", "status", "actions"];

export const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: "title",        visible: true,  order: 0, width: 240 },
  { id: "company",      visible: true,  order: 1, width: 160 },
  { id: "status",       visible: true,  order: 2, width: 120 },
  { id: "portal",       visible: true,  order: 3, width: 120 },
  { id: "salary",       visible: true,  order: 4, width: 160 },
  { id: "contractType", visible: false, order: 5, width: 100 },
  { id: "location",     visible: false, order: 6, width: 140 },
  { id: "interviewAt",  visible: false, order: 7, width: 140 },
  { id: "appliedAt",    visible: true,  order: 8, width: 120 },
  { id: "actions",      visible: true,  order: 9, width: 80  },
];
