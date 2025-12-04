import { Modal, Notice, normalizePath } from "obsidian";
import {
  TemplateDefinition,
  TemplateField,
  TemplateFieldType,
  TemplateFormsHost,
} from "./settings";

interface RenderState {
  mode: "list" | "builder" | "use";
  selectedTemplate: TemplateDefinition | null;
  builderDraft: TemplateDefinition;
}

const FIELD_TYPE_OPTIONS: { value: TemplateFieldType; label: string }[] = [
  { value: "text", label: "Texte" },
  { value: "textarea", label: "Zone de texte" },
  { value: "number", label: "Nombre" },
  { value: "date", label: "Date" },
];

export default class TemplateFormsModal extends Modal {
  private readonly host: TemplateFormsHost;
  private state: RenderState;

  constructor(host: TemplateFormsHost) {
    super(host.app);
    this.host = host;
    this.state = {
      mode: "list",
      selectedTemplate: null,
      builderDraft: this.createEmptyTemplate(),
    };
  }

  onOpen(): void {
    this.render();
  }

  onClose(): void {
    this.contentEl.empty();
    this.state = {
      mode: "list",
      selectedTemplate: null,
      builderDraft: this.createEmptyTemplate(),
    };
  }

  private createEmptyTemplate(): TemplateDefinition {
    return {
      id: "",
      name: "",
      description: "",
      fields: [],
      body: "",
    };
  }

  private render(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("template-form-modal");

    const root = contentEl.createDiv({ cls: "template-forms-root" });

    if (this.state.mode === "builder") {
      this.renderTemplateBuilder(root);
      return;
    }

    if (this.state.mode === "use" && this.state.selectedTemplate) {
      this.renderTemplateForm(root, this.state.selectedTemplate);
      return;
    }

    this.renderTemplateList(root);
  }

  private renderTemplateList(root: HTMLElement): void {
    root.createEl("h2", { text: "Templates" });

    const actions = root.createDiv({ cls: "template-form-actions" });
    const createButton = actions.createEl("button", { text: "Créer un template" });
    createButton.addEventListener("click", () => {
      this.state = {
        mode: "builder",
        selectedTemplate: null,
        builderDraft: this.createEmptyTemplate(),
      };
      this.render();
    });

    if (!this.host.settings.templates.length) {
      root.createEl("p", { text: "Aucun template enregistré pour le moment." });
      return;
    }

    this.host.settings.templates.forEach((template) => {
      const card = root.createDiv({ cls: "template-card" });
      card.createEl("h3", { text: template.name });
      card.createEl("p", { text: template.description || "Pas de description" });

      const useButton = card.createEl("button", { text: "Utiliser ce template" });
      useButton.addEventListener("click", () => {
        this.state = {
          mode: "use",
          selectedTemplate: template,
          builderDraft: this.state.builderDraft,
        };
        this.render();
      });
    });
  }

