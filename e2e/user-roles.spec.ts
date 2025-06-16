import { test, expect } from '@playwright/test';

/**
 * Testes de Roles de Usuário no Sistema de Agendamentos
 * Valida permissões e funcionalidades específicas para cada tipo de usuário
 */

test.describe('User Roles - Sistema de Agendamentos', () => {

  test.describe('SUPER_ADMIN', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/api/auth/**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: '1',
              name: 'Super Admin',
              email: 'superadmin@barbershop.com',
              roles: ['SUPER_ADMIN']
            }
          })
        });
      });

      await page.route('**/api/appointments/stats**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            total: 150,
            scheduled: 45,
            confirmed: 35,
            completed: 55,
            cancelled: 10,
            noShow: 5,
            totalRevenue: 7500.00,
            averagePrice: 50.00
          })
        });
      });

      await page.addInitScript(() => {
        localStorage.setItem('token', 'super-admin-token');
      });
    });

    test('deve ter acesso completo ao dashboard', async ({ page }) => {
      await page.goto('http://localhost:3000/dashboard');
      
      await expect(page.locator('[data-testid="user-role-badge"]')).toContainText('Super Administrador');
      await expect(page.locator('[data-testid="dashboard-metrics"]')).toBeVisible();
      await expect(page.locator('[data-testid="nav-settings"]')).toBeVisible();
    });
  });

  test.describe('BARBER', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/api/auth/**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: '3',
              name: 'João Barbeiro',
              email: 'joao@barbershop.com',
              roles: ['BARBER'],
              barbershopId: 'barbershop-1',
              barberId: 'barber-3'
            }
          })
        });
      });

      await page.route('**/api/appointments/stats**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            total: 25,
            scheduled: 8,
            confirmed: 6,
            completed: 9,
            cancelled: 1,
            noShow: 1,
            totalRevenue: 1250.00,
            averagePrice: 50.00
          })
        });
      });

      await page.addInitScript(() => {
        localStorage.setItem('token', 'barber-token');
      });
    });

    test('deve ver apenas seus próprios agendamentos', async ({ page }) => {
      await page.goto('http://localhost:3000/dashboard');
      
      await expect(page.locator('[data-testid="user-role-badge"]')).toContainText('Barbeiro');
      await expect(page.locator('[data-testid="dashboard-metrics"]')).toBeVisible();
      await expect(page.locator('[data-testid="nav-settings"]')).not.toBeVisible();
    });
  });

  test.describe('CLIENT', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/api/auth/**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: '4',
              name: 'Carlos Cliente',
              email: 'carlos@email.com',
              roles: ['CLIENT']
            }
          })
        });
      });

      await page.addInitScript(() => {
        localStorage.setItem('token', 'client-token');
      });
    });

    test('deve ter interface simplificada', async ({ page }) => {
      await page.goto('http://localhost:3000/dashboard');
      
      await expect(page.locator('[data-testid="user-role-badge"]')).toContainText('Cliente');
      await expect(page.locator('[data-testid="nav-settings"]')).not.toBeVisible();
    });
  });
});
