# GitHub Actions Workflows for RedDoor Mobile Builds

This directory contains GitHub Actions workflows for building and releasing the RedDoor mobile applications.

## Workflows

### 1. `build-mobile-simple.yml` - Simple Build Workflow

**Recommended for getting started**

- Builds Android APK (unsigned) and iOS app bundle
- Runs on both release creation and manual trigger
- No signing certificates required
- Uploads artifacts for download

**Triggers:**

- When a GitHub release is published
- Manual workflow dispatch

### 2. `release-production.yml` - Production Release Workflow

**For production releases with proper signing**

- Builds signed Android APK and iOS IPA
- Requires signing certificates and provisioning profiles
- Integrates with AWS for production configuration
- Uploads to GitHub releases and as artifacts

**Triggers:**

- When a GitHub release is published
- Manual workflow dispatch with environment selection

### 3. `build-and-release.yml` - Full Featured Workflow

**Complete workflow with all features**

- Comprehensive build process
- Supports both automatic and manual release creation
- Includes AWS integration
- Advanced iOS build configuration

## Setup Instructions

### Basic Setup (Simple Workflow)

1. **No additional setup required** - the simple workflow will work out of the box
2. Create a GitHub release to trigger the build
3. Download APK and iOS app from the workflow artifacts

### Production Setup (Signed Builds)

#### Required GitHub Secrets

**AWS Configuration:**

```
AWS_ACCESS_KEY_ID          # AWS access key for Amplify config
AWS_SECRET_ACCESS_KEY      # AWS secret key for Amplify config
```

**Android Signing:**

```
ANDROID_KEYSTORE_BASE64    # Base64 encoded Android keystore file
ANDROID_KEYSTORE_PASSWORD  # Keystore password
ANDROID_KEY_ALIAS          # Key alias name
ANDROID_KEY_PASSWORD       # Key password
```

**iOS Signing:**

```
IOS_CERTIFICATE_BASE64         # Base64 encoded .p12 certificate
IOS_CERTIFICATE_PASSWORD       # Certificate password
IOS_PROVISIONING_PROFILE_BASE64 # Base64 encoded provisioning profile
IOS_CODE_SIGN_IDENTITY         # Code signing identity name
IOS_PROVISIONING_PROFILE_UUID  # Provisioning profile UUID
APPLE_TEAM_ID                  # Apple Developer Team ID
```

#### GitHub Variables (Optional)

```
AWS_REGION                 # AWS region (default: us-east-1)
```

### Setting Up Android Signing

1. **Generate a keystore** (if you don't have one):

   ```bash
   keytool -genkey -v -keystore release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Convert keystore to base64**:

   ```bash
   base64 -i release-key.keystore | pbcopy  # macOS
   base64 -w 0 release-key.keystore         # Linux
   ```

3. **Add to GitHub Secrets**:
   - `ANDROID_KEYSTORE_BASE64`: The base64 string from step 2
   - `ANDROID_KEYSTORE_PASSWORD`: Password you set for the keystore
   - `ANDROID_KEY_ALIAS`: The alias you used (e.g., "my-key-alias")
   - `ANDROID_KEY_PASSWORD`: Password for the key (often same as keystore password)

### Setting Up iOS Signing

1. **Export your certificate** from Keychain Access as a .p12 file

2. **Convert certificate to base64**:

   ```bash
   base64 -i certificate.p12 | pbcopy  # macOS
   base64 -w 0 certificate.p12         # Linux
   ```

3. **Convert provisioning profile to base64**:

   ```bash
   base64 -i profile.mobileprovision | pbcopy  # macOS
   base64 -w 0 profile.mobileprovision         # Linux
   ```

4. **Add to GitHub Secrets**:
   - `IOS_CERTIFICATE_BASE64`: Base64 encoded certificate
   - `IOS_CERTIFICATE_PASSWORD`: Certificate password
   - `IOS_PROVISIONING_PROFILE_BASE64`: Base64 encoded provisioning profile
   - `IOS_CODE_SIGN_IDENTITY`: Certificate name (e.g., "iPhone Distribution: Your Name")
   - `IOS_PROVISIONING_PROFILE_UUID`: UUID from provisioning profile
   - `APPLE_TEAM_ID`: Your Apple Developer Team ID

## Usage

### Creating a Release

1. **Automatic Release** (when you create a GitHub release):

   ```bash
   # Create and push a tag
   git tag v1.0.0
   git push origin v1.0.0

   # Create a release on GitHub using the tag
   # The workflow will automatically trigger
   ```

2. **Manual Trigger**:
   - Go to Actions tab in your GitHub repository
   - Select the workflow you want to run
   - Click "Run workflow"
   - Fill in any required parameters

### Downloading Builds

**From GitHub Releases:**

- APK and IPA files are attached to the release
- Direct download links for distribution

**From Workflow Artifacts:**

- Available in the Actions tab
- Click on a workflow run to see artifacts
- Download zip files containing the builds

## Workflow Features

### Build Process

1. **Web App Build**: Runs `npm run build` to create optimized web bundle
2. **Capacitor Sync**: Syncs web assets with native projects
3. **Native Builds**: Compiles Android APK and iOS app/IPA
4. **Artifact Upload**: Uploads builds to GitHub releases and artifacts

### Environment Support

- **Development**: Unsigned builds for testing
- **Production**: Signed builds ready for distribution
- **Staging**: Configurable environment for testing

### Error Handling

- Graceful fallbacks when signing certificates are not available
- Clear error messages for missing dependencies
- Artifact upload even if signing fails

## Troubleshooting

### Common Issues

**Android Build Fails:**

- Check Java version (requires Java 17)
- Verify Android SDK setup
- Check keystore configuration if using signed builds

**iOS Build Fails:**

- Ensure running on macOS runner
- Check Xcode version compatibility
- Verify certificate and provisioning profile setup

**AWS Configuration Issues:**

- Verify AWS credentials have proper permissions
- Check if Amplify app ID and branch are correct in `prod-config` script

**Missing Artifacts:**

- Check workflow logs for build errors
- Verify file paths in the workflow
- Ensure builds complete successfully before artifact upload

### Getting Help

1. Check the workflow logs in the Actions tab
2. Verify all required secrets are set correctly
3. Test builds locally using the same commands
4. Check Capacitor and platform-specific documentation

## Customization

### Modifying Build Commands

Edit the workflow files to change:

- Build commands (`npm run build`, `gradlew assembleRelease`)
- Artifact names and paths
- Upload destinations

### Adding New Platforms

- Add new jobs for additional platforms
- Configure platform-specific build steps
- Set up signing and artifact upload

### Environment Variables

Add environment-specific configuration:

- Different AWS profiles for staging/production
- Platform-specific build configurations
- Custom artifact naming schemes