  private renderTemplateBuilder(root: HTMLElement): void {
    root.createEl("h2", { text: "Créer un template" });
    root.createEl("p", {
      text: "Ajoutez des champs puis composez le markdown en utilisant ${id_champ} pour insérer la valeur.",
      cls: "template-form-modal__subtitle",
    });

    const form = root.createEl("form", { cls: "template-builder" });

    this.createInputField(form, "Nom du template", "template-name", (value) => {
      this.state.builderDraft.name = value;
    }, this.state.builderDraft.name);

    this.createInputField(
      form,
      "Description",
      "template-description",
      (value) => {
        this.state.builderDraft.description = value;
      },
      this.state.builderDraft.description
    );

    const fieldsHeader = form.createDiv({ cls: "template-builder__section" });
    fieldsHeader.createEl("h3", { text: "Champs" });

    const fieldsContainer = form.createDiv({ cls: "template-builder__fields" });
    this.state.builderDraft.fields.forEach((field, index) => {
      this.renderFieldEditor(fieldsContainer, field, index);
    });

    const addFieldButton = form.createEl("button", {
      text: "Ajouter un champ",
      type: "button",
      cls: "mod-cta secondary",
    });
    addFieldButton.addEventListener("click", () => {
      const newField: TemplateField = {
        id: `champ_${this.state.builderDraft.fields.length + 1}`,
        label: "Titre du champ",
        placeholder: "",
        type: "text",
      };
      this.state.builderDraft.fields.push(newField);
      this.render();
    });

    const bodyField = form.createDiv({ cls: "template-form-modal__field" });
    bodyField.createEl("label", {
      text: "Template (markdown)",
      attr: { for: "template-body" },
    });
    const bodyInput = bodyField.createEl("textarea", {
      attr: {
        id: "template-body",
        rows: "8",
        placeholder: "Utilisez ${id_champ} pour insérer un champ",
      },
      cls: "template-form-modal__textarea",
      text: this.state.builderDraft.body,
    });
    bodyInput.addEventListener("input", (event) => {
      this.state.builderDraft.body = (event.target as HTMLTextAreaElement).value;
    });

    const actions = form.createDiv({ cls: "template-form-modal__actions" });

    const cancelButton = actions.createEl("button", {
      text: "Retour",
      type: "button",
      cls: "mod-cta secondary",
    });
    cancelButton.addEventListener("click", () => {
      this.state = {
        mode: "list",
        selectedTemplate: null,
        builderDraft: this.state.builderDraft,
      };
      this.render();
    });

    actions.createEl("button", {
      text: "Enregistrer",
      type: "submit",
      cls: "mod-cta",
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      await this.saveTemplate();
    });
  }

  private renderFieldEditor(container: HTMLElement, field: TemplateField, index: number): void {
    const fieldRow = container.createDiv({ cls: "template-builder__field-row" });

    const labelInput = fieldRow.createEl("input", {
      type: "text",
      attr: { value: field.label, placeholder: "Titre" },
      cls: "template-builder__input",
    });
    labelInput.addEventListener("input", (event) => {
      field.label = (event.target as HTMLInputElement).value;
    });

    const idInput = fieldRow.createEl("input", {
      type: "text",
      attr: { value: field.id, placeholder: "Identifiant" },
      cls: "template-builder__input",
    });
    idInput.addEventListener("input", (event) => {
      field.id = (event.target as HTMLInputElement).value;
    });

    const placeholderInput = fieldRow.createEl("input", {
      type: "text",
      attr: { value: field.placeholder, placeholder: "Placeholder" },
      cls: "template-builder__input",
    });
    placeholderInput.addEventListener("input", (event) => {
      field.placeholder = (event.target as HTMLInputElement).value;
    });

    const typeSelect = fieldRow.createEl("select", { cls: "template-builder__select" });
    FIELD_TYPE_OPTIONS.forEach((option) => {
      const opt = typeSelect.createEl("option", { value: option.value, text: option.label });
      if (option.value === field.type) {
        opt.selected = true;
      }
    });
    typeSelect.addEventListener("change", (event) => {
      field.type = (event.target as HTMLSelectElement).value as TemplateFieldType;
    });

    const removeButton = fieldRow.createEl("button", {
      text: "Supprimer",
      type: "button",
      cls: "mod-cta secondary",
    });
    removeButton.addEventListener("click", () => {
      this.state.builderDraft.fields.splice(index, 1);
      this.render();
    });
  }

  private createInputField(
    form: HTMLElement,
    label: string,
    id: string,
    onChange: (value: string) => void,
    value = ""
  ): void {
    const field = form.createDiv({ cls: "template-form-modal__field" });
    field.createEl("label", { text: label, attr: { for: id } });
    const input = field.createEl("input", {
      type: "text",
      attr: { id, value },
      cls: "template-form-modal__input",
    });
    input.addEventListener("input", (event) => {
      onChange((event.target as HTMLInputElement).value);
    });
  }

  private async saveTemplate(): Promise<void> {
    const draft = this.state.builderDraft;
    const name = draft.name.trim();
    const description = draft.description.trim();
    if (!name) {
      new Notice("Le nom du template est requis.");
      return;
    }

    const normalizedId = this.slugify(name);
    const uniqueId = this.ensureUniqueId(normalizedId);

    const template: TemplateDefinition = {
      ...draft,
      id: uniqueId,
      name,
      description,
      fields: draft.fields.map((field) => ({ ...field })),
    };

    this.host.settings.templates.push(template);
    await this.host.saveSettings();
    new Notice(`Template "${template.name}" enregistré.`);

    this.state = {
      mode: "list",
      selectedTemplate: null,
      builderDraft: this.createEmptyTemplate(),
    };
    this.render();
  }

