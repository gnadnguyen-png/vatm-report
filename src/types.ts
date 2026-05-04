export type RiskLevel = 'A' | 'B' | 'C' | 'D' | 'E';
export type ProbabilityLevel = '1' | '2' | '3' | '4' | '5';

export interface SafetyReportInput {
  id: string;
  ngay_xay_ra: string;
  nguoi_bao_cao: string;
  is_anonymous: boolean;
  don_vi: string;
  loai_vu_viec: string;
  chi_tiet_su_viec: string;
  email?: string;
  created_at: string;
}

export interface AIAnalysis {
  ngay_xay_ra: string;
  loai_vu_viec: string;
  tieu_de_bao_cao: string;
  tom_tat_an_danh: string;
  moi_nguy_goc_re: string;
  muc_do_rui_ro: RiskLevel;
  tan_suat_rui_ro: ProbabilityLevel;
  de_xuat_xu_ly: string;
  shell_analysis?: {
    software: string;
    hardware: string;
    environment: string;
    liveware: string;
    liveware_other: string;
  };
  classification_warning?: string;
}

export interface SafetyReport extends SafetyReportInput {
  analysis?: AIAnalysis;
  status: 'pending' | 'processing' | 'completed' | 'archived';
  response?: string;
}
