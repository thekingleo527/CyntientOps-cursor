# 📁 File Organization Guidance for CyntientOps-MP

## 🎯 Purpose
This document provides clear guidance for organizing files in the CyntientOps-MP project to maintain a clean, logical structure and prevent clutter in the root directory.

## 📂 Folder Structure

### Root Directory
The root directory should only contain:
- **Essential project files**: `package.json`, `README.md`, `yarn.lock`
- **Symlinks to config files**: `metro.config.js`, `nx.json`, `tsconfig.json`, `tsconfig.base.json`
- **Main application folders**: `apps/`, `packages/`, `docs/`, `scripts/`, `config/`, `logs/`, `temp/`

### 📁 Organized Folders

#### `config/` - Configuration Files
**Purpose**: Central location for all project configuration files
**Files to place here**:
- `.eslintrc.js` - ESLint configuration
- `jest.preset.js` - Jest testing configuration
- `metro.config.js` - Metro bundler configuration
- `nx.json` - Nx workspace configuration
- `tsconfig.base.json` - Base TypeScript configuration
- `tsconfig.json` - Root TypeScript configuration
- Any other `.config.js`, `.config.ts`, or configuration files

**Note**: Symlinks are created in the root for files that need to be accessible from the root directory.

#### `docs/` - Documentation
**Purpose**: All project documentation and guides
**Files to place here**:
- `README.md` - Project overview and setup instructions
- `*.md` - All markdown documentation files
- `security/` - Security-related documentation
- `setup/` - Setup and installation guides
- `FILE_ORGANIZATION_GUIDANCE.md` - This file

#### `scripts/` - Scripts and Automation
**Purpose**: All executable scripts and automation tools
**Files to place here**:
- `*.sh` - Shell scripts
- `*.js` - Node.js scripts
- `*.sql` - Database scripts
- `setup/` - Setup and installation scripts
- Any other executable scripts

#### `logs/` - Log Files
**Purpose**: All log files and temporary output
**Files to place here**:
- `*.log` - All log files
- `*.out` - Output files
- Any temporary files that generate logs

#### `temp/` - Temporary Files
**Purpose**: Temporary files that don't belong elsewhere
**Files to place here**:
- Temporary files during development
- Files that need to be reviewed before permanent placement
- Duplicate files that need cleanup

## 🚫 What NOT to Place in Root

### Avoid These in Root Directory:
- ❌ Configuration files (use `config/`)
- ❌ Documentation files (use `docs/`)
- ❌ Script files (use `scripts/`)
- ❌ Log files (use `logs/`)
- ❌ Temporary files (use `temp/`)
- ❌ Duplicate files
- ❌ Build artifacts (use `dist/` or `build/`)

## 📋 File Placement Rules

### Configuration Files
```
✅ config/.eslintrc.js
✅ config/jest.preset.js
✅ config/metro.config.js
✅ config/nx.json
✅ config/tsconfig.base.json
✅ config/tsconfig.json
❌ .eslintrc.js (in root)
❌ jest.preset.js (in root)
```

### Documentation Files
```
✅ docs/README.md
✅ docs/SETUP_GUIDE.md
✅ docs/API_DOCUMENTATION.md
✅ docs/security/SECURITY_GUIDE.md
❌ README.md (in root - only if it's the main project README)
❌ SETUP_GUIDE.md (in root)
```

### Script Files
```
✅ scripts/setup.sh
✅ scripts/deploy.js
✅ scripts/database.sql
✅ scripts/setup/install.sh
❌ setup.sh (in root)
❌ deploy.js (in root)
```

### Log Files
```
✅ logs/install.log
✅ logs/build.log
✅ logs/error.log
❌ install.log (in root)
❌ build.log (in root)
```

## 🔧 Maintenance Tasks

### Regular Cleanup (Weekly)
1. **Check root directory** for loose files
2. **Move misplaced files** to appropriate folders
3. **Clean up temp folder** - remove old temporary files
4. **Review logs folder** - archive or delete old logs
5. **Update this guidance** if new patterns emerge

### Before Committing
1. **Ensure no loose files** in root directory
2. **Verify symlinks** are working correctly
3. **Check that moved files** don't break references
4. **Update any hardcoded paths** if files were moved

## 🚀 Quick Commands

### Move Configuration Files
```bash
# Move config files to config folder
mv .eslintrc.js config/
mv jest.preset.js config/
mv metro.config.js config/
mv nx.json config/
mv tsconfig.*.json config/
```

### Create Symlinks (if needed)
```bash
# Create symlinks for files that need to be in root
ln -sf config/metro.config.js metro.config.js
ln -sf config/nx.json nx.json
ln -sf config/tsconfig.json tsconfig.json
```

### Clean Up Root Directory
```bash
# Find loose files in root
find . -maxdepth 1 -type f -name "*.md" -o -name "*.js" -o -name "*.json" -o -name "*.ts" -o -name "*.sql" -o -name "*.sh" | grep -v node_modules
```

## 📝 For Future AI Models

When working on this project:

1. **Always check the appropriate folder** before creating new files
2. **Follow the established patterns** for file organization
3. **Update this guidance** if you create new organizational patterns
4. **Move loose files** to appropriate folders before committing
5. **Maintain symlinks** for files that need to be accessible from root
6. **Clean up temporary files** regularly

## 🎯 Benefits

- **Cleaner root directory** - easier to navigate
- **Logical organization** - files are where you expect them
- **Better maintainability** - easier to find and manage files
- **Consistent structure** - follows established patterns
- **Reduced clutter** - prevents accumulation of loose files

---

**Last Updated**: October 2024
**Maintained By**: CyntientOps Development Team
