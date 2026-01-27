# Android APK Signing Setup for CI/CD

This document explains how to configure Android APK signing for GitHub Actions to produce production-ready signed APKs.

## Overview

The GitHub Actions workflows now support automatic APK signing using GitHub Secrets. If signing is configured, the workflows will produce **signed APKs**. If not configured, they will fall back to **unsigned APKs**.

## Prerequisites

You need to create an Android keystore file. This is required for signing Android applications.

### Creating a Keystore

Run this command on your local machine:

```bash
keytool -genkey -v -keystore euaitalk-release.keystore \
    -alias euaitalk \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000
```

You'll be prompted for:
- **Keystore password**: Choose a strong password
- **Key password**: Can be the same as keystore password
- **Name and organization details**: Fill in as appropriate

**⚠️ IMPORTANT**: Keep this keystore file and passwords safe! You'll need them for all future releases.

## Configuring GitHub Secrets

To enable APK signing in GitHub Actions, you need to add the following secrets to your repository:

### 1. Navigate to Repository Settings

1. Go to your GitHub repository
2. Click on **Settings** tab
3. In the left sidebar, click **Secrets and variables** → **Actions**

### 2. Add Required Secrets

Click **New repository secret** for each of the following:

#### Secret 1: ANDROID_KEYSTORE_BASE64

This is your keystore file encoded in base64.

**To create this value:**

```bash
# On Linux/Mac
base64 -w 0 euaitalk-release.keystore

# On Windows (PowerShell)
[Convert]::ToBase64String([IO.File]::ReadAllBytes("euaitalk-release.keystore"))
```

Copy the entire output (it will be a very long string) and paste it as the secret value.

#### Secret 2: ANDROID_KEYSTORE_PASSWORD

The password you chose when creating the keystore (the store password).

#### Secret 3: ANDROID_KEY_ALIAS

The alias you used when creating the keystore. From the example above, this would be `euaitalk`.

#### Secret 4: ANDROID_KEY_PASSWORD

The key password you chose. Often this is the same as the keystore password.

### Summary of Secrets

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `ANDROID_KEYSTORE_BASE64` | Base64-encoded keystore file | `MIIKRgIBAzCC...` (very long) |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password | `your-secure-password` |
| `ANDROID_KEY_ALIAS` | Key alias | `euaitalk` |
| `ANDROID_KEY_PASSWORD` | Key password | `your-secure-password` |

## Verifying Setup

Once you've added all four secrets:

1. Make any change and merge to `main`, or
2. Manually trigger the "Release on Merge" workflow from the Actions tab

The workflow will:
- Detect that signing secrets are configured
- Decode the keystore
- Build a signed APK
- Upload the signed APK to the GitHub Release

Check the workflow logs for confirmation:
```
Building signed release APK...
✅ Renamed signed APK to EuAiTalk-X.Y.Z.apk
```

## Without Signing Configuration

If you don't configure the secrets, the workflows will still work but produce unsigned APKs:
```
Building unsigned release APK (no keystore configured)...
✅ Renamed unsigned APK to EuAiTalk-X.Y.Z.apk
```

**Unsigned APKs**:
- ⚠️ Cannot be uploaded to Google Play Store
- ⚠️ Users must enable "Install from unknown sources" on their devices
- ✅ Useful for testing and development

**Signed APKs**:
- ✅ Can be uploaded to Google Play Store (use AAB format for Play Store)
- ✅ Users can install normally
- ✅ Required for production releases

## Security Best Practices

### ✅ DO:
- Keep your keystore file in a secure location (encrypted backup)
- Use strong, unique passwords
- Store secrets only in GitHub Secrets (never commit to repository)
- Limit access to repository secrets to trusted collaborators

### ❌ DON'T:
- Never commit keystore files to the repository
- Never commit passwords to the repository
- Never share keystore passwords publicly
- Never reuse passwords from other services

## Troubleshooting

### Build fails with "keystore not found"

**Problem**: The base64 decoding failed.

**Solution**: 
- Ensure you copied the complete base64 string (no line breaks)
- Re-encode the keystore: `base64 -w 0 euaitalk-release.keystore`
- Update the `ANDROID_KEYSTORE_BASE64` secret

### Build fails with "password incorrect"

**Problem**: The passwords don't match.

**Solution**:
- Verify the passwords in GitHub Secrets match what you used when creating the keystore
- Test locally: `keytool -list -v -keystore euaitalk-release.keystore`

### APK is still unsigned

**Problem**: Secrets are not configured or not accessible.

**Solution**:
- Ensure all four secrets are added to the repository
- Check secret names match exactly (case-sensitive)
- Verify secrets are in **Actions** secrets (not Environment secrets)

## Local Testing

To test signing locally without CI/CD:

```bash
cd android

# Set environment variables
export ANDROID_KEYSTORE_FILE="/path/to/euaitalk-release.keystore"
export ANDROID_KEYSTORE_PASSWORD="your-password"
export ANDROID_KEY_ALIAS="euaitalk"
export ANDROID_KEY_PASSWORD="your-password"

# Build signed APK
gradle assembleRelease

# Verify signature
jarsigner -verify -verbose -certs app/build/outputs/apk/release/app-release.apk
```

## Additional Resources

- [Android App Signing Documentation](https://developer.android.com/studio/publish/app-signing)
- [GitHub Actions Encrypted Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Keystore Security Best Practices](https://developer.android.com/studio/publish/app-signing#secure-shared-keystore)

## Support

If you encounter issues:
1. Check the GitHub Actions workflow logs
2. Review this documentation
3. Test signing locally using the steps above
4. Open an issue in the repository with error details
