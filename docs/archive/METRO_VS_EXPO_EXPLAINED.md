# Metro vs Expo: Understanding the Build System 🏗️

## Quick Answer

**Metro** is the JavaScript bundler (like Webpack)
**Expo** is the development framework that uses Metro

Think of it like:
- **Metro** = The engine
- **Expo** = The car that contains the engine

---

## 🎯 Metro Bundler

### What It Is
- JavaScript bundler specifically designed for React Native
- Created by Facebook/Meta
- Transforms and bundles your JavaScript/TypeScript code
- Similar to Webpack but optimized for mobile

### What It Does
1. **Reads** your source files (`.js`, `.ts`, `.tsx`)
2. **Transforms** TypeScript → JavaScript, JSX → JavaScript
3. **Bundles** all files into a single JavaScript bundle
4. **Serves** the bundle to your app via HTTP (during development)
5. **Watches** for file changes and rebundles automatically

### Configuration
- `metro.config.js` - Metro bundler settings
- Controls:
  - File resolution (how imports are found)
  - Transformations (Babel, TypeScript)
  - Cache settings
  - Watch folders
  - Asset handling

### Example Metro Process
```
Your Code (TypeScript)
  ↓ Metro reads files
  ↓ Metro transforms TypeScript → JavaScript
  ↓ Metro bundles all imports
  ↓ Metro serves bundle
Your App (JavaScript bundle)
```

---

## 🚀 Expo

### What It Is
- Complete development framework for React Native
- Provides tools, libraries, and services
- Makes React Native development easier
- Manages the entire build and deployment process

### What It Provides
1. **Expo CLI** - Command-line tools
2. **Expo Go** - Mobile app for testing (no build required)
3. **Development Server** - Runs Metro bundler
4. **Native Modules** - Pre-built native functionality
5. **Build Services** - Cloud build (EAS Build)
6. **Over-the-Air Updates** - Update apps without app store

### How Expo Uses Metro
```
You run: expo start
  ↓
Expo CLI starts
  ↓
Expo configures Metro bundler
  ↓
Metro bundles your code
  ↓
Expo serves bundle + provides development tools
  ↓
Your app connects and runs
```

---

## 🔄 How They Work Together

### Development Flow

```
┌─────────────────────────────────────────┐
│  You: yarn expo start                   │
└────────────────┬────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│  Expo CLI                               │
│  - Starts development server (port 8081)│
│  - Configures Metro bundler             │
│  - Provides QR code for connection      │
│  - Shows logs and debug info            │
└────────────────┬────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│  Metro Bundler                          │
│  - Reads your source code               │
│  - Transforms TypeScript                │
│  - Bundles all JavaScript               │
│  - Serves bundle on localhost:8081      │
│  - Watches for file changes             │
└────────────────┬────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│  Your App (Expo Go or Dev Build)       │
│  - Connects to Metro                    │
│  - Downloads JavaScript bundle          │
│  - Runs your app                        │
│  - Hot reloads on changes               │
└─────────────────────────────────────────┘
```

### In Your Project

**When you run**: `yarn mobile:start:clean`

This actually does:
```bash
# 1. Kill old processes
lsof -nP -i:8081 -t | xargs kill -9

# 2. Clean caches
rm -rf $TMPDIR/metro-cache

# 3. Start Expo (which starts Metro)
expo start -c --dev-client
```

**Expo then**:
- Reads `app.json` for configuration
- Reads `metro.config.js` for Metro settings
- Starts Metro bundler with your config
- Opens development server
- Shows QR code for connection

---

## 📊 Key Differences

| Aspect | Metro | Expo |
|--------|-------|------|
| **Type** | Bundler (tool) | Framework (platform) |
| **Purpose** | Transform & bundle code | Complete dev environment |
| **Runs** | As part of build process | CLI commands |
| **Config** | `metro.config.js` | `app.json`, `expo.config.js` |
| **Standalone** | Can run standalone | Uses Metro internally |
| **Output** | JavaScript bundle | Running app + dev tools |

