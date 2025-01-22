/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['exceljs']
  },
  webpack: (config) => {
    config.externals = [...(config.externals || []), { exceljs: 'exceljs' }];
    return config;
  }
};

export default nextConfig;
