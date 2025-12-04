# Template Forms (WIP)

**Template Forms** is an upcoming Obsidian plugin that will allow users to create notes through **custom HTML/CSS form interfaces** instead of sequential prompt dialogs.  
The goal is to replace prompt-based workflows (e.g., Templater `await ask()` chains) with clean, user-defined interfaces containing inputs, buttons, tabs, and validation.

⚠️ **The plugin is currently in early development.  
Most features are not implemented yet.**

---

## 🚧 Project Goals (Planned)

- Add a **sidebar icon** that opens a dedicated UI inside Obsidian  
- Display a **list of available form templates**  
- Selecting a template opens its associated **HTML/CSS form**  
- Support multiple **modes** inside a single template (e.g. “family / friend / work”)  
- Provide built-in **validation** for required fields  
- Provide **Cancel** / **Validate** buttons  
- On validation:
  - Check inputs
  - Create a new note
  - Apply properties (YAML)
  - Use dynamic filename patterns
  - Move note to a required target folder

- Allow automatic creation of new templates:
  - Generates `template.html`
  - Generates `template.css`
  - Generates `meta.json`

---

## 📦 Current Status

At this stage, the plugin includes:

- Basic project setup (TypeScript, Obsidian API)
- Manifest configuration  
- Skeleton plugin activation  
- Development environment ready for expansion  

More features will be added gradually.

---

## 🛠️ Development Setup

Clone this repository into:

```
<your-vault>/.obsidian/plugins/template-forms
````

Install dependencies:

```bash
npm install
````

Build in watch mode:

```bash
npm run dev
```

Enable the plugin in:

```
Settings → Community plugins
```

## 🤝 Contributing

This project is currently developed by a single author,
but contributions and suggestions are welcome as the plugin evolves.

---

## 📄 License

MIT License.
