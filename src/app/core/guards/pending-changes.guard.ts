import { CanDeactivateFn } from '@angular/router';

export interface ComponentCanDeactivate {
  canDeactivate: () => boolean;
}

export const pendingChangesGuard: CanDeactivateFn<ComponentCanDeactivate> = (component) => {
  if (component && component.canDeactivate) {
    if (!component.canDeactivate()) {
      return confirm('⚠️ You have unsaved changes in your form. Are you sure you want to discard them and leave this page?');
    }
  }
  return true;
};
