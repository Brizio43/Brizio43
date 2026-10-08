# Reconhecimento de texto local

Arquivos distribuídos com o app para evitar carregamentos externos durante o OCR:

- Tesseract.js 5.1.1: tesseract.min.js, worker.min.js (pacote npm verificado durante instalação).
- Tesseract.js-core 5.1.1: tesseract-core-lstm.wasm.js e tesseract-core-lstm.wasm (pacote npm).
- Modelo de português: https://tessdata.projectnaptha.com/4.0.0/por.traineddata.gz, obtido via HTTPS com verificação TLS.

As licenças e avisos acompanham estes arquivos. A imagem é processada no navegador e não é enviada a um serviço de OCR. Não editar os arquivos distribuídos manualmente; atualizar a partir dos pacotes/fontes originais, preservando licenças e verificações.
