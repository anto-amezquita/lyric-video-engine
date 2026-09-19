# content.md

## Purpose

This file defines how product language should be written in practice.

`brand.md` defines how the product should sound.  
`content.md` defines how that voice is applied inside real interfaces, flows, and messages.

The goal is to make product copy clear, consistent, useful, and easy to extend across the whole product.

---

## Core principles

### 1. Say what matters

Every word should help the user understand, decide, or act.

### 2. Prefer clarity over cleverness

Charm is welcome when it does not reduce comprehension.

### 3. Be specific

Specific language reduces uncertainty and makes interfaces easier to use.

### 4. Match the moment

Tone may change between onboarding, errors, confirmations, and marketing, but the product should still sound like itself.

### 5. Reduce cognitive load

Use familiar words, consistent terminology, and predictable patterns.

---

## General writing rules

- Use plain language.
- Prefer active voice.
- Keep sentences short when the user is trying to complete a task.
- Use the same term for the same thing everywhere.
- Avoid filler, jargon, hype, and internal language.
- Do not use humour in high-friction or sensitive moments unless clearly appropriate.
- Avoid vague labels such as `Submit`, `Manage`, `Continue`, or `Learn more` when a more specific action is possible.
- Write for scanning first, reading second.

---

## Product terminology

| Concept | Preferred term | Avoid |
|---|---|---|
| [Concept] | [Term] | [Alternatives to avoid] |
| [Concept] | [Term] | [Alternatives to avoid] |

---

## Buttons

### Rules

- Use verbs.
- Describe the result of the action.
- Keep labels short but specific.
- Use sentence case unless the product deliberately uses another system.

### Prefer

- `Save article`
- `Create account`
- `Send invitation`
- `Remove filter`

### Avoid

- `Submit`
- `OK`
- `Proceed`
- `Click here`

---

## Forms

### Labels

- Use clear nouns or noun phrases.
- Do not rely on placeholder text as the only label.
- Keep labels stable across the flow.

### Helper text

Use helper text to reduce uncertainty, not repeat the label.

### Validation

- Explain what is wrong.
- Tell the user how to fix it.
- Avoid blame.

### Example

**Weak:**  
`Invalid input`

**Better:**  
`Enter an email address in the format name@example.com`

---

## Errors

### Rules

- Say what happened.
- Say what the user can do next when possible.
- Avoid technical detail unless the user can act on it.
- Do not blame the user.
- Avoid generic `Something went wrong` when more specific language is possible.

### Pattern

`[What happened]. [What the user can do next].`

### Examples

- `We could not save your changes. Try again.`
- `This link has expired. Request a new one to continue.`
- `You do not have permission to edit this page.`

---

## Empty states

### Rules

- Explain why the area is empty.
- Help the user understand whether this is normal.
- Offer a useful next step when appropriate.

### Pattern

1. What this area is for
2. Why it is empty
3. What to do next

### Example

**Saved articles**  
`You have not saved any articles yet.`  
`Save articles to return to them later.`

---

## Success messages

### Rules

- Confirm the outcome.
- Keep it concise.
- Do not celebrate routine actions too loudly.

### Examples

- `Changes saved`
- `Invitation sent`
- `Article removed from saved`

---

## Loading states

### Rules

- Use loading copy only when it helps.
- Prefer specific language when the user is waiting for a meaningful process.
- Avoid overexplaining fast routine loads.

### Examples

- `Loading saved articles`
- `Uploading image`
- `Preparing preview`

---

## Navigation and headings

### Rules

- Headings should describe the content below them.
- Navigation labels should match user language, not internal structures.
- Avoid vague bucket names unless they are already well understood.

---

## Notifications

### Rules

- Keep notifications actionable.
- Put the most important information first.
- Use urgency only when it is real.

---

## Dates, numbers, and formatting

### Dates

[Define preferred format.]

### Times

[Define preferred format.]

### Numbers

[Define separators, decimal usage, rounding rules, and unit handling.]

### Currency

[Define format and locale behaviour.]

---

## Localization

- Write strings so they can expand without breaking layouts.
- Avoid wordplay that will not translate well if localization is expected.
- Keep variables and placeholders understandable.
- Do not concatenate phrases that may need different grammar in another language.

---

## Accessibility in language

- Link text should make sense out of context.
- Avoid instructions based only on visual position, such as `click the button on the right`.
- Use descriptive labels for controls.
- Keep error messages attached to the relevant field or action.

---

## Tone by context

| Context | Tone |
|---|---|
| Product UI | clear, calm, concise |
| Onboarding | reassuring, encouraging |
| Errors | honest, useful, non-blaming |
| Empty states | helpful, light, action-oriented |
| Sensitive moments | respectful, restrained |
| Marketing | more expressive, still concrete |

---

## Final review checklist

- Is every word useful?
- Is the meaning clear on first read?
- Are labels specific?
- Is terminology consistent?
- Are errors helpful and non-blaming?
- Are empty states informative?
- Does the tone fit the moment?
- Would this still make sense if read by a screen reader?
- Could the text survive translation?
- Does it sound like the same product as the rest of the interface?
