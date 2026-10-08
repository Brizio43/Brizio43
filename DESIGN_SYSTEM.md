# Design system — Quiz Estudo

Versão 1.2. Referência visual: `design-system.html`. Tokens: `tokens.css`. Componentes compartilhados com o app: `style.css`. A página de referência não altera quizzes ou dados do usuário.

## Direção

Uma interface calma, legível e acolhedora para criar questões e aprender com os resultados. Azul (#2455DB) orienta ações e estrutura a interface; laranja (#EE7B2C) destaca progresso e aprendizado. Use texto escuro sobre laranja claro para preservar legibilidade. Priorize conteúdo sobre decoração e mantenha uma ação principal em cada grupo.

## Tokens

Use variáveis semânticas, evitando cores literais em componentes novos. `--color-primary` indica ação; `--color-text` e `--color-muted` definem hierarquia; `--color-success` e `--color-danger` representam resultados. Superfícies usam `--color-surface` sobre `--color-canvas`. `--color-control-border` delimita campos; não use a borda sutil de cards em controles interativos.

Manrope para títulos; DM Sans para corpo e controles. Ambas têm fallback system-ui. A aplicação continua utilizável se as fontes externas não carregarem. Escala de espaços: 4, 8, 12, 16, 20, 24, 32, 40 e 48 px. Raios: 8, 10, 14, 24 e 36 px. Use `--layout-reading` para fluxos de perguntas e `--layout-wide` para a biblioteca.

## Componentes

| Componente | API CSS | Uso |
| --- | --- | --- |
| Botão primário | `button`, `.button` para links | Salvar, confirmar, avançar |
| Botão secundário | `.secondary` | Editar, adicionar, voltar |
| Ação destrutiva | `.danger` | Excluir com confirmação |
| Card | `.card` | Um quiz, metadados e ações |
| Painel | `.panel` | Formulário ou questão |
| Badge | `.badge` | Tema ou matéria |
| Alternativa | `.choice` + `.selected`, `.correct`, `.wrong` | Seleção e correção |
| Feedback | `.feedback` | Resultado com explicação |
| Aviso | `.notice` | Informação contextual |
| Erro | `.error` + `aria-invalid` no campo | Descrever problema e correção |
| Dica | `.hint-button`, `.notice` + aria-expanded/aria-controls | Ajuda contextual sem perder a resposta |
| Resposta escrita | `#written-answer` (input ou textarea) | Lacuna e exercício descritivo |
| Progresso | `.progress` com elemento filho | Andamento com atributos ARIA |

Use elementos nativos: button para ações, a para navegação, label associado ao campo. Botões desativados usam disabled real. Alternativas selecionadas usam aria-pressed. As alternativas corretas e incorretas preservam sua indicação visual mesmo quando disabled.

## Estados e acessibilidade

Todos os controles possuem foco de 3 px com afastamento de 3 px. Ações usam altura mínima de 44 px. Campos inválidos precisam de aria-invalid, descrição por aria-describedby e mensagem que indique como corrigir. Não dependa somente de cor para transmitir resultado. Feedback dinâmico no app usa role=status. Navegação inclui link para pular ao conteúdo.

Movimentos são breves (150 ms) e desligados com prefers-reduced-motion. Até 650 px, grupos passam para uma coluna. Textos longos quebram sem ampliar a página horizontalmente. A referência visual cobre estados; não representa certificação de acessibilidade completa.

## Linguagem

Escreva ações com verbo e objeto: “Salvar quiz”. Para erros, explique a solução: “Preencha o nome, as perguntas e todas as alternativas”. Na prática, use “Vamos aprender com essa” e apresente a resposta correta. Não exponha detalhes técnicos nos fluxos de estudo.

## Evolução

Adicione tokens em tokens.css, componentes em style.css e seus exemplos nesta referência. Faça validação em desktop e celular e confira o fluxo de criação e resposta após alterações compartilhadas. A página usa os mesmos estilos do produto para evitar divergência.

## Referência visual e navegação da prática

A versão 1.2 usa https://onefin.framer.website/ como referência para gradientes luminosos, cabeçalho arredondado, superfícies translúcidas e composição de cartões sobrepostos. Mantém a marca Quiz Estudo, seu conteúdo e sua identidade azul e laranja.

O mapa de questões usa grupos por tipo e estados com rótulos acessíveis: respondida (✓), pulada (↷), em branco (—) e pendente. Cor complementa os símbolos. O progresso conta questões confirmadas, sem avançar apenas por pular. A revisão final preserva a separação entre tipos e distingue erros de questões em branco.

## Compartilhamento, ranking e recompensas

Use `.share-panel` para convites, `.reward-unlock` para a conquista após um acerto, `.prize-card` e `.prize-icon` para a coleção e `.ranking` para posições na competição. Selos combinam o nome, a forma hexagonal e o símbolo; o texto explica o brinde e o XP. O ranking deve mostrar participante, pontos, acertos e tempo, incluindo em telas pequenas. Feedback de cópia e conquistas usa role=status.
