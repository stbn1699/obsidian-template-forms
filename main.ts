import { Plugin } from "obsidian";
import TemplateFormsModal from "./TemplateFormsView";
import {
  DEFAULT_SETTINGS,
  TemplateFormsHost,
  TemplateFormsSettings,
} from "./settings";

export default class TemplateFormsPlugin extends Plugin implements TemplateFormsHost {
  settings: TemplateFormsSettings = DEFAULT_SETTINGS;

  async onload(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());

    this.addRibbonIcon("layout-grid", "Template Forms", () => {
      const modal = new TemplateFormsModal(this);
      modal.open();
    });
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }
}
