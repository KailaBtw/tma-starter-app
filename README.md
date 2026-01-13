# Project Linting and Formatting Guide

This project uses automated linting and formatting tools to maintain code quality and consistency. This guide explains how to use them.

## Table of Contents

- [Backend (Python)](#backend-python)
- [Frontend (JavaScript/React)](#frontend-javascriptreact)
- [Mobile App (React Native/Expo)](#mobile-app-react-nativeexpo)
- [GitHub Actions CI](#github-actions-ci)
- [Quick Reference](#quick-reference)

---

## Backend (Python)

The backend uses three tools for code quality:

- **Black**: Code formatter (automatically formats code)
- **Ruff**: Fast linter (finds errors and style issues)
- **isort**: Import sorter (organizes import statements)

### Installation

First, install the development dependencies:

```bash
cd backend
poetry install --with dev
```

### Usage

#### Format Code with Black

Format all Python files:

```bash
poetry run black .
```

Check if files need formatting (without making changes):

```bash
poetry run black --check .
```

#### Sort Imports with isort

Sort imports in all files:

```bash
poetry run isort .
```

Check if imports need sorting (without making changes):

```bash
poetry run isort --check-only .
```

#### Lint Code with Ruff

Check for linting errors:

```bash
poetry run ruff check .
```

Auto-fix issues that can be automatically fixed:

```bash
poetry run ruff check --fix .
```

#### Run All Checks

To check everything before committing:

```bash
# Check formatting
poetry run black --check .

# Check import sorting
poetry run isort --check-only .

# Check linting
poetry run ruff check .
```

#### Auto-format Everything

To automatically format and fix everything:

```bash
# Format code
poetry run black .

# Sort imports
poetry run isort .

# Fix linting issues
poetry run ruff check --fix .
```

### Configuration

All configuration is in `backend/pyproject.toml`:

- **Black**: Line length 88, Python 3.9+ compatible
- **Ruff**: Checks for errors, warnings, and style issues
- **isort**: Configured to work with Black's formatting style

---

## Frontend (JavaScript/React)

The frontend uses two tools:

- **ESLint**: JavaScript/React linter (finds errors and enforces best practices)
- **Prettier**: Code formatter (automatically formats code)

### Installation

First, install the development dependencies:

```bash
cd ui
npm install
```

### Usage

#### Lint Code with ESLint

Check for linting errors:

```bash
npm run lint
```

Auto-fix issues that can be automatically fixed:

```bash
npm run lint:fix
```

#### Format Code with Prettier

Format all files:

```bash
npm run format
```

Check if files need formatting (without making changes):

```bash
npm run format:check
```

#### Run All Checks

To check everything before committing:

```bash
# Check linting
npm run lint

# Check formatting
npm run format:check
```

#### Auto-format Everything

To automatically format and fix everything:

```bash
# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

### Configuration

- **ESLint**: Configured in `ui/.eslintrc.cjs` with React-specific rules
- **Prettier**: Configured in `ui/.prettierrc` with sensible defaults
- **Prettier ignore**: Files listed in `ui/.prettierignore` are excluded

---

## Mobile App (React Native/Expo)

The mobile app is a React Native application built with Expo for users to access their groups, courses, and track progress.

### Location

The mobile app is located in the `mobile/` directory.

### Setup

1. **Navigate to mobile directory**:
   ```bash
   cd mobile
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment**:
   Create a `.env` file:
   ```
   EXPO_PUBLIC_API_URL=http://localhost:8000
   ```

4. **Start development server**:
   ```bash
   npm start
   ```

### Running the App

- **iOS**: `npm run ios`
- **Android**: `npm run android`
- **Web**: `npm run web`

### Tech Stack

- Expo (React Native framework)
- Expo Router (file-based routing)
- React Native Paper (Material Design 3 UI)
- TypeScript
- React Query (data fetching)
- Axios (HTTP client)

### Documentation

For detailed mobile app documentation, see [mobile/README.md](./mobile/README.md).

---

## GitHub Actions CI

The project includes a GitHub Actions workflow that automatically runs all linters and formatters on:

- Every push to `main` or `develop` branches
- Every pull request targeting `main` or `develop` branches

### Workflow Location

The workflow is defined in `.github/workflows/lint.yml`.

### What It Checks

**Backend:**
- ✅ Black formatting check
- ✅ isort import sorting check
- ✅ Ruff linting check

**Frontend:**
- ✅ ESLint linting check
- ✅ Prettier formatting check

### Viewing Results

1. Go to your repository on GitHub
2. Click on the "Actions" tab
3. Click on the workflow run to see detailed results
4. If any check fails, fix the issues locally and push again

---

## Quick Reference

### Backend Commands

| Command | Description |
|---------|-------------|
| `poetry run black .` | Format all Python files |
| `poetry run black --check .` | Check if formatting is needed |
| `poetry run isort .` | Sort all imports |
| `poetry run isort --check-only .` | Check if imports need sorting |
| `poetry run ruff check .` | Check for linting errors |
| `poetry run ruff check --fix .` | Fix auto-fixable linting errors |

### Frontend Commands

| Command | Description |
|---------|-------------|
| `npm run lint` | Check for linting errors |
| `npm run lint:fix` | Fix auto-fixable linting errors |
| `npm run format` | Format all files |
| `npm run format:check` | Check if formatting is needed |


### Database Commands
To completely replace the database, use the reset flag:
`docker exec -it tma_backend poetry run python scripts/populate.py --reset`

To append to the database, don't use the reset flag: 
`docker exec -it tma_backend poetry run python scripts/populate.py`

### Completely Rebuild Docker Images and Containers 
`docker-compose down --rmi all -v --remove-orphans && docker-compose up --build -d`

### Recommended Workflow

Before committing your code:

1. **Backend:**f
   ```bash
   cd backend
   poetry run black .
   poetry run isort .
   poetry run ruff check --fix .
   ```

2. **Frontend:**
   ```bash
   cd ui
   npm run lint:fix
   npm run format
   ```

3. **Commit and push:**
   ```bash
   git add .
   git commit -m "Your commit message"
   git push
   ```

The GitHub Actions workflow will automatically verify everything passes!


## Testing
* Backend: `docker exec -it tma_backend poetry run pytest`
* Web: `docker exec -it tma_frontend npm run test:verbose`
* Mobile: 
    ```bash
    cd mobile
    npm run test:verbose
    ```