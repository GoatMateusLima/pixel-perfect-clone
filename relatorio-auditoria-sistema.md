# ⚔️ AUDITORIA DE SEGURANÇA E RED TEAM + ⚡ ENGENHARIA DE PERFORMANCE

> MENTALIDADE ZERO TRUST: Todo input é maligno. Front-end não existe. Performance lenta mata produtos.

---

## 1. 🔴 VULNERABILIDADES CRÍTICAS (Corrige Hoje)

### 1.1 Upload de Arquivo sem Validação MIME Real (RCE/Malware)
**Local:** `src/pages/ProfilePage.tsx` e `src/components/CreatePost.tsx`
**Problema atual:** No Supabase Storage, o upload utiliza o parâmetro `contentType: mediaFile.type` advindo diretamente do client-side na API e não há verificação binária do payload.
**Exploração (Red Team):** Um atacante logado (Authentication + Bypass) intercepta a requisição via Burp Suite, troca a carga binária por um script ou payload executável genérico encadeado a uma imagem `.png` em Base64 e força o Header de imagem. O Back-end não filtra a assinatura do arquivo. Se a CDN / storage entregar este payload e houver um exploit vetorial (como XSS cego), a exploração será direta (Stored). Se alguém abrir, há risco de infecção cruzada de sessão.
**Impacto:** Remote Code Execution (RCE) se existir um vetor de exploração backend, e Blind/Stored XSS de alta gravidade. Roubo imediato de Sessão para usuários administrativos.
**Solução Prática:**
- **Storage Filters (backend):** O Supabase Storage deve validar mime types e tamanhos **via Check constraint e Policies do Row Level Security**, e nunca confiar na tipagem do FormData do react.
```sql
CREATE POLICY "Apenas Imagens e Videos Reais"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'ComunityPost' AND 
  (mimetype = 'image/jpeg' OR mimetype = 'image/png' OR mimetype = 'image/webp' OR mimetype LIKE 'video/%')
);
```

### 1.2 Rate Limiting Inexistente no Edge Function Proxy (Denial of Wallet)
**Local:** `supabase/functions/api-proxy/index.ts`
**Problema atual:** A API Serverless Deno invoca as chaves da Groq, Youtube e Klipy. Um invasor só precisa ter um JWT autêntico qualquer do seu Supabase (`auth.getUser()` retornará OK) para floodar as integrações conectadas em loop.
**Impacto:** Gastos financeiros avassaladores da nuvem (Denial of Wallet). O limite de chamadas será ditado por quão rápido a rede do atacante consegue esgotar a própria Groq e Vercel, o que arruinará seu billing em poucas horas ou causará suspensão por abuso nas parceiras (Groq rate throttles limits).
**Solução Prática:** 
- Adicionar Rate-Limit agressivo baseado no IP ou ID de sessão usando Upstash (Redis) restrito dentro das Edge Functions.
- Exemplo: Max 30 tokens request por minuto por Host.

### 1.3 `dangerouslySetInnerHTML` e Configurações Soltas de Segurança no DOM
**Local:** `src/components/ui/chart.tsx` (linha ~70).
**Problema atual:** Inserção direta de HTML no DOM com `dangerouslySetInnerHTML`.
**Impacto:** Stored DOM-XSS. Qualquer inserção cruzada não purificada vai gerar a execução do ataque JavaScript Client-Side sobre a conta alheia que o abrir.
**Solução:** Sempre que for obrigado a expor innerHTML purifique os dados com `DOMPurify.sanitize(input)` ou escape stracts (`he.encode()`).

---

## 2. 🟠 VULNERABILIDADES MODERADAS

### 2.1 Persistência de Tokens (Vetor XSS para Account Takeover)
**Local:** O sistema depende do comportamento padrão local do client JS do Supabase para persistir acesso JWT, além do uso excessivo de `localStorage` para estados e assessment.
**Riscos Potenciais:** Qualquer sucesso num XSS trivial ou comprometimento do CDN de bibliotecas JS que você utiliza garantirá ao hacker as chaves API e os tokens do usuário da instância comprometida para bypassar Auth2.0.
**Solução Prática:** Alternar para a arquitetura de **Server-side Rendering Auth Cookies HttpOnly + Secure**. O token não existirá no objeto do navegador. Até isso ocorrer, force um **Content Security Policy** (CSP) duro em seu proxy reverso que desabilite avaliações impensadas: `<meta http-equiv="Content-Security-Policy" content="script-src 'self' 'unsafe-inline' https://dominio-do-supabase.io; object-src 'none';"/>`.

