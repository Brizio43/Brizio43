# Quiz Estudo

App estático em português para criar quizzes de múltipla escolha, completar frases e exercícios descritivos, com dicas, explicações, pontuação e revisão. Inclui um quiz de exemplo, edição, exclusão e importação/exportação JSON.

Os dados são guardados no navegador via localStorage; não há conta, sincronização ou backend. Exporte os quizzes para fazer backup. Não armazene informações confidenciais. A importação aceita arquivos JSON de até 2 MB.

## Quizzes a partir de imagens

No criador, selecione uma imagem PNG, JPG ou WebP de até 10 MB e 25 megapixels. Clique em **Extrair texto da imagem**: ao concluir o reconhecimento, o app gera automaticamente três exercícios para cada trecho legível do conteúdo, sem o antigo limite de dez questões:

- **Múltipla escolha:** escolha o termo que completa o trecho, com quatro alternativas.
- **Completar frases:** digite a palavra ausente. A correção ignora diferenças de caixa, acentos e pontuação.
- **Descritivo:** explique a informação com suas palavras e compare com a resposta de referência. Não há nota automática para esse tipo.

Cada questão possui uma dica acessível pelo botão **Dica**, que pode ser aberta e ocultada sem perder a resposta digitada. No editor, perguntas, tipos, respostas, explicações e dicas podem ser alterados. Os quizzes antigos continuam funcionando como múltipla escolha e recebem uma dica padrão se não tiverem uma dica salva.

Revise o texto reconhecido e use **Gerar todas as questões do conteúdo** para atualizar os exercícios. A regeneração substitui as sugestões geradas anteriormente, preservando questões criadas manualmente. Não há duplicação a cada clique. A geração é local, baseada em regras e no próprio texto; não usa IA nem acrescenta conhecimento externo. Linhas e frases são usadas integralmente; passagens longas são divididas em trechos menores. Conteúdo somente com símbolos não gera questões. Erros de OCR podem produzir exercícios incorretos: revise o resultado antes de salvar.

O resultado mostra a pontuação apenas das questões com correção automática e lista separadamente os exercícios descritivos. Exportação, importação e armazenamento local preservam os três tipos, suas dicas e respostas de referência.

O reconhecimento em português usa Tesseract.js, incluído em `vendor/ocr`, e é executado no navegador. A imagem não é enviada nem persistida. O texto revisado é salvo com o quiz e acompanha a exportação JSON. Textos impressos e fotos nítidas têm melhores resultados; anotações manuscritas podem precisar de transcrição manual. O usuário também pode colar ou digitar o conteúdo sem usar OCR. O leitor local aumenta o download inicial do app em cerca de 10 MB durante a primeira extração.

## Desenvolvimento

Requer Node.js 24. Não há dependências externas de execução.

```sh
npm start
npm test
```

O servidor usa a porta 3000 ou a variável PORT. Abra o endereço local correspondente no seu ambiente de desenvolvimento.

## Publicação no GitHub Pages

Em Settings → Pages, selecione Deploy from a branch, a branch contendo estes arquivos e a pasta /(root). Como este é o repositório de perfil Brizio43/Brizio43, o endereço padrão do projeto é https://brizio43.github.io/Brizio43/ . O código usa caminhos relativos para funcionar nesse endereço.

Publique os arquivos da raiz e a pasta `vendor/ocr` completa. Fontes do Google são opcionais; fontes locais de fallback mantêm o app utilizável sem esse serviço.
