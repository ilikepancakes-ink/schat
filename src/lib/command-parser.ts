export interface ChatCommand {
  type: 'invitelink' | 'privateshare' | 'message';
  content: string;
  args?: string[];
}

/**
 * Parse a message to check if it's a command
 */
export function parseCommand(message: string): ChatCommand {
  const trimmed = message.trim();
  
  // Check for &invitelink command
  if (trimmed === '&invitelink') {
    return {
      type: 'invitelink',
      content: trimmed,
    };
  }
  
  // Check for &privateshare command
  if (trimmed.startsWith('&privateshare ')) {
    const args = trimmed.split(' ').slice(1); // Remove the command part
    const username = args[0];
    
    if (!username) {
      throw new Error('Username is required for &privateshare command');
    }
    
    return {
      type: 'privateshare',
      content: trimmed,
      args: [username],
    };
  }
  
  // Regular message
  return {
    type: 'message',
    content: trimmed,
  };
}

/**
 * Check if a message is a command
 */
export function isCommand(message: string): boolean {
  const trimmed = message.trim();
  return trimmed === '&invitelink' || trimmed.startsWith('&privateshare ');
}

/**
 * Get help text for commands
 */
export function getCommandHelp(): string {
  return `Available commands:
• &invitelink - Generate an invite link for the current chatroom
• &privateshare <username> - Send a private invite to a specific user

Example: &privateshare john123`;
}
