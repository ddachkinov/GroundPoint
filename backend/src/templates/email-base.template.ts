import { env } from '../config/env';

/**
 * Base email template with consistent styling and footer
 */
export function baseEmailTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Email</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 16px;
      line-height: 1.6;
      color: #333333;
      background-color: #f4f4f4;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .email-header {
      background-color: #2563eb;
      padding: 24px;
      text-align: center;
    }
    .email-header h1 {
      margin: 0;
      color: #ffffff;
      font-size: 24px;
      font-weight: 600;
    }
    .email-body {
      padding: 32px 24px;
    }
    .email-body p {
      margin: 0 0 16px 0;
    }
    .email-body h2 {
      margin: 0 0 16px 0;
      font-size: 20px;
      font-weight: 600;
      color: #111827;
    }
    .details-box {
      background-color: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
      margin: 24px 0;
    }
    .details-box p {
      margin: 8px 0;
    }
    .details-box strong {
      color: #111827;
    }
    .cta-button {
      display: inline-block;
      padding: 12px 32px;
      margin: 24px 0;
      background-color: #2563eb;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      text-align: center;
    }
    .cta-button:hover {
      background-color: #1d4ed8;
    }
    .email-footer {
      background-color: #f9fafb;
      padding: 24px;
      text-align: center;
      font-size: 14px;
      color: #6b7280;
      border-top: 1px solid #e5e7eb;
    }
    .email-footer p {
      margin: 8px 0;
    }
    .email-footer a {
      color: #2563eb;
      text-decoration: none;
    }
    @media only screen and (max-width: 600px) {
      .email-body {
        padding: 24px 16px;
      }
      .cta-button {
        display: block;
        width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <h1>${env.EMAIL_FROM_NAME}</h1>
    </div>
    <div class="email-body">
      ${content}
    </div>
    <div class="email-footer">
      <p>&copy; ${new Date().getFullYear()} ${env.EMAIL_FROM_NAME}. All rights reserved.</p>
      <p>
        <a href="${env.FRONTEND_URL}/unsubscribe">Unsubscribe</a> |
        <a href="${env.FRONTEND_URL}/contact">Contact Support</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount);
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}