---

## 🔧 Configuration in Your Project

### Metro Config (`metro.config.js`)
```javascript
config.resolver.alias = {
  '@cyntientops/business-core': path.resolve(workspaceRoot, 'packages/business-core/src'),
  // ... package aliases for monorepo
};

config.watchFolders = [
  path.resolve(workspaceRoot, 'packages'),
  // ... folders to watch
];
```

**This tells Metro**:
- How to resolve `@cyntientops/*` imports
- Which folders to watch for changes
- Where to find node_modules

### Expo Config (`app.json`)
```json
{
  "expo": {
    "name": "CyntientOps Mobile",
    "slug": "cyntientops-mobile",
    "version": "1.0.0",
    "main": "apps/mobile-rn/index.js"
  }
}
```

**This tells Expo**:
- App name and version
- Entry point file
- Platform-specific settings
- Build configuration

---

## 🎯 Common Scenarios

### Scenario 1: Metro Bundle Error
```
Error: Unable to resolve module @cyntientops/business-core
```

**Issue**: Metro can't find the module
**Fix**: Check `metro.config.js` aliases
**Why**: Metro resolves imports, not Expo

### Scenario 2: Expo Start Fails
```
Error: Metro bundler encountered an error
```

**Issue**: Expo can't start Metro
**Fix**: Check Metro config, clear caches
**Why**: Expo depends on Metro working

### Scenario 3: App Won't Load
```
App shows white screen
```

**Issue**: Bundle loaded but code has errors
**Fix**: Check browser/device console
**Why**: Metro bundled successfully, but runtime error

---

## 🚀 In Your Project

### Your Setup
```
CyntientOps-MP/
├── metro.config.js          ← Metro configuration (monorepo aliases)
├── app.json                 ← Expo configuration (app settings)
├── apps/mobile-rn/
│   ├── index.js            ← Entry point (registered with Expo)
│   ├── App.tsx             ← Root component
│   └── package.json        ← Expo dependencies
└── packages/               ← Watched by Metro
    ├── business-core/
    ├── ui-components/
    └── ...
```

### When You Start Development

1. **You run**: `yarn mobile:start:clean`
2. **Expo**:
   - Reads `app.json`
   - Starts development server
   - Configures Metro
3. **Metro**:
   - Reads `metro.config.js`
   - Finds `apps/mobile-rn/index.js`
   - Bundles all imports from `packages/`
   - Serves bundle on port 8081
4. **Your App**:
   - Connects to Metro
   - Downloads bundle
   - Runs code
   - Hot reloads on changes

---

## 💡 Key Takeaways

1. **Metro = Bundler** (transforms & bundles code)
2. **Expo = Framework** (uses Metro + provides tools)
3. **You configure both** (metro.config.js + app.json)
4. **Metro runs inside Expo** (when you run expo start)
5. **Both are required** (Expo needs Metro to work)

### Analogy
- **Metro** = Engine in a car (makes it go)
- **Expo** = The entire car (steering wheel, dashboard, controls)
- You drive the **car (Expo)**, which uses the **engine (Metro)**

---

## 🔍 Debugging Tips

### Metro Issues
- Clear Metro cache: `rm -rf $TMPDIR/metro-cache`
- Check `metro.config.js` syntax
- Verify import paths match config aliases
- Look for module resolution errors

### Expo Issues
- Run `npx expo-doctor` to check health
- Check `app.json` is valid JSON
- Verify entry point exists
- Check Expo version compatibility

### Both
- Kill old processes: `lsof -nP -i:8081 -t | xargs kill -9`
- Check node version: `node -v` (should be 20+)
- Reinstall dependencies: `yarn install`

---

**Summary**: Expo is the framework that makes React Native easy. Metro is the bundler it uses under the hood. When you run `expo start`, Expo starts Metro for you.
