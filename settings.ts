import { App } from "obsidian";

export type TemplateFieldType = "text" | "textarea" | "number" | "date";

export interface TemplateField {
  id: string;
  label: string;
  type: TemplateFieldType;
  placeholder: string;
}

export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  fields: TemplateField[];
  body: string;
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
