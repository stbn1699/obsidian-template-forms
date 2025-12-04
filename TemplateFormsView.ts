import { ItemView, WorkspaceLeaf } from "obsidian";

export const TEMPLATE_FORMS_VIEW_TYPE = "template-forms-view";

interface SimpleTemplate {
  id: string;
  name: string;
  description: string;
}

export default class TemplateFormsView extends ItemView {
  private readonly templates: SimpleTemplate[];
  private currentTemplate: SimpleTemplate | null;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
    this.templates = [
      { id: "contact", name: "Contact", description: "Créer une fiche contact" },
      { id: "project", name: "Projet", description: "Créer une fiche projet" },
    ];
    this.currentTemplate = null;
  }

  getViewType(): string {
    return TEMPLATE_FORMS_VIEW_TYPE;
  }

  getDisplayText(): string {
    return "Template Forms";
  }

  getIcon(): string {
    return "layout-grid";
  }

  async onOpen(): Promise<void> {
    this.render();
  }

  async onClose(): Promise<void> {
    // No cleanup required for now
  }

  private render(): void {
    this.containerEl.empty();

    const root = this.containerEl.createDiv({ cls: "template-forms-root" });

    if (this.currentTemplate) {
      this.renderTemplateForm(root, this.currentTemplate);
    } else {
      this.renderTemplateList(root);
    }
  }

  private renderTemplateList(root: HTMLElement): void {
    root.createEl("h2", { text: "Choisir un template" });

    this.templates.forEach((template) => {
      const card = root.createDiv({ cls: "template-card" });
      card.createEl("h3", { text: template.name });
      card.createEl("p", { text: template.description });

      const useButton = card.createEl("button", { text: "Utiliser ce template" });
      useButton.addEventListener("click", () => {
        this.currentTemplate = template;
        this.render();
      });
    });
  }

  private renderTemplateForm(root: HTMLElement, template: SimpleTemplate): void {
    root.createEl("h2", { text: `Template : ${template.name}` });
    root.createEl("p", {
      text: "Ici, plus tard, le vrai HTML du formulaire sera injecté.",
    });

    const actions = root.createDiv({ cls: "template-form-actions" });

    const cancelButton = actions.createEl("button", { text: "Annuler" });
    cancelButton.addEventListener("click", () => {
      this.currentTemplate = null;
      this.render();
    });

    const validateButton = actions.createEl("button", { text: "Valider" });
    validateButton.addEventListener("click", () => {
      console.log("Validate template:", template.id);
    });
  }
}
