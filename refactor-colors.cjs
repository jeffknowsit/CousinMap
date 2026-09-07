const fs = require('fs');
let content = fs.readFileSync('tailwind.config.js', 'utf8');

// The colors object
const colorsMatch = content.match(/colors:\s*\{([\s\S]+?)\}/);
if (colorsMatch) {
  const colorsStr = colorsMatch[1];
  const newColorsStr = colorsStr.replace(/'([^']+)':\s*'#([a-fA-F0-9]{6})'/g, (match, name, hex) => {
    return `'${name}': 'rgb(var(--color-${name}) / <alpha-value>)'`;
  });
  
  content = content.replace(colorsStr, newColorsStr);
  fs.writeFileSync('tailwind.config.js', content);
  console.log('tailwind.config.js updated');
  
  // Now generate the CSS variables
  let cssVars = ':root {\n';
  let cssVarsDark = '.dark {\n';
  
  const matches = [...colorsStr.matchAll(/'([^']+)':\s*'#([a-fA-F0-9]{6})'/g)];
  for (const m of matches) {
    const hex = m[2];
    const r = parseInt(hex.substring(0,2), 16);
    const g = parseInt(hex.substring(2,4), 16);
    const b = parseInt(hex.substring(4,6), 16);
    cssVars += `  --color-${m[1]}: ${r} ${g} ${b}; /* #${hex} */\n`;
    
    // Auto-generate some dark mode approximations
    // For surface/background, we invert. For others, maybe leave as is or slightly adjust
    if (m[1].includes('surface') || m[1].includes('background')) {
      if (hex === 'faf8ff' || hex === 'ffffff') cssVarsDark += `  --color-${m[1]}: 18 20 24;\n`;
      else if (hex === 'f2f3ff') cssVarsDark += `  --color-${m[1]}: 26 28 32;\n`;
      else if (hex === 'e2e7ff') cssVarsDark += `  --color-${m[1]}: 34 36 40;\n`;
      else if (hex === 'dae2fd') cssVarsDark += `  --color-${m[1]}: 42 44 48;\n`;
      else cssVarsDark += `  --color-${m[1]}: ${r} ${g} ${b};\n`;
    } else if (m[1].includes('on-surface') || m[1].includes('on-background')) {
       if (hex === '131b2e') cssVarsDark += `  --color-${m[1]}: 226 226 233;\n`;
       else if (hex === '3e4947') cssVarsDark += `  --color-${m[1]}: 196 199 197;\n`;
       else cssVarsDark += `  --color-${m[1]}: 226 226 233;\n`;
    } else if (m[1] === 'outline' || m[1] === 'outline-variant') {
       cssVarsDark += `  --color-${m[1]}: 140 145 142;\n`;
    } else {
       // Keep primary/secondary etc the same for now, or just mirror them
       cssVarsDark += `  --color-${m[1]}: ${r} ${g} ${b};\n`;
    }
  }
  cssVars += '}\n\n' + cssVarsDark + '}\n';
  
  let cssContent = fs.readFileSync('src/styles/main.css', 'utf8');
  cssContent = cssContent.replace('@tailwind utilities;', '@tailwind utilities;\n\n@layer base {\n' + cssVars + '}\n');
  fs.writeFileSync('src/styles/main.css', cssContent);
  console.log('src/styles/main.css updated');
}
