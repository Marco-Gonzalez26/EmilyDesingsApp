import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { HomeData } from '../../shared/models/home';

@Injectable({
  providedIn: 'root',
})
export class HomeService {
  constructor(private api: ApiService) {}

  getHomeData(limit_productos: number = 8): Observable<HomeData> {
    return this.api.get<HomeData>(`/api/catalogo/home?limit_productos=${limit_productos}`);
  }
}
