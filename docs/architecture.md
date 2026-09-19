# architecture.md

## Purpose

This file defines the stable technical rules of the product.

Feature specs may describe implementation details for one piece of work. This document defines the shared architecture that should remain consistent across the whole product.

The goal is to help contributors and AI agents make technical decisions that fit the system rather than solving each task in isolation.

---

## 1. Stack

### Frontend

- framework: [ ]
- language: [ ]
- styling: [ ]
- component system: [ ]
- animation: [ ]
- forms: [ ]
- state management: [ ]
- data fetching: [ ]
- routing: [ ]

### Backend

- runtime / framework: [ ]
- database: [ ]
- auth: [ ]
- file storage: [ ]
- background jobs: [ ]
- email / notifications: [ ]

### Tooling

- package manager: [ ]
- linting: [ ]
- formatting: [ ]
- testing: [ ]
- CI/CD: [ ]
- deployment: [ ]

---

## 2. Repository structure

```txt
[Define the preferred folder structure here.]
```

### Structure rules

- [Rule]
- [Rule]
- [Rule]

---

## 3. Architectural principles

Choose the principles that should guide the codebase.

### Example principles

#### Prefer composition over duplication

Shared behaviour should be extracted when it is meaningfully reusable, not copied across features.

#### Keep domain logic close to the domain

Business rules should live in places that make ownership and change easy to understand.

#### Separate visual components from feature logic

Reusable interface components should not contain one-off product behaviour.

#### Optimize for clarity before cleverness

Prefer code that is easy to reason about and maintain over code that is merely compact or novel.

---

## 4. Frontend architecture

### Routing

[How routing works.]

### Rendering model

[SSR, CSR, SSG, hybrid, etc.]

### State management

[What belongs in local state, URL state, server state, global state.]

### Data fetching

[Preferred libraries, caching strategy, invalidation rules, loading/error handling.]

### Forms and validation

[Where validation lives and what patterns to use.]

### Components

[How components are grouped, named, and reused.]

### Styling

[Tokens, CSS strategy, theming, responsive conventions.]

### Accessibility

[Implementation expectations.]

---

## 5. Backend architecture

### API style

[REST, GraphQL, RPC, server actions, etc.]

### Domain boundaries

[How business areas are separated.]

### Authentication and authorization

[Rules and ownership.]

### Data validation

[Where validation happens.]

### Error handling

[How errors are represented and exposed.]

### Background processing

[Jobs, queues, retries, idempotency.]

---

## 6. Data architecture

### Core entities

- [Entity]
- [Entity]

### Database conventions

- naming: [ ]
- ids: [ ]
- timestamps: [ ]
- soft delete: [ ]
- migrations: [ ]

### Data ownership

[Which part of the system owns which data.]

---

## 7. API conventions

### Naming

[Endpoint and field naming conventions.]

### Requests

[Validation, pagination, filtering, sorting.]

### Responses

[Shape, envelope, status handling.]

### Errors

[Error format and examples.]

### Versioning

[If relevant.]

---

## 8. Design system integration

### Tokens

[Where tokens live and how they are consumed.]

### Components

[How components are shared and documented.]

### Variants

[How visual and behavioural variants are handled.]

### Theming

[How brand or theme differences are represented.]

---

## 9. Code conventions

### Naming

- files: [ ]
- components: [ ]
- hooks: [ ]
- utilities: [ ]
- types: [ ]

### Type safety

[Expected use of types, schemas, generated types, etc.]

### Error handling

[Patterns.]

### Logging

[Patterns.]

### Comments

[When comments are useful and when code should explain itself.]

---

## 10. Testing strategy

### Unit tests

[What deserves unit tests.]

### Integration tests

[What deserves integration tests.]

### End-to-end tests

[What deserves E2E coverage.]

### Visual regression

[If relevant.]

### Accessibility testing

[Expected checks.]

---

## 11. Security and privacy

- [Authentication rules]
- [Authorization rules]
- [Secrets handling]
- [PII handling]
- [Input validation]
- [Rate limiting]
- [Auditability]

---

## 12. Performance

### Targets

- [Target]
- [Target]

### Preferred practices

- [Practice]
- [Practice]

### Avoid

- [Anti-pattern]
- [Anti-pattern]

---

## 13. Observability

### Analytics

[How product analytics are instrumented.]

### Logging

[What is logged and why.]

### Monitoring

[How health and failures are detected.]

### Error reporting

[How client and server errors are tracked.]

---

## 14. Deployment and environments

### Environments

- local
- preview
- staging
- production

### Environment variables

[How they are managed.]

### Deployment process

[How code reaches production.]

### Rollback strategy

[How failed releases are handled.]

---

## 15. Preferred patterns

- [Pattern]
- [Pattern]
- [Pattern]

---

## 16. Patterns to avoid

- [Anti-pattern]
- [Anti-pattern]
- [Anti-pattern]

---

## 17. Open architectural questions

- [Question]
- [Question]
- [Question]

---

## Final review checklist

- Is the stack explicit?
- Is the folder structure clear?
- Are frontend and backend responsibilities separated?
- Are data and API conventions defined?
- Are design tokens and components integrated into the architecture?
- Are testing expectations visible?
- Are security, privacy, and performance considered?
- Are preferred patterns and anti-patterns named?
- Could an AI coding agent make consistent technical choices from this file?
