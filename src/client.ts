import axios, { AxiosInstance } from "axios";

export interface LoadSheddingStatus {
  status: {
    capetown: { name: string; stage: string; stage_updated: string };
    eskom: { name: string; stage: string; stage_updated: string };
  };
}

export interface Area {
  id: string;
  name: string;
  region: string;
}

export interface AreasSearchResult {
  areas: Area[];
}

export interface AreaEvent {
  end: string;
  note: string;
  start: string;
}

export interface AreaDay {
  date: string;
  name: string;
  stages: string[][];
}

export interface AreaInfo {
  events: AreaEvent[];
  info: { name: string; region: string };
  schedule: { days: AreaDay[]; source: string };
}

export interface AreasNearby {
  areas: (Area & { count: number })[];
}

export interface Allowance {
  allowance: {
    count: number;
    limit: number;
    type: string;
  };
}

export class EskomSePushClient {
  private http: AxiosInstance;

  constructor(token: string) {
    this.http = axios.create({
      baseURL: "https://developer.sepush.co.za/business/2.0",
      headers: { token },
    });
  }

  async getStatus(test = false): Promise<LoadSheddingStatus> {
    const params = test ? { test: "current" } : {};
    const { data } = await this.http.get<LoadSheddingStatus>("/status", { params });
    return data;
  }

  async searchAreas(text: string, test = false): Promise<AreasSearchResult> {
    const params: Record<string, string> = { text };
    if (test) params.test = "true";
    const { data } = await this.http.get<AreasSearchResult>("/areas_search", { params });
    return data;
  }

  async getAreaInfo(id: string, test = false): Promise<AreaInfo> {
    const params: Record<string, string> = { id };
    if (test) params.test = "current";
    const { data } = await this.http.get<AreaInfo>("/area", { params });
    return data;
  }

  async getAreasNearby(lat: number, lon: number, test = false): Promise<AreasNearby> {
    const params: Record<string, string | number> = { lat, lon };
    if (test) params.test = "true";
    const { data } = await this.http.get<AreasNearby>("/areas_nearby", { params });
    return data;
  }

  async getAllowance(): Promise<Allowance> {
    const { data } = await this.http.get<Allowance>("/api_allowance");
    return data;
  }
}
