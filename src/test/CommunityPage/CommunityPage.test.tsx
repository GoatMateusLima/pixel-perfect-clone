import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import React from "react";

/* ═══════════════════════════════════════════════════════════════════════════════
   MOCKS — vi.mock é hoisted, então tudo deve ser inline
   ═══════════════════════════════════════════════════════════════════════════════ */

const mockState = vi.hoisted(() => ({
  lastInsertedDescription: "",
}));

/* ── Supabase ─────────────────────────────────────────────────────────────────── */
vi.mock("../../../utils/supabase.ts", () => {
  const mockPosts = [
    {
      id: "post-1",
      created_at: new Date().toISOString(),
      description: "Conteúdo do Post 1",
      date: new Date().toISOString(),
      midia: "EMPTY",
      creator_id: "user-1",
      liked_by: [],
      profiles: {
        user_id: "user-1",
        name: "Usuário 1",
        perfil: "avatar1.png",
        descricao: "Bio 1",
        bordas: [],
      },
    },
    {
      id: "post-2",
      created_at: new Date().toISOString(),
      description: "Conteúdo do Post 2",
      date: new Date().toISOString(),
      midia: "EMPTY",
      creator_id: "user-2",
      liked_by: [],
      profiles: {
        user_id: "user-2",
        name: "Usuário 2",
        perfil: "avatar2.png",
        descricao: "Bio 2",
        bordas: [],
      },
    },
  ];

  const mockChain: any = {};
  const mocker = () => mockChain;

  Object.assign(mockChain, {
    from: vi.fn().mockImplementation(mocker),
    select: vi.fn().mockImplementation(mocker),
    eq: vi.fn().mockImplementation(mocker),
    order: vi.fn().mockImplementation(mocker),
    limit: vi.fn().mockImplementation(mocker),
    in: vi.fn().mockImplementation(mocker),
    insert: vi.fn().mockImplementation((data: any) => {
      if (data?.description) {
        // @ts-ignore
        mockState.lastInsertedDescription = data.description;
      }
      return mockChain;
    }),
    update: vi.fn().mockImplementation(mocker),
    range: vi.fn().mockResolvedValue({ data: mockPosts, error: null }),
    single: vi.fn().mockImplementation(() => {
      return Promise.resolve({
        data: {
          id: "new-post-123",
          // @ts-ignore
          description: mockState.lastInsertedDescription || "Postagem de teste com texto!",
          date: new Date().toISOString(),
          creator_id: "user-test-123",
          profiles: {
            user_id: "user-test-123",
            name: "Usuário Teste",
            perfil: "avatar.png",
            descricao: "Bio",
            bordas: [],
          },
        },
        error: null,
      });
    }),
    maybeSingle: vi.fn().mockResolvedValue({ data: { name: "Usuário Teste", descricao: "Bio" }, error: null }),
    upsert: vi.fn().mockResolvedValue({ error: null }),
    rpc: vi.fn().mockResolvedValue({ error: null }),
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnValue({ subscribe: vi.fn() }),
    }),
    removeChannel: vi.fn(),
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "https://mock.url/img.png" } }),
      }),
    },
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  });

  return { default: mockChain };
});

/* ── AuthContext ───────────────────────────────────────────────────────────────── */
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: {
      id: "user-test-123",
      email: "teste@upjobs.com",
      user_metadata: { name: "Usuário Teste" },
    },
    session: {
      user: {
        id: "user-test-123",
        email: "teste@upjobs.com",
        user_metadata: { name: "Usuário Teste" },
      },
    },
    loading: false,
    assessment: { discProfile: "S", valorHoraLiquida: 45, completed: true },
    profilePhoto: "https://mock.url/avatar.png",
    updateAssessment: vi.fn(),
    saveAssessmentToDb: vi.fn(),
    refreshPhoto: vi.fn(),
    signOutUser: vi.fn(),
    logout: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

