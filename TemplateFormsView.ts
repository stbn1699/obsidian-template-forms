import { Modal, Notice, normalizePath } from "obsidian";
import {
  TemplateDefinition,
  TemplateField,
  TemplateFieldType,
  TemplateVariable,
  TemplateFormsHost,
} from "./settings";

interface RenderState {
  mode: "list" | "builder" | "use";
  selectedTemplate: TemplateDefinition | null;
  builderDraft: TemplateDefinition;
  editingTemplateId: string | null;
}

const MONTH_NAMES = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

const MONTH_NAMES_SHORT = [
  "Janv.",
  "Févr.",
  "Mars",
  "Avr.",
  "Mai",
  "Juin",
  "Juil.",
  "Août",
  "Sept.",
  "Oct.",
  "Nov.",
  "Déc.",
];

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
      editingTemplateId: null,
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
      editingTemplateId: null,
    };
  }

  private createEmptyTemplate(): TemplateDefinition {
    return {
      id: "",
      name: "",
      description: "",
      defaultFilename: "",
      fields: [],
      computedVariables: [],
      body: "",
      useDestinationFolder: false,
      destinationFolder: "",
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
        editingTemplateId: null,
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
          editingTemplateId: null,
        };
        this.render();
      });

      const editButton = card.createEl("button", { text: "Modifier" });
      editButton.addEventListener("click", () => {
        this.state = {
          mode: "builder",
          selectedTemplate: null,
          builderDraft: this.cloneTemplate(template),
          editingTemplateId: template.id,
        };
        this.render();
      });
    });
  }

  private renderTemplateBuilder(root: HTMLElement): void {
    root.createEl("h2", {
      text: this.state.editingTemplateId ? "Modifier le template" : "Créer un template",
    });
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

    this.createInputField(
      form,
      "Nom de fichier par défaut",
      "template-default-filename",
      (value) => {
        this.state.builderDraft.defaultFilename = value;
      },
      this.state.builderDraft.defaultFilename ?? ""
    );

    const destinationSection = form.createDiv({ cls: "template-builder__section" });
    destinationSection.createEl("h3", { text: "Destination" });

    const destinationToggle = destinationSection.createDiv({ cls: "template-form-modal__field" });
    const destinationLabel = destinationToggle.createEl("label", {
      text: "Définir un dossier de destination",
      attr: { for: "template-destination-toggle" },
    });
    const destinationCheckbox = destinationToggle.createEl("input", {
      type: "checkbox",
      attr: { id: "template-destination-toggle" },
    });
    destinationCheckbox.checked = this.state.builderDraft.useDestinationFolder ?? false;
    destinationCheckbox.addEventListener("change", (event) => {
      const checked = (event.target as HTMLInputElement).checked;
      this.state.builderDraft.useDestinationFolder = checked;
      if (!checked) {
        this.state.builderDraft.destinationFolder = "";
      }
      this.render();
    });
    destinationLabel.prepend(destinationCheckbox);

    if (this.state.builderDraft.useDestinationFolder) {
      const folderField = destinationSection.createDiv({ cls: "template-form-modal__field" });
      folderField.createEl("label", {
        text: "Dossier de destination",
        attr: { for: "template-destination-folder" },
      });
      const folderInput = folderField.createEl("input", {
        type: "text",
        attr: {
          id: "template-destination-folder",
          value: this.state.builderDraft.destinationFolder ?? "",
          placeholder: "ex: Notes/Templates",
        },
        cls: "template-form-modal__input",
      });
      folderInput.addEventListener("input", (event) => {
        this.state.builderDraft.destinationFolder = (event.target as HTMLInputElement).value;
      });
    }

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

    const variablesSection = form.createDiv({ cls: "template-builder__section" });
    variablesSection.createEl("h3", { text: "Variables automatiques" });
    variablesSection.createEl("p", {
      text: "Définissez des variables calculées à partir des champs ou des valeurs par défaut (par exemple ${date}).",
      cls: "template-form-modal__subtitle",
    });

    const variablesContainer = variablesSection.createDiv({ cls: "template-builder__fields" });
    (this.state.builderDraft.computedVariables ?? []).forEach((variable, index) => {
      this.renderVariableEditor(variablesContainer, variable, index);
    });

    const addVariableButton = variablesSection.createEl("button", {
      text: "Ajouter une variable",
      type: "button",
      cls: "mod-cta secondary",
    });
    addVariableButton.addEventListener("click", () => {
      const variables = this.state.builderDraft.computedVariables ?? [];
      variables.push({
        id: `variable_${variables.length + 1}`,
        value: "",
      });
      this.state.builderDraft.computedVariables = variables;
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
        editingTemplateId: null,
      };
      this.render();
    });

    actions.createEl("button", {
      text: this.state.editingTemplateId ? "Mettre à jour" : "Enregistrer",
      type: "submit",
      cls: "mod-cta",
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      void this.saveTemplate();
    });
  }

  private renderVariableEditor(
    container: HTMLElement,
    variable: TemplateVariable,
    index: number
  ): void {
    const row = container.createDiv({ cls: "template-builder__field-row" });

    const idInput = row.createEl("input", {
      type: "text",
      attr: { value: variable.id, placeholder: "Identifiant" },
      cls: "template-builder__input",
    });
    idInput.addEventListener("input", (event) => {
      variable.id = (event.target as HTMLInputElement).value;
    });

    const valueInput = row.createEl("input", {
      type: "text",
      attr: { value: variable.value, placeholder: "Valeur (peut inclure ${id})" },
      cls: "template-builder__input",
    });
    valueInput.addEventListener("input", (event) => {
      variable.value = (event.target as HTMLInputElement).value;
    });

    const removeButton = row.createEl("button", {
      text: "Supprimer",
      type: "button",
      cls: "mod-cta secondary",
    });
    removeButton.addEventListener("click", () => {
      const variables = this.state.builderDraft.computedVariables ?? [];
      variables.splice(index, 1);
      this.state.builderDraft.computedVariables = variables;
      this.render();
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
    const useDestinationFolder = draft.useDestinationFolder ?? false;
    const destinationFolder = draft.destinationFolder?.trim() ?? "";
    if (!name) {
      new Notice("Le nom du template est requis.");
      return;
    }

    if (useDestinationFolder && !destinationFolder) {
      new Notice("Indiquez un dossier de destination ou désactivez l'option correspondante.");
      return;
    }

    const normalizedId = this.slugify(name);
    const targetId = this.state.editingTemplateId ?? this.ensureUniqueId(normalizedId);

    const template: TemplateDefinition = {
      ...draft,
      id: targetId,
      name,
      description,
      fields: draft.fields.map((field) => ({ ...field })),
      computedVariables: (draft.computedVariables ?? []).map((variable) => ({ ...variable })),
      useDestinationFolder,
      destinationFolder: useDestinationFolder ? destinationFolder : "",
    };

    if (this.state.editingTemplateId) {
      const index = this.host.settings.templates.findIndex(
        (tpl) => tpl.id === this.state.editingTemplateId
      );
      if (index !== -1) {
        this.host.settings.templates.splice(index, 1, template);
      }
    } else {
      this.host.settings.templates.push(template);
    }
    await this.host.saveSettings();
    new Notice(
      this.state.editingTemplateId
        ? `Template "${template.name}" mis à jour.`
        : `Template "${template.name}" enregistré.`
    );

    this.state = {
      mode: "list",
      selectedTemplate: null,
      builderDraft: this.createEmptyTemplate(),
      editingTemplateId: null,
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

    const dateContext = new Date();
    const builtInValues = this.getBuiltInVariables(dateContext);
    const defaultFilename = (template.defaultFilename ?? template.name).trim();
    const resolvedDefaultFilename = this.renderTemplateString(
      defaultFilename,
      builtInValues,
      dateContext
    );

    const filenameField = form.createDiv({ cls: "template-form-modal__field" });
    filenameField.createEl("label", {
      text: "Nom du fichier (sans extension)",
      attr: { for: "template-file-name" },
    });
    const filenameInput = filenameField.createEl("input", {
      type: "text",
      attr: {
        id: "template-file-name",
        value: resolvedDefaultFilename || template.name,
        placeholder: "Nom du fichier",
      },
      cls: "template-form-modal__input",
    });

    const useDestinationFolder = template.useDestinationFolder ?? false;
    if (useDestinationFolder) {
      const destinationField = form.createDiv({ cls: "template-form-modal__field" });
      destinationField.createEl("label", {
        text: "Dossier de destination",
        attr: { for: "template-destination-folder" },
      });
      destinationField.createEl("input", {
        type: "text",
        attr: {
          id: "template-destination-folder",
          value: template.destinationFolder ?? "",
          placeholder: "ex: Notes/Templates",
        },
        cls: "template-form-modal__input",
      });
    }

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
        editingTemplateId: null,
      };
      this.render();
    });

    actions.createEl("button", {
      text: "Créer la note",
      type: "submit",
      cls: "mod-cta",
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      void this.createNoteFromTemplate(template, filenameInput.value || template.name, form);
    });
  }

  private async createNoteFromTemplate(
    template: TemplateDefinition,
    filename: string,
    form: HTMLElement
  ): Promise<void> {
    const dateContext = new Date();
    const values = this.buildTemplateValues(template, form, dateContext);
    const useDestinationFolder = template.useDestinationFolder ?? false;
    const destinationInput = form.querySelector<HTMLInputElement>("#template-destination-folder");
    const destinationFolder = useDestinationFolder
      ? this.renderTemplateString(
          destinationInput?.value.trim() || template.destinationFolder || "",
          values,
          dateContext
        ).trim()
      : "";

    const renderedFilename =
      this.renderTemplateString(filename, values, dateContext).trim() || template.name;
    const content = this.renderTemplateString(template.body, values, dateContext);
    const path = this.getAvailablePath(renderedFilename, destinationFolder);

    if (destinationFolder) {
      await this.ensureFolderExists(destinationFolder);
    }
    await this.host.app.vault.create(path, content);
    new Notice(`Note créée: ${path}`);
    this.state = {
      mode: "list",
      selectedTemplate: null,
      builderDraft: this.state.builderDraft,
      editingTemplateId: null,
    };
    this.render();
  }

  private buildTemplateValues(
    template: TemplateDefinition,
    form: HTMLElement,
    dateContext: Date
  ): Record<string, string> {
    const values: Record<string, string> = { ...this.getBuiltInVariables(dateContext) };

    template.fields.forEach((field) => {
      const input = form.querySelector<HTMLInputElement>(`#${field.id}`);
      const textarea = form.querySelector<HTMLTextAreaElement>(`#${field.id}`);
      values[field.id] = (input?.value ?? textarea?.value ?? "").trim();
    });

    const computedVariables = template.computedVariables ?? [];
    return this.resolveComputedVariables(values, computedVariables, dateContext);
  }

  private resolveComputedVariables(
    baseValues: Record<string, string>,
    computedVariables: TemplateVariable[],
    dateContext: Date
  ): Record<string, string> {
    const values = { ...baseValues };
    const iterations = Math.max(1, computedVariables.length * 3);

    for (let i = 0; i < iterations; i += 1) {
      let updated = false;

      computedVariables.forEach((variable) => {
        const resolved = this.renderTemplateString(variable.value, values, dateContext);
        if (values[variable.id] !== resolved) {
          values[variable.id] = resolved;
          updated = true;
        }
      });

      if (!updated) {
        break;
      }
    }

    return values;
  }

  private renderTemplateString(
    template: string,
    values: Record<string, string>,
    dateContext: Date
  ): string {
    return template.replace(/\$\{([^}]+)}/g, (_, rawFieldId: string) => {
      const [fieldId, format] = rawFieldId.split(":").map((part) => part.trim());
      const value = values[fieldId] ?? "";

      if (format) {
        const parsedDate = this.parseDateValue(value, dateContext);
        if (parsedDate) {
          return this.formatDate(parsedDate, format);
        }
      }

      return value;
    });
  }

  private getBuiltInVariables(dateContext: Date): Record<string, string> {
    const now = dateContext;
    return {
      date: now.toISOString().slice(0, 10),
      time: now.toTimeString().slice(0, 5),
      datetime: now.toISOString(),
    };
  }

  private parseDateValue(value: string, fallback: Date): Date | null {
    if (!value) {
      return fallback;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    return parsed;
  }

  private formatDate(date: Date, format: string): string {
    const tokens: Record<string, string> = {
      YYYY: date.getFullYear().toString(),
      YY: date.getFullYear().toString().slice(-2),
      MM: `${date.getMonth() + 1}`.padStart(2, "0"),
      MMM: MONTH_NAMES_SHORT[date.getMonth()],
      MMMM: MONTH_NAMES[date.getMonth()],
      DD: `${date.getDate()}`.padStart(2, "0"),
      HH: `${date.getHours()}`.padStart(2, "0"),
      mm: `${date.getMinutes()}`.padStart(2, "0"),
      ss: `${date.getSeconds()}`.padStart(2, "0"),
    };

    return format.replace(
      /YYYY|YY|MMMM|MMM|MM|DD|HH|mm|ss/g,
      (token) => tokens[token] ?? token
    );
  }

  private getAvailablePath(baseName: string, folderPath?: string): string {
    const safeName = baseName || "nouvelle-note";
    const folder = folderPath?.trim() ? normalizePath(folderPath.trim()) : "";
    const prefix = folder ? `${folder}/` : "";

    const normalized = normalizePath(`${prefix}${safeName}.md`);
    if (!this.host.app.vault.getAbstractFileByPath(normalized)) {
      return normalized;
    }

    let index = 1;
    while (true) {
      const candidate = normalizePath(`${prefix}${safeName} ${index}.md`);
      if (!this.host.app.vault.getAbstractFileByPath(candidate)) {
        return candidate;
      }
      index += 1;
    }
  }

  private async ensureFolderExists(folderPath: string): Promise<void> {
    const normalized = normalizePath(folderPath);
    const existing = this.host.app.vault.getAbstractFileByPath(normalized);
    if (!existing) {
      await this.host.app.vault.createFolder(normalized);
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

  private cloneTemplate(template: TemplateDefinition): TemplateDefinition {
    return {
      ...template,
      defaultFilename: template.defaultFilename,
      fields: template.fields.map((field) => ({ ...field })),
      computedVariables: (template.computedVariables ?? []).map((variable) => ({ ...variable })),
    };
  }
}
