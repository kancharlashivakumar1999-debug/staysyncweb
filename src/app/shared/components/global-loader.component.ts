import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { LoadingService } from '../../core/services/loading.service';

@Component({
  selector: 'app-global-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loader-overlay" *ngIf="loading$ | async">
      <div class="loader-card">
        <div class="spinner"></div>
        <span class="loader-text">Loading, please wait...</span>
      </div>
    </div>
  `,
  styles: [`
    .loader-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(15, 23, 42, 0.4);
      backdrop-filter: blur(2px);
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.15s ease-out;
    }

    .loader-card {
      background: #ffffff;
      padding: 1.25rem 2rem;
      border-radius: 14px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.85rem;
      border: 1px solid #e2e8f0;
      min-width: 180px;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3.5px solid #e2e8f0;
      border-top-color: #2563eb;
      border-right-color: #3b82f6;
      border-radius: 50%;
      animation: spin 0.75s linear infinite;
    }

    .loader-text {
      font-size: 0.85rem;
      font-weight: 700;
      color: #334155;
      letter-spacing: 0.02em;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `]
})
export class GlobalLoaderComponent {
  loading$: Observable<boolean>;

  constructor(private loadingService: LoadingService) {
    this.loading$ = this.loadingService.loading$;
  }
}
