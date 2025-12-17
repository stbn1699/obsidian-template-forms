import { App } from "obsidian";

export type TemplateFieldType = "text" | "textarea" | "number" | "date";

export interface TemplateField {
  id: string;
  label: string;
  type: TemplateFieldType;
  placeholder: string;
}

export interface TemplateVariable {
  id: string;
  value: string;
}

export interface TemplateDefinition {
  useDestinationFolder: boolean;
  id: string;
  name: string;
  description: string;
  fields: TemplateField[];
  computedVariables?: TemplateVariable[];
  body: string;
  destinationFolder?: string;
}

export interface TemplateFormsSettings {
  templates: TemplateDefinition[];
}

export const DEFAULT_SETTINGS: TemplateFormsSettings = {
  templates: [],
};

export interface TemplateFormsHost {
  app: App;
  settings: TemplateFormsSettings;
  saveSettings: () => Promise<void>;
}
