import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { Client, Databases } from "node-appwrite";
import { createProxyMiddleware } from 'http-proxy-middleware';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let appwriteClient: Client | null = null;
let databases: Databases | null = null;

function getAppwriteDb() {
  if (!databases) {
    const endpoint = process.env.APPWRITE_ENDPOINT;
    const projectId = process.env.APPWRITE_PROJECT_ID;
    const apiKey = process.env.APPWRITE_API_KEY;

    if (!endpoint || !projectId || !apiKey) {
      throw new Error("Missing Appwrite credentials. Please set APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, and APPWRITE_API_KEY in the Environment Secrets.");
    }

    appwriteClient = new Client()
      .setEndpoint(endpoint)
      .setProject(projectId)
      .setKey(apiKey);
    
    databases = new Databases(appwriteClient);
  }
  return databases;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Log all incoming requests
  app.use((req, res, next) => {
    if (req.url.startsWith('/v1')) console.log('[REQ]', req.method, req.url);
    next();
  });

  // Handle CORS preflight for Appwrite proxy explicitly
  app.use((req, res, next) => {
    if (req.method === 'OPTIONS' && req.url.startsWith('/v1')) {
      res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', req.headers['access-control-request-headers'] || 'Origin, X-Requested-With, Content-Type, Accept, X-Appwrite-Project, X-Appwrite-Session, X-Appwrite-Response-Format, X-Appwrite-Mode');
      res.header('Access-Control-Allow-Credentials', 'true');
      return res.status(200).end();
    }
    next();
  });

  // Proxy for Appwrite to bypass CORS in preview and production
  app.use(createProxyMiddleware({
    pathFilter: '/v1',
    target: 'https://sgp.cloud.appwrite.io',
    changeOrigin: true,
    on: {
      proxyReq: (proxyReq) => {
        proxyReq.removeHeader('Origin');
        proxyReq.removeHeader('Referer');
      },
      proxyRes: (proxyRes, req, res) => {
        if (req.headers.origin) {
          proxyRes.headers['Access-Control-Allow-Origin'] = req.headers.origin as string;
        } else {
          proxyRes.headers['Access-Control-Allow-Origin'] = '*';
        }
        proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
        proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS';
        proxyRes.headers['Access-Control-Allow-Headers'] = req.headers['access-control-request-headers'] || 'Origin, X-Requested-With, Content-Type, Accept, X-Appwrite-Project, X-Appwrite-Session';
      }
    }
  }));

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });
  
  app.post("/api/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const PROJECT_ID = "69fd6737000dbdd02a67";
      const DB_ID = "69fd691800237a6aaa72";
      const API_KEY = "standard_9dd4f065af44a319b454264cc86639709b954002fe610cb9c11909c1359fbd576b684a66c9537a5b09cb0ab391f900743677aa4a59d0b72d49ede23d3b51f7461613b4616a4919c79f63260b531e1343a380a43011273e3905646adc59d6e2e38a0b3df2f3a13047454a6a3280dec8569c2b519d887122f8405133f29a973550";
      
      const { Client, Databases, Query } = await import("node-appwrite");
      const client = new Client()
        .setEndpoint('https://sgp.cloud.appwrite.io/v1')
        .setProject(PROJECT_ID)
        .setKey(API_KEY);
      const db = new Databases(client);
      
      const data = await db.listDocuments(DB_ID, 'users', [Query.equal('email', email)]);
      
      if (!data.documents || data.documents.length === 0) {
        return res.status(401).json({ error: "Email tidak ditemukan di sistem." });
      }
      
      const user = data.documents[0];
      if (user.password !== password) {
        return res.status(401).json({ error: "Password salah." });
      }
      
      res.json({ user });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: "Internal server error: " + e.message });
    }
  });
  
  app.get("/api/data", async (req, res) => {
    try {
      res.json({ message: "Appwrite is connected!" });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/dump-schema", async (req, res) => {
    try {
      const PROJECT_ID = "69fd6737000dbdd02a67";
      const DB_ID = "69fd691800237a6aaa72";
      const API_KEY = "standard_9dd4f065af44a319b454264cc86639709b954002fe610cb9c11909c1359fbd576b684a66c9537a5b09cb0ab391f900743677aa4a59d0b72d49ede23d3b51f7461613b4616a4919c79f63260b531e1343a380a43011273e3905646adc59d6e2e38a0b3df2f3a13047454a6a3280dec8569c2b519d887122f8405133f29a973550";
      
      const { Client, Databases } = await import("node-appwrite");
      const client = new Client()
        .setEndpoint('https://sgp.cloud.appwrite.io/v1')
        .setProject(PROJECT_ID)
        .setKey(API_KEY);
      const db = new Databases(client);

      const colls = ['kegiatan', 'kak', 'rab'];
      const schema: Record<string, any> = {};
      
      for (const c of colls) {
        const attrs = await db.listAttributes(DB_ID, c);
        schema[c] = attrs.attributes.map((a: any) => ({key: a.key, type: a.type}));
      }
      res.json(schema);
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production: serve static files
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
