# Quiz Estudo

App estático em português para criar quizzes de múltipla escolha e estudar com correção imediata, explicações, pontuação e revisão. Inclui um quiz de exemplo, edição, exclusão e importação/exportação JSON.

Os dados são guardados no navegador via localStorage; não há conta, sincronização ou backend. Exporte os quizzes para fazer backup. Não armazene informações confidenciais. A importação aceita arquivos JSON de até 2 MB.

## Desenvolvimento

Requer Node.js 24. Não há dependências externas de execução.

```sh
npm start
npm test
```

O servidor usa a porta 3000 ou a variável PORT. Abra o endereço local correspondente no seu ambiente de desenvolvimento.

## Publicação no GitHub Pages

Em Settings → Pages, selecione Deploy from a branch, a branch contendo estes arquivos e a pasta /(root). Como este é o repositório de perfil Brizio43/Brizio43, o endereço padrão do projeto é https://brizio43.github.io/Brizio43/ . O código usa caminhos relativos para funcionar nesse endereço.

Os arquivos publicados são index.html, style.css, app.js e quiz.js. Fontes do Google são opcionais; fontes locais de fallback mantêm o app utilizável sem esse serviço.
