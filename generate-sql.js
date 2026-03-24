const { execSync } = require('child_process');
const fs = require('fs');

console.log('Generating Prisma SQL diff...');
try {
  const result = execSync('npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script', { 
    maxBuffer: 1024 * 1024 * 10,
    stdio: 'pipe' 
  });
  
  fs.writeFileSync('schema-push.sql', result);
  console.log('Successfully wrote schema-push.sql');
} catch (e) {
  console.error('Error generating SQL:', e.stderr ? e.stderr.toString() : e.message);
  process.exit(1);
}
