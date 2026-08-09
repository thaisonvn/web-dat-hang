import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for Gemini
  app.post("/api/generate-description", async (req, res) => {
    try {
      const { name, category, price } = req.body;
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
      }

      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const prompt = `Viết một đoạn mô tả chi tiết, hấp dẫn và chuyên nghiệp cho sản phẩm sau để bán trên website thương mại điện tử.
Tên sản phẩm: ${name}
Danh mục: ${category}
Giá: ${price.toLocaleString('vi-VN')}đ

Yêu cầu:
- Nêu bật công dụng, điểm mạnh của sản phẩm.
- Văn phong thu hút, tự nhiên, thuyết phục khách hàng.
- Trình bày ngắn gọn, dễ đọc, có thể dùng bullet points (dấu gạch ngang/đầu dòng) để liệt kê tính năng.
- Không quá dài, tối đa khoảng 150-200 chữ.
- Trả về đoạn text kết quả, không cần format markdown hay thẻ HTML.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
      });

      res.json({ description: response.text });
    } catch (error: any) {
      console.error("Error generating description:", error);
      res.status(500).json({ error: error.message || "Something went wrong" });
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
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
