import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AuditEvent {
  at: string;
  event: string;
  username: string | null;
  ip: string | null;
  userAgent: string | null;
  details: Record<string, unknown>;
}

/** Admin-only audit log: logins, saves, restores, uploads - with client IPs. */
@Injectable({ providedIn: 'root' })
export class AuditService {
  private readonly http = inject(HttpClient);

  /** Newest first. */
  async list(limit = 100): Promise<AuditEvent[]> {
    const response = await firstValueFrom(
      this.http.get<{ events: AuditEvent[] }>(`${environment.apiUrl}/audit`, { params: { limit } })
    );
    return response.events;
  }
}
