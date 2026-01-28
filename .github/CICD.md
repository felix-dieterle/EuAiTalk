# CI/CD Workflows Documentation

This document describes the Continuous Integration and Continuous Deployment (CI/CD) workflows implemented for the EuAiTalk project.

## Overview

The project uses GitHub Actions to automate testing, building, and releasing of both the Node.js backend and Android application.

## Workflows

### 1. Release on Merge (`release.yml`)

**Purpose:** Automatically create releases when changes are merged to the main branch.

**Triggers:**
- Automatic: Pushes to `main` branch (on merge)
- Manual: Workflow dispatch with version bump selection (patch/minor/major)

**Steps:**
1. **Version Calculation**: Automatically increments version (patch by default)
2. **Update Files**: Updates `package.json` and Android `build.gradle` with new version
3. **Create Tag**: Creates and pushes a git tag (e.g., `v1.0.1`)
4. **Generate Changelog**: Extracts commits since last release
5. **Create Release**: Creates GitHub release with changelog
6. **Build Backend**: Packages backend as tarball
7. **Build Android**: Compiles release APK
8. **Upload Assets**: Attaches all build artifacts to release

**Output:**
- GitHub Release with version tag
- Backend package: `euaitalk-backend-{VERSION}.tar.gz`
- Android APK: `EuAiTalk-{VERSION}.apk` (signed if keystore is configured, unsigned otherwise)
- Automated changelog from commits

**APK Signing:**
- The workflow supports automatic APK signing via GitHub Secrets
- If configured, produces signed APKs ready for distribution
- Falls back to unsigned APKs if secrets are not set
- See [SIGNING_SETUP.md](SIGNING_SETUP.md) for configuration instructions

**Success Criteria:**
- Version is bumped correctly
- Git tag is created and pushed
- GitHub release is published
- All artifacts are attached to release

---

### 2. Backend CI (`backend-ci.yml`)

**Purpose:** Validates backend code changes to ensure the server works correctly.

**Triggers:**
- Pull requests targeting `main` or `develop` branches
- Pushes to `main` or `develop` branches
- Only runs when backend-related files change:
  - `server/**`
  - `package.json`
  - `.github/workflows/backend-ci.yml`

**Steps:**
1. **Setup**: Checks out code and sets up Node.js 18
2. **Install**: Runs `npm ci` to install dependencies
3. **Syntax Check**: Validates JavaScript syntax with `node --check`
4. **Health Check**: Starts the server and tests the `/api/health` endpoint

**Success Criteria:**
- All dependencies install without errors
- Server code has valid JavaScript syntax
- Server starts successfully
- Health endpoint returns "ok" status

---

### 3. Frontend CI (`frontend-ci.yml`)

**Purpose:** Validates frontend code changes to ensure HTML, CSS, and JavaScript work correctly.

**Triggers:**
- Pull requests targeting `main` or `develop` branches
- Pushes to `main` or `develop` branches
- Only runs when frontend files change:
  - `public/**`
  - `.github/workflows/frontend-ci.yml`

**Steps:**
1. **HTML Validation**: Checks HTML syntax and structure
2. **JavaScript Check**: Validates JavaScript syntax with `node --check`
3. **CSS Check**: Basic CSS syntax validation
4. **Static Files**: Tests that all static files are served correctly

**Success Criteria:**
- HTML is valid
- JavaScript has no syntax errors
- CSS has no obvious errors
- All static files are accessible (HTTP 200)

---

### 4. Android CI (`android-ci.yml`)

**Purpose:** Builds and tests the Android application on every change.

**Triggers:**
- Pull requests targeting `main` or `develop` branches
- Pushes to `main` or `develop` branches
- Only runs when Android files change:
  - `android/**`
  - `.github/workflows/android-ci.yml`

**Steps:**
1. **Setup**: Checks out code, sets up JDK 17, and Gradle 8.2
2. **Build**: Compiles debug APK with `gradle assembleDebug`
3. **Upload**: Uploads debug APK as artifact (30-day retention)
4. **Lint**: Runs Android lint checks
5. **Reports**: Uploads lint reports (7-day retention)

**Artifacts:**
- `app-debug`: Debug APK for testing
- `lint-reports`: HTML lint reports

**Success Criteria:**
- APK builds without errors
- Lint checks complete (warnings allowed)

---

### 5. Android Release (`android-release.yml`) [Legacy]

**Note:** This workflow is maintained for backward compatibility. For new releases, use the main Release workflow (`release.yml`) instead.

**Purpose:** Creates production-ready APK releases and publishes them to GitHub Releases.

**Triggers:**

1. **Tag Push** (Automatic):
   ```bash
   git tag -a v1.0.0 -m "Release version 1.0.0"
   git push origin v1.0.0
   ```

2. **Manual Dispatch** (via GitHub UI):
   - Go to Actions → Android Release → Run workflow
   - Enter version number (e.g., `1.0.0`)

**Steps:**
1. **Setup**: Checks out code, sets up JDK 17, and Gradle 8.2
2. **Version**: Extracts version from tag or workflow input
3. **Build**: Compiles release APK with `gradle assembleRelease`
4. **Rename**: Renames APK to `EuAiTalk-{VERSION}.apk`
5. **Release**: Creates GitHub release with:
   - Release notes
   - Downloadable APK
   - Installation instructions

**Output:**
- GitHub Release with versioned APK (signed if keystore is configured)
- Release notes with installation guidance

