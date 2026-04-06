-- Templates de referência para RLS (ajuste nomes de colunas/tabelas ao schema real).
-- Aplicar no SQL Editor do Supabase após revisão; testar com JWT de usuário comum e admin.

-- Exemplo: profiles — leitura do próprio registro; atualização só do dono
-- CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = user_id);
-- CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = user_id);

-- Exemplo: coluna role — operações admin só via Edge Function com service role ou RPC security definer
-- CREATE POLICY "profiles_admin_read" ON profiles FOR SELECT USING (
--   EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin')
-- );

-- lesson_progress — insert/update só para o próprio user_id
-- CREATE POLICY "lesson_progress_own" ON lesson_progress FOR ALL USING (auth.uid() = user_id);

-- publications / amizades / watch / quizzes — repetir padrão: USING (auth.uid() = ...) ou joins seguros

-- Storage: buckets com path contendo auth.uid()::text; negar listagem pública se não for necessário
