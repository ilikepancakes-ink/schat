# SchoolChat Deployment Script (PowerShell)
# This script handles the deployment of the SchoolChat application on Windows

param(
    [string]$DeploymentType = "local"
)

# Set error action preference
$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting SchoolChat deployment..." -ForegroundColor Green

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if required environment variables are set
function Test-EnvironmentVariables {
    Write-Status "Checking environment variables..."
    
    $requiredVars = @(
        "JWT_SECRET",
        "ENCRYPTION_KEY",
        "NEXT_PUBLIC_SUPABASE_URL",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        "SUPABASE_SERVICE_ROLE_KEY",
        "NEXT_PUBLIC_APP_URL"
    )
    
    $missingVars = @()
    
    foreach ($var in $requiredVars) {
        $value = [Environment]::GetEnvironmentVariable($var)
        if ([string]::IsNullOrEmpty($value)) {
            $missingVars += $var
        }
    }
    
    if ($missingVars.Count -gt 0) {
        Write-Error "Missing required environment variables:"
        $missingVars | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
        throw "Missing environment variables"
    }
    
    Write-Status "All required environment variables are set ✓"
}

# Install dependencies
function Install-Dependencies {
    Write-Status "Installing dependencies..."
    npm ci --only=production
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to install dependencies"
    }
    Write-Status "Dependencies installed ✓"
}

# Run security tests
function Test-Security {
    Write-Status "Running security tests..."
    
    try {
        npm run test:security 2>$null
        Write-Status "Security tests passed ✓"
    }
    catch {
        Write-Warning "Security tests not available, running manual security checks..."
        
        # Run our custom security tests
        npx tsx test-security.ts
        if ($LASTEXITCODE -ne 0) {
            throw "Security tests failed!"
        }
        Write-Status "Manual security tests passed ✓"
    }
}

# Build the application
function Build-Application {
    Write-Status "Building application..."
    npm run build
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to build application"
    }
    Write-Status "Application built successfully ✓"
}

# Run health check
function Test-Health {
    Write-Status "Running health check..."
    
    # Start the application in background for health check
    $job = Start-Job -ScriptBlock { npm start }
    
    # Wait for application to start
    Start-Sleep -Seconds 10
    
    try {
        # Check health endpoint
        $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Status "Health check passed ✓"
        }
        else {
            throw "Health check returned status code: $($response.StatusCode)"
        }
    }
    catch {
        Write-Error "Health check failed: $_"
        throw "Health check failed"
    }
    finally {
        # Stop the test instance
        Stop-Job -Job $job -Force
        Remove-Job -Job $job -Force
    }
}

# Deploy with Docker
function Deploy-Docker {
    Write-Status "Deploying with Docker..."
    
    # Check if Docker is available
    try {
        docker --version | Out-Null
    }
    catch {
        throw "Docker is not available. Please install Docker Desktop."
    }
    
    # Build Docker image
    docker build -t schoolchat:latest .
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to build Docker image"
    }
    
    # Stop existing container if running
    docker stop schoolchat 2>$null
    docker rm schoolchat 2>$null
    
    # Run new container
    docker run -d --name schoolchat --restart unless-stopped -p 3000:3000 --env-file .env.production schoolchat:latest
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to start Docker container"
    }
    
    Write-Status "Docker deployment completed ✓"
}

# Deploy with Docker Compose
function Deploy-DockerCompose {
    Write-Status "Deploying with Docker Compose..."
    
    # Check if Docker Compose is available
    try {
        docker-compose --version | Out-Null
    }
    catch {
        throw "Docker Compose is not available. Please install Docker Desktop with Compose."
    }
    
    # Stop existing services
    docker-compose down 2>$null
    
    # Build and start services
    docker-compose up -d --build
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to start services with Docker Compose"
    }
    
    Write-Status "Docker Compose deployment completed ✓"
}

# Main deployment function
function Start-Deployment {
    Write-Status "SchoolChat Deployment Starting..."
    
    # Check if .env.production exists
    if (-not (Test-Path ".env.production")) {
        Write-Error ".env.production file not found!"
        Write-Error "Please create .env.production with your production environment variables."
        throw "Missing .env.production file"
    }
    
    # Load environment variables from .env.production
    Get-Content ".env.production" | ForEach-Object {
        if ($_ -match "^([^#][^=]+)=(.*)$") {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
        }
    }
    
    try {
        # Run deployment steps
        Test-EnvironmentVariables
        Install-Dependencies
        Test-Security
        Build-Application
        
        # Choose deployment method
        switch ($DeploymentType.ToLower()) {
            "docker-compose" {
                Deploy-DockerCompose
            }
            "docker" {
                Deploy-Docker
            }
            default {
                Write-Status "Skipping containerized deployment (use 'docker' or 'docker-compose' parameter)"
                Test-Health
            }
        }
        
        Write-Status "🎉 SchoolChat deployment completed successfully!" 
        $appUrl = [Environment]::GetEnvironmentVariable("NEXT_PUBLIC_APP_URL")
        if ([string]::IsNullOrEmpty($appUrl)) { $appUrl = "http://localhost:3000" }
        Write-Status "Application should be available at: $appUrl"
    }
    catch {
        Write-Error "Deployment failed: $_"
        exit 1
    }
}

# Run main deployment
Start-Deployment
