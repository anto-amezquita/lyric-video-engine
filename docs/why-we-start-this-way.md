# Begin with a Product Operating System

## Why AI-assisted projects should start with shared intent — and stay visible as they grow

AI has made it easier than ever to begin building. A rough idea can become a screen, a component, or even a working prototype in minutes. That speed is exciting. It is also slightly dangerous.

When a project begins only with prompts, the product can start changing shape one request at a time. The interface may drift. The codebase may grow several competing patterns. The writing may sound different from one flow to the next. Most importantly, the reason the product exists can become less visible as implementation accelerates.

The answer is not to slow everything down with heavy process. The answer is to make the important decisions explicit early enough that AI can help us move faster without quietly pulling the product apart.

That is the idea behind this starter kit: begin each project by creating a small **product operating system** before asking AI to build the product itself — then add a visible team layer so the work remains understandable as it moves.

---

## The problem with starting from prompts alone

Prompt-driven building gives enormous freedom at the beginning. You can ask for anything, try anything, and change direction quickly.

But a project that lives only in prompts has very little memory.

The product direction is scattered across conversations. The reasons behind decisions are easy to lose. A model may solve similar problems differently on different days because the relevant context is not reliably present. Over time, the human becomes the only stable source of truth — which means they must keep repeating, correcting, and re-explaining the project.

Recent writing on AI-assisted development has started to describe this problem more directly. Martin Fowler’s “Context Anchoring” argues that decision context should be treated as **external state**: a living reference outside the conversation that preserves decisions for both humans and AI across sessions. Structured prompt-driven development makes a related argument: prompts and decisions become first-class artifacts in version control, reducing reinvention and helping teams govern AI-assisted work more consistently.

The issue is not that AI lacks ability. The issue is that a project without durable context asks both the human and the model to keep reconstructing the same product from memory.

---

## What spec-driven development gets right

Spec-driven development is a useful response to this problem. GitHub’s Spec Kit describes it as a way to focus on product scenarios rather than writing undifferentiated code, and its workflow begins by clarifying what should be built before moving into planning and tasks. That is a major improvement over starting directly with code.

A good spec forces a project to answer questions such as:

- What problem are we solving?
- Who is it for?
- What should the user be able to do?
- What is in scope?
- What would count as complete?

These are precisely the questions that prevent AI from filling gaps with plausible but unintended product choices.

But feature specs alone are not enough.

A feature can be perfectly specified and still belong to a product whose visual language, technical architecture, writing style, and quality bar are undefined. If every feature spec must also reinvent the brand, the interface rules, the architecture, and the definition of done, the system remains fragile.

Our setup keeps the strengths of spec-driven development and extends them one level upward: **before we define individual features, we define the product environment those features should live inside.**

---

## The product operating system

The starter kit separates project knowledge into a few durable layers:

```txt
/docs
  backlog.md
  product-north-star.md
  brand.md
  design.md
  content.md
  spec.md
  architecture.md
  quality.md
  linear-workflow.md

/specs
/decisions
/skills

AGENTS.md
```

Each layer has a different job.

### Docs are the project’s memory

The files in `/docs` hold the stable truths of the product:

- `product-north-star.md` defines what the product is, who it serves, why it exists, and what it should not become.
- `brand.md` defines how the product should feel, sound, and be recognised.
- `design.md` defines interface principles, interaction rules, components, tokens, and accessibility expectations.
- `content.md` turns brand voice into practical UI writing rules.
- `architecture.md` defines the stable technical shape of the product.
- `quality.md` defines what “done” means across usability, accessibility, testing, performance, and release readiness.
- `spec.md` defines how future product specs should be written.
- `linear-workflow.md` defines how project knowledge becomes visible team progress without leaving the repository as source of truth.

This makes context durable. It no longer has to be inferred from the latest chat thread.

`backlog.md` is the one deliberate exception to “memory” in this folder. Everything else in `/docs` is written to stay true for a long time; `backlog.md` is written to be edited every session — it holds only what's currently open, and an item leaves it the moment it ships or graduates into a spec. It sits in `/docs` for the same reason the memory files do — one place an agent or a person checks first — not because it shares their stability.

### Specs are current decisions

The `/specs` folder contains the concrete product or feature specs currently being built. These are more local and more changeable than the core docs. They describe a particular slice of work in enough detail that implementation does not need to invent the product along the way.

### ADRs preserve remembered reasons

