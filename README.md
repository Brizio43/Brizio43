# Quiz Estudo

App em português para criar quizzes de múltipla escolha, completar frases e exercícios descritivos, com dicas, explicações, pontuação e revisão. Inclui um quiz de exemplo, edição, exclusão e importação/exportação JSON.

Quizzes individuais, progresso de estudo e a coleção de recompensas são guardados no navegador via localStorage. As competições usam um servidor Node.js com SQLite para centralizar participantes, respostas e ranking. Não há contas de usuário. Exporte os quizzes para fazer backup. Não armazene informações confidenciais. A importação aceita arquivos JSON de até 2 MB.

## Quizzes a partir de imagens

No criador, selecione uma imagem PNG, JPG ou WebP de até 10 MB e 25 megapixels. Clique em **Extrair texto da imagem**: ao concluir o reconhecimento, o app gera automaticamente três exercícios para cada trecho legível do conteúdo, sem o antigo limite de dez questões:

- **Múltipla escolha:** escolha o termo que completa o trecho, com quatro alternativas.
- **Completar frases:** digite a palavra ausente. A correção ignora diferenças de caixa, acentos e pontuação.
- **Descritivo:** explique a informação com suas palavras e compare com a resposta de referência. Não há nota automática para esse tipo.

Cada questão possui uma dica acessível pelo botão **Dica**, que pode ser aberta e ocultada sem perder a resposta digitada. No editor, perguntas, tipos, respostas, explicações e dicas podem ser alterados. Os quizzes antigos continuam funcionando como múltipla escolha e recebem uma dica padrão se não tiverem uma dica salva.

Revise o texto reconhecido e use **Gerar todas as questões do conteúdo** para atualizar os exercícios. A regeneração substitui as sugestões geradas anteriormente, preservando questões criadas manualmente. Não há duplicação a cada clique. A geração é local, baseada em regras e no próprio texto; não usa IA nem acrescenta conhecimento externo. As linhas quebradas do OCR são reunidas antes da separação por término de frase. A frase inteira fica em uma única questão de completar, incluindo frases longas e trechos separados por ponto e vírgula. Repetições do mesmo trecho são removidas. Conteúdo somente com símbolos não gera questões. Erros de OCR podem produzir exercícios incorretos: revise o resultado antes de salvar.

O resultado mostra a pontuação apenas das questões com correção automática e lista separadamente os exercícios descritivos. Exportação, importação e armazenamento local preservam os três tipos, suas dicas e respostas de referência.

O reconhecimento em português usa Tesseract.js, incluído em `vendor/ocr`, e é executado no navegador. A imagem não é enviada nem persistida. O texto revisado é salvo com o quiz e acompanha a exportação JSON. Textos impressos e fotos nítidas têm melhores resultados; anotações manuscritas podem precisar de transcrição manual. O usuário também pode colar ou digitar o conteúdo sem usar OCR. O leitor local aumenta o download inicial do app em cerca de 10 MB durante a primeira extração.

## Desenvolvimento

Requer Node.js 24, com o módulo nativo node:sqlite. Não há pacotes npm a instalar.

```sh
npm start
npm test
```

O servidor usa a porta 3000 ou a variável PORT. O banco persistente fica em .quiz-data/competitions.sqlite (ignorado pelo Git); QUIZ_DB_PATH pode apontar para outro arquivo em disco persistente. Abra o endereço local correspondente no seu ambiente de desenvolvimento.

## Publicação no GitHub Pages

Em Settings → Pages, selecione Deploy from a branch, a branch contendo estes arquivos e a pasta /(root). Como este é o repositório de perfil Brizio43/Brizio43, o endereço padrão do projeto é https://brizio43.github.io/Brizio43/ . O código usa caminhos relativos para funcionar nesse endereço.

O GitHub Pages oferece o estudo individual, o compartilhamento por link e as recompensas locais; não executa o servidor de competições. Para competição e ranking, execute server.js em uma hospedagem com Node.js 24 e disco persistente, servindo app e API no mesmo domínio. Publique os arquivos da raiz e a pasta `vendor/ocr` completa. Fontes do Google são opcionais; fontes locais de fallback mantêm o app utilizável sem esse serviço.

