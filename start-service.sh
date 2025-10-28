#!/bin/bash
# Auto-generated start script for ff-orgn-6700

cd "$(dirname "$0")"

# Force webpack for compatibility if Next.js 16
if grep -q '"next": ".*16\.' package.json; then
    echo "Starting ff-orgn-6700 with webpack (Next.js 16)..."
    npm run dev -- --webpack
else
    echo "Starting ff-orgn-6700..."
    npm run dev
fi
