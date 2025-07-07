# Schat Windows Desktop App

A Flutter Windows desktop application for the Schat platform.

## Features

- **Real-time Chat**: Connect to chatrooms and send/receive messages in real-time
- **User Authentication**: Login and register with your Schat account
- **Multiple Chatrooms**: Join different chatrooms using invite codes
- **Windows Native**: Built specifically for Windows desktop with native window management
- **Dark/Light Theme**: Automatic theme switching based on system preferences
- **Secure Connection**: All communication is encrypted and secure

## Prerequisites

- Flutter SDK (3.0.0 or higher)
- Windows 10 or higher
- Visual Studio 2019 or higher with C++ development tools

## Installation

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd schat/flutter
   ```

2. **Install dependencies**:
   ```bash
   flutter pub get
   ```

3. **Enable Windows desktop support** (if not already enabled):
   ```bash
   flutter config --enable-windows-desktop
   ```

4. **Run the application**:
   ```bash
   flutter run -d windows
   ```

## Building for Release

To build a release version of the app:

```bash
flutter build windows --release
```

The built application will be available in `build/windows/runner/Release/`.

## Configuration

The app connects to the Schat backend at `https://chat.ilikepancakes.ink`. This is configured in `lib/services/api_service.dart`.

## Project Structure

```
lib/
├── main.dart                 # App entry point
├── models/                   # Data models
│   ├── user.dart
│   ├── chatroom.dart
│   └── message.dart
├── providers/                # State management
│   ├── auth_provider.dart
│   └── chat_provider.dart
├── screens/                  # UI screens
│   ├── auth/
│   │   ├── login_screen.dart
│   │   └── register_screen.dart
│   └── chat/
│       ├── chat_home_screen.dart
│       └── chat_room_screen.dart
├── services/                 # API and external services
│   └── api_service.dart
└── utils/                    # Utilities and themes
    └── theme.dart
```

## Features Overview

### Authentication
- Login with username/password
- User registration
- Automatic token validation and refresh
- Secure token storage

### Chat Functionality
- Real-time messaging via WebSocket
- Multiple chatroom support
- Join chatrooms with invite codes
- Message history loading
- Online/offline status indicators

### User Interface
- Modern Material Design 3 UI
- Responsive layout optimized for desktop
- Sidebar navigation for chatrooms
- Message bubbles with timestamps
- User avatars and display names

## API Integration

The app integrates with the existing Schat web API:

- **Authentication**: `/api/auth/login`, `/api/auth/register`
- **Chatrooms**: `/api/chatrooms`, `/api/chatrooms/join`
- **Messages**: `/api/chatrooms/{id}/messages`
- **WebSocket**: Real-time message updates

## Development

### Adding New Features

1. **Models**: Add new data models in `lib/models/`
2. **API Calls**: Extend `lib/services/api_service.dart`
3. **State Management**: Update providers in `lib/providers/`
4. **UI**: Create new screens in `lib/screens/`

### Testing

Run tests with:
```bash
flutter test
```

### Debugging

For debugging, run:
```bash
flutter run -d windows --debug
```

## Troubleshooting

### Common Issues

1. **Build Errors**: Ensure Visual Studio C++ tools are installed
2. **Network Issues**: Check firewall settings for the app
3. **Authentication Issues**: Verify the API endpoint is accessible

### Logs

Application logs are available in the Flutter console when running in debug mode.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is part of the Schat platform.