/* ── useModeration ────────────────────────────────────────────────────────────── */
vi.mock("@/hooks/useModeration", () => ({
  useModeration: () => ({
    moderate: vi.fn().mockResolvedValue({ approved: true }),
  }),
}));

/* ── Assets estáticos (imagens DISC) ──────────────────────────────────────────── */
vi.mock("@/assets/disc/Dominancia.webp", () => ({ default: "dominancia.webp" }));
vi.mock("@/assets/disc/Influencia.webp", () => ({ default: "influencia.webp" }));
vi.mock("@/assets/disc/Estabilidade.webp", () => ({ default: "estabilidade.webp" }));
vi.mock("@/assets/disc/Conformidade.webp", () => ({ default: "conformidade.webp" }));

/* ── framer-motion (mock completo com motion.a, motion.div, etc.) ─────────────── */
vi.mock("framer-motion", () => {
  const handler = {
    get(_target: any, prop: string) {
      // Retorna um componente React para qualquer tag: motion.div, motion.a, motion.span...
      return React.forwardRef((props: any, ref: any) => {
        // Remove props que o DOM não reconhece
        const {
          initial, animate, exit, transition, whileHover, whileTap, whileInView,
          whileFocus, whileDrag, layout, layoutId, variants, onAnimationComplete,
          ...domProps
        } = props;
        return React.createElement(prop, { ...domProps, ref });
      });
    },
  };

  return {
    motion: new Proxy({}, handler),
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
    useAnimation: () => ({ start: vi.fn(), stop: vi.fn() }),
    useInView: () => false,
  };
});

/* ── Header ───────────────────────────────────────────────────────────────────── */
vi.mock("@/components/Header", () => ({
  default: () => React.createElement("header", { "data-testid": "header" }, "Header Mock"),
}));

/* ── LeftSidebar ──────────────────────────────────────────────────────────────── */
vi.mock("@/components/LeftSidebar", () => ({
  default: (props: any) =>
    React.createElement("aside", { "data-testid": "left-sidebar" },
      React.createElement("span", { "data-testid": "sidebar-name" }, props.myName),
    ),
}));

/* ── RightSidebar ─────────────────────────────────────────────────────────────── */
vi.mock("@/components/RightSidebar", () => ({
  default: () => React.createElement("aside", { "data-testid": "right-sidebar" }, "Right Sidebar Mock"),
}));

/* ── PostCard ─────────────────────────────────────────────────────────────────── */
vi.mock("@/components/PostCard", () => {
  const PostCard = (props: any) =>
    React.createElement("div", { "data-testid": "post-card" },
      React.createElement("div", { "data-testid": "post-author" }, props.post?.profile?.name),
      React.createElement("div", { "data-testid": "post-description" }, props.post?.description),
    );
  return {
    default: PostCard,
    DISC_IMGS: { D: "d.webp", I: "i.webp", S: "s.webp", C: "c.webp" },
    DISC_COLOR: { D: "red", I: "yellow", S: "green", C: "blue" },
    DISC_LABEL: { D: "Dominância", I: "Influência", S: "Estabilidade", C: "Conformidade" },
    formatRelativeTime: () => "há 1min",
    toInitials: (name?: string) => (name ?? "??").slice(0, 2).toUpperCase(),
    UserAvatar: () => React.createElement("div", { "data-testid": "user-avatar" }),
  };
});

/* ── PostModal ────────────────────────────────────────────────────────────────── */
vi.mock("@/components/PostModal", () => ({
  default: () => React.createElement("div", { "data-testid": "post-modal" }, "Modal Mock"),
}));

/* ── PostMedia ────────────────────────────────────────────────────────────────── */
vi.mock("@/components/PostMedia", () => ({
  default: () => React.createElement("div", { "data-testid": "post-media" }),
}));

/* ── GifPicker ────────────────────────────────────────────────────────────────── */
vi.mock("@/components/GifPicker", () => ({
  default: () => React.createElement("div", { "data-testid": "gif-picker" }),
}));

