const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

const dirs = [path.join(__dirname, 'src'), path.join(__dirname, 'prisma')];

dirs.forEach(dir => {
  walk(dir, function(filePath) {
    if (filePath.endsWith('.ts') || filePath.endsWith('.tsx') || filePath.endsWith('.prisma')) {
      let content = fs.readFileSync(filePath, 'utf8');
      let original = content;
      
      content = content.replace(/\btenantId\b/g, 'brandId');
      content = content.replace(/\btenantIds\b/g, 'brandIds');
      
      content = content.replace(/\btenant\b/g, 'brand');
      content = content.replace(/\bTenant\b/g, 'Brand');
      content = content.replace(/\btenants\b/g, 'brands');
      content = content.replace(/\bTenants\b/g, 'Brands');
      content = content.replace(/\bTENANT\b/g, 'BRAND');
      
      content = content.replace(/x-tenant-id/g, 'x-brand-id');
      
      if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated', filePath);
      }
    }
  });
});
