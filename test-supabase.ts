import { createClient } from '@supabase/supabase-js';

async function testSupabaseConnection() {
  console.log('🔍 Verificando variáveis de ambiente...\n');

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL não está definida');
  } else {
    console.log('✅ NEXT_PUBLIC_SUPABASE_URL:', url);
  }

  if (!key) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY não está definida');
  } else {
    console.log('✅ NEXT_PUBLIC_SUPABASE_ANON_KEY: [Configurada]');
  }

  if (!url || !key) {
    console.error('\n⚠️  Credenciais do Supabase não configuradas!');
    console.log('\nPor favor, crie um arquivo .env.local com:');
    console.log('NEXT_PUBLIC_SUPABASE_URL=sua_url_aqui');
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_aqui');
    process.exit(1);
  }

  try {
    console.log('\n🔗 Tentando conectar ao Supabase...');
    const supabase = createClient(url, key);
    
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Erro ao conectar:', error.message);
      process.exit(1);
    }

    console.log('✅ Conexão com Supabase estabelecida com sucesso!');
    console.log('📊 Sessão atual:', data.session ? 'Autenticado' : 'Não autenticado');
    
  } catch (err) {
    console.error('❌ Erro durante a conexão:', err);
    process.exit(1);
  }
}

testSupabaseConnection();
