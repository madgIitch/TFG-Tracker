const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      let changed = false;
      const hasCommonStyles = content.includes("import { commonStyles }");
      const hasStyles = content.includes("import { styles }");

      if (hasCommonStyles || hasStyles) {
        // Replace imports
        content = content.replace(/import \{ commonStyles \} from '([^']+)';/g, "import { getCommonStyles } from '$1';");
        content = content.replace(/import \{ styles \} from '([^']+)';/g, "import { getStyles } from '$1';");

        // 1. Ensure useTheme is imported
        if (!content.includes('useTheme')) {
           // We'll append it to the first import
           content = content.replace(/import React(.*?);\n/, "import React$1;\nimport { useTheme } from '../theme/ThemeContext';\n");
           // if standard theme import doesn't match, we check '../theme/ThemeContext' vs '../../theme/ThemeContext'
           // We'll do a simple trick: determine relative path to theme via existing path
        }
        
        // Add useTheme if still not there (Phase screens use nested structure)
        if (!content.includes('useTheme')) {
             content = "import { useTheme } from '../../theme/ThemeContext';\n" + content;
        }

        // 2. Inject inside component
        // Typically: export const XXX: React.FC = (...) => {  OR export const XXX = (...) => {
        // Find the component definition
        const compRegex = /(export const [A-Za-z0-9_]+.*?(?:=>\s*\{\n?|=>\s*\{(?!\s*return)))/;
        const match = content.match(compRegex);
        if (match) {
            let injectStatements = "";
            // Si ya usa theme = useTheme(), no lo duplicamos
            if (!content.includes('const theme = useTheme();')) {
                injectStatements += "\n  const theme = useTheme();";
            }
            if (hasCommonStyles) {
                injectStatements += "\n  const commonStyles = getCommonStyles(theme);";
            }
            if (hasStyles) {
                injectStatements += "\n  const styles = getStyles(theme);";
            }
            
            content = content.replace(compRegex, match[0] + injectStatements);
        }

        changed = true;
      }

      if (changed) {
        fs.writeFileSync(fullPath, content);
        console.log('Injected: ' + file);
      }
    }
  }
}

// 1. Process screens
processDir(path.join(process.cwd(), 'src/screens'));
// 2. Process components
processDir(path.join(process.cwd(), 'src/components'));
