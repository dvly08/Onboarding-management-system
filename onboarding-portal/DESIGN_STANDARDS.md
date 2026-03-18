# Design standards (onboarding portal)

Follow these when adding or changing UI so the app stays consistent and dark mode works everywhere. Reference: [style.css](style.css) and existing components (Reminders, 1:1s, plan editor).

---

## 1. Checkboxes

**One design everywhere:** The single checkbox style is the main-page **task toggle**: 24×24px, `border-radius: 8px`, green gradient when checked, **Unicode "✓"** as the checkmark. These all use it: `.task-toggle` (tasks), `.field--checkbox input` (forms), `.reminder-check-wrap input` (Reminders), `.one-on-ones-check-wrap input` (1:1s).

- **Prefer the standard pattern** so styling and dark mode apply automatically:
  ```html
  <label class="field field--checkbox">
    <input type="checkbox" />
    <span>Label text</span>
  </label>
  ```
- **If layout needs a custom wrapper** (e.g. inside a list row), use the same box and "✓" checkmark:
  - Box: `appearance: none`, 24×24px, `border-radius: 8px`, border, background, `display: grid; place-items: center`
  - Checkmark: `::after { content: "✓"; font-size: 14px; font-weight: 700; line-height: 1; color: transparent }` and when checked `color: #193626` (light) / `var(--text)` (dark)
  - **Always add a matching `body.theme-dark` block** for that selector: same values as `body.theme-dark .field--checkbox input[type="checkbox"]` and `:checked` / `::after` in style.css (search for "field--checkbox" in the dark section).

---

## 2. Sections / cards / list rows (backgrounds)

- Any new **card, panel, or row** that has its own background (e.g. `rgba(255,255,255,...)`) **must** have a dark mode override.
- Add the new selector to the same `body.theme-dark` block that already includes `.card`, `.reminder-row`, `.one-on-ones-row`, `.one-on-ones-about-block` in style.css:
  - `background: linear-gradient(180deg, rgba(18, 27, 50, 0.96), rgba(8, 13, 27, 0.96));`
  - `border-color: rgba(130, 156, 211, 0.18);`
  - `box-shadow: 0 20px 36px rgba(0, 0, 0, 0.24);`

---

## 3. Collapsible toggles

- Use existing classes so dark mode is automatic: **`.collapsible-toggle`** or **`.plan-stage-toggle`**.
- If you add a **new** collapsible control, give it the same dark rules as those (see `body.theme-dark .collapsible-toggle` and `.plan-stage-toggle` in style.css):
  - Default: `background: rgba(16, 24, 45, 0.92); border-color: rgba(130, 156, 211, 0.18); color: var(--muted-strong);`
  - Hover: `background: rgba(31, 189, 116, 0.18); color: var(--accent);`

---

## 4. Editable text fields (forms and overlays)

- Use the **standard field structure** so inputs/textarea get global and dark styles:
  ```html
  <label class="field">
    <span>Label text</span>
    <input type="text" placeholder="..." />
  </label>
  ```
  or `<textarea>...</textarea>` inside the same `<label class="field">` with a `<span>` label.
- Place form content inside **`.editor-panel-content`**; overlay structure: **`.settings-overlay`**, **`.settings-panel`**, **`.card`** so panels and inputs match the main page and dark theme.
- Avoid plain unstyled inputs (no `.field`, no shared panel) so all editors look the same.

---

## 5. Date and number inputs

- Treat scheduler controls the same way across the app. If you add a date or cadence field, it should inherit the shared dark-mode rules under `body.theme-dark input[type="date"]` and `body.theme-dark input[type="number"]`.
- Avoid one-off selector stacks for specific overlays unless a control truly needs custom behavior.
- For dark mode, verify both the field background and the native browser affordances:
  - Date picker icon / calendar indicator stays visible.
  - Number spinners do not fall back to a bright default.
  - `color-scheme: dark` is applied where the browser supports it.

---

## 6. Reference

- **style.css** – canonical dark theme: all `body.theme-dark` blocks.
- **Existing components** – Reminders list, 1:1 agenda/action items, plan editor, settings overlays – as examples of the above patterns.
