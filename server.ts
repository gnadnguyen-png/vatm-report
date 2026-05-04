import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { Resend } from "resend";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    ngay_xay_ra: { type: Type.STRING },
    loai_vu_viec: { type: Type.STRING },
    tieu_de_bao_cao: { type: Type.STRING },
    tom_tat_an_danh: { type: Type.STRING },
    moi_nguy_goc_re: { type: Type.STRING },
    muc_do_rui_ro: { type: Type.STRING, enum: ["A", "B", "C", "D", "E"] },
    tan_suat_rui_ro: { type: Type.STRING, enum: ["1", "2", "3", "4", "5"] },
    de_xuat_xu_ly: { type: Type.STRING },
    shell_analysis: {
      type: Type.OBJECT,
      properties: {
        software: { type: Type.STRING },
        hardware: { type: Type.STRING },
        environment: { type: Type.STRING },
        liveware: { type: Type.STRING },
        liveware_other: { type: Type.STRING },
      },
      required: ["software", "hardware", "environment", "liveware", "liveware_other"],
    },
    classification_warning: { type: Type.STRING },
  },
  required: [
    "ngay_xay_ra",
    "loai_vu_viec",
    "tieu_de_bao_cao",
    "tom_tat_an_danh",
    "moi_nguy_goc_re",
    "muc_do_rui_ro",
    "tan_suat_rui_ro",
    "de_xuat_xu_ly",
    "shell_analysis"
  ],
};

let resendClient: Resend | null = null;

