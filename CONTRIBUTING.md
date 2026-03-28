# Contributing to Inkflow

Thank you for your interest in contributing to Inkflow! 🌟

We welcome contributions of all kinds, including bug reports, feature requests, documentation improvements, and code changes.

## Development & Branching Policy

To maintain high code quality and package health, **direct pushes to the `master` branch are restricted**. All changes must be submitted via a Pull Request (PR).

### 1. Fork & Branch
Fork the repository and create a new feature branch for your work:
```bash
git checkout -b feature/your-feature-name
```

### 2. Development Setup

To get started with development, follow these steps:

1.  **Install Dependencies**: `npm install`. This will automatically set up **Husky** handles to ensure you don't accidentally push directly to the `master` branch.
2.  **Start Dev Server**: `npm run dev`. This runs the editor demo locally.
3.  **Run Tests**: `npm test`. We use Vitest for core editor logic.
4.  **Lint**: `npm run lint`. Ensure your code follows the project's style guide.

### 3. Automated CI
On every Pull Request, our **GitHub Actions CI** will automatically run:
-   **Linting**: Ensures consistent code style.
-   **Testing**: Validates core editor logic.
-   **Build**: Confirms the production bundle is stable.

### 4. Submitting a Pull Request
Once your changes are ready and all tests pass locally:
1.  Push your branch to your fork.
2.  Open a Pull Request against the `master` branch of the main repository.
3.  Provide a clear description of the problem solved or feature added.

## Code of Conduct

Please note that this project is released with a [Contributor Code of Conduct](CODE_OF_CONDUCT.md). By participating in this project you agree to abide by its terms.

---
Inkflow is built with ❤️ for the modern web.
