import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastMessage } from '../../core/services/toast.service';

@Component({
  selector: 'app-toaster',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container top-center" *ngIf="(toastService.toasts$ | async) as toasts">
      <div 
        *ngFor="let toast of toasts" 
        class="toast-item"
        [ngClass]="'toast-' + toast.type"
        (click)="toastService.remove(toast.id)"
      >
        <div class="toast-icon">
          <span *ngIf="toast.type === 'success'">✓</span>
          <span *ngIf="toast.type === 'error'">✕</span>
          <span *ngIf="toast.type === 'warning'">⚠</span>
          <span *ngIf="toast.type === 'info'">ℹ</span>
        </div>
        <div class="toast-content">
          <div class="toast-title" *ngIf="toast.title">{{ toast.title }}</div>
          <div class="toast-body">{{ toast.message }}</div>
        </div>
        <button class="toast-close" (click)="toastService.remove(toast.id); $event.stopPropagation()">×</button>
      </div>
    </div>
  `,
  styles: [`
    .toast-container.top-center {
      position: fixed;
      top: 1.25rem;
      left: 50%;
      transform: translateX(-50%);
      z-index: 99999;
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
      pointer-events: none;
      width: 100%;
      max-width: 460px;
      padding: 0 1rem;
    }

    .toast-item {
      pointer-events: auto;
      display: flex;
      align-items: flex-start;
      padding: 0.85rem 1.15rem;
      border-radius: 10px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.2);
      color: #ffffff;
      cursor: pointer;
      animation: slideDownFade 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      transition: all 0.2s ease;
      backdrop-filter: blur(8px);
    }

    .toast-item:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 28px -5px rgba(0, 0, 0, 0.3);
    }

    /* Success: Vibrant Green */
    .toast-success {
      background-color: #059669; /* Emerald 600 */
      border-left: 5px solid #10b981;
    }

    /* Error / Failure: Vibrant Danger Red */
    .toast-error {
      background-color: #dc2626; /* Red 600 */
      border-left: 5px solid #ef4444;
    }

    /* Warning */
    .toast-warning {
      background-color: #d97706; /* Amber 600 */
      border-left: 5px solid #f59e0b;
    }

    /* Info */
    .toast-info {
      background-color: #2563eb; /* Blue 600 */
      border-left: 5px solid #3b82f6;
    }

    .toast-icon {
      font-size: 1.15rem;
      font-weight: 800;
      margin-right: 0.85rem;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
      margin-top: 0.1rem;
    }

    .toast-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }

    .toast-title {
      font-weight: 700;
      font-size: 0.875rem;
      letter-spacing: 0.025em;
    }

    .toast-body {
      font-size: 0.825rem;
      line-height: 1.35;
      opacity: 0.95;
      word-break: break-word;
    }

    .toast-close {
      background: transparent;
      border: none;
      color: rgba(255, 255, 255, 0.8);
      font-size: 1.25rem;
      line-height: 1;
      cursor: pointer;
      margin-left: 0.75rem;
      padding: 0;
      transition: color 0.15s ease;
    }

    .toast-close:hover {
      color: #ffffff;
    }

    @keyframes slideDownFade {
      from {
        opacity: 0;
        transform: translateY(-20px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
  `]
})
export class ToasterComponent {
  constructor(public toastService: ToastService) {}
}
