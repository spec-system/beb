const nextConfig = {
  // Keep slash variants stable during the reversible migration window.
  skipTrailingSlashRedirect: true,
  // Keep Node-only document conversion out of the Next server bundle.
  serverExternalPackages: ['kordoc'],

  async redirects() {
    return [
      {
        source: '/workflow-lab/index.html',
        destination: '/workflow-lab/',
        permanent: false,
      },
      {
        source: '/workflow-lab/dept.html',
        destination: '/workflow-lab/dept',
        permanent: false,
      },
      {
        source: '/workflow-lab/form.html',
        destination: '/workflow-lab/form',
        permanent: false,
      },
      {
        source: '/workflow-lab/toeic.html',
        destination: '/workflow-lab/toeic',
        permanent: false,
      },
      {
        source: '/workflow-lab/volunteer.html',
        destination: '/workflow-lab/volunteer',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
