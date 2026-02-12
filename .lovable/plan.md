

## Roadmap Animado - Melhorias de Interatividade e Personagem

### Mudancas planejadas no `RoadmapSection.tsx`:

**1. Personagem detalhado substituindo o pin generico**
- Substituir o icone `MapPin` por um avatar SVG inline de um astronauta/explorador pixel-art estilizado, com animacao de "caminhada" (alternando entre dois frames via keyframe CSS)
- O personagem tera um trail/rastro luminoso atras dele conforme avanca

**2. Interatividade nos nodes do roadmap**
- Cada node (etapa) sera clicavel e expandira um tooltip/popover com descricao detalhada da etapa
- Nodes completos terao um efeito de pulso sutil; nodes bloqueados terao um efeito de "static/glitch"
- Hover nos nodes mostrara um brilho mais intenso e escala aumentada

**3. Controle do usuario sobre a animacao**
- Adicionar um botao "Replay" para o usuario poder reassistir a animacao do caminho
- A animacao do personagem acompanhara o progresso do path SVG de forma sincronizada

**4. Efeitos visuais extras**
- Particulas pequenas (pontos luminosos) ao longo do caminho usando framer-motion
- Linhas de conexao entre o node ativo e o texto descritivo lateral
- Progress bar sutil abaixo do roadmap mostrando "3 de 6 etapas completas"

### Detalhes tecnicos

- Tudo implementado em `src/components/RoadmapSection.tsx` usando `framer-motion` (ja instalado) e CSS/Tailwind
- O personagem sera um SVG inline com dois estados animados via CSS keyframes (sem dependencias novas)
- Tooltips nos nodes usarao o componente `Tooltip` do Radix UI (ja disponivel)
- Estado de "replay" controlado com `useState` + key reset no container animado
- Particulas serao `motion.div` com posicoes absolutas ao longo do path, animadas com delay escalonado

