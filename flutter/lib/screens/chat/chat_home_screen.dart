import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/chat_provider.dart';
import '../../models/chatroom.dart';
import '../../services/api_service.dart';
import 'chat_room_screen.dart';

class ChatHomeScreen extends StatefulWidget {
  const ChatHomeScreen({super.key});

  @override
  State<ChatHomeScreen> createState() => _ChatHomeScreenState();
}

class _ChatHomeScreenState extends State<ChatHomeScreen> {
  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final chatProvider = Provider.of<ChatProvider>(context, listen: false);
    
    if (authProvider.token != null) {
      await chatProvider.loadChatrooms(authProvider.token!);
      chatProvider.connectSocket(authProvider.token!);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('SchoolChat'),
        actions: [
          Consumer<ChatProvider>(
            builder: (context, chatProvider, child) {
              return Icon(
                chatProvider.isConnected ? Icons.wifi : Icons.wifi_off,
                color: chatProvider.isConnected ? Colors.green : Colors.red,
              );
            },
          ),
          const SizedBox(width: 8),
          PopupMenuButton<String>(
            onSelected: (value) {
              if (value == 'logout') {
                _handleLogout();
              } else if (value == 'profile') {
                _showProfile();
              }
            },
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: 'profile',
                child: Row(
                  children: [
                    Icon(Icons.person),
                    SizedBox(width: 8),
                    Text('Profile'),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'logout',
                child: Row(
                  children: [
                    Icon(Icons.logout),
                    SizedBox(width: 8),
                    Text('Logout'),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
      body: Row(
        children: [
          // Sidebar with chatrooms
          Container(
            width: 300,
            decoration: BoxDecoration(
              border: Border(
                right: BorderSide(color: Colors.grey[300]!),
              ),
            ),
            child: Column(
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
                      const Icon(Icons.chat_bubble_outline),
                      const SizedBox(width: 8),
                      const Text(
                        'Chatrooms',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const Spacer(),
                      IconButton(
                        icon: const Icon(Icons.add),
                        onPressed: _showJoinChatroomDialog,
                        tooltip: 'Join Chatroom',
                      ),
                    ],
                  ),
                ),
                // Chatrooms list
                Expanded(
                  child: Consumer<ChatProvider>(
                    builder: (context, chatProvider, child) {
                      if (chatProvider.isLoading) {
                        return const Center(child: CircularProgressIndicator());
                      }

                      if (chatProvider.chatrooms.isEmpty) {
                        return const Center(
                          child: Text('No chatrooms available'),
                        );
                      }

                      return ListView.builder(
                        itemCount: chatProvider.chatrooms.length,
                        itemBuilder: (context, index) {
                          final chatroom = chatProvider.chatrooms[index];
                          return _buildChatroomTile(chatroom);
                        },
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
          // Main content area
          Expanded(
            child: Consumer<ChatProvider>(
              builder: (context, chatProvider, child) {
                if (chatProvider.currentChatroom == null) {
                  return const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.chat_bubble_outline,
                          size: 64,
                          color: Colors.grey,
                        ),
                        SizedBox(height: 16),
                        Text(
                          'Select a chatroom to start chatting',
                          style: TextStyle(
                            fontSize: 18,
                            color: Colors.grey,
                          ),
                        ),
                      ],
                    ),
                  );
                }

                return ChatRoomScreen(chatroom: chatProvider.currentChatroom!);
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildChatroomTile(Chatroom chatroom) {
    return Consumer<ChatProvider>(
      builder: (context, chatProvider, child) {
        final isSelected = chatProvider.currentChatroom?.id == chatroom.id;
        
        return Container(
          decoration: BoxDecoration(
            color: isSelected ? Theme.of(context).primaryColor.withOpacity(0.1) : null,
            border: Border(
              bottom: BorderSide(color: Colors.grey[200]!),
            ),
          ),
          child: ListTile(
            leading: CircleAvatar(
              backgroundColor: chatroom.isStaffOnly ? Colors.orange : Colors.blue,
              child: Icon(
                chatroom.isStaffOnly ? Icons.admin_panel_settings : Icons.group,
                color: Colors.white,
              ),
            ),
            title: Text(
              chatroom.name,
              style: TextStyle(
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              ),
            ),
            subtitle: Text(
              chatroom.description ?? 'No description',
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            trailing: Text(
              '${chatroom.memberCount}',
              style: TextStyle(
                color: Colors.grey[600],
                fontSize: 12,
              ),
            ),
            onTap: () => _selectChatroom(chatroom),
          ),
        );
      },
    );
  }

  Future<void> _selectChatroom(Chatroom chatroom) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final chatProvider = Provider.of<ChatProvider>(context, listen: false);
    
    if (authProvider.token != null) {
      await chatProvider.selectChatroom(chatroom, authProvider.token!);
    }
  }

  void _showJoinChatroomDialog() {
    final controller = TextEditingController();
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Join Chatroom'),
        content: TextField(
          controller: controller,
          decoration: const InputDecoration(
            labelText: 'Invite Code',
            hintText: 'Enter the chatroom invite code',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => _joinChatroom(controller.text.trim()),
            child: const Text('Join'),
          ),
        ],
      ),
    );
  }

  Future<void> _joinChatroom(String inviteCode) async {
    if (inviteCode.isEmpty) return;
    
    Navigator.of(context).pop(); // Close dialog
    
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final chatProvider = Provider.of<ChatProvider>(context, listen: false);
    
    if (authProvider.token != null) {
      final result = await ApiService.joinChatroom(inviteCode, authProvider.token!);
      
      if (result['success'] == true) {
        // Reload chatrooms
        await chatProvider.loadChatrooms(authProvider.token!);
        
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(result['message'] ?? 'Joined chatroom successfully')),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(result['error'] ?? 'Failed to join chatroom'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    }
  }

  void _showProfile() {
    // TODO: Implement profile screen
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Profile screen coming soon!')),
    );
  }

  Future<void> _handleLogout() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final chatProvider = Provider.of<ChatProvider>(context, listen: false);
    
    chatProvider.disconnectSocket();
    await authProvider.logout();
  }
}
