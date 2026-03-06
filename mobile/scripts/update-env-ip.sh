#!/bin/bash
# Script to automatically update .env file with current IP address
# This script detects your computer's IP and updates the .env file
# Run this before starting Expo, or add it to package.json scripts

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MOBILE_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$MOBILE_DIR/.env"

# Quiet mode flag (for use in npm scripts)
QUIET=false
if [ "$1" = "--quiet" ] || [ "$1" = "-q" ]; then
    QUIET=true
fi

if [ "$QUIET" = false ]; then
    echo "🔍 Auto-detecting your computer's IP address..."
fi

# Try different methods to find IP
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    IP=$(hostname -I | awk '{print $1}' 2>/dev/null || ip route get 1.1.1.1 | awk '{print $7; exit}' 2>/dev/null || ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "msys2" ]]; then
    # Windows (Git Bash, Cygwin, MSYS2) – use ipconfig
    IP=$(ipconfig 2>/dev/null | grep "IPv4" | sed 's/.*: *//' | tr -d '\r' | grep -v '^127\.' | grep -v '^169\.' | head -1)
else
    IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
fi

if [ -z "$IP" ]; then
    echo "❌ Could not automatically detect IP address."
    exit 1
fi

if [ "$QUIET" = false ]; then
    echo "✅ Found IP address: $IP"
    echo ""
fi

# Check if .env file exists
if [ ! -f "$ENV_FILE" ]; then
    if [ "$QUIET" = false ]; then
        echo "📝 Creating .env file..."
    fi
    echo "EXPO_PUBLIC_API_URL=http://$IP:8000" > "$ENV_FILE"
    if [ "$QUIET" = false ]; then
        echo "✅ Created .env file with IP: $IP"
    fi
else
    # Check current IP in .env (ignore commented lines and localhost)
    CURRENT_IP=$(grep "^[^#]*EXPO_PUBLIC_API_URL=" "$ENV_FILE" 2>/dev/null | sed 's/.*http:\/\///' | sed 's/:8000.*//' | grep -v localhost | grep -v 127.0.0.1 | head -1)
    
    if [ "$CURRENT_IP" = "$IP" ]; then
        if [ "$QUIET" = false ]; then
            echo "✅ .env file already has the correct IP: $IP"
            echo "   No changes needed."
        fi
    else
        if [ "$QUIET" = false ]; then
            echo "📝 Updating .env file..."
        fi
        # Backup original
        cp "$ENV_FILE" "$ENV_FILE.bak" 2>/dev/null
        
        # Remove old EXPO_PUBLIC_API_URL lines (including commented ones)
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' '/^[[:space:]]*[#;]*[[:space:]]*EXPO_PUBLIC_API_URL=/d' "$ENV_FILE"
        else
            sed -i '/^[[:space:]]*[#;]*[[:space:]]*EXPO_PUBLIC_API_URL=/d' "$ENV_FILE"
        fi
        
        # Add new line
        echo "EXPO_PUBLIC_API_URL=http://$IP:8000" >> "$ENV_FILE"
        
        if [ "$QUIET" = false ]; then
            if [ -n "$CURRENT_IP" ]; then
                echo "✅ Updated IP from $CURRENT_IP to $IP"
            else
                echo "✅ Set IP to $IP"
            fi
            echo "   Backup saved to: $ENV_FILE.bak"
        fi
    fi
fi

if [ "$QUIET" = false ]; then
    echo ""
    echo "💡 Next steps:"
    echo "   1. Start Expo: npm start"
    echo "   2. Make sure your phone and computer are on the same WiFi"
    echo "   3. Test: Open http://$IP:8000/docs in your phone browser"
fi

# Export IP for use in other scripts
export DETECTED_IP="$IP"

