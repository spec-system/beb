import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';

// 로컬 dev 전용: Vercel 서버리스 함수(api/export-hwp)를 개발 서버에서 동일하게 흉내낸다.
// kordoc은 Node 전용이라 dev 서버(Node)에서만 로드하며, 빌드에는 포함되지 않는다.
function hwpDevApi(): Plugin {
  return {
    name: 'hwp-dev-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/export-hwp', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'POST만 허용됩니다.' }));
          return;
        }
        try {
          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(chunk as Buffer);
          const body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
          const { generateHwpx } = await import('./server/hwpx.mjs');
          const buf = await generateHwpx(body.markdown, body.preset);
          const safe = String(body.filename ?? 'document').replace(/[\\/:*?"<>|]/g, '_') || 'document';
          res.setHeader('Content-Type', 'application/octet-stream');
          res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(safe)}.hwpx`);
          res.end(buf);
        } catch (err) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }));
        }
      });
    },
  };
}

const workflowLabPages = {
  workflowLab: path.resolve(__dirname, 'workflow-lab/index.html'),
  workflowLabDept: path.resolve(__dirname, 'workflow-lab/dept.html'),
  workflowLabForm: path.resolve(__dirname, 'workflow-lab/form.html'),
  workflowLabToeic: path.resolve(__dirname, 'workflow-lab/toeic.html'),
  workflowLabVolunteer: path.resolve(__dirname, 'workflow-lab/volunteer.html'),
};

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), hwpDevApi()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          ...workflowLabPages,
        },
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            charts: ['recharts'],
            icons: ['lucide-react'],
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
