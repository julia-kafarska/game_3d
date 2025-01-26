#!/usr/bin/env node

// renameToSnakeCase.js
const fs = require("fs");
const path = require("path");

/**
 * Convert a string to snake_case:
 *  - Insert underscore between lower & uppercase letters.
 *  - Replace spaces & dashes with underscores.
 *  - Convert all letters to lowercase.
 */
function toSnakeCase(str) {
  return (
    str
      // Insert underscore between lower & uppercase (e.g. "FileName" -> "File_Name")
      .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
      // Replace spaces, dashes, or repeated underscores with a single underscore
      .replace(/[\s\-]+/g, "_")
      // Finally, lowercase everything
      .toLowerCase()
  );
}

/**
 * Recursively rename folders and files to snake_case.
 * - Renames folder first, then recurses into the renamed folder.
 * - Files keep their extension; only the basename is changed.
 */
function renameRecursively(currentDir) {
  const entries = fs.readdirSync(currentDir, { withFileTypes: true });

  for (const entry of entries) {
    const oldPath = path.join(currentDir, entry.name);

    if (entry.isDirectory()) {
      // 1) Rename the directory to snake_case (if needed)
      const newDirName = toSnakeCase(entry.name);
      let newDirPath = oldPath;

      if (newDirName !== entry.name) {
        newDirPath = path.join(currentDir, newDirName);
        fs.renameSync(oldPath, newDirPath);
      }

      // 2) Recurse inside the (possibly renamed) directory
      renameRecursively(newDirPath);
    } else if (entry.isFile()) {
      // 1) Separate the filename and extension
      const { name, ext } = path.parse(entry.name);
      // 2) Convert just the basename to snake_case; keep the extension
      const newFileName = toSnakeCase(name) + ext;

      if (newFileName !== entry.name) {
        const newFilePath = path.join(currentDir, newFileName);
        fs.renameSync(oldPath, newFilePath);
      }
    }
    // If it's neither a directory nor file (e.g., symlink), you could handle that here if desired
  }
}

// --------------------
// USAGE EXAMPLE
// --------------------
// Change './myFolder' to the root folder you want to rename:
const targetDirectory = path.join(__dirname, "models");
renameRecursively(targetDirectory);

/*
  updateImportPaths.js

  Usage:
    1. Make sure you have a backup of your files or use a test directory.
    2. Run: node updateImportPaths.js /path/to/your/project
    3. It will recursively find .js, .ts, .jsx, .tsx files and update all local import/require paths to snake_case.

  Important: This script only rewrites import paths in the file *contents*.
  It does NOT rename the actual files/folders.
  For renaming folders/files to snake_case, see the previous script you have.
*/

/**
 * Transform a local path (e.g., "./FolderOne/filePlayer.tsx") into snake_case:
 *   - Snake-cases each directory segment.
 *   - Preserves '.' or '..'.
 *   - Preserves file extension on the last segment.
 *   - Returns untouched if not a relative path (like 'leva' or 'react').
 */
function snakeCaseImportPath(importPath) {
  // Skip non-relative imports (e.g., "react", "leva", etc.)
  if (!importPath.startsWith("./") && !importPath.startsWith("../")) {
    return importPath;
  }

  const segments = importPath.split("/");

  const newSegments = segments.map((seg, idx) => {
    // Preserve "." and ".." segments
    if (seg === "." || seg === ".." || seg === "") {
      return seg;
    }
    // For the last segment, preserve file extension
    if (idx === segments.length - 1) {
      const { name, ext } = path.parse(seg);
      return toSnakeCase(name) + ext;
    }
    // Otherwise, it's a folder name—snake-case the whole segment
    return toSnakeCase(seg);
  });

  return newSegments.join("/");
}

/**
 * Update all import paths in the given file to snake_case.
 * - Looks for both `import ... from '...'` and `require('...')`.
 */
function updateImportsInFile(filePath) {
  const code = fs.readFileSync(filePath, "utf8");

  // Regex to match: import ... from 'somePath'
  // Capturing groups:
  //   p1 = "import ... from '"
  //   p2 = the path
  //   p3 = the closing quote
  const importRegex = /(import\s+[^'"]*\s+from\s+["'])([^"']+)(["'])/g;

  // Regex to match: require('somePath')
  // Capturing groups:
  //   p1 = "require('"
  //   p2 = the path
  //   p3 = the closing quote + possible parentheses
  const requireRegex = /(require\s*\(\s*["'])([^"']+)(["']\s*\))/g;

  let newCode = code.replace(importRegex, (match, p1, p2, p3) => {
    const updatedPath = snakeCaseImportPath(p2);
    return p1 + updatedPath + p3;
  });

  newCode = newCode.replace(requireRegex, (match, p1, p2, p3) => {
    const updatedPath = snakeCaseImportPath(p2);
    return p1 + updatedPath + p3;
  });

  fs.writeFileSync(filePath, newCode, "utf8");
}

/**
 * Recursively walk a directory, updating import paths in all .js, .jsx, .ts, .tsx files.
 */
function processDirectory(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      processDirectory(entryPath);
    } else if (entry.isFile()) {
      // If you only want to modify certain extensions, check them here:
      if (/\.(js|jsx|ts|tsx)$/.test(entry.name)) {
        updateImportsInFile(entryPath);
      }
    }
  }
}

// -----------------------------
// USAGE EXAMPLE
// -----------------------------
if (require.main === module) {
  // When running from CLI, pass the project path as an argument
  const targetPath = process.argv[2] || __dirname;
  console.log(`Updating import paths in: ${targetPath}`);
  processDirectory(targetPath);
  console.log("Done!");
}
