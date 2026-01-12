import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  // Add empty turbopack config to allow webpack usage
  turbopack: {},
  // Ensure webpack resolves from the correct directory
  webpack: (config, { isServer }) => {
    // Make sure webpack resolves modules from the project root
    if (!config.resolve.roots) {
      config.resolve.roots = [__dirname];
    } else if (!config.resolve.roots.includes(__dirname)) {
      config.resolve.roots.unshift(__dirname);
    }
    
    // Ensure modules are resolved from node_modules in the project directory
    if (config.resolve.modules) {
      if (!config.resolve.modules.includes(path.resolve(__dirname, 'node_modules'))) {
        config.resolve.modules.unshift(path.resolve(__dirname, 'node_modules'));
      }
    } else {
      config.resolve.modules = [path.resolve(__dirname, 'node_modules'), 'node_modules'];
    }
    
    return config;
  },
};

export default nextConfig;
