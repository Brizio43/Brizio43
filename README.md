# Quiz Estudo

App estático em português para criar quizzes de múltipla escolha e estudar com correção imediata, explicações, pontuação e revisão. Inclui um quiz de exemplo, edição, exclusão e importação/exportação JSON.

Os dados são guardados no navegador via localStorage; não há conta, sincronização ou backend. Exporte os quizzes para fazer backup. Não armazene informações confidenciais. A importação aceita arquivos JSON de até 2 MB.

## Quizzes a partir de imagens

No criador, selecione uma imagem PNG, JPG ou WebP de até 10 MB e 25 megapixels. Clique em **Extrair texto da imagem**, revise o reconhecimento e use **Gerar questões do conteúdo**. É possível gerar até 3, 5 ou 10 sugestões conforme a quantidade de frases disponíveis. As questões são de completar frases e usam palavras do conteúdo como alternativas; revise os distratores e respostas antes de salvar. Não há geração por IA.

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
