# RedDoor - Local Community Platform

**"Reddit meets Nextdoor"** - A location-based social platform that combines the community-driven content model of Reddit with the local focus of Nextdoor.

## What is RedDoor?

RedDoor enables users to engage with their local communities through location-specific channels while maintaining the ability to discover content across all communities through aggregated feeds. Users join location-based communities (cities/metro areas) and participate in topic-specific channels within those locations.

### Key Features

- **Location-Based Communities**: Join cities or metropolitan areas (e.g., "Ann Arbor", "Chicago", "Seattle")
- **Local Channels**: Topic-specific discussions within each location ("politics", "golf", "restaurants", "events")
- **Rich Content**: Text posts, images, and links with Markdown formatting support
- **Multiple Feed Types**:
  - Channel-specific feeds for focused discussions
  - Location-wide feeds for community overview
  - "All" feed combining content from all joined locations
  - "Popular" feed highlighting trending content
- **Cross-Platform**: Web app, iOS, and Android support via Progressive Web App and native compilation

## Technology Stack

### Frontend

- **React 19** with TypeScript for type-safe development
- **Vite** for fast development and optimized builds
- **React Router** for client-side routing
- **React Markdown** for rich text content rendering
- **AWS Amplify UI** for pre-built authentication and storage components

### Backend (AWS Amplify Gen 2)

- **AWS Amplify** for full-stack deployment and hosting
- **AWS Cognito** for user authentication and management
- **AWS AppSync** for GraphQL API with real-time subscriptions
- **Amazon DynamoDB** for scalable data storage
- **Amazon S3** for image uploads and static content
- **AWS Lambda** for serverless business logic
- **AWS CDK** for Infrastructure as Code

### Mobile & PWA

- **Capacitor** for native iOS and Android app compilation
- **Progressive Web App** capabilities for mobile web experience
- **Mobile-first responsive design**

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- AWS CLI configured with appropriate permissions
- For mobile development: Xcode (iOS) and/or Android Studio

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd reddoor
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up AWS Amplify backend**

   ```bash
   # Deploy to sandbox environment for development
   npm run sandbox
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

The app will be available at `http://localhost:5173`

## Available Scripts

### Development Scripts

- **`npm run dev`** - Starts the Vite development server with hot module replacement
- **`npm run sandbox`** - Deploys Amplify backend to a sandbox environment for development and testing
- **`npm run build`** - Builds the app for production (TypeScript compilation + Vite build)
- **`npm run preview`** - Serves the production build locally for testing

### Code Quality Scripts

- **`npm run lint`** - Runs ESLint to check for code quality issues
- **`npm run analyze`** - Analyzes bundle size using source-map-explorer (requires build first)
- **`npm run prepare`** - Sets up Husky git hooks (runs automatically after npm install)

### Production & Deployment Scripts

- **`npm run prod-config`** - Generates production configuration from deployed Amplify app
  - Uses app ID `d14lkx3uodtpjt` and `main` branch
  - Requires `personal` AWS profile

### Mobile Development Scripts

- **`npm run ios`** - Complete iOS build and launch process:

  1. Generates production config
  2. Builds the web app
  3. Syncs with Capacitor
  4. Copies files to iOS project
  5. Opens Xcode for iOS development

- **`npm run dev-ios`** - iOS development workflow (without config generation):
  1. Builds the web app
  2. Syncs with Capacitor (`cap sync`)
  3. Copies files to iOS project (`cap copy ios`)
  4. Opens Xcode (`cap open ios`)

## Development Workflow

### Local Development

1. **Start sandbox backend**

   ```bash
   npm run sandbox
   ```

2. **Start development server**

   ```bash
   npm run dev
   ```

3. **Make changes** - The dev server will automatically reload

### Code Quality

The project uses several tools to maintain code quality:

- **ESLint** - Linting for TypeScript and React
- **Husky** - Git hooks for pre-commit checks
- **lint-staged** - Runs linting and formatting on staged files
- **Prettier** - Code formatting (configured via lint-staged)

Pre-commit hooks automatically:

- Format TypeScript, JSON, YAML, and Markdown files
- Run ESLint with auto-fix
- Cache results for faster subsequent runs

### Mobile Development

#### iOS Development

1. Run `npm run ios` for complete setup
2. Use Xcode to build and test on simulator/device
3. For subsequent changes, use `npm run dev-ios`

#### Android Development

- Android project is set up in the `android/` directory
- Use `cap sync android && cap open android` to work with Android Studio

### Production Deployment

1. **Build for production**

   ```bash
   npm run build
   ```

2. **Deploy backend** (if changes made to amplify/)

   ```bash
   npx ampx pipeline-deploy --branch main
   ```

3. **Deploy frontend** - Amplify automatically deploys from connected Git repository

## Project Structure

```
reddoor/
├── amplify/                 # AWS Amplify backend configuration
│   ├── auth/               # Authentication setup
│   ├── data/               # GraphQL schema and resolvers
│   └── backend.ts          # Backend resource definitions
├── src/                    # React application source
├── public/                 # Static assets
├── ios/                    # iOS Capacitor project
├── android/                # Android Capacitor project
├── dist/                   # Production build output
├── .qcontext/              # Project documentation and context
└── amplify_outputs.json    # Generated Amplify configuration
```

## Key Configuration Files

- **`package.json`** - Dependencies and scripts
- **`vite.config.ts`** - Vite build configuration
- **`capacitor.config.ts`** - Mobile app configuration
- **`amplify/backend.ts`** - AWS backend resource definitions
- **`tsconfig.json`** - TypeScript configuration
- **`eslint.config.js`** - ESLint rules and configuration

## Environment Setup

### AWS Profile Configuration

The project uses the `personal` AWS profile. Ensure your AWS CLI is configured:

```bash
aws configure --profile personal
```

### Required AWS Permissions

Your AWS profile needs permissions for:

- Amplify (full access for deployment)
- CloudFormation (for infrastructure deployment)
- S3, DynamoDB, Lambda, Cognito, AppSync (for backend services)

## Troubleshooting

### Common Issues

1. **Amplify sandbox fails to deploy**

   - Check AWS credentials and permissions
   - Ensure unique resource names in your region

2. **iOS build fails**

   - Ensure Xcode is installed and up to date
   - Check that iOS project is properly synced with `cap sync`

3. **Development server won't start**
   - Clear node_modules and reinstall: `rm -rf node_modules package-lock.json && npm install`
   - Check for port conflicts (default: 5173)

### Getting Help

- Check the AWS Amplify documentation for backend issues
- Refer to Capacitor docs for mobile development
- Use Vite documentation for build and development server issues

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Ensure all tests pass and linting is clean
5. Submit a pull request

## License

[Add your license information here]
