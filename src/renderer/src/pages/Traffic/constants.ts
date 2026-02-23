import type { ResourceType } from "@shared/resourceType";

export const METHODS = ["ALL", "GET", "POST", "PUT", "PATCH", "DELETE"] as const;
export const STATUS_CATS = ["ALL", "2xx", "3xx", "4xx", "5xx"] as const;

export type ResourceFilterId = "ALL" | ResourceType;

export const RESOURCE_FILTERS: Array<{ id: ResourceFilterId; label: string }> = [
  { id: "ALL", label: "All" },
  { id: "document", label: "Doc" },
  { id: "xhr", label: "XHR" },
  { id: "script", label: "JS" },
  { id: "stylesheet", label: "CSS" },
  { id: "image", label: "Img" },
  { id: "font", label: "Font" },
  { id: "media", label: "Media" },
  { id: "other", label: "Other" },
];