The `/decisions` folder stores Architecture Decision Records. An ADR is a short document that captures one significant decision, its context, and its consequences. That matters because code often reveals *what* changed, but not *why*. ADRs preserve the reasoning behind choices so future humans and future AI agents do not have to guess.

### Skills are methods, not memory

The `/skills` folder contains reusable ways of working:

- `project-kickoff`
- `project-setup-linear`
- `product-spec`
- `frontend-design`
- `design-system`
- `accessibility-review`
- `quality-gate`

This distinction matters:

```txt
Docs = memory
Skills = methods
Specs = current decisions
ADRs = remembered reasons
Linear = shared visibility
```

OpenAI’s Codex documentation makes a similar distinction: `AGENTS.md` provides durable repository guidance, while skills package repeatable task-specific workflows. Skills themselves are modular bundles built around a `SKILL.md` manifest, which makes them a good fit for recurring product practices such as project kickoff, spec writing, frontend work, or review.

The practical effect is that AI does not only know more about the project. It also learns how we prefer to work on the project.

---

## From product memory to team visibility

A project can have excellent documentation and still be hard to understand at a glance.

The repository can tell us what we know, what we have decided, and how we expect the product to be built. But it does not always answer the daily team questions quickly:

- Where are we now?
- What are we doing next?
- What is blocked?
- What still needs a decision?
- What should be revisited later?

That is where Linear becomes useful.

The repository remains the source of truth. Linear becomes the shared map of the work:

```txt
Repository = what we know
Linear = where that knowledge is in motion
```

Linear’s structure maps well to the system:

- **Initiatives** group projects by larger objectives.
- **Projects** represent coherent bodies of work with a clear outcome.
- **Milestones** represent stages in a project lifecycle.
- **Project documents** and links gather relevant materials in one visible place.
- **Project updates** communicate progress, risks, and next steps.
- **Project templates** make the workflow reusable across new projects.

This avoids a common failure mode: either project knowledge lives only in task trackers, where it becomes shallow and fragmented, or it lives only in documents, where it becomes rich but invisible in day-to-day work. The two layers solve different problems and become stronger together.

The repository answers:

> What do we know, believe, and decide?

Linear answers:

> Where are we now, and what needs attention next?

That distinction is especially useful when uncertainty needs to stay visible. Labels such as `assumption`, `decision-needed`, `revisit`, and `blocked`, together with saved views and weekly updates, make it easier to see not only completed work, but unresolved product thinking before it turns into hidden risk.

---

## Why begin this way?

### 1. It keeps the product whole

Digital products are not only code. They are the result of product thinking, brand decisions, interaction choices, writing, technical structure, and quality standards working together.

Starting with a product operating system makes those dimensions visible from the beginning. Instead of allowing each new prompt to define a slightly different product, we establish a shared foundation that every future task can reference.

### 2. It moves freedom to a better place

At first glance, more rules can look like less freedom.

In practice, it removes a lot of low-value freedom:

- the freedom to name the same thing three different ways
- the freedom to rebuild similar components with different patterns
- the freedom to let every new screen invent its own hierarchy
- the freedom to forget why an earlier technical choice was made
- the freedom to let uncertainty disappear because nobody can see it

That is not the kind of freedom that makes a product better.

The more valuable freedom is preserved — and often strengthened:

- the freedom to explore ideas before committing
- the freedom to make strong product choices
- the freedom to break a rule deliberately when there is a good reason
- the freedom to move faster later because the basics no longer need to be renegotiated
- the freedom for a team to collaborate without every person needing the whole project held in their head

The best balance is:

```txt
explore freely
→ decide deliberately
→ build consistently
→ revise consciously
```

This is not bureaucracy. It is a way to protect creative energy for the choices that actually matter.

### 3. It reduces repeated explanation

Codex recommends making successful guidance reusable with `AGENTS.md` instead of repeating it manually in every prompt. Its documentation describes `AGENTS.md` as durable project guidance that travels with the repository and applies before work begins.

The same principle applies to product intent, brand direction, architecture, quality, and team workflow. Once a decision is likely to matter more than once, it deserves a stable home.

### 4. It makes AI collaboration more legible

When the project’s rules are externalized, it becomes easier to see what the AI is working from and easier to correct it when needed. The assistant is no longer guided by hidden prompt residue or by the human’s memory alone. It is guided by files that can be reviewed, versioned, and improved.

