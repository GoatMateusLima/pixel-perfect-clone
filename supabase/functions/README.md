# Edge Function `api-proxy`

Centraliza chamadas a **Groq**, **YouTube** e **Klipy** com segredos só no servidor (secrets do Supabase).

## Deploy

```bash
supabase login
supabase link --project-ref SEU_PROJECT_REF
supabase secrets set GROQ_API_KEY=gsk_...
supabase secrets set YOUTUBE_API_KEY=...
supabase secrets set KLIPY_API_KEY=...
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...   # necessário para admin_quiz_insert
supabase functions deploy api-proxy --no-verify-jwt false
```

`SUPABASE_URL` e `SUPABASE_ANON_KEY` são injetados automaticamente na função.

## Ações (`body.action`)

| Action | Payload | Uso |
|--------|---------|-----|
| `chat` | `model`, `messages`, `temperature` | Tutor / Orion |
| `moderate_text` | `text` | Moderação |
| `moderate_vision` | `base64`, `mimeType`, `extraText?` | Imagem/GIF |
| `quiz_tab` | `prompt` | QuizTab |
| `admin_quiz_insert` | `aulaId`, `aulaNome`, `aulaDesc` | Só `profiles.role = admin` |
| `youtube_playlist` | `playlistId`, `pageToken?` | Playlist Admin |
| `klipy_gifs` | `q`, `featured`, `pos?` | GIF picker |

O cliente chama `supabase.functions.invoke('api-proxy', { body: { action, ... } })` com JWT do usuário.
