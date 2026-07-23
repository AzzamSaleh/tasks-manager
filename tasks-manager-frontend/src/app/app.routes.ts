import { Routes } from '@angular/router';
import { guestGuard } from './core/guards/guest.guard';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

/*
 * Main application routing configuration.
 *
 * Login is public.
 * Authenticated pages render inside AppLayout.
 */
export const routes: Routes = [
  {
    path: 'login',
    canActivate: [
      guestGuard
    ],
    loadComponent: () =>
      import(
        './features/auth/pages/login/login'
      ).then(
        component => component.Login
      )
  },

  /*
   * An empty URL initially goes to login.
   *
   * guestGuard will redirect an already authenticated
   * user to the correct dashboard.
   */
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login'
  },

  /*
   * All authenticated child pages share
   * the same sidebar and header.
   */
  {
    path: '',
    canActivate: [
      authGuard
    ],
    loadComponent: () =>
      import(
        './layout/app-layout/app-layout'
      ).then(
        component => component.AppLayout
      ),

    children: [
      /*
       * Keep the more specific Admin route
       * before the Admin dashboard route.
       */
      {
        path: 'admin/users',
        canActivate: [
          roleGuard
        ],
        data: {
          roles: ['ADMIN']
        },
        loadComponent: () =>
          import(
            './features/users/pages/user-list/user-list'
          ).then(
            component => component.UserList
          )
      },

      {
        path: 'admin/tasks',
        canActivate: [
          roleGuard
        ],
        data: {
          roles: ['ADMIN'],
          mode: 'admin'
        },
        loadComponent: () =>
          import(
            './features/tasks/pages/task-workspace/task-workspace'
          ).then(
            component =>
              component.TaskWorkspace
          )
      },
      {
        path: 'admin/activity-logs',
        canActivate: [
          roleGuard
        ],
        data: {
          roles: ['ADMIN']
        },
        loadComponent: () =>
          import(
            './features/activity-logs/pages/activity-log-page/activity-log-page'
          ).then(
            component =>
              component.ActivityLogPage
          )
      },
      {
        path: 'profile',
        loadComponent: () =>
          import(
            './features/profile/pages/profile-page/profile-page'
          ).then(
            component =>
              component.ProfilePage
          )
      },
      {
        path: 'admin',
        canActivate: [
          roleGuard
        ],
        data: {
          roles: ['ADMIN']
        },
        loadComponent: () =>
          import(
            './features/dashboard/pages/admin-dashboard/admin-dashboard'
          ).then(
            component =>
              component.AdminDashboard
          )
      },

      {
        path: 'user/tasks',
        canActivate: [
          roleGuard
        ],
        data: {
          roles: ['USER'],
          mode: 'user'
        },
        loadComponent: () =>
          import(
            './features/tasks/pages/task-workspace/task-workspace'
          ).then(
            component =>
              component.TaskWorkspace
          )
      },

      {
        path: 'user',
        canActivate: [
          roleGuard
        ],
        data: {
          roles: ['USER']
        },
        loadComponent: () =>
          import(
            './features/dashboard/pages/user-dashboard/user-dashboard'
          ).then(
            component =>
              component.UserDashboard
          )
      }
    ]
  },

  {
    path: '**',
    redirectTo: 'login'
  }
];