## Pular, retomar e organizar a prática

Os exercícios ficam em blocos: múltipla escolha, completar frases e descritivos. O mapa permite navegar por todos os blocos, indicando respondidas, puladas e em branco. **Pular e voltar depois** preserva o rascunho; **Deixar em branco** limpa a resposta, mas a questão ainda pode ser retomada pelo mapa antes de finalizar. Questões confirmadas ficam disponíveis para revisão e não são apresentadas novamente pelo avanço automático.

O progresso, as respostas confirmadas e os rascunhos ficam salvos neste navegador. A biblioteca mostra **Continuar estudo**. Ao editar perguntas ou respostas de um quiz, uma sessão incompatível é reiniciada. A opção **Revisar e finalizar** permite voltar a pendências ou finalizar com questões em branco. Rascunhos não confirmados são considerados em branco na finalização.

Respostas objetivas incorretas mostram imediatamente a resposta correta e a explicação. Descritivas sempre mostram a referência para comparação, sem julgamento automático. Na revisão final, todas as questões mostram o gabarito ou referência, incluindo as deixadas em branco; questões objetivas em branco contam como não acertadas na porcentagem.

Trechos repetidos não geram exercícios duplicados. Perguntas repetidas do mesmo tipo são removidas durante geração e importação e rejeitadas no salvamento manual. Regenerar não acumula cópias. Os três formatos podem trabalhar o mesmo conceito, mas cada exercício é único dentro do seu tipo.

O visual usa https://onefin.framer.website/ como referência de composição, gradientes e superfícies, mantendo azul e laranja.

## Compartilhamento e competição

O botão **Compartilhar** cria um link com o quiz comprimido no fragmento da URL, sem precisar de um servidor de dados. Quem abrir o link pode adicionar o quiz à biblioteca e estudar. As questões e o gabarito fazem parte desse link de estudo individual; a imagem e o texto de origem separado não são incluídos. Quizzes acima do limite de 2 MB precisam ser exportados por arquivo. O endereço do app deve estar acessível aos destinatários; endereços locais usados em desenvolvimento não funcionam em outras máquinas.

**Criar competição** salva uma cópia fixa do quiz no servidor e gera um convite. Participantes entram com um apelido público único e recebem uma tentativa. O servidor corrige e guarda cada resposta confirmada, impede alterações posteriores e libera o gabarito dessa questão. Respostas em branco são permitidas. O ranking só inclui participações finalizadas, atualiza a cada dez segundos enquanto a página está aberta e possui atualização manual.

Cada acerto objetivo vale 10 pontos. O ranking ordena por pontos e desempata pelo menor tempo total, medido pelo servidor desde a entrada até a finalização; o tempo continua durante pausas. Descritivas são exercícios de autoavaliação e não somam pontos. Participação e retomada usam um token privado guardado neste navegador; perder esse armazenamento impede retomar a mesma participação. Apelidos, pontuação, acertos e tempo ficam visíveis para quem tem o link da competição.

O SQLite guarda competições e resultados após reiniciar o processo. Preserve o arquivo do banco durante atualizações e use um volume persistente em uma futura hospedagem. Os testes da API usam bancos temporários e não precisam de serviços externos ou credenciais. No ambiente atual, a competição está preparada para teste; ainda não foi publicada para pessoas fora dele.

## Selos e brindes virtuais

Cada acerto de múltipla escolha ou completar frases desbloqueia um selo, um brinde virtual e 10 XP. A coleção contém Olhar atento / Cristal azul, Mente curiosa / Estrela laranja, Passo certeiro / Foguete do saber e Conhecimento em ação / Troféu virtual. A visualização de uma resposta já confirmada não duplica o prêmio. Uma nova prática individual pode gerar novos prêmios. Em competição, cada questão é pontuada uma vez pelo servidor. Descritivas não geram prêmio automático.

As recompensas são somente colecionáveis digitais, sem valor monetário. A coleção pessoal fica neste navegador; a pontuação do ranking é calculada separadamente pelo servidor.
