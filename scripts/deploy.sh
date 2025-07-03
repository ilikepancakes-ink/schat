#!/bin/bash

# SchoolChat Deployment Script
# This script handles the deployment of the SchoolChat application

set -e  # Exit on any error

echo "🚀 Starting SchoolChat deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required environment variables are set
check_env_vars() {
    print_status "Checking environment variables..."
    
    required_vars=(
        "JWT_SECRET"
        "ENCRYPTION_KEY"
        "NEXT_PUBLIC_SUPABASE_URL"
        "NEXT_PUBLIC_SUPABASE_ANON_KEY"
        "SUPABASE_SERVICE_ROLE_KEY"
        "NEXT_PUBLIC_APP_URL"
    )
    
    missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        print_error "Missing required environment variables:"
        printf '%s\n' "${missing_vars[@]}"
        exit 1
    fi
    
    print_status "All required environment variables are set ✓"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    npm ci --only=production
    print_status "Dependencies installed ✓"
}

# Run security tests
run_security_tests() {
    print_status "Running security tests..."
    
    if npm run test:security 2>/dev/null; then
        print_status "Security tests passed ✓"
    else
        print_warning "Security tests not available, running manual security checks..."
        
        # Run our custom security tests
        if npx tsx test-security.ts; then
            print_status "Manual security tests passed ✓"
        else
            print_error "Security tests failed!"
            exit 1
        fi
    fi
}

# Build the application
build_application() {
    print_status "Building application..."
    npm run build
    print_status "Application built successfully ✓"
}

# Run health check
health_check() {
    print_status "Running health check..."
    
    # Start the application in background for health check
    npm start &
    APP_PID=$!
    
    # Wait for application to start
    sleep 10
    
    # Check health endpoint
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        print_status "Health check passed ✓"
    else
        print_error "Health check failed!"
        kill $APP_PID 2>/dev/null || true
        exit 1
    fi
    
    # Stop the test instance
    kill $APP_PID 2>/dev/null || true
    sleep 2
}

# Deploy with Docker
deploy_docker() {
    print_status "Deploying with Docker..."
    
    # Build Docker image
    docker build -t schoolchat:latest .
    
    # Stop existing container if running
    docker stop schoolchat 2>/dev/null || true
    docker rm schoolchat 2>/dev/null || true
    
    # Run new container
    docker run -d \
        --name schoolchat \
        --restart unless-stopped \
        -p 3000:3000 \
        --env-file .env.production \
        schoolchat:latest
    
    print_status "Docker deployment completed ✓"
}

# Deploy with Docker Compose
deploy_docker_compose() {
    print_status "Deploying with Docker Compose..."
    
    # Stop existing services
    docker-compose down 2>/dev/null || true
    
    # Build and start services
    docker-compose up -d --build
    
    print_status "Docker Compose deployment completed ✓"
}

# Main deployment function
main() {
    print_status "SchoolChat Deployment Starting..."
    
    # Check if .env.production exists
    if [[ ! -f ".env.production" ]]; then
        print_error ".env.production file not found!"
        print_error "Please create .env.production with your production environment variables."
        exit 1
    fi
    
    # Source environment variables
    set -a
    source .env.production
    set +a
    
    # Run deployment steps
    check_env_vars
    install_dependencies
    run_security_tests
    build_application
    
    # Choose deployment method
    if [[ "$1" == "docker-compose" ]]; then
        deploy_docker_compose
    elif [[ "$1" == "docker" ]]; then
        deploy_docker
    else
        print_status "Skipping containerized deployment (use 'docker' or 'docker-compose' argument)"
        health_check
    fi
    
    print_status "🎉 SchoolChat deployment completed successfully!"
    print_status "Application should be available at: ${NEXT_PUBLIC_APP_URL:-http://localhost:3000}"
}

# Run main function with all arguments
main "$@"