function getResend() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return null;
  // Re-initialize if the key changed in environment (though usually requires restart)
  if (!resendClient || (resendClient as any).key !== apiKey) {
    resendClient = new Resend(apiKey);
    (resendClient as any).key = apiKey; // Storing to check for changes
  }
  return resendClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // API Route for Gemini Analysis
  app.post("/api/analyze", async (req, res) => {
    const { input } = req.body;
    
    // Diagnostic
    console.log("Environment Keys:", Object.keys(process.env).filter(k => k.includes("API") || k.includes("KEY") || k.includes("GEMINI")));
    
    // Check multiple potential key names for maximum flexibility
    const keysToTry = [
      "GEMINI_API_KEY",
      "GOOGLE_API_KEY",
      "GOOGLE_GENERATIVE_AI_API_KEY",
      "VITE_GEMINI_API_KEY",
      "CUSTOM_AI_KEY"
    ];

    let apiKey = "";
    let keyUsed = "";

    for (const keyName of keysToTry) {
      const val = process.env[keyName];
      if (val && val.length >= 10 && val !== "MY_GEMINI_API_KEY") {
        apiKey = val;
        keyUsed = keyName;
        break;
      }
    }

    if (!apiKey) {
      console.error("AI Key missing or too short. Keys scanned:", keysToTry);
      return res.status(500).json({ 
        error: "Chưa cấu hình được mã hiệu AI. Nếu bạn không thể sửa GEMINI_API_KEY, hãy tạo một Secret mới tên là 'CUSTOM_AI_KEY' và dán mã AIza vào đó." 
      });
    }

    // Diagnostic log with partial key for safety
    console.log(`Using AI Key from: ${keyUsed}. Key starts with: ${apiKey.substring(0, 4)}... ends with: ...${apiKey.substring(apiKey.length - 4)}`);

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
      Bạn là Hệ thống AI Chuyên gia Phân tích An toàn. Hãy phân tích báo cáo sau:
      
      Ngày xảy ra: ${input.ngay_xay_ra}
      Người báo cáo: ${input.is_anonymous ? "Ẩn danh" : input.nguoi_bao_cao}
      Đơn vị: ${input.don_vi}
      Loại vụ việc (người dùng chọn): ${input.loai_vu_viec}
      Chi tiết sự việc: ${input.chi_tiet_su_viec}
      
      QUY TẮC XỬ LÝ:
      1. CHUẨN HÓA PHÂN LOẠI: Đối chiếu "Chi tiết sự việc" với "Loại vụ việc". Nếu sai, hãy đưa ra cảnh báo trong trường classification_warning và gợi ý loại đúng.
      2. PHÂN TÍCH MỐI NGUY (SHELL): Xác định các yếu tố Software, Hardware, Environment, Liveware (người báo cáo), Liveware (người khác).
      3. ĐÁNH GIÁ RỦI RO:
         - Mức độ rủi ro (Hậu quả): A (Thảm họa), B (Nghiêm trọng), C (Tương đối cao), D (Gián đoạn), E (Ít ảnh hưởng).
         - Khả năng xảy ra (Tần suất): 1 (Thường xuyên), 2 (Thỉnh thoảng), 3 (Đôi khi), 4 (Hiếm khi), 5 (Vô cùng hiếm).
      4. KHỬ ĐỊNH DANH: Trường tom_tat_an_danh phải chuyên nghiệp và KHÔNG chứa tên riêng hay thông tin định danh cá nhân.
      
      Hãy trả về kết quả theo định dạng JSON chuẩn.
    `;

    try {
      const response = await ai.models.generateContent({ 
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: ANALYSIS_SCHEMA as any,
        }
      });
      
      const text = response.text;
      
      if (!text) {
        throw new Error("AI returned empty response");
      }

      res.status(200).json(JSON.parse(text));
    } catch (error: any) {
      console.error("AI Analysis Error:", error);
      res.status(500).json({ error: error.message || "AI Analysis failed" });
    }
  });

  // API Route to send email
  app.post("/api/send-email", async (req, res) => {
    const { to, subject, html, attachments } = req.body;
    const resend = getResend();

    if (!resend) {
      console.error("RESEND_API_KEY is not configured");
      return res.status(500).json({ 
        error: "Lỗi: Chưa thiết lập RESEND_API_KEY. Vui lòng vào Cài đặt (Settings) > Secrets để thêm khóa này." 
      });
    }

    // Basic format check
    const currentKey = process.env.RESEND_API_KEY?.trim() || "";
    if (!currentKey.startsWith("re_")) {
      return res.status(400).json({ 
        error: `Lỗi: Định dạng API Key không đúng. Khóa Resend phải bắt đầu bằng 're_'. Bạn đang dùng: '${currentKey.substring(0, 3)}...'` 
      });
    }

    try {
      // Simplify 'from' address to avoid potential naming validation issues on trial plan
      const { data, error } = await resend.emails.send({
        from: "onboarding@resend.dev",
        to: [to],
        subject: subject,
        html: html,
        attachments: attachments || [],
      });

      if (error) {
        console.error("Detailed Resend error:", JSON.stringify(error, null, 2));
        
        let userMessage = error.message || "Email validation error";
        
        // Custom messaging for common Resend Trial Plan issues
        if (error.name === 'validation_error') {
          if (userMessage.includes('onboarding@resend.dev') || userMessage.includes('not verified')) {
            userMessage = "Lỗi: Tài khoản Resend dùng thử chỉ có thể gửi email tới chính email đăng ký của bạn. Hãy kiểm tra địa chỉ người nhận hoặc xác thực tên miền.";
          } else if (userMessage.includes('API key')) {
            userMessage = `Lỗi: API Key không hợp lệ (${userMessage}). Hãy kiểm tra lại trong phần Settings > Secrets.`;
          }
        } else if (userMessage.includes('API key')) {
          userMessage = "Lỗi: Kiểm tra lại API Key trong phần Secrets (cần bắt đầu bằng re_).";
        }

        return res.status(400).json({ 
          error: userMessage, 
          details: error 
        });
      }

      res.status(200).json({ data });
    } catch (err: any) {
      console.error("Internal server error:", err);
      res.status(500).json({ error: err.message || "Failed to send email" });
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
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
