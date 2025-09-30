# Contributing to LivPulse v2.0

We love your input! We want to make contributing to LivPulse as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

## Pull Requests

Pull requests are the best way to propose changes to the codebase. We actively welcome your pull requests:

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue that pull request!

## Any contributions you make will be under the MIT Software License

In short, when you submit code changes, your submissions are understood to be under the same [MIT License](http://choosealicense.com/licenses/mit/) that covers the project. Feel free to contact the maintainers if that's a concern.

## Report bugs using GitHub's [issues](https://github.com/vasistasandeep/LivPulse2.0/issues)

We use GitHub issues to track public bugs. Report a bug by [opening a new issue](https://github.com/vasistasandeep/LivPulse2.0/issues/new); it's that easy!

## Write bug reports with detail, background, and sample code

**Great Bug Reports** tend to have:

- A quick summary and/or background
- Steps to reproduce
  - Be specific!
  - Give sample code if you can
- What you expected would happen
- What actually happens
- Notes (possibly including why you think this might be happening, or stuff you tried that didn't work)

## Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL
- Redis
- Git

### Setup Steps
1. Clone the repository
```bash
git clone https://github.com/vasistasandeep/LivPulse2.0.git
cd LivPulse2.0
```

2. Backend setup
```bash
cd backend
npm install
cp .env.example .env
# Configure your .env file
npx prisma generate
npx prisma db push
npm run dev
```

3. Frontend setup
```bash
cd frontend
npm install
cp .env.example .env.local
# Configure your .env.local file
npm start
```

## Code Style

### TypeScript/JavaScript
- Use TypeScript for all new code
- Follow ESLint configuration
- Use Prettier for formatting
- Write meaningful variable and function names
- Add JSDoc comments for public APIs

### React Components
- Use functional components with hooks
- Follow the established folder structure
- Use Material-UI components when possible
- Keep components small and focused

### Backend Code
- Use async/await instead of callbacks
- Implement proper error handling
- Use Prisma for database operations
- Follow REST API conventions

## Testing

- Write unit tests for new features
- Ensure all tests pass before submitting PR
- Include integration tests for API endpoints
- Test edge cases and error conditions

## Commit Messages

Use clear and meaningful commit messages:
- `feat: add new dashboard component`
- `fix: resolve authentication bug`
- `docs: update API documentation`
- `refactor: improve database queries`
- `test: add unit tests for user service`

## License

By contributing, you agree that your contributions will be licensed under the MIT License.