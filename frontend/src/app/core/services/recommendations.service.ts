import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Recommendation } from '../../shared/models/recommendation';

@Injectable({
  providedIn: 'root',
})
export class RecommendationsService {
  constructor(private api: ApiService) {}

  getRecommendations(limit: number = 5): Observable<Recommendation[]> {
    return this.api.get<Recommendation[]>(
      `/api/recomendaciones?limit=${limit}`,
    );
  }
}
