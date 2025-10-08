# Contributing to UniStay

Thank you for your interest in contributing to UniStay! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Maintain a harassment-free environment

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally
   ```bash
   git clone https://github.com/YOUR-USERNAME/startup.git
   cd startup
   ```
3. **Set up the development environment** (see README.md)
4. **Create a branch** for your changes
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### Before You Start

- Check existing issues to see if your idea is already being worked on
- For major changes, open an issue first to discuss your approach
- Make sure you can run the project locally and all tests pass

### Making Changes

1. **Write clear, focused commits**
   ```bash
   git commit -m "Add feature: detailed description"
   ```

2. **Follow the existing code style**
   - Backend: TypeScript with Express patterns
   - Frontend: React with TypeScript
   - Use meaningful variable names
   - Add comments for complex logic

3. **Test your changes**
   - Ensure the backend starts without errors
   - Ensure the frontend builds and runs
   - Test all affected features manually
   - Test edge cases

### Commit Message Guidelines

Use clear, descriptive commit messages:

```
feat: add user profile photo upload
fix: resolve login redirect issue
docs: update API documentation for reviews
refactor: simplify trust score calculation
chore: update dependencies
```

Prefixes:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

## Pull Request Process

1. **Update documentation** if needed
2. **Ensure your code follows the style** of the project
3. **Test thoroughly** - both happy path and edge cases
4. **Submit your PR** with a clear description:
   - What changes did you make?
   - Why did you make them?
   - How can reviewers test them?
5. **Respond to feedback** - be open to suggestions

### PR Title Format

```
[Type] Brief description of changes

Example:
[Feature] Add company profile photo upload
[Fix] Resolve email verification token expiry
[Docs] Add deployment guide for AWS
```

## Code Style Guidelines

### TypeScript/JavaScript

- Use TypeScript for type safety
- Prefer `const` over `let`
- Use async/await over promises
- Use descriptive variable names
- Keep functions small and focused

### React Components

- Use functional components with hooks
- Keep components small and reusable
- Use TypeScript interfaces for props
- Follow the existing component structure

### API Design

- RESTful endpoints where possible
- Clear, consistent naming
- Proper HTTP status codes
- Validate all input with Zod schemas
- Return meaningful error messages

## Project Areas

### Backend (`/backend`)

- Express routes in `src/routes/`
- Authentication in `src/middleware/auth.ts`
- Database migrations in `migrations/`
- Utilities in `src/utils/`

Technologies:
- Node.js + Express + TypeScript
- PostgreSQL
- JWT authentication
- Zod validation

### Frontend (`/frontend`)

- Routes in `app/routes/`
- Components in `app/components/`
- API client in `app/lib/api/`
- Shared hooks in `app/lib/`

Technologies:
- React + React Router
- TypeScript
- TailwindCSS
- Radix UI components

## Testing

Currently, the project relies on manual testing. We'd love contributions to add:
- Unit tests for utilities
- Integration tests for API endpoints
- E2E tests for critical user flows

## Documentation

When adding new features:
- Update the README.md if user-facing
- Update API documentation in backend/README.md
- Add inline code comments for complex logic
- Consider adding a separate doc in `/docs` for major features

## Areas We Need Help

- [ ] Unit and integration tests
- [ ] Rate limiting for API endpoints
- [ ] Password reset functionality
- [ ] Admin dashboard improvements
- [ ] Mobile responsive improvements
- [ ] Accessibility improvements
- [ ] Performance optimizations
- [ ] Documentation improvements

## Questions?

- Check existing issues and discussions
- Read the documentation in `/backend/README.md` and `/frontend/README.md`
- Open an issue for questions

## License

By contributing, you agree that your contributions will be licensed under the ISC License.

---

Thank you for contributing to UniStay! 🎉
