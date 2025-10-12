#!/bin/bash
# Fix critical TypeScript errors in mobile app

echo "🔧 Fixing Mobile App TypeScript Errors"
echo "======================================"

# Fix WorkerDashboardScreen props
echo "1. Fixing WorkerDashboardScreen props..."
sed -i '' 's/export interface WorkerDashboardScreenProps {}/export interface WorkerDashboardScreenProps {\n  userId: string;\n  userName: string;\n  onLogout: () => void;\n}/' apps/mobile-rn/src/screens/WorkerDashboardScreen.tsx || echo "  WorkerDashboardScreen already fixed or not found"

# Fix ClientDashboardScreen props
echo "2. Fixing ClientDashboardScreen props..."
sed -i '' 's/export interface ClientDashboardScreenProps {}/export interface ClientDashboardScreenProps {\n  userId: string;\n  userName: string;\n  onLogout: () => void;\n}/' apps/mobile-rn/src/screens/ClientDashboardScreen.tsx || echo "  ClientDashboardScreen already fixed or not found"

# Fix AdminDashboardScreen props
echo "3. Fixing AdminDashboardScreen props..."
sed -i '' 's/export interface AdminDashboardScreenProps {}/export interface AdminDashboardScreenProps {\n  userId: string;\n  userName: string;\n  onLogout: () => void;\n}/' apps/mobile-rn/src/screens/AdminDashboardScreen.tsx || echo "  AdminDashboardScreen already fixed or not found"

echo ""
echo "✅ Mobile app type fixes complete!"
echo "Run 'yarn tsc --noEmit' to verify remaining errors"
