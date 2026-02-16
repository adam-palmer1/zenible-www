/**
 * Custom Reports API Service
 * Endpoints for the Custom Report Builder
 */

import { API_BASE_URL } from '@/config/api';
import { createRequest } from '../httpClient';
import type {
  AvailableColumnsResponse,
  CustomReportCreate,
  CustomReportListResponse,
  CustomReportResponse,
  CustomReportUpdate,
  ReportConfiguration,
  ReportExecutionResponse,
  ReportEntityType,
  EntityQueryResultResponse,
} from '@/types/customReport';

const request = createRequest('CustomReportsAPI');

/** Raw API response shape — entities come as an array */
interface RawReportExecutionResponse {
  entities: EntityQueryResultResponse[];
  executed_at: string;
  date_range_resolved?: { start: string; end: string };
}

/** Convert entities array into a record keyed by entity_type */
function transformExecutionResponse(raw: RawReportExecutionResponse): ReportExecutionResponse {
  const results = {} as Record<ReportEntityType, EntityQueryResultResponse>;
  for (const entity of raw.entities) {
    results[entity.entity_type] = entity;
  }
  return {
    results,
    executed_at: raw.executed_at,
    date_range_resolved: raw.date_range_resolved,
  };
}

class CustomReportsAPI {
  private baseEndpoint: string;

  constructor() {
    this.baseEndpoint = '/crm/custom-reports';
  }

  // --- Metadata ---

  async getAvailableColumns(): Promise<AvailableColumnsResponse> {
    return request<AvailableColumnsResponse>(`${this.baseEndpoint}/columns`, {
      method: 'GET',
    });
  }

  // --- Ad-hoc Execution ---

  async executeReport(
    configuration: ReportConfiguration,
    page = 1,
    perPage = 50
  ): Promise<ReportExecutionResponse> {
    const raw = await request<RawReportExecutionResponse>(
      `${this.baseEndpoint}/execute?page=${page}&per_page=${perPage}`,
      {
        method: 'POST',
        body: JSON.stringify(configuration),
      }
    );
    return transformExecutionResponse(raw);
  }

  async exportCSV(configuration: ReportConfiguration): Promise<Blob> {
    const url = `${API_BASE_URL}${this.baseEndpoint}/export/csv`;
    const token = localStorage.getItem('access_token');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(configuration),
    });

    if (!response.ok) {
      throw new Error('Failed to export report as CSV');
    }

    return response.blob();
  }

  async exportPDF(configuration: ReportConfiguration): Promise<Blob> {
    const url = `${API_BASE_URL}${this.baseEndpoint}/export/pdf`;
    const token = localStorage.getItem('access_token');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(configuration),
    });

    if (!response.ok) {
      throw new Error('Failed to export report as PDF');
    }

    return response.blob();
  }

  // --- Saved Report CRUD ---

  async listReports(page = 1, perPage = 20): Promise<CustomReportListResponse> {
    return request<CustomReportListResponse>(
      `${this.baseEndpoint}?page=${page}&per_page=${perPage}`,
      { method: 'GET' }
    );
  }

  async createReport(data: CustomReportCreate): Promise<CustomReportResponse> {
    return request<CustomReportResponse>(this.baseEndpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getReport(id: string): Promise<CustomReportResponse> {
    return request<CustomReportResponse>(`${this.baseEndpoint}/${id}`, {
      method: 'GET',
    });
  }

  async updateReport(id: string, data: CustomReportUpdate): Promise<CustomReportResponse> {
    return request<CustomReportResponse>(`${this.baseEndpoint}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteReport(id: string): Promise<void> {
    return request<void>(`${this.baseEndpoint}/${id}`, {
      method: 'DELETE',
    });
  }

  async cloneReport(id: string, name?: string): Promise<CustomReportResponse> {
    const url = name
      ? `${this.baseEndpoint}/${id}/clone?name=${encodeURIComponent(name)}`
      : `${this.baseEndpoint}/${id}/clone`;
    return request<CustomReportResponse>(url, {
      method: 'POST',
    });
  }

  // --- Saved Report Execution ---

  async executeSavedReport(
    id: string,
    page = 1,
    perPage = 50
  ): Promise<ReportExecutionResponse> {
    const raw = await request<RawReportExecutionResponse>(
      `${this.baseEndpoint}/${id}/execute?page=${page}&per_page=${perPage}`,
      { method: 'GET' }
    );
    return transformExecutionResponse(raw);
  }

  async exportSavedCSV(id: string): Promise<Blob> {
    const url = `${API_BASE_URL}${this.baseEndpoint}/${id}/export/csv`;
    const token = localStorage.getItem('access_token');

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to export saved report as CSV');
    }

    return response.blob();
  }

  async exportSavedPDF(id: string): Promise<Blob> {
    const url = `${API_BASE_URL}${this.baseEndpoint}/${id}/export/pdf`;
    const token = localStorage.getItem('access_token');

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to export saved report as PDF');
    }

    return response.blob();
  }
}

const customReportsAPI = new CustomReportsAPI();
export default customReportsAPI;
