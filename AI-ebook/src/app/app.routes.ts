import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { Routes } from '@angular/router';
import { AppShellComponent } from './shared/components/app-shell/app-shell.component';
import { LoginPageComponent } from './features/auth/pages/login-page/login-page.component';
import { RegisterPageComponent } from './features/auth/pages/register-page/register-page.component';
import { DashboardPageComponent } from './features/dashboard/pages/dashboard-page/dashboard-page.component';
import { CreateEbookPageComponent } from './features/ebook/create/pages/create-ebook-page/create-ebook-page.component';
import { LearningPreferencesPageComponent } from './features/ebook/create/pages/learning-preferences-page/learning-preferences-page.component';
import { ResearchProgressPageComponent } from './features/ebook/research/pages/research-progress/research-progress.component';
import { SourceReviewPageComponent } from './features/ebook/research/pages/source-review/source-review.component';
import { LearningPlanPageComponent } from './features/ebook/learning-plan/pages/learning-plan-page.component';
import { OutlinePageComponent } from './features/ebook/outline/pages/outline-page.component';
import { GenerationPageComponent } from './features/ebook/generation/pages/generation-page.component';
import { EditorPageComponent } from './features/ebook/editor/pages/editor-page.component';
import { QualityCheckPageComponent } from './features/ebook/quality/pages/quality-check-page.component';
import { ReaderPageComponent } from './features/reader/pages/reader-page/reader-page.component';
import { EbookDetailPageComponent } from './features/ebook/detail/pages/ebook-detail-page/ebook-detail-page.component';

const signedIn: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  try { return !!(await auth.restoreSession()) || router.createUrlTree(['/login']); }
  catch { return router.createUrlTree(['/login']); }
};
export const routes: Routes = [
  { path: 'login', component: LoginPageComponent },
  { path: 'register', component: RegisterPageComponent },
  {
    path: '',
    component: AppShellComponent,
    canActivate: [signedIn],
    canActivateChild: [signedIn],
    children: [
      {
        path: 'account',
        loadComponent: () => import('./features/account/pages/account-page.component')
          .then(m => m.AccountPageComponent)
      },
      { path: 'dashboard', component: DashboardPageComponent },
      { path: 'ebooks/:id/detail', component: EbookDetailPageComponent },
      {
        path: 'ebooks/create',
        component: CreateEbookPageComponent,
        canActivate: [signedIn],
      },
      {
        path: 'ebooks/create/preferences',
        component: LearningPreferencesPageComponent,
        canActivate: [signedIn],
      },
      {
        path: 'ebooks/:id/research',
        component: ResearchProgressPageComponent,
        canActivate: [signedIn],
      },
      {
        path: 'ebooks/:id/sources',
        component: SourceReviewPageComponent,
        canActivate: [signedIn],
      },
      {
        path: 'ebooks/:id/learning-plan',
        component: LearningPlanPageComponent,
        canActivate: [signedIn],
      },
      {
        path: 'ebooks/:id/outline',
        component: OutlinePageComponent,
        canActivate: [signedIn],
      },
      {
        path: 'ebooks/:id/generation',
        component: GenerationPageComponent,
        canActivate: [signedIn],
      },
      {
        path: 'ebooks/:id/editor',
        component: EditorPageComponent,
        canActivate: [signedIn],
      },
      {
        path: 'ebooks/:id/quality-check',
        component: QualityCheckPageComponent,
        canActivate: [signedIn],
      },
      { path: 'ebooks/:id/reader', component: ReaderPageComponent },
      { path: '', redirectTo: '/login', pathMatch: 'full' },
    ],
  },
];
