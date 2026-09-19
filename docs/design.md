# design.md

## Purpose

This file defines how digital products in this project should be designed.

A good product is not only functional. It should be clear, coherent, accessible, and intentional in the way it looks, behaves, and communicates. Design decisions should help users understand the product, complete their goals, and trust what they are using.

This document exists to keep visual design, interaction design, content, and component decisions aligned across the product.

---

## Core principles

### 1. Design should make the product easier to understand

Every visual and interaction decision should reduce confusion, reveal structure, or support action.

### 2. Start with hierarchy

The user should be able to tell, at a glance:

- where they are
- what matters most
- what they can do next
- what changed after they acted

### 3. Build systems, not one-off screens

Prefer reusable patterns, components, tokens, and rules over isolated solutions.

### 4. Let function and feeling support each other

A product can be useful and still have character. The visual language should express the product’s personality without weakening usability, accessibility, or consistency.

### 5. Make states first-class

A component is not finished when the default state looks good. Design all relevant states.

### 6. Accessibility is part of the design

Accessibility shapes contrast, typography, semantics, focus treatment, target sizes, motion, language, and component behaviour from the beginning.

---

## Required context before designing

Before making product or interface decisions, review:

1. `product-north-star.md`
2. `brand.md`
3. `spec.md`
4. Existing product patterns
5. Relevant shipped product areas

---

## What every design should answer

1. What is the user trying to do here?
2. What is the most important thing on the screen?
3. What should the user notice first, second, and third?
4. What actions are available?
5. What happens when the user acts?
6. What happens when data is missing, delayed, invalid, or unavailable?
7. How does this adapt across screen sizes and input methods?
8. How does this fit the wider product system?
9. What parts should become reusable components or patterns?
10. How does the design preserve clarity, accessibility, and character at the same time?

---

# Design foundations

## 1. Layout

### General approach

- Use layout to create order before adding visual styling.
- Prefer strong alignment, clear grouping, and predictable rhythm.
- Keep related elements close and unrelated elements apart.
- Use whitespace deliberately.
- Avoid arbitrary placement.

### Grids

- Use a consistent grid system across the product.
- Let the grid support both structure and flexibility.
- Break the grid only when it creates meaningful emphasis and does not harm comprehension.

### Responsive behaviour

For each important screen or component, define:

- what reflows
- what stacks
- what collapses
- what remains fixed
- what changes interaction model
- what must stay visible or reachable

---

## 2. Spacing

- Use a spacing scale, not arbitrary values.
- Spacing should communicate relationship, grouping, and hierarchy.
- Increase spacing between sections before increasing visual decoration.
- Prefer fewer, stronger spacing rules over many near-identical values.

---

## 3. Typography

Typography should make content easier to read, scan, and trust.

### Rules

- Use a defined type scale.
- Prefer a small number of clear text styles over many minor variants.
- Headings should describe structure, not just add visual emphasis.
- Body text should prioritise readability over compactness.
- Use font weight, size, and spacing intentionally.
- Interface text should be concise, specific, and easy to scan.

---

## 4. Colour

### Rules

- Use semantic tokens rather than hard-coded colour values.
- Do not use colour as the only way to communicate meaning.
- Maintain sufficient contrast.
- Reserve strong accent colours for moments that deserve attention.
- Keep status colours consistent across the product.

### Semantic roles

- background
- surface
- surface-elevated
- text-primary
- text-secondary
- border-subtle
- border-strong
- action-primary
- action-secondary
- success
- warning
- danger
- info
- focus

---

## 5. Shape, borders, and elevation

- Use shape and elevation to explain structure, containment, and affordance.
- Use a consistent radius scale.
- Borders should clarify boundaries, not decorate by default.
- Shadows should indicate layering or interactivity, not be applied indiscriminately.
- Similar components should share similar physical language.

---

## 6. Iconography and imagery

### Iconography

- Icons should reinforce meaning, not replace necessary labels.
- Use a consistent icon family and visual weight.
- Prefer familiar symbols for common actions.
- Do not rely on icons alone when the action may be ambiguous.

