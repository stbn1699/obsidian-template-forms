import { App, Modal } from "obsidian";

interface SimpleTemplate {
  id: string;
  name: string;
  description: string;
}

export default class TemplateFormsModal extends Modal {
  private readonly templates: SimpleTemplate[];
  private currentTemplate: SimpleTemplate | null;

  constructor(app: App) {
    super(app);
    this.templates = [
      { id: "contact", name: "Contact", description: "Créer une fiche contact" },
      { id: "project", name: "Projet", description: "Créer une fiche projet" },
    ];
    this.currentTemplate = null;
  }

  onOpen(): void {
    this.render();
  }

  onClose(): void {
    this.contentEl.empty();
    this.currentTemplate = null;
  }

  private render(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("template-form-modal");

    const root = contentEl.createDiv({ cls: "template-forms-root" });

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

    const form = root.createEl("form", { cls: "template-form-modal__form" });

    this.createField(
      form,
      "template-title",
      "Titre de la note",
      "ex: Nouveau contact"
    );
    this.createField(
      form,
      "template-summary",
      "Résumé",
      "Saisir un bref résumé"
    );
    this.createTextarea(
      form,
      "template-details",
      "Détails",
      "Informations supplémentaires pour le template"
    );

    const actions = form.createDiv({ cls: "template-form-modal__actions" });

    const cancelButton = actions.createEl("button", {
      text: "Annuler",
      type: "button",
      cls: "mod-cta secondary",
    });
    cancelButton.addEventListener("click", () => {
      this.currentTemplate = null;
      this.render();
    });

    const validateButton = actions.createEl("button", {
      text: "Valider",
      type: "submit",
      cls: "mod-cta",
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const title =
        form.querySelector<HTMLInputElement>("#template-title")?.value.trim() || "";
      const summary =
        form.querySelector<HTMLInputElement>("#template-summary")?.value.trim() || "";
      const details =
        form.querySelector<HTMLTextAreaElement>("#template-details")?.value.trim() || "";

      console.log("Validate template:", template.id, { title, summary, details });
      this.close();
    });
  }

  private createField(
    form: HTMLElement,
    id: string,
    label: string,
    placeholder: string
  ): void {
    const field = form.createDiv({ cls: "template-form-modal__field" });
    field.createEl("label", { text: label, attr: { for: id } });
    field.createEl("input", {
      type: "text",
      attr: { id, placeholder },
      cls: "template-form-modal__input",
    });
  }

  private createTextarea(
    form: HTMLElement,
    id: string,
    label: string,
    placeholder: string
  ): void {
    const field = form.createDiv({ cls: "template-form-modal__field" });
    field.createEl("label", { text: label, attr: { for: id } });
    field.createEl("textarea", {
      attr: { id, placeholder, rows: "4" },
      cls: "template-form-modal__textarea",
    });
  }
}
