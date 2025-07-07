import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/chat_provider.dart';
import '../../models/chatroom.dart';
import '../../models/message.dart';

class ChatRoomScreen extends StatefulWidget {
  final Chatroom chatroom;

  const ChatRoomScreen({
    super.key,
    required this.chatroom,
  });

  @override
  State<ChatRoomScreen> createState() => _ChatRoomScreenState();
}

class _ChatRoomScreenState extends State<ChatRoomScreen> {
  final _messageController = TextEditingController();
  final _scrollController = ScrollController();

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Header
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Theme.of(context).primaryColor.withOpacity(0.1),
            border: Border(
              bottom: BorderSide(color: Colors.grey[300]!),
            ),
          ),
          child: Row(
            children: [
              CircleAvatar(
                backgroundColor: widget.chatroom.isStaffOnly ? Colors.orange : Colors.blue,
                child: Icon(
                  widget.chatroom.isStaffOnly ? Icons.admin_panel_settings : Icons.group,
                  color: Colors.white,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.chatroom.name,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    if (widget.chatroom.description != null)
                      Text(
                        widget.chatroom.description!,
                        style: TextStyle(
                          color: Colors.grey[600],
                          fontSize: 14,
                        ),
                      ),
                  ],
                ),
              ),
              Text(
                '${widget.chatroom.memberCount} members',
                style: TextStyle(
                  color: Colors.grey[600],
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ),
        // Invite Code Display
        if (widget.chatroom.inviteCode != null)
          _buildInviteCodeDisplay(),
        // Messages
        Expanded(
          child: Consumer<ChatProvider>(
            builder: (context, chatProvider, child) {
              if (chatProvider.isLoading) {
                return const Center(child: CircularProgressIndicator());
              }

              if (chatProvider.messages.isEmpty) {
                return const Center(
                  child: Text('No messages yet. Start the conversation!'),
                );
              }

              return ListView.builder(
                controller: _scrollController,
                padding: const EdgeInsets.all(16),
                itemCount: chatProvider.messages.length,
                itemBuilder: (context, index) {
                  final message = chatProvider.messages[index];
                  return _buildMessageBubble(message);
                },
              );
            },
          ),
        ),
        // Message input
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            border: Border(
              top: BorderSide(color: Colors.grey[300]!),
            ),
          ),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _messageController,
                  decoration: InputDecoration(
                    hintText: 'Type a message...',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(24),
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                  ),
                  maxLines: null,
                  onSubmitted: (_) => _sendMessage(),
                ),
              ),
              const SizedBox(width: 8),
              Consumer<ChatProvider>(
                builder: (context, chatProvider, child) {
                  return IconButton(
                    onPressed: chatProvider.isConnected ? _sendMessage : null,
                    icon: const Icon(Icons.send),
                    style: IconButton.styleFrom(
                      backgroundColor: Theme.of(context).primaryColor,
                      foregroundColor: Colors.white,
                    ),
                  );
                },
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildMessageBubble(Message message) {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final isOwnMessage = message.userId == authProvider.user?.id;

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment: isOwnMessage ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (!isOwnMessage) ...[
            CircleAvatar(
              radius: 16,
              backgroundColor: Colors.blue,
              child: Text(
                message.senderName.isNotEmpty ? message.senderName[0].toUpperCase() : '?',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: Container(
              constraints: BoxConstraints(
                maxWidth: MediaQuery.of(context).size.width * 0.7,
              ),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: isOwnMessage 
                    ? Theme.of(context).primaryColor 
                    : Colors.grey[200],
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (!isOwnMessage)
                    Text(
                      message.senderName,
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                        color: isOwnMessage ? Colors.white70 : Colors.grey[600],
                      ),
                    ),
                  Text(
                    message.content,
                    style: TextStyle(
                      color: isOwnMessage ? Colors.white : Colors.black87,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    message.formattedTime,
                    style: TextStyle(
                      fontSize: 10,
                      color: isOwnMessage ? Colors.white70 : Colors.grey[600],
                    ),
                  ),
                ],
              ),
            ),
          ),
          if (isOwnMessage) ...[
            const SizedBox(width: 8),
            CircleAvatar(
              radius: 16,
              backgroundColor: Theme.of(context).primaryColor,
              child: Text(
                authProvider.user?.displayNameOrUsername.isNotEmpty == true 
                    ? authProvider.user!.displayNameOrUsername[0].toUpperCase() 
                    : '?',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Future<void> _sendMessage() async {
    final content = _messageController.text.trim();
    if (content.isEmpty) return;

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final chatProvider = Provider.of<ChatProvider>(context, listen: false);

    if (authProvider.token != null) {
      _messageController.clear();
      await chatProvider.sendMessage(content, authProvider.token!);
      
      // Scroll to bottom
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (_scrollController.hasClients) {
          _scrollController.animateTo(
            _scrollController.position.maxScrollExtent,
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeOut,
          );
        }
      });
    }
  }

  Widget _buildInviteCodeDisplay() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.blue.shade50,
        border: Border(
          bottom: BorderSide(color: Colors.blue.shade200),
        ),
      ),
      child: Row(
        children: [
          Icon(
            Icons.tag,
            size: 16,
            color: Colors.blue.shade600,
          ),
          const SizedBox(width: 8),
          Text(
            'Invite Code:',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w500,
              color: Colors.blue.shade700,
            ),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.blue.shade100,
              borderRadius: BorderRadius.circular(4),
            ),
            child: Text(
              widget.chatroom.inviteCode!,
              style: TextStyle(
                fontSize: 14,
                fontFamily: 'monospace',
                color: Colors.blue.shade800,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          const Spacer(),
          TextButton.icon(
            onPressed: () => _copyInviteCode(),
            icon: const Icon(Icons.copy, size: 16),
            label: const Text('Copy'),
            style: TextButton.styleFrom(
              foregroundColor: Colors.blue.shade600,
              textStyle: const TextStyle(fontSize: 12),
            ),
          ),
        ],
      ),
    );
  }

  void _copyInviteCode() async {
    if (widget.chatroom.inviteCode != null) {
      await Clipboard.setData(ClipboardData(text: widget.chatroom.inviteCode!));
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Invite code copied to clipboard!'),
            duration: Duration(seconds: 2),
          ),
        );
      }
    }
  }
}
