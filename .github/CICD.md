# CI/CD Workflows Documentation

This document describes the Continuous Integration and Continuous Deployment (CI/CD) workflows implemented for the EuAiTalk project.

## Overview

The project uses GitHub Actions to automate testing, building, and releasing of both the Node.js backend and Android application.

## Workflows

### 1. Backend CI (`backend-ci.yml`)

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

### 2. Android CI (`android-ci.yml`)

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

### 3. Android Release (`android-release.yml`)

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
- GitHub Release with versioned APK
- Release notes with installation guidance

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

**Option 1: Using Git Tags**
```bash
# Create and push a tag
git tag -a v1.0.0 -m "Release 1.0.0"
git push origin v1.0.0

# GitHub Actions will automatically:
# 1. Build the release APK
# 2. Create a GitHub release
# 3. Upload the APK
```

**Option 2: Manual Workflow**
1. Go to GitHub → Actions tab
2. Select "Android Release" workflow
3. Click "Run workflow"
4. Enter version number (e.g., `1.0.0`)
5. Click "Run workflow"

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
    ├── backend-ci.yml       # Backend testing
    ├── android-ci.yml       # Android build & lint
    └── android-release.yml  # Release APK creation
```

---

## Future Improvements

Potential enhancements to consider:

1. **Backend Testing**: Add unit tests with Jest or Mocha
2. **Android Testing**: Add instrumented tests and unit tests
3. **Code Coverage**: Generate and upload coverage reports
4. **Signed APKs**: Add keystore signing for production releases
5. **Deployment**: Auto-deploy backend to cloud service
6. **Notifications**: Send Slack/Discord notifications on build failures
7. **Performance**: Add build caching for faster builds

---

## Support

For questions or issues with CI/CD:
1. Check workflow logs in GitHub Actions
2. Review this documentation
3. Open an issue in the repository

---

**Last Updated**: 2026-01-26
**Version**: 1.0
