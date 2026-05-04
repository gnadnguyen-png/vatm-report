import { GoogleGenAI, Type } from "@google/genai";
import { SafetyReportInput, AIAnalysis } from "./types";

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

export async function analyzeSafetyReport(input: SafetyReportInput): Promise<AIAnalysis> {
  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input })
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Gặp lỗi khi kết nối với máy chủ AI.");
    }

    return await res.json() as AIAnalysis;
  } catch (error: any) {
    console.error("AI Analysis Proxy Error:", error);
    throw error;
  }
}
