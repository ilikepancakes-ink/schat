import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../models/chatroom.dart';
import '../models/message.dart';
import '../services/api_service.dart';

class ChatProvider with ChangeNotifier {
  List<Chatroom> _chatrooms = [];
  List<Message> _messages = [];
  Chatroom? _currentChatroom;
  IO.Socket? _socket;
  bool _isLoading = false;
  bool _isConnected = false;

  List<Chatroom> get chatrooms => _chatrooms;
  List<Message> get messages => _messages;
  Chatroom? get currentChatroom => _currentChatroom;
  bool get isLoading => _isLoading;
  bool get isConnected => _isConnected;

  Future<void> loadChatrooms(String token) async {
    _isLoading = true;
    notifyListeners();

    try {
      final result = await ApiService.getChatrooms(token);
      if (result['success'] == true) {
        _chatrooms = (result['chatrooms'] as List)
            .map((json) => Chatroom.fromJson(json))
            .toList();
      }
    } catch (e) {
      debugPrint('Error loading chatrooms: $e');
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> selectChatroom(Chatroom chatroom, String token) async {
    _currentChatroom = chatroom;
    _messages.clear();
    notifyListeners();

    await loadMessages(chatroom.id, token);
  }

  Future<void> loadMessages(String chatroomId, String token) async {
    _isLoading = true;
    notifyListeners();

    try {
      final result = await ApiService.getChatroomMessages(chatroomId, token);
      if (result['success'] == true) {
        _messages = (result['messages'] as List)
            .map((json) => Message.fromJson(json))
            .toList();
      }
    } catch (e) {
      debugPrint('Error loading messages: $e');
    }

    _isLoading = false;
    notifyListeners();
  }

  void connectSocket(String token) {
    if (_socket != null) {
      _socket!.disconnect();
    }

    _socket = IO.io('https://chat.ilikepancakes.ink', <String, dynamic>{
      'transports': ['websocket'],
      'autoConnect': false,
      'auth': {'token': token},
    });

    _socket!.connect();

    _socket!.on('connect', (_) {
      _isConnected = true;
      debugPrint('Socket connected');
      notifyListeners();
    });

    _socket!.on('disconnect', (_) {
      _isConnected = false;
      debugPrint('Socket disconnected');
      notifyListeners();
    });

    _socket!.on('new_message', (data) {
      final message = Message.fromJson(data);
      if (message.chatroomId == _currentChatroom?.id) {
        _messages.add(message);
        notifyListeners();
      }
    });

    _socket!.on('user_joined', (data) {
      debugPrint('User joined: $data');
      // Handle user joined event
    });

    _socket!.on('user_left', (data) {
      debugPrint('User left: $data');
      // Handle user left event
    });
  }

  Future<void> sendMessage(String content, String token) async {
    if (_currentChatroom == null) return;

    try {
      final result = await ApiService.sendMessage(
        _currentChatroom!.id,
        content,
        token,
      );
      
      if (result['success'] == true) {
        // Message will be added via socket event
        debugPrint('Message sent successfully');
      }
    } catch (e) {
      debugPrint('Error sending message: $e');
    }
  }

  void disconnectSocket() {
    _socket?.disconnect();
    _socket = null;
    _isConnected = false;
    notifyListeners();
  }

  @override
  void dispose() {
    disconnectSocket();
    super.dispose();
  }
}
