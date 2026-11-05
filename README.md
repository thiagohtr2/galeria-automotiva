# Galeria Automotiva

Galeria estática de imagens automotivas com URLs previsíveis para pessoas e agentes.

## Executar localmente

```bash
python3 -m http.server 4173
```

Acesse `http://localhost:4173`.

## Painel de enquadramento

- Abra [Enquadrar imagens](enquadramento.html) e use **Anterior** e **Próximo** para navegar pelos veículos do manifesto.
- **Ajustar ao grid** centraliza a área visível e aplica a maior escala que cabe na margem de segurança de 8% da largura. A escala mantém a proporção do veículo.
- **OK, salvar aprovação** grava a revisão neste navegador. **Baixar PNG aprovado** gera a imagem transparente de 1672 × 941 px com o enquadramento salvo.
- **Exportar aprovações** baixa um JSON para aplicar as revisões no repositório. Cada registro identifica o PNG de origem pelo SHA-256 e informa o retângulo de desenho no quadro final em pixels. O catálogo é atualizado separadamente.

## Acesso programático

- Manifesto: `cars.json`
- Imagens: `assets/cars/<arquivo>.png`
- Download completo: `downloads/galeria-automotiva-todos-png-transparente.zip`
- Lote BYD: `downloads/byd-carros-png-transparente.zip`
- Lote Chevrolet e Citroën: `downloads/chevrolet-citroen-carros-png-transparente.zip`
- Lote Ford e GWM: `downloads/ford-gwm-carros-png-transparente.zip`
- Lote GWM e Honda: `downloads/gwm-honda-carros-png-transparente.zip`
- Lote Honda e Hyundai: `downloads/honda-hyundai-carros-png-transparente.zip`
- Lote Hyundai, Jeep e Kia: `downloads/hyundai-jeep-kia-carros-png-transparente.zip`
- Lote Kia, Leapmotor e Mitsubishi: `downloads/kia-leapmotor-mitsubishi-carros-png-transparente.zip`
- Lote Mitsubishi, Nissan, Peugeot e RAM: `downloads/mitsubishi-nissan-peugeot-ram-carros-png-transparente.zip`
- Lote RAM, Renault e Suzuki: `downloads/ram-renault-suzuki-carros-png-transparente.zip`
- Lote Toyota e Volkswagen: `downloads/toyota-volkswagen-carros-png-transparente.zip`
- Lote Volkswagen: `downloads/volkswagen-carros-png-transparente.zip`
- Lote BYD e Chevrolet: `downloads/byd-chevrolet-carros-png-transparente.zip`
- Lote Citroën e Fiat: `downloads/citroen-fiat-carros-png-transparente.zip`
- Lote Mitsubishi e Volkswagen: `downloads/mitsubishi-volkswagen-carros-png-transparente.zip`
- Lote Agrale, Aston Martin e Audi: `downloads/agrale-aston-martin-audi-carros-png-transparente.zip`
- Lote Audi A6, Q3, Q5, Q6, Q7 e Q8: `downloads/audi-a6-q3-q5-q6-q7-q8-carros-png-transparente.zip`
- Lote Audi RS, Avatr e BMW elétricos: `downloads/audi-rs-avatr-bmw-eletricos-carros-png-transparente.zip`
- Lote BMW M, Série 1–5, X1 e X2: `downloads/bmw-m-series-x1-x2-carros-png-transparente.zip`
- Lote BMW X3–X7, CAOA Changan e Chery: `downloads/bmw-x3-x5-x6-x7-changan-chery-carros-png-transparente.zip`
- Lote Chery, Citroën, Denza, EFFA e Ferrari: `downloads/chery-citroen-denza-effa-ferrari-carros-png-transparente.zip`
- Manifesto público: `https://raw.githubusercontent.com/thiagohtr2/galeria-automotiva/main/cars.json`
- ZIP público completo: `https://raw.githubusercontent.com/thiagohtr2/galeria-automotiva/main/downloads/galeria-automotiva-todos-png-transparente.zip`
- Logotipos das marcas (49 arquivos): `downloads/logotipos-marcas-automotivas-png-transparente.zip`
- Logotipos — lote 2 (30 arquivos): `downloads/logotipos-marcas-automotivas-lote-2-png-transparente.zip`
- Manifesto dos logotipos: `logos.json`
- Site público após habilitar o Pages: `https://thiagohtr2.github.io/galeria-automotiva/`

Cada item do manifesto inclui nome, ano, carroceria, dimensões, transparência e URL pública da imagem.

O ZIP completo usa PNG-8 otimizado para download; os arquivos individuais e os ZIPs por lote preservam PNG em cores completas.

As imagens deste acervo foram geradas por IA e devem ser usadas como material visual ilustrativo.

## Central de downloads por lote

- Site: [downloads.html](downloads.html) (publicado no GitHub Pages depois de habilitar Pages).
- Galeria de veículos: [index.html](index.html).
- Os lotes são construídos no navegador a partir de cars.json (downloads + cars).
- Os lotes são apresentados do mais recente para o mais antigo, com busca por marca/modelo e botões de download.
- A coleção atual tem **191 imagens PNG de carros**, **49 logotipos** e **20 lotes de carros** (19 lotes de 10, um lote complementar de 2). O pacote completo está em downloads/galeria-automotiva-todos-png-transparente.zip.
- Os lotes 19 e 20, publicados em 4/11/2026 (horário da Bahia), são:
  - 19: downloads/bmw-x3-x5-x6-x7-changan-chery-carros-png-transparente.zip
  - 20: downloads/chery-citroen-denza-effa-ferrari-carros-png-transparente.zip

### Como adicionar o próximo lote sem perder os anteriores

1. Gerar e revisar os novos arquivos PNG, com um nome exclusivo por modelo.
2. Enviar os PNGs para assets/cars/ (sem substituir os existentes por engano).
3. Criar um novo arquivo ZIP em downloads/ com o novo lote.
4. Acrescentar os veículos ao final do array cars em cars.json, mantendo id, name, year, bodyType, filename, image, url, width, height, transparent e alt.
5. Acrescentar uma entrada **no final** de downloads com collection, count, url e createdAt (timestamp ISO 8601), na mesma ordem dos veículos adicionados.
6. Atualizar download.count, o ZIP geral downloads/galeria-automotiva-todos-png-transparente.zip e, se desejar, a versão do manifesto.
7. Conferir que cars.json é JSON válido, que o total informado coincide com os arquivos armazenados e que os novos ZIPs são acessíveis.

**Importante:** a página descobre novas entradas assim que os arquivos/manifestos são publicados no repositório, mas **não publica automaticamente imagens criadas no ChatGPT**. É necessário enviar os arquivos para o GitHub. O lote 14 é uma exceção histórica: o ZIP possui dois arquivos e o catálogo lista apenas o novo Volkswagen Virtus, pois o outro arquivo já existia na coleção.

### Publicação do site

O workflow .github/workflows/pages.yml está configurado para publicar no GitHub Pages, mas a instalação inicial do Pages requer ativação pelo proprietário do repositório:

1. Abrir Settings → Pages em thiagohtr2/galeria-automotiva.
2. Selecionar **GitHub Actions** em Build and deployment → Source.
3. Abrir Actions → Deploy gallery to GitHub Pages → Run workflow para publicar, ou realizar um novo commit.

A falha anterior ocorreu na etapa Configure Pages com "Resource not accessible by integration", porque o site Pages ainda não estava habilitado.
