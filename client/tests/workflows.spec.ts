import {
  test,
  expect,
  type Page,
  type APIRequestContext,
} from '@playwright/test';
import { createHmac } from 'node:crypto';

const api = 'http://localhost:5011/api';
const password = 'TestPassword123!';
const memberEmail = 'member@example.test';
let issueId = '';
let memberId = '';
async function login(page: Page, email = 'admin@example.test') {
  await page.goto('/login');
  await page.getByLabel('Email address', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(
    page.getByRole('heading', { name: 'Dashboard', exact: true }),
  ).toBeVisible();
}
async function adminToken(request: APIRequestContext) {
  const response = await request.post(`${api}/auth/login`, {
    data: { email: 'admin@example.test', password },
  });
  expect(response.ok()).toBeTruthy();
  return (await response.json()).data.token as string;
}

test.describe.serial('real backend browser workflows', () => {
  let pageErrors: string[] = [];
  test.beforeEach(async ({ page }) => {
    pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
  });
  test.afterEach(() => {
    expect(pageErrors, 'No uncaught browser errors').toEqual([]);
  });

  test('route protection, invalid and expired tokens, registration, login, logout and empty dashboard', async ({
    page,
  }) => {
    await page.goto('/issues');
    await expect(page).toHaveURL(/\/login$/);
    await page.evaluate(() =>
      localStorage.setItem('issue-tracker-token', 'invalid-token'),
    );
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login\?expired=1$/);
    await expect(page.getByRole('status')).toContainText('session has expired');
    const body = `${Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')}.${Buffer.from(JSON.stringify({ sub: '000000000000000000000000', exp: 1 })).toString('base64url')}`;
    const expired = `${body}.${createHmac('sha256', 'frontend-e2e-only-secret-at-least-32-characters').update(body).digest('base64url')}`;
    await page.evaluate(
      (token) => localStorage.setItem('issue-tracker-token', token),
      expired,
    );
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login\?expired=1$/);
    await page.getByRole('link', { name: 'Create an account' }).click();
    await page.getByLabel('Full name').fill('Test Member');
    await page.getByLabel('Email address').fill(memberEmail);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByLabel('Confirm password').fill('DifferentPassword!');
    await page
      .getByRole('button', { name: 'Create account', exact: true })
      .click();
    await expect(page.locator('.error-state')).toContainText(
      'Passwords do not match',
    );
    await page.getByLabel('Confirm password').fill(password);
    await page
      .getByRole('button', { name: 'Create account', exact: true })
      .click();
    await expect(page).toHaveURL(/\/login\?registered=1$/);
    await expect(page.getByRole('status')).toContainText('Account created');
    await page.getByLabel('Email address').fill(memberEmail);
    await page.getByLabel('Password', { exact: true }).fill('wrong-password');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page.locator('.error-state')).toContainText(
      'Invalid email or password',
    );
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByText('MY WORKSPACE', { exact: true })).toBeVisible();
    await expect(page.getByText('Your workspace is clear')).toBeVisible();
    await page.reload();
    await expect(
      page.getByRole('heading', { name: 'Dashboard' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Sign out', exact: true }).click();
    await expect(page).toHaveURL(/\/login$/);
    expect(
      await page.evaluate(() => localStorage.getItem('issue-tracker-token')),
    ).toBeNull();
  });

  test('member issue creation, editing, comments, profile and restricted access', async ({
    page,
    request,
  }) => {
    await login(page, memberEmail);
    await expect(
      page
        .getByRole('navigation')
        .getByRole('link', { name: 'Users', exact: true }),
    ).toHaveCount(0);
    await page.getByRole('link', { name: 'Create issue', exact: true }).click();
    await expect(
      page.getByRole('heading', { name: 'Create an issue' }),
    ).toBeVisible();
    await expect(page.getByLabel('Assignee', { exact: true })).toHaveCount(0);
    await page.getByLabel('Issue title').fill('Browser reported issue');
    await page
      .getByLabel('Description', { exact: true })
      .fill('Real browser integration issue.');
    await page.getByLabel('Priority', { exact: true }).selectOption('HIGH');
    await page
      .getByRole('button', { name: 'Create issue', exact: true })
      .click();
    await expect(page).toHaveURL(/\/issues\/[a-f0-9]{24}$/);
    issueId = page.url().split('/').pop()!;
    await expect(
      page.getByRole('heading', { name: 'Browser reported issue' }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Update status' }),
    ).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: 'Delete', exact: true }),
    ).toHaveCount(0);
    await page.getByRole('button', { name: 'Edit issue' }).click();
    await page
      .getByRole('dialog')
      .getByLabel('Issue title')
      .fill('Updated browser issue');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(
      page.getByRole('heading', { name: 'Updated browser issue' }),
    ).toBeVisible();
    await page.getByLabel('Add a comment').fill('Investigating the report.');
    await page.getByRole('button', { name: 'Post comment' }).click();
    await expect(
      page.getByText('Investigating the report.', { exact: true }),
    ).toBeVisible();
    await page.getByRole('link', { name: 'View my profile' }).click();
    await expect(
      page.getByRole('heading', { name: 'My profile' }),
    ).toBeVisible();
    await expect(page.getByText(memberEmail, { exact: true })).toBeVisible();
    await page.goto('/users');
    await expect(
      page.getByRole('heading', { name: 'Administrator access required' }),
    ).toBeVisible();
    const token = await page.evaluate(() =>
      localStorage.getItem('issue-tracker-token'),
    );
    const me = await request.get(`${api}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    memberId = (await me.json()).data._id;
    // An unrelated account must not be able to read the issue or its discussion.
    const response = await request.post(`${api}/auth/register`, {
      data: { name: 'Outsider', email: 'outsider@example.test', password },
    });
    expect(response.ok()).toBeTruthy();
    const outsider = (await response.json()).data;
    await page.evaluate(
      (token) => localStorage.setItem('issue-tracker-token', token),
      outsider.token,
    );
    await page.goto(`/issues/${issueId}`);
    await expect(page.locator('.error-state')).toContainText('Access denied');
    await expect(page.getByLabel('Add a comment')).toHaveCount(0);
    await page.goto('/issues/000000000000000000000000');
    await expect(page.locator('.error-state')).toContainText('Issue not found');
  });

  test('admin assignment, member status, user management and issue deletion', async ({
    page,
    browser,
    request,
  }) => {
    await login(page);
    await expect(
      page.getByText('WORKSPACE OVERVIEW', { exact: true }),
    ).toBeVisible();
    await page.goto(`/issues/${issueId}`);
    await page.getByLabel('Assignee', { exact: true }).selectOption(memberId);
    await page.getByRole('button', { name: 'Save assignment' }).click();
    await expect(page.getByRole('status')).toContainText('assignment updated');
    const memberContext = await browser.newContext();
    const memberPage = await memberContext.newPage();
    await memberPage.goto('http://localhost:3011/login');
    await memberPage.getByLabel('Email address').fill(memberEmail);
    await memberPage.getByLabel('Password', { exact: true }).fill(password);
    await memberPage
      .getByRole('button', { name: 'Sign in', exact: true })
      .click();
    await expect(memberPage).toHaveURL(/\/dashboard$/);
    await memberPage.goto(`http://localhost:3011/issues/${issueId}`);
    await memberPage
      .getByLabel('Status', { exact: true })
      .selectOption('IN_PROGRESS');
    await memberPage.getByRole('button', { name: 'Update status' }).click();
    await expect(memberPage.getByRole('status')).toContainText(
      'status updated',
    );
    await memberContext.close();
    await page.reload();
    await expect(page.getByLabel('Status', { exact: true })).toHaveValue(
      'IN_PROGRESS',
    );
    await page.getByLabel('Status', { exact: true }).selectOption('CLOSED');
    await page.getByRole('button', { name: 'Update status' }).click();
    await expect(page.getByRole('status')).toContainText('status updated');
    await page
      .getByRole('navigation')
      .getByRole('link', { name: 'Users', exact: true })
      .click();
    await page
      .getByRole('button', { name: 'View Test Member', exact: true })
      .click();
    await expect(
      page.getByRole('dialog').getByText(memberEmail, { exact: true }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Close', exact: true }).click();
    await page
      .getByRole('button', { name: 'Edit Test Member', exact: true })
      .click();
    await page
      .getByRole('dialog')
      .getByLabel('Full name')
      .fill('Updated Member');
    await page
      .getByRole('button', { name: 'Save changes', exact: true })
      .click();
    await expect(
      page.getByText('Updated Member', { exact: true }),
    ).toBeVisible();
    await page
      .getByRole('button', { name: 'Delete Updated Member', exact: true })
      .click();
    await page
      .getByRole('button', { name: 'Delete user', exact: true })
      .click();
    await expect(
      page.getByRole('dialog').locator('.error-state'),
    ).toContainText('referenced by issues or comments');
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(
      page.getByRole('button', { name: 'Delete Test Admin', exact: true }),
    ).toBeDisabled();
    const temporary = await request.post(`${api}/auth/register`, {
      data: { name: 'Unused Member', email: 'unused@example.test', password },
    });
    expect(temporary.ok()).toBeTruthy();
    await page.reload();
    await page
      .getByRole('button', { name: 'Delete Unused Member', exact: true })
      .click();
    await page
      .getByRole('button', { name: 'Delete user', exact: true })
      .click();
    await expect(page.getByText('Unused Member', { exact: true })).toHaveCount(
      0,
    );
    await page.goto('/issues/new');
    await page.getByLabel('Issue title').fill('Admin assigned issue');
    await page
      .getByLabel('Description', { exact: true })
      .fill('Created and assigned by an administrator.');
    await page.getByLabel('Assignee', { exact: true }).selectOption(memberId);
    await page
      .getByRole('button', { name: 'Create issue', exact: true })
      .click();
    await expect(
      page.getByRole('heading', { name: 'Admin assigned issue' }),
    ).toBeVisible();
    await page.getByLabel('Assignee', { exact: true }).selectOption('');
    await page.getByRole('button', { name: 'Save assignment' }).click();
    await expect(page.getByRole('status')).toContainText('assignment updated');
    await page.getByRole('button', { name: 'Delete', exact: true }).click();
    await page
      .getByRole('button', { name: 'Delete issue', exact: true })
      .click();
    await expect(page).toHaveURL(/\/issues$/);
    await page.goto(`/issues/${issueId}`);
    await page.getByRole('button', { name: 'Delete', exact: true }).click();
    await page
      .getByRole('button', { name: 'Delete issue', exact: true })
      .click();
    await expect(page).toHaveURL(/\/issues$/);
    await expect(
      page.getByText('No issues yet', { exact: true }),
    ).toBeVisible();
    const token = await adminToken(request);
    const response = await request.get(`${api}/issues/${issueId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.status()).toBe(404);
  });

  test('real data search, filters, pagination, dashboard totals and responsive navigation', async ({
    page,
    request,
  }) => {
    const token = await adminToken(request);
    const headers = { Authorization: `Bearer ${token}` };
    for (let i = 0; i < 12; i++) {
      const response = await request.post(`${api}/issues`, {
        headers,
        data: {
          title:
            i === 11
              ? 'Unique power supply defect'
              : `Verification issue ${i + 1}`,
          description: 'Created in the isolated browser test database.',
          priority: i === 11 ? 'HIGH' : 'LOW',
        },
      });
      expect(response.ok()).toBeTruthy();
      if (i === 11) {
        const id = (await response.json()).data._id;
        const status = await request.patch(`${api}/issues/${id}/status`, {
          headers,
          data: { status: 'CLOSED' },
        });
        expect(status.ok()).toBeTruthy();
      }
    }
    await login(page);
    await expect(
      page
        .locator('.stat-card')
        .filter({ hasText: 'Total issues' })
        .locator('.stat-value'),
    ).toHaveText('12');
    await expect(
      page
        .locator('.stat-card')
        .filter({ hasText: 'Closed' })
        .locator('.stat-value'),
    ).toHaveText('1');
    await page
      .getByRole('link', { name: 'View all issues', exact: true })
      .click();
    await expect(page.getByText('Showing 1–10 of 12 issues')).toBeVisible();
    await page.getByRole('button', { name: 'Next page' }).click();
    await expect(page.getByText('Showing 11–12 of 12 issues')).toBeVisible();
    await page.getByRole('button', { name: 'Previous page' }).click();
    await page
      .getByLabel('Search issues', { exact: true })
      .fill('Unique power');
    await expect(page.getByText('Showing 1–1 of 1 issues')).toBeVisible();
    await page.getByLabel('Priority', { exact: true }).selectOption('LOW');
    await expect(page.getByText('No matching issues')).toBeVisible();
    await page.getByRole('button', { name: 'Reset', exact: true }).click();
    await page.getByLabel('Status', { exact: true }).selectOption('CLOSED');
    await expect(page.getByText('Showing 1–1 of 1 issues')).toBeVisible();
    await page.getByRole('button', { name: 'Reset', exact: true }).click();
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(
      page.getByRole('button', { name: 'Open navigation' }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    const table = page.getByRole('region', { name: 'Issues table' });
    expect(
      await table.evaluate(
        (element) => element.scrollWidth > element.clientWidth,
      ),
    ).toBeTruthy();
    await page.getByRole('button', { name: 'Open navigation' }).click();
    await page
      .getByRole('dialog')
      .getByRole('link', { name: 'My profile', exact: true })
      .click();
    await expect(
      page.getByRole('heading', { name: 'My profile', exact: true }),
    ).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0); // closed native dialogs are not exposed
    await page.getByRole('button', { name: 'Open navigation' }).click();
    await page.keyboard.press('Escape');
    await expect(
      page.getByRole('button', { name: 'Open navigation' }),
    ).toBeFocused();
    for (const [path, heading] of [
      ['/issues/new', 'Create an issue'],
      ['/users', 'Users'],
    ]) {
      await page.goto(path);
      await expect(
        page.getByRole('heading', { name: heading, exact: true }),
      ).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBeTruthy();
    }
    await page.goto('/dashboard');
    await expect(
      page.getByRole('heading', { name: 'Dashboard', exact: true }),
    ).toBeVisible();
    await page.screenshot({
      path: 'test-results/dashboard-mobile.png',
      fullPage: true,
    });
    for (const width of [768, 1280, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBeTruthy();
    }
    await page.screenshot({
      path: 'test-results/dashboard-desktop.png',
      fullPage: true,
    });
  });
});
