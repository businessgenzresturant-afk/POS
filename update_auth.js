const fs = require('fs');
const path = require('path');

function replaceInFiles(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInFiles(fullPath);
    } else if (fullPath.endsWith('route.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Some GET functions don't accept request, e.g. export async function GET()
      content = content.replace(/export async function (GET|POST|PUT|PATCH|DELETE)\(\)\s*{/g, "export async function $1(request: Request) {");
      content = content.replace(/export async function (GET|POST|PUT|PATCH|DELETE)\(request: Request\)\s*{/g, "export async function $1(request: Request) {");
      
      // Update checkAuth() calls
      if (content.includes('checkAuth()')) {
        content = content.replace(/checkAuth\(\)/g, "checkAuth(request)");
        fs.writeFileSync(fullPath, content);
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

replaceInFiles('./src/app/api');
