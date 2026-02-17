# Coding Rules & Protocols

## 🤖 AI Assistant Interaction Protocols

### Rule 1: Phase One - Planning & Approval
* **Protocol:** Establish the approach and gain approval *before* writing code.
* **Context Gathering:** Read specific scoped documents (e.g., `docs/schema.md` or `docs/PRD.md`) only during this phase. Do not continuously re-read the PRD during execution.
* **The 1-3-1 Proposal:** Provide **1** clearly defined goal, **3** potential execution options, and **1** recommendation.
* **The Test Plan:** Include your testing strategy (Playwright or pytest) within the 1-3-1 proposal. 
* **Constraint:** Stop and wait for user approval. Do not proceed to Phase Two until confirmed.

### Rule 2: Phase Two - Autonomous Execution Loop
* **Protocol:** Once the 1-3-1 plan is approved, execute autonomously. 
* **Action:** You no longer need permission to write tests, create files, or modify code related to the approved plan.
* **Self-Correction:** Independently run the test/linter and fix any resulting errors. Do not pause to ask for help with failing tests unless you are completely stuck after multiple attempts.

### Rule 3: External Memory & Session Hygiene
* **Protocol:** Maintain persistent context outside the chat.
* **Action:** Always read `progress.md` before starting, and update it exactly with what was finished when stopping.
* **Bankruptcy:** If token count exceeds ~20k-30k or a task fails repeatedly, run `/clear` immediately and pick up from `progress.md`.

---

## 🏗️ Architecture & Code Standards

### Rule 4: Backend & Database Standardization
* **Backend Framework:** Use **Python (FastAPI)** for core AI, NLP, and orchestration.
* **Edge Functions:** Use **TypeScript** for serverless routing.
* **BaaS & Auth:** Rely strictly on **Supabase** for user authentication and RLS. 
* **Database:** Use **PostgreSQL**. Leverage `JSONB` for unstructured AI data.
* **Deployment Boundaries:** Assume deployment to a **Linux VPS**. Containerize all services using **Docker** (`docker-compose`).

### Rule 5: Code Style & Modularity
* **Modularity:** Keep functions small, single-purpose, and pure. Separate business logic from UI components.
* **Agentic Workflows:** Strictly isolate system prompts into dedicated configuration files (e.g., `prompts.ts` or `.md`).
* **Typing & Errors:** Use strict typing (TypeScript / Pydantic). Define interfaces for API payloads. Never swallow errors; log the full context.

---

## 🚀 Automation & Tooling

### Rule 6: Exact Commands & Plugins
* **Python:** `pip install <package>` 
* **Node:** `npm install <package>`
* **Development:** `docker-compose up -d` (Backend) | `npm run dev` (Frontend)
* **Plugins:** Standardize AI tool use. Install MCP servers for third-party tasks. Run `/plugin marketplace add anthropics/claude-code` and `/plugin install frontend-design@claude-code-plugins`.

---

## 🎨 Frontend & UI Standards

### Rule 7: shadcn/ui Best Practices
* **Protocol:** Treat UI components as source code. Consult `DesignSystem.md` before generating new UI.
* **Action:** Install components individually (e.g., `npx shadcn@latest add button`). 
* **Structure:** Place raw components in `components/ui/` and build product-specific abstractions (e.g., `AppButton.tsx`). 
* **Styling:** Use Tailwind CSS variables for global design tokens.
* **Cognitive Load:** Design flows that progressively disclose information. Use micro-interactions to mask AI network latency.

---

## 🧪 Testing, Quality & Security

### Rule 8: Playwright & TDD (Critical)
* **Protocol:** Always test first using **Playwright** (E2E/UI) and **pytest** (Backend).
* **Action:** Check existing tests in `tests/`. Create/adjust `.spec.ts` or `test_*.py` files for new flows. 
* **Resilience:** Use Playwright's built-in async matchers (e.g., `await expect(page.locator('.foo')).toBeVisible()`) to avoid manual waits. Use Page Object Models (POM) for complex flows.

### Rule 9: Secrets & Validation
* **Protocol:** Zero-trust data handling.
* **Action:** Never hardcode API keys for external services or LLMs. Always use environment variables and ensure `.env` is ignored in git. Sanitize all user inputs before passing them into a prompt or query.

---

## 📚 Project Documentation

### Rule 10: Documentation Standards
* **ADRs:** Document significant architectural decisions.
* **PRD:** Update the PRD only when core project scope changes, rather than treating it as a daily dependency.