  private ensureUniqueId(baseId: string): string {
    let candidate = baseId || `template_${Date.now()}`;
    let index = 1;
    while (this.host.settings.templates.some((tpl) => tpl.id === candidate)) {
      candidate = `${baseId}-${index}`;
      index += 1;
    }
    return candidate;
  }

  private renderTemplateForm(root: HTMLElement, template: TemplateDefinition): void {
    root.createEl("h2", { text: `Template : ${template.name}` });
    root.createEl("p", {
      text: template.description || "Remplissez les champs pour créer la note.",
      cls: "template-form-modal__subtitle",
    });

    const form = root.createEl("form", { cls: "template-form-modal__form" });

    const filenameField = form.createDiv({ cls: "template-form-modal__field" });
    filenameField.createEl("label", {
      text: "Nom du fichier (sans extension)",
      attr: { for: "template-file-name" },
    });
    const filenameInput = filenameField.createEl("input", {
      type: "text",
      attr: {
        id: "template-file-name",
        value: template.name,
        placeholder: "Nom du fichier",
      },
      cls: "template-form-modal__input",
    });

    template.fields.forEach((field) => {
      const wrapper = form.createDiv({ cls: "template-form-modal__field" });
      wrapper.createEl("label", { text: field.label, attr: { for: field.id } });

      if (field.type === "textarea") {
        wrapper.createEl("textarea", {
          attr: { id: field.id, placeholder: field.placeholder, rows: "4" },
          cls: "template-form-modal__textarea",
        });
      } else {
        wrapper.createEl("input", {
          type: field.type === "number" ? "number" : field.type === "date" ? "date" : "text",
          attr: { id: field.id, placeholder: field.placeholder },
          cls: "template-form-modal__input",
        });
      }
    });

    const actions = form.createDiv({ cls: "template-form-modal__actions" });

    const cancelButton = actions.createEl("button", {
      text: "Retour",
      type: "button",
      cls: "mod-cta secondary",
    });
    cancelButton.addEventListener("click", () => {
      this.state = {
        mode: "list",
        selectedTemplate: null,
        builderDraft: this.state.builderDraft,
      };
      this.render();
    });

    actions.createEl("button", {
      text: "Créer la note",
      type: "submit",
      cls: "mod-cta",
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      await this.createNoteFromTemplate(template, filenameInput.value || template.name, form);
    });
  }

  private async createNoteFromTemplate(
    template: TemplateDefinition,
    filename: string,
    form: HTMLElement
  ): Promise<void> {
    const values: Record<string, string> = {};
    template.fields.forEach((field) => {
      const input = form.querySelector<HTMLInputElement>(`#${field.id}`);
      const textarea = form.querySelector<HTMLTextAreaElement>(`#${field.id}`);
      values[field.id] = (input?.value ?? textarea?.value ?? "").trim();
    });

    const content = this.renderTemplateBody(template.body, values);
    const path = this.getAvailablePath(filename.trim() || template.name);

    await this.host.app.vault.create(path, content);
    new Notice(`Note créée: ${path}`);
    this.state = {
      mode: "list",
      selectedTemplate: null,
      builderDraft: this.state.builderDraft,
    };
    this.render();
  }

  private renderTemplateBody(body: string, values: Record<string, string>): string {
    return body.replace(/\$\{([^}]+)\}/g, (_, fieldId: string) => {
      return values[fieldId] ?? "";
    });
  }

  private getAvailablePath(baseName: string): string {
    const safeName = baseName || "nouvelle-note";
    const normalized = normalizePath(`${safeName}.md`);
    if (!this.host.app.vault.getAbstractFileByPath(normalized)) {
      return normalized;
    }

    let index = 1;
    while (true) {
      const candidate = normalizePath(`${safeName} ${index}.md`);
      if (!this.host.app.vault.getAbstractFileByPath(candidate)) {
        return candidate;
      }
      index += 1;
    }
  }

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }
}
