import { client } from './index';

export interface NewsletterEmail {
  id: number;
  email: string;
  subscribedAt: string;
}

/**
 * Subscribe an email to the newsletter
 */
export async function subscribeEmail(email: string): Promise<NewsletterEmail> {
  const subscribedAt = new Date().toISOString();

  const result = await client.execute({
    sql: `INSERT INTO newsletter_emails (email, subscribedAt) VALUES (?, ?)`,
    args: [email, subscribedAt],
  });

  return {
    id: Number(result.lastInsertRowid),
    email,
    subscribedAt,
  };
}

/**
 * Check if an email is already subscribed
 */
export async function isEmailSubscribed(email: string): Promise<boolean> {
  const result = await client.execute({
    sql: `SELECT id FROM newsletter_emails WHERE email = ?`,
    args: [email],
  });

  return result.rows.length > 0;
}

/**
 * Get all newsletter subscribers
 */
export async function getAllSubscribers(): Promise<NewsletterEmail[]> {
  const result = await client.execute(`
    SELECT id, email, subscribedAt
    FROM newsletter_emails
    ORDER BY subscribedAt DESC
  `);

  return result.rows.map(row => ({
    id: row.id as number,
    email: row.email as string,
    subscribedAt: row.subscribedAt as string,
  }));
}