/* ═══════════════════════════════════════════════════════════════════════════════
   IMPORT DO COMPONENTE (após os mocks)
   ═══════════════════════════════════════════════════════════════════════════════ */

import CommunityPage from "@/pages/CommunityPage (2)";

/* ── Helper de renderização ───────────────────────────────────────────────────── */

function renderCommunityPage() {
  return render(
    React.createElement(
      MemoryRouter,
      { initialEntries: ["/comunidade"] },
      React.createElement(CommunityPage),
    ),
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   TESTES — Testar criação de postagem na pagina da Comunidade
   ═══════════════════════════════════════════════════════════════════════════════ */

describe("Testar criação de postagem na pagina da Comunidade", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── IT 1 — Exploratório: Página Comunidade Carregada ──────────────────────
  it("Pagina Comunidade Carregada", async () => {
    renderCommunityPage();

    // 1. O título "Comunidade" deve estar visível
    expect(screen.getByText("Comunidade")).toBeInTheDocument();

    // 2. A descrição da página deve aparecer
    expect(
      screen.getByText(/Compartilhe conquistas, dicas e insights com a rede UpJobs/),
    ).toBeInTheDocument();

    // 3. O Header deve ter sido renderizado
    expect(screen.getByTestId("header")).toBeInTheDocument();

    // 4. O componente de criação de post deve estar presente
    // (Agora que não estamos mais mockando o CreatePost, procuramos pelo conteúdo real dele)
    expect(screen.getByText("No que você está pensando?")).toBeInTheDocument();

    // 5. Os filtros "Recentes" e "Populares" devem estar na página
    expect(screen.getByText(/Recentes/)).toBeInTheDocument();
    expect(screen.getByText(/Populares/)).toBeInTheDocument();

    // 6. As badges de estatística devem aparecer (membros, online, etc.)
    expect(screen.getByText("2.4k membros")).toBeInTheDocument();
    expect(screen.getByText("94 online")).toBeInTheDocument();
    expect(screen.getByText("↑ 18% hoje")).toBeInTheDocument();

    // 7. Aguarda o estado de loading finalizar
    await waitFor(() => {
      const postCards = screen.queryAllByTestId("post-card");
      expect(postCards.length).toBeGreaterThan(0);
    });
  });

  // ── IT 2 — Mostrar as postagens mais recentes, exploratorio ────────────────
  it("Mostrar as postagens mais recentes, exploratorio", async () => {
    renderCommunityPage();

    // 1. Aguarda as postagens aparecerem no feed
    await waitFor(() => {
      const postCards = screen.getAllByTestId("post-card");
      expect(postCards.length).toBeGreaterThan(0);
    });

    // 2. Verifica se o conteúdo mockado apareceu
    expect(screen.getByText("Conteúdo do Post 1")).toBeInTheDocument();
    expect(screen.getByText("Conteúdo do Post 2")).toBeInTheDocument();
  });

  // ── IT 3 — Abrir PopUp de criar postagem, exploratorio ────────────────
  it("Abrir PopUp de criar postagem, exploratorio", async () => {
    renderCommunityPage();

    // 1. O formulário deve começar em estado contraído (apenas o botão "No que você está pensando?")
    const previewButton = screen.getByText("No que você está pensando?");
    expect(previewButton).toBeInTheDocument();

    // 2. Clica no botão para expandir
    fireEvent.click(previewButton);

    // 3. Verifica se o textarea apareceu
    const textarea = screen.getByPlaceholderText(/Compartilhe um insight/);
    expect(textarea).toBeInTheDocument();

    // 4. Verifica se as opções de mídia (Imagem, Vídeo, GIF) aparecem
    expect(screen.getByTitle("Adicionar imagem")).toBeInTheDocument();
    expect(screen.getByTitle("Adicionar vídeo")).toBeInTheDocument();
    expect(screen.getByTitle("Adicionar GIF")).toBeInTheDocument();
    
    // 5. Verifica botões Cancelar e Publicar
    expect(screen.getByText("Cancelar")).toBeInTheDocument();
    expect(screen.getByText("Publicar")).toBeInTheDocument();
  });

  // ── IT 4 — Aceitar conteudo Texto, Video, Imagens, teste de funcional ────────
  it("Aceitar conteudo Texto, Video, Imagens, teste de funcional", async () => {
    renderCommunityPage();

    // 1. Aguarda feed inicial (evita conflitos de renderização assíncrona)
    await waitFor(() => expect(screen.getAllByTestId("post-card").length).toBeGreaterThan(0));

    // 2. Abre o formulário e preenche texto
    fireEvent.click(screen.getByText("No que você está pensando?"));
    const textarea = screen.getByPlaceholderText(/Compartilhe um insight/);
    fireEvent.change(textarea, { target: { value: "Postagem de teste com texto!" } });

    // 3. Publicar
    fireEvent.click(screen.getByText("Publicar"));

    // 4. Pós-condição: aparecer o card com sua postagem em cima das outras
    await waitFor(() => {
      const postCards = screen.getAllByTestId("post-card");
      const firstCard = postCards[0];
      
      // Verifica conteúdo
      expect(firstCard).toHaveTextContent("Postagem de teste com texto!");
      
      // Verifica se o autor é o usuário logado (definido no mock useAuth como "Usuário Teste")
      const author = firstCard.querySelector('[data-testid="post-author"]');
      expect(author).toHaveTextContent("Usuário Teste");
    });
  });

  // ── IT 5 — Enviar a Postagem, teste de confirmação ────────────────────────
  it("Enviar a Postagem, teste de confirmação", async () => {
    renderCommunityPage();

    // 1. Aguarda feed inicial
    await waitFor(() => expect(screen.getAllByTestId("post-card").length).toBeGreaterThan(0));

    // 2. Abre e preenche
    fireEvent.click(screen.getByText("No que você está pensando?"));
    const textarea = screen.getByPlaceholderText(/Compartilhe um insight/);
    fireEvent.change(textarea, { target: { value: "Post de confirmação" } });

    // 3. Clica em publicar
    fireEvent.click(screen.getByText("Publicar"));

    // 4. Teste de confirmação: O formulário deve "limpar" e "fechar" (voltar ao estado inicial)
    await waitFor(() => {
      // O textarea deve sumir
      expect(screen.queryByPlaceholderText(/Compartilhe um insight/)).not.toBeInTheDocument();
      // O botão inicial deve voltar a aparecer
      expect(screen.getByText("No que você está pensando?")).toBeInTheDocument();
    });

    // 5. Confirma que a postagem realmente apareceu no feed
    expect(screen.getByText("Post de confirmação")).toBeInTheDocument();
  });

  // ── IT 6 — Aparecer sua postagem como a mais recente, Exploratório ─────────
  it("Aparecer sua postagem como a mais recente, Exploratório", async () => {
    renderCommunityPage();

    // 1. Aguarda feed inicial
    await waitFor(() => expect(screen.getAllByTestId("post-card").length).toBeGreaterThan(0));

    // 2. Cria postagem exploratória
    fireEvent.click(screen.getByText("No que você está pensando?"));
    fireEvent.change(screen.getByPlaceholderText(/Compartilhe um insight/), { 
      target: { value: "Postagem mais recente no topo!" } 
    });
    fireEvent.click(screen.getByText("Publicar"));

    // 3. Verifica se a postagem está na primeira posição (topo do feed)
    await waitFor(() => {
      const postCards = screen.getAllByTestId("post-card");
      
      // O primeiro elemento do array de postCards deve ser o novo post ("most recent")
      expect(postCards[0]).toHaveTextContent("Postagem mais recente no topo!");
      
      // O segundo elemento deve ser um dos posts mockados inicialmente
      expect(postCards[1]).toHaveTextContent("Conteúdo do Post 1");
    });
  });
});





