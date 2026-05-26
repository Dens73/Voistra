const path = require('node:path');

async function main() {
  const root = process.env.DIPLOM_ROOT ? path.resolve(process.env.DIPLOM_ROOT) : process.cwd();
  const { createServer } = await import('vite');
  const react = (await import('@vitejs/plugin-react')).default;

  const server = await createServer({
    root: path.join(root, 'apps/desktop'),
    configFile: false,
    plugins: [react()],
    server: {
      host: '127.0.0.1',
      port: 5173,
      strictPort: true,
    },
    build: {
      outDir: 'dist-renderer',
    },
    resolve: {
      alias: [
        { find: 'debug', replacement: path.join(root, 'apps/desktop/src/shims/debug.ts') },
      ],
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'socket.io-client'],
    },
  });

  await server.listen();
  server.printUrls();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
