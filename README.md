# Schat

## 🚀 Features

### Core Chat Functionality
- **Real-time messaging** with Socket.IO
- **Multiple chat rooms** with invite codes and links
- **Private messaging** between users
- **Friend system** with friend requests and management
- **User profiles** with customizable profile pictures
- **Dark mode** support

### Security Features
- **Two-factor authentication (2FA)** with TOTP
- **Secure authentication** with JWT tokens
- **Password hashing** with bcrypt
- **Security report system** for ethical hackers
- **Rate limiting** and input validation
- **Privacy settings** for user profiles

### Administrative Features
- **Admin dashboard** for site management
- **Staff-only announcement rooms**
- **User role management** (Site Owner, Admin, Moderator)
- **Security report management**
- **User moderation tools**

### Developer Features
- **API documentation** available at `/developers`
- **Health check endpoint** at `/api/health`
- **Comprehensive test suite** with Jest
- **Security testing** with automated security audits

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Socket.IO
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT, bcryptjs, Speakeasy (2FA)
- **Real-time**: Socket.IO
- **Testing**: Jest, Testing Library
- **Deployment**: Docker, Render Platform

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account and project
- (Optional) Docker for containerized deployment

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/ilikepancakes-ink/schat.git
cd schat
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# JWT Configuration
JWT_SECRET=your_jwt_secret_key

# Discord Webhook (for security reports)
DISCORD_WEBHOOK_URL=your_discord_webhook_url

# Application Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Database Setup
Run the database setup script:
```bash
npm run setup-db
```

### 5. Start the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📱 Flutter Mobile App

A Flutter mobile version is also available in the `/flutter` directory. See the Flutter README for setup instructions.

## 🧪 Testing

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run security tests
```bash
npm run test:security
```

### Generate coverage report
```bash
npm run test:coverage
```

## 🔒 Security

This application includes several security features designed for the cybersecurity community:

- **Security Report System**: Users can report vulnerabilities through the "Hackers? Visit here!" button
- **Secure Session Management**: JWT tokens with proper expiration
- **Input Validation**: Comprehensive validation on all user inputs
- **Rate Limiting**: Protection against abuse and spam

For detailed security information, see [SECURITY.md](SECURITY.md).

## 🚀 Deployment

### Render Platform (Recommended)
The application is configured for deployment on Render:

```bash
npm run render-build
npm run render-start
```

### Docker Deployment
```bash
# Build and run with Docker
npm run deploy:docker

# Or use Docker Compose
npm run deploy:docker-compose
```

### Manual Deployment
```bash
npm run build
npm start
```

## 📚 API Documentation

Visit `/developers` in the application for comprehensive API documentation, including:
- Authentication endpoints
- Chat room management
- User profile management
- Private messaging
- Friend system
- Security features

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the Apachie License 2.0 see the LICENSE file for details.

## 🆘 Support

- **Security Issues**: Use the in-app security report system or contact the administrators
- **General Issues**: Open an issue on GitHub
- **Documentation**: Visit `/docs` in the application

## 🔗 Links

- **offical site** https://chat.ilikepancakes.ink
- **API Docs**: https://chat.ilikepancakes.ink/developers
- **Security Reports**: https://chat.ilikepancakes.ink/security-report
