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

      // Clean up badly injected lines
      if (content.includes('const commonStyles = getCommonStyles(theme);')) {
          content = content.replace(/\n\s*const commonStyles = getCommonStyles\(theme\);/g, '');
          changed = true;
      }
      if (content.includes('const styles = getStyles(theme);')) {
          content = content.replace(/\n\s*const styles = getStyles\(theme\);/g, '');
          changed = true;
      }
      
      // Some formatting cleanup where it collapsed with `const navigation`
      content = content.replace(/getStyles\(theme\);\s*const (navigation|authContext|loading)/g, '\n  const $1');

      // Now ensure `const theme = useTheme()` is present.
      // And RIGHT AFTER it, we put the commonStyles and styles if they form part of the imports.
      const hasCommonStylesImport = content.includes('getCommonStyles');
      const hasStylesImport = content.includes('getStyles');
      
      if (hasCommonStylesImport || hasStylesImport) {
          if (!content.includes('const theme = useTheme();')) {
              // we inject const theme = useTheme() right after the component declaration
              const compRegex = /(export const [A-Za-z0-9_]+.*?(?:=>\s*\{\n?|=>\s*\{(?!\s*return)))/;
              content = content.replace(compRegex, "$1\n  const theme = useTheme();");
          }
          
          let injectLines = "";
          if (hasCommonStylesImport) injectLines += "\n  const commonStyles = getCommonStyles(theme);";
          if (hasStylesImport) injectLines += "\n  const styles = getStyles(theme);";
          
          if (injectLines !== "") {
             content = content.replace(/(const theme = useTheme\(\);)/, "$1" + injectLines);
          }
          changed = true;
      }

      if (changed) {
        fs.writeFileSync(fullPath, content);
        console.log('Fixed: ' + file);
      }
    }
  }
}

processDir(path.join(process.cwd(), 'src/screens'));
processDir(path.join(process.cwd(), 'src/components'));