That also makes the system more portable across models. Different tools may use different entry files — `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, or repository instructions — but the shared product truth can remain ordinary Markdown files that any capable model can read.

### 5. It gives the project a better beginning

The first phase of a project is where the biggest leverage lives. Decisions made there shape everything that follows: what gets built, what gets postponed, what the product feels like, and what becomes expensive to change later.

The `project-kickoff` guide exists to make that beginning more fluent and more human. It asks one good question at a time, suggests options when the answer is not obvious, records decisions, and helps turn a loose idea into the first coherent version of a product.

This is important because the best project start is not a questionnaire and not a code dump. It is a guided conversation that helps the product become clear before the implementation becomes fast.

### 6. It keeps the project understandable after the beginning

Good projects do not only need a strong start. They need a shared way to stay understandable while they are being made.

The `project-setup-linear` skill translates the product operating system into a visible project structure: milestones show the lifecycle, issues show concrete work, labels expose uncertainty, and updates tell the current story. That means the system is not only helpful when creating a product; it remains helpful when a team is trying to understand where the product stands weeks later.

---

## How this differs from heavy process

This system is not meant to freeze the product before learning begins.

The core documents should be stable enough to guide decisions, but not sacred. Specs should be current, not permanent. ADRs should record meaningful decisions, not every small thought. Skills should support repeatable work, not replace judgment. Linear should make progress visible, not become a second source of truth.

The purpose is not to predict the entire product in advance. The purpose is to make the project’s current understanding explicit, so new learning can improve the system instead of merely creating drift.

That is also where the setup differs from a rigid waterfall interpretation of specifications. The point is not to finish thinking before building; it is to make thinking visible enough that building remains aligned. Spec-driven development provides the feature-level discipline. The product operating system adds durable context around it. Linear adds shared visibility while the work is moving.

---

## A practical workflow

A healthy default flow now looks like this:

```txt
rough idea
→ project-kickoff
→ project-setup-linear
→ product-spec
→ frontend-design
→ design-system, when shared patterns emerge
→ accessibility-review
→ quality-gate
```

The files and tools support the flow:

```txt
product intent
→ documented once

feature intent
→ specified when needed

important reasons
→ recorded when decisions are made

repeatable work
→ turned into skills

team progress
→ made visible in Linear
```

This creates a project that becomes easier to work on as it grows. Early effort compounds instead of evaporating.

---

## What we are really standardising

We are not standardising creativity.

We are standardising:

- where durable decisions live
- how product work becomes buildable
- how design remains coherent
- how technical choices remain legible
- how quality is judged
- how AI is invited into the process
- how a team sees where the project stands

That leaves plenty of room for originality. In fact, it protects it. A product with a clear point of view is more likely to become distinctive than one assembled from an endless series of disconnected prompts.

---

## Conclusion

AI makes it possible to build sooner. A product operating system makes it possible to build **well** sooner. A visible project layer makes it possible to keep building **together** without losing the thread.

By starting each project with shared product intent, design rules, technical principles, quality standards, reusable skills, and a guided kickoff process — then representing the moving work in Linear — we give both humans and AI a better environment in which to work. We trade a little early spontaneity for much more coherence, speed, confidence, and shared understanding over the life of the product.

The goal is not to constrain the work until nothing surprising can happen.

The goal is to make sure that when something surprising does happen, it becomes part of a product that still knows what it is — and a project that the team can still understand.

---

## Sources

- GitHub, *Spec Kit* — toolkit and documentation for spec-driven development.
  <https://github.com/github/spec-kit> · <https://github.github.com/spec-kit/>
- Birgitta Böckeler, *Understanding Spec-Driven Development: Kiro, spec-kit, and Tessl* — on the spec-first / spec-anchored / spec-as-source distinction.
  <https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html>
- Martin Fowler, *Patterns for Reducing Friction in AI-Assisted Development* — where Context Anchoring is defined, alongside Knowledge Priming, Design-First Collaboration, Sensible Defaults, and the Feedback Flywheel.
  <https://martinfowler.com/articles/reduce-friction-ai/>
- Martin Fowler, *Architecture Decision Record*.
  <https://martinfowler.com/bliki/ArchitectureDecisionRecord.html>
- The `AGENTS.md` convention. <https://agents.md>
- OpenAI Codex documentation on `AGENTS.md`, skills, and durable project guidance.
- Linear documentation on initiatives, projects, milestones, documents, updates, and project templates.
