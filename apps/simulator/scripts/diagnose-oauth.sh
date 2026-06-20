#!/bin/bash
# Script para diagnosticar problemas de autenticação OAuth

echo "========================================"
echo "Diagnóstico de Autenticação OAuth"
echo "========================================"
echo ""

echo "📋 Verificando arquivo .env.local..."
if [ -f .env.local ]; then
  echo "✅ .env.local encontrado"
  
  if grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.local; then
    SUPABASE_URL=$(grep NEXT_PUBLIC_SUPABASE_URL .env.local | cut -d '=' -f2)
    echo "   SUPABASE_URL: $SUPABASE_URL"
  fi
  
  if grep -q "NEXT_PUBLIC_SITE_URL" .env.local; then
    SITE_URL=$(grep NEXT_PUBLIC_SITE_URL .env.local | cut -d '=' -f2)
    echo "   SITE_URL: $SITE_URL"
    echo "   ✅ URL de callback será: $SITE_URL/auth/callback"
  else
    echo "   ❌ NEXT_PUBLIC_SITE_URL não encontrada!"
  fi
else
  echo "❌ .env.local não encontrado"
fi

echo ""
echo "🔧 Próximos passos:"
echo "1. Abra https://app.supabase.com"
echo "2. Vá para Authentication > URL Configuration"
echo "3. Adicione estas URLs em 'Redirect URLs':"
echo "   - http://localhost:3000/auth/callback"
echo "   - https://csa-adaptive-simulator.vercel.app/auth/callback"
echo "4. Clique em 'Save'"
echo ""
echo "💡 Para verificar a configuração via API:"
echo "   npm run dev"
echo "   # Abra: http://localhost:3000/api/debug/auth-config"
