const fs = require('fs');
const path = require('path');

const screensDir = path.join(process.cwd(), 'src/styles/screens');
const files = fs.readdirSync(screensDir);

files.forEach(file => {
  if (file.endsWith('.ts')) {
    const fullPath = path.join(screensDir, file);
    let content = fs.readFileSync(fullPath, 'utf8');

    // 1. Reemplace los imports estáticos
    content = content.replace(/import \{ theme \}.*?\n/g, '');
    content = content.replace(/import \{ theme, Theme \}.*?\n/g, '');
    if(!content.includes('import { Theme }')){
      content = content.replace(/import \{ StyleSheet \} from 'react-native';/, "import { StyleSheet } from 'react-native';\nimport { Theme } from '../../theme';");
    }

    // 2. Reemplace la firma
    content = content.replace(/export const styles = StyleSheet.create\(\{/, 'export const getStyles = (theme: Theme) => StyleSheet.create({');

    fs.writeFileSync(fullPath, content);
    console.log('Refactored: ' + file);
  }
});