**APK Signing:**
- Supports automatic signing via GitHub Secrets
- See [SIGNING_SETUP.md](SIGNING_SETUP.md) for setup instructions

**Success Criteria:**
- Release APK builds successfully
- APK is attached to GitHub release
- Release is published (not draft)

---

## Security Features

All workflows follow security best practices:

- **Minimal Permissions**: Each workflow has explicit `permissions` blocks limiting GITHUB_TOKEN access
- **Path Filtering**: Workflows only run when relevant files change, reducing attack surface
- **No Secrets Exposure**: No API keys or secrets are used in workflows
- **Dependency Pinning**: Actions use specific versions (e.g., `@v4`)

---

## Usage Guide

### Automatic Release on Merge

The new release workflow automatically creates releases when changes are merged to `main`:

1. Make your changes in a feature branch
2. Create a pull request to `main`
3. Once the PR is approved and merged, the release workflow will:
   - Automatically bump the patch version (e.g., 1.0.0 → 1.0.1)
   - Create a git tag (e.g., v1.0.1)
   - Generate a changelog from commits
   - Build and publish both backend and Android releases
   - Create a GitHub release with all artifacts

**Manual Release with Custom Version:**

If you need to bump minor or major version:

1. Go to GitHub → Actions tab
2. Select "Release on Merge" workflow
3. Click "Run workflow"
4. Select version bump type:
   - `patch`: 1.0.0 → 1.0.1 (bug fixes)
   - `minor`: 1.0.0 → 1.1.0 (new features)
   - `major`: 1.0.0 → 2.0.0 (breaking changes)
5. Click "Run workflow"

### Running Backend Tests Locally

```bash
# Install dependencies
npm ci

# Check syntax
node --check server/index.js

# Start server (test manually)
npm start
# In another terminal: curl http://localhost:3000/api/health
```

### Building Android APK Locally

```bash
cd android

# Debug build
gradle assembleDebug
# Output: app/build/outputs/apk/debug/app-debug.apk

# Release build
gradle assembleRelease
# Output: app/build/outputs/apk/release/app-release.apk
```

### Creating a Release

**Option 1: Automatic on Merge (Recommended)**
```bash
# Work on your feature
git checkout -b feature/my-feature
# ... make changes ...
git commit -m "feat: add new feature"
git push origin feature/my-feature

# Create PR and merge to main
# GitHub Actions will automatically create a release
```

**Option 2: Manual with Version Selection**
1. Go to GitHub → Actions tab
2. Select "Release on Merge" workflow
3. Click "Run workflow"
4. Select version bump type (patch/minor/major)
5. Click "Run workflow"

**Option 3: Using Git Tags (Legacy Android-only)**
```bash
# Create and push a tag (triggers Android-only release)
git tag -a v1.0.0 -m "Release 1.0.0"
git push origin v1.0.0

# Note: This will only build Android APK
# For full releases (backend + Android), use Option 1 or 2
```

### Viewing Workflow Results

1. Go to the **Actions** tab in the GitHub repository
2. Select the workflow run you want to inspect
3. View logs, download artifacts, or check job status

### Downloading Debug APKs

1. Go to Actions → Select a completed Android CI run
2. Scroll to "Artifacts" section
3. Download `app-debug` artifact
4. Unzip and install APK on Android device

---

## Troubleshooting

### Backend CI Fails

**Problem**: Health check fails
- **Solution**: Check server logs in workflow output
- **Common causes**:
  - Port 3000 already in use
  - Missing dependencies
  - Syntax errors in server code

### Android CI Fails

**Problem**: Build fails with Gradle errors
- **Solution**: Check Gradle version compatibility
- **Common causes**:
  - JDK version mismatch
  - Missing Android SDK components
  - Gradle dependency issues

**Problem**: Lint warnings
- **Solution**: Review lint reports in artifacts
- **Note**: Lint warnings don't fail the build

### Android Release Fails

**Problem**: APK not found after build
- **Solution**: Check build output path in logs
- **Possible fix**: APK might have different name than expected

**Problem**: Release already exists
- **Solution**: Delete existing release or use different tag

---

## File Structure

```
.github/
└── workflows/
    ├── release.yml           # Main release workflow (on merge to main)
    ├── backend-ci.yml        # Backend testing (PR + push)
    ├── frontend-ci.yml       # Frontend validation (PR + push)
    ├── android-ci.yml        # Android build & lint (PR + push)
    └── android-release.yml   # Legacy Android-only release
```

---

## Future Improvements

Potential enhancements to consider:

1. **Backend Testing**: Add unit tests with Jest or Mocha
2. **Android Testing**: Add instrumented tests and unit tests
3. **Code Coverage**: Generate and upload coverage reports
4. ~~**Signed APKs**: Add keystore signing for production releases~~ ✅ **Implemented** - See [SIGNING_SETUP.md](SIGNING_SETUP.md)
5. **Deployment**: Auto-deploy backend to cloud service (Heroku, AWS, etc.)
6. **Notifications**: Send Slack/Discord notifications on build failures
7. **Performance**: Add build caching for faster builds
8. **Semantic Versioning**: Auto-detect version bump from commit messages (feat/fix/BREAKING)

---

## Support

For questions or issues with CI/CD:
1. Check workflow logs in GitHub Actions
2. Review this documentation
3. Open an issue in the repository

---

**Last Updated**: 2026-01-27
**Version**: 2.0
