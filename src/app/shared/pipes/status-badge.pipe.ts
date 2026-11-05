import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'statusBadge',
  standalone: true
})
export class StatusBadgePipe implements PipeTransform {
  transform(status: string | null | undefined): string {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'available':
        return 'badge-success';
      case 'occupied':
      case 'vacated':
        return 'badge-danger';
      case 'notice_period':
      case 'maintenance':
        return 'badge-warning';
      default:
        return 'badge-info';
    }
  }
}
