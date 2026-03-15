import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createDatabase } from './db.js';
import { createCategoriesRouter } from './routes/categories.js';
import { createTagsRouter } from './routes/tags.js';
import { createPromptsRouter } from './routes/prompts.js';
import { createImportExportRouter } from './routes/importExport.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json());

// Initialize database
export const db = createDatabase();

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// API routes
app.use('/api/categories', createCategoriesRouter(db));
app.use('/api/tags', createTagsRouter(db));
app.use('/api/prompts', createPromptsRouter(db));
app.use('/api', createImportExportRouter(db));

// Serve static files in production
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));
app.get('*splat', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
