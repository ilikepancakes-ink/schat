/**
 * Discord webhook utility for sending notifications
 */

interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  fields?: DiscordEmbedField[];
  timestamp?: string;
  footer?: {
    text: string;
  };
}

interface DiscordWebhookPayload {
  content?: string;
  embeds?: DiscordEmbed[];
}

interface WebhookOptions {
  title?: string;
  description?: string;
  color?: number;
  fields?: DiscordEmbedField[];
  content?: string;
}

// Discord webhook URL from environment variable
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

/**
 * Send a Discord webhook notification
 */
export async function sendDiscordWebhook(options: WebhookOptions): Promise<void> {
  // Skip if webhook URL is not configured
  if (!DISCORD_WEBHOOK_URL) {
    console.warn('Discord webhook URL not configured, skipping notification');
    return;
  }

  try {
    const payload: DiscordWebhookPayload = {};

    // Add content if provided
    if (options.content) {
      payload.content = options.content;
    }

    // Create embed if title or description provided
    if (options.title || options.description) {
      const embed: DiscordEmbed = {
        timestamp: new Date().toISOString(),
        footer: {
          text: 'SchoolChat Security System'
        }
      };

      if (options.title) {
        embed.title = options.title;
      }

      if (options.description) {
        embed.description = options.description;
      }

      if (options.color) {
        embed.color = options.color;
      }

      if (options.fields && options.fields.length > 0) {
        embed.fields = options.fields;
      }

      payload.embeds = [embed];
    }

    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Discord webhook failed with status: ${response.status}`);
    }

  } catch (error) {
    console.error('Failed to send Discord webhook:', error);
    // Don't throw error to prevent breaking the main functionality
  }
}

/**
 * Send a simple text message to Discord
 */
export async function sendDiscordMessage(message: string): Promise<void> {
  return sendDiscordWebhook({ content: message });
}

/**
 * Send an error notification to Discord
 */
export async function sendDiscordError(error: string, path?: string): Promise<void> {
  const description = path 
    ? `**Error:** ${error}\n**Path:** ${path}`
    : `**Error:** ${error}`;

  return sendDiscordWebhook({
    title: '🚨 Application Error',
    description,
    color: 0xFF0000, // Red color
  });
}

/**
 * Send a security alert to Discord
 */
export async function sendDiscordSecurityAlert(
  title: string, 
  description: string, 
  severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
): Promise<void> {
  const colors = {
    low: 0x00FF00,      // Green
    medium: 0xFFFF00,   // Yellow
    high: 0xFF8C00,     // Orange
    critical: 0xFF0000  // Red
  };

  const emojis = {
    low: '🟢',
    medium: '🟡',
    high: '🟠',
    critical: '🔴'
  };

  return sendDiscordWebhook({
    title: `${emojis[severity]} ${title}`,
    description,
    color: colors[severity],
  });
}
