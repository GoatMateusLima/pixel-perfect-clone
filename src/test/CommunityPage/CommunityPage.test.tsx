import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
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
      if (data && typeof data === "object" && "description" in data) {
        mockState.lastInsertedDescription = String(data.description);
      }
      return mockChain;
    }),
    update: vi.fn().mockImplementation(mocker),
    range: vi.fn().mockResolvedValue({ data: mockPosts, error: null }),
    single: vi.fn().mockImplementation(() => {
      return Promise.resolve({
        data: {
          id: "new-post-123",
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
      return React.forwardRef((props: any, ref: any) => {
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

/* ── Mocks de Componentes ─────────────────────────────────────────────────────── */
vi.mock("@/components/Header", () => ({
  default: () => <header data-testid="header">Header Mock</header>,
}));

vi.mock("@/components/LeftSidebar", () => ({
  default: (props: any) => (
    <aside data-testid="left-sidebar">
      <span data-testid="sidebar-name">{props.myName}</span>
    </aside>
  ),
}));

vi.mock("@/components/RightSidebar", () => ({
  default: () => <aside data-testid="right-sidebar">Right Sidebar Mock</aside>,
}));

vi.mock("@/components/PostCard", () => {
  const PostCard = (props: any) => (
    <div data-testid="post-card">
      <div data-testid="post-author">{props.post?.profiles?.name}</div>
      <div data-testid="post-description">{props.post?.description}</div>
    </div>
  );
  return {
    default: PostCard,
    DISC_IMGS: { D: "d.webp", I: "i.webp", S: "s.webp", C: "c.webp" },
    DISC_COLOR: { D: "red", I: "yellow", S: "green", C: "blue" },
    DISC_LABEL: { D: "Dominância", I: "Influência", S: "Estabilidade", C: "Conformidade" },
    formatRelativeTime: () => "há 1min",
    toInitials: (name?: string) => (name ?? "??").slice(0, 2).toUpperCase(),
    UserAvatar: () => <div data-testid="user-avatar" />,
  };
});

vi.mock("@/components/PostModal", () => ({
  default: () => <div data-testid="post-modal">Modal Mock</div>,
}));

vi.mock("@/components/PostMedia", () => ({
  default: () => <div data-testid="post-media" />,
}));

vi.mock("@/components/GifPicker", () => ({
  default: () => <div data-testid="gif-picker" />,
}));

/* ═══════════════════════════════════════════════════════════════════════════════
   IMPORT DO COMPONENTE (após os mocks)
   ═══════════════════════════════════════════════════════════════════════════════ */

import CommunityPage from "@/pages/CommunityPage (2)";

/* ── Helper de renderização ───────────────────────────────────────────────────── */

function renderCommunityPage() {
  return render(
    <MemoryRouter initialEntries={["/comunidade"]}>
      <CommunityPage />
    </MemoryRouter>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   TESTES — Testar criação de postagem na pagina da Comunidade
   ═══════════════════════════════════════════════════════════════════════════════ */

describe("Testar criação de postagem na pagina da Comunidade", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.lastInsertedDescription = "";
  });

  it("Pagina Comunidade Carregada", async () => {
    renderCommunityPage();
    expect(screen.getByText("Comunidade")).toBeInTheDocument();
    expect(screen.getByText(/Compartilhe conquistas, dicas e insights/)).toBeInTheDocument();
    expect(screen.getByTestId("header")).toBeInTheDocument();
    expect(screen.getByText("No que você está pensando?")).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.queryAllByTestId("post-card").length).toBeGreaterThan(0);
    });
  });

  it("Mostrar as postagens mais recentes, exploratorio", async () => {
    renderCommunityPage();
    await waitFor(() => {
      expect(screen.getAllByTestId("post-card").length).toBeGreaterThan(0);
    });
    expect(screen.getByText("Conteúdo do Post 1")).toBeInTheDocument();
    expect(screen.getByText("Conteúdo do Post 2")).toBeInTheDocument();
  });

  it("Abrir PopUp de criar postagem, exploratorio", async () => {
    renderCommunityPage();
    fireEvent.click(screen.getByText("No que você está pensando?"));
    expect(screen.getByPlaceholderText(/Compartilhe um insight/)).toBeInTheDocument();
    expect(screen.getByTitle("Adicionar imagem")).toBeInTheDocument();
    expect(screen.getByText("Publicar")).toBeInTheDocument();
  });

  it("Aceitar conteudo Texto, Video, Imagens, teste de funcional", async () => {
    renderCommunityPage();
    await waitFor(() => expect(screen.getAllByTestId("post-card").length).toBeGreaterThan(0));

    fireEvent.click(screen.getByText("No que você está pensando?"));
    fireEvent.change(screen.getByPlaceholderText(/Compartilhe um insight/), { 
      target: { value: "Postagem de teste com texto!" } 
    });

    await act(async () => {
      fireEvent.click(screen.getByText("Publicar"));
    });

    await waitFor(() => {
      const cards = screen.getAllByTestId("post-card");
      expect(cards[0]).toHaveTextContent("Postagem de teste com texto!");
    });
  });

  it("Enviar a Postagem, teste de confirmação", async () => {
    renderCommunityPage();
    await waitFor(() => expect(screen.getAllByTestId("post-card").length).toBeGreaterThan(0));

    fireEvent.click(screen.getByText("No que você está pensando?"));
    fireEvent.change(screen.getByPlaceholderText(/Compartilhe um insight/), { 
      target: { value: "Post de confirmação" } 
    });

    await act(async () => {
      fireEvent.click(screen.getByText("Publicar"));
    });

    await waitFor(() => {
      expect(screen.queryByPlaceholderText(/Compartilhe um insight/)).not.toBeInTheDocument();
      expect(screen.getByText("No que você está pensando?")).toBeInTheDocument();
    });
    expect(screen.getByText("Post de confirmação")).toBeInTheDocument();
  });

  it("Aparecer sua postagem como a mais recente, Exploratório", async () => {
    renderCommunityPage();
    await waitFor(() => expect(screen.getAllByTestId("post-card").length).toBeGreaterThan(0));

    fireEvent.click(screen.getByText("No que você está pensando?"));
    fireEvent.change(screen.getByPlaceholderText(/Compartilhe um insight/), { 
      target: { value: "Postagem mais recente no topo!" } 
    });

    await act(async () => {
      fireEvent.click(screen.getByText("Publicar"));
    });

    await waitFor(() => {
      const postCards = screen.getAllByTestId("post-card");
      expect(postCards[0]).toHaveTextContent("Postagem mais recente no topo!");
      expect(postCards[1]).toHaveTextContent("Conteúdo do Post 1");
    });
  });
});