### Imagery

- Use imagery when it adds context, emotion, evidence, or recognition.
- Crop and scale images intentionally.
- Maintain a consistent visual treatment.
- Avoid generic filler images.

---

# Interaction design

## 7. Interaction principles

- Make actions obvious.
- Keep behaviour predictable.
- Reveal complexity gradually.
- Preserve orientation after every action.

---

## 8. Motion

Motion should explain change, support continuity, and add polish.

### Rules

- Prefer short, purposeful transitions.
- Reuse duration and easing tokens.
- Do not animate everything.
- Avoid motion that delays interaction without adding meaning.
- Respect reduced-motion preferences.

---

## 9. Feedback and system status

Design relevant states, including:

- idle
- hover
- focus
- pressed
- selected
- loading
- success
- warning
- error
- disabled
- empty
- offline or degraded

### Rules

- Loading states should preserve layout where possible.
- Error states should explain what happened and what the user can do.
- Success feedback should be clear but not noisy.
- Empty states should explain the situation and suggest a next step when useful.
- Disabled states should be used carefully.

---

# Components and systems

## 10. Component design

Each reusable component should define:

- purpose
- anatomy
- variants
- states
- responsive behaviour
- content rules
- accessibility behaviour
- token usage
- do / do not guidance

### Component quality bar

A component is ready when:

- it has a clear reason to exist
- it uses shared tokens
- its variants are necessary and distinguishable
- all relevant states are designed
- its behaviour is documented
- it works with realistic content lengths
- it is accessible by design
- it can be reused without leaking one-off page logic into the component itself

---

## 11. Tokens

### Token categories may include

- colour
- typography
- spacing
- radius
- border
- shadow
- motion
- breakpoints
- z-index

### Rules

- Prefer semantic tokens over raw values.
- Components should consume tokens, not define visual constants internally.
- Brand-specific decisions should live in tokens rather than component logic where possible.
- New tokens should solve a repeatable system need, not one isolated screen problem.

---

## 12. Patterns

Patterns should define:

- when to use them
- when not to use them
- structure
- behaviour
- content rules
- responsive behaviour
- accessibility considerations
- examples

---

# Content and language

## 13. Product copy

Product language should be:

- clear
- concise
- human
- specific
- useful

### Rules

- Prefer plain language over cleverness when clarity matters.
- Buttons should describe the action they perform.
- Error messages should explain the problem and the next step.
- Empty states should avoid blame and help the user move forward.
- Avoid filler text, vague labels, and internal jargon.
- Use consistent terminology across the product.

---

# Accessibility

## 14. Accessibility requirements

Designs must account for:

- sufficient colour contrast
- visible focus states
- keyboard reachability
- logical reading and tab order
- meaningful labels
- screen-reader-friendly structure
- text resizing
- touch target size
- reduced motion
- non-colour indicators for meaning
- error identification and recovery

Accessibility should be visible in the design files and documentation, not left as an implementation assumption.

---

# Design documentation

## 15. What to document

For meaningful product work, document:

- the user problem
- key decisions
- layouts and responsive behaviour
- components and states
- interaction details
- content rules
- accessibility notes
- assumptions
- unresolved questions

---

## 16. Handoff expectations

A design is ready for implementation when:

- the main flow is clear
- all relevant states are shown or described
- responsive behaviour is defined
- component reuse is identified
- spacing, typography, colour, and motion use system rules
- accessibility expectations are visible
- copy is final enough to build from
- open questions are listed
- the implementation team should not need to invent core behaviour

---

# Final review checklist

- Is the user goal clear?
- Is the visual hierarchy obvious?
- Does the layout support scanning and action?
- Are spacing and typography systematic?
- Is colour being used intentionally and accessibly?
- Are all important states covered?
- Is the interaction model predictable?
- Does motion explain rather than decorate?
- Are reusable components and patterns identified?
- Are tokens used instead of one-off values?
- Does the design hold up with real content?
- Is responsive behaviour defined?
- Is accessibility visible in the design decisions?
- Is the copy clear and specific?
- Does this feel like part of the same product system?