### 2.2 RLS Frouxo Baseado Exclusivamente na Suposição do UID (Insecure Direct Object Reference - IDOR)
**Ref:** Arquitetura do `docs/supabase_rls_templates.sql` baseia tudo em `auth.uid() = user_id`.
**Problema:** Se os Endpoints expuserem colunas como IDs num POST manual, ou pior: se for criar chats, mensagens privadas, amizades diretas alterando o ID no frontend `supabase.from('mensagens').insert({receiver: x, ...})`.
Se a Policy for somente `sender=auth.uid()`, nada impede que o cara envie mensagens e span de notificações para um usuário oculto/bloqueado modificando o pacote na rede.
**Solução Prática (Controle Vertical/Horizontal Rigído):**
Valide relacionamentos implicitamente no banco!
```sql
CREATE POLICY "Insere MSG Apenas de Amigos" ON messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND 
  EXISTS(SELECT 1 FROM amizades WHERE status='accepted' AND ((user1=auth.uid() AND user2=receiver_id) OR (user2=auth.uid() AND user1=receiver_id)))
);
```

---

## 3. ⚡ PERFORMANCE: OTIMIZAÇÃO DE ENGENHARIA (N+1 / Gargalos Reais)

### 3.1 N+1 Query Problem Disfarçado de Frontend Batching (Latência)
**Local:** Em lugares como `CommunityPage.tsx` na busca híbrida e `PostModal.tsx`, as chamadas operam pedindo as "Postagens/Comentarios" -> Coletam o Set de "user_ids" por Javascript -> Deslancham OUTRA Query no banco usando `IN(ids)`.
**O Gargalo:** Para um servidor Supabase nos EUA recebendo as queries do Brasil, isso aumenta o Round Trip Time (RTT) drasticamente por ter que renderizar requests de Ida-Volta. 
**Ação Imediata:** Configure Corretamente as Constraints de Foreign Key. `comments.user_id -> profiles`. Mudar tudo no frontend para Joins e Subqueries:
`supabase.from('comments').select('*, profiles!comments_user_id_fkey(*)')`. 1 chamada REST unificada com plano GIN otimizado no Postgres. Adeus N+1.

### 3.2 O Colapso das Múltiplas Subscriptions de Broadcast Realtime
**Local:** Componentes do Chat como o `MessengerWidget.tsx` usam instâncias e Effect Listeners que em algumas transições/falhas podem causar Memory Leak e Re-render Thrashing.
**Impacto:** Redução crítica das memórias ram no celular do usuário (Lag pesado ou fechamento de abas), WebSockets não matando as instâncias desapensadas, poluindo sua infra com Conexões inativas custosas e exaurindo max concurrences limits do tier.
**Solução:** Abster de listeners amplos com `*`. Use Filters, Debounces apurados (como feito com o debounce do typing). Desmonte todo listener no clean-up do `useEffect`. Mova as subscriptions de notificação unificada para um Context Singleton ou Worker ao longo do App.

### 3.3 Apocalipse CPU com Pesquisa de Full-text (`ILike`)
**Local:** O Filtro Local/Busca em `CommunityPage.tsx` usando `.ilike('description', '%'+tagFilter+'%')`.
**Impacto:** Realizar `ilike '%search%'` na description irá disparar o motor do PostgreSQL à caça em Força Bruta por texto em "Full Sequential Scans". Em milhões de inserts é o modo mais letal de engargalar query IOs, travando DB Inteiro.
**Solução (Faça hoje!):** Indexação Tri-gram GIN. Execute no Backend do Supabase Query Editor:
```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX CONCURRENTLY idx_publications_description_trgm ON publications USING GIN (description gin_trgm_ops);
CREATE INDEX CONCURRENTLY idx_comments_text_trgm ON comments USING GIN (comment gin_trgm_ops);
```

### 3.4 Request Waterfalls Síncronas Paralizadoras
**Problema:** Múltiplas funções em App/AuthContext e em Modais usando `await ...` para em seguida outro `await ...`. Elas formam filhotes em vez de operarem assincronas juntas, bloqueando Render Path. (First Paint Blockers).
**Correção Prática:** Identifique todo bloco de query que não seja obrigatoriamente sequencial e paralelize com `Promise.all([queryX, queryY])`.

---

## 📌 ORDEM REALÍSTICA DE REVISÃO E EXECUÇÃO ("GET SHIT DONE")

1. **[BANCO - HOJE]** Rode as extensões `GIN (pg_trgm)` antes que a busca exploda os recursos pela performance linear bruta da pesquisa atual. (Performance Server Crash)
2. **[RED TEAM EDGE - HOJE]** Proteja Edge Functions Groq/AI de flood implementando restrições de limites antes que vazem limites financeiros!
3. **[STORAGE BACK-END]** Bloqueie Policies de injeção direta de Arquivos/Malware com o Check da extensão nos buckets RLS para desarmar brechas RCE e blindar Storage Public URLs.
4. **[Front-end Cleanup]** Varra e corrija os pseudo-joins baseados em JS substituindo pelo `profiles!` do próprio driver supabase-js assim aliviando Request-waterfalls.
5. **[Segurança]** Ative Server-Header CSP restrito. Reveja Lógica RLS para bloquear inserção de chats fantasmas (IDOR).
