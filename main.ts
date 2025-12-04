import { Plugin } from "obsidian";
import TemplateFormsModal from "./TemplateFormsView";

export default class TemplateFormsPlugin extends Plugin {
  async onload(): Promise<void> {
    this.addRibbonIcon("layout-grid", "Template Forms", () => {
      const modal = new TemplateFormsModal(this.app);
      modal.open();
    });
  }
}
