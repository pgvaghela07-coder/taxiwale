#!/bin/bash

echo "Starting Tripeaz Taxi Partners Dashboard Server..."
echo ""

# Check if Node.js is installed
if command -v node &> /dev/null; then
    echo "Using Node.js server..."
    node frontend/server.js
elif command -v python3 &> /dev/null; then
    echo "Using Python 3 server..."
    echo "Server running at http://localhost:8000"
    echo "Press Ctrl+C to stop the server"
    python3 -m http.server 8000
elif command -v python &> /dev/null; then
    echo "Using Python server..."
    echo "Server running at http://localhost:8000"
    echo "Press Ctrl+C to stop the server"
    python -m http.server 8000
else
    echo "Error: Neither Node.js nor Python is installed."
    echo "Please install Node.js from https://nodejs.org/ or Python from https://www.python.org/"
    exit 1
fi


