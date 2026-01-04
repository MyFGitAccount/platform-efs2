import { execSync } from 'child_process';

console.log('🔨 Building EFS Platform for Vercel...');

try {
  // Build client
  console.log('📦 Building client...');
  execSync('cd client && npm run build', { stdio: 'inherit' });
  
  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
