# Teju Jagua

Seu launcher de livros pessoal. Gerencie sua biblioteca de EPUBs e PDFs, leia com conforto e compartilhe sua jornada literária com amigos.

## 🐉 Sobre

Teju Jagua é inspirado na criatura da mitologia tupi-guarani - um lagarto com sete cabeças de cachorro. Assim como o Hydra Launcher é para jogos, Teju Jagua é para livros.

## ✨ Funcionalidades

- **Biblioteca Local**: Importe e gerencie seus EPUBs e PDFs
- **Leitor Integrado**: Leia diretamente no app com marcadores de progresso
- **Sistema Social**: Veja o que amigos estão lendo, compartilhe destaques
- **Temas de Leitura**: Dark, Light e Sepia para conforto visual
- **Destaques e Marcações**: Salve trechos importantes com cores
- **Sincronização na Nuvem**: Acesse sua biblioteca em qualquer dispositivo

## 🚀 Começando

### Pré-requisitos

- Node.js 22+
- npm ou yarn
- Git

### Instalação

```bash
# Clonar o repositório
git clone https://github.com/SEU_USUARIO/teju-jagua-books.git
cd teju-jagua-books

# Instalar dependências
npm install

# Iniciar em modo desenvolvimento
npm run dev
```

### Build

```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

## 🛠️ Tecnologias

- **Electron** - Desktop framework
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **Firebase** - Backend (Auth + Firestore)
- **epub.js** - Leitor de EPUB
- **SQLite** - Banco de dados local

## 📁 Estrutura do Projeto

```
src/
├── main/           # Electron main process
├── preload/        # Preload scripts
└── renderer/       # React application
    ├── components/ # Reusable UI components
    ├── pages/      # Page components
    ├── stores/     # Zustand state stores
    ├── types/      # TypeScript types
    └── styles/     # Global styles
```

## 📝 Roadmap

- [x] Setup inicial do projeto
- [x] Fase 1: MVP - Biblioteca + Leitor EPUB
  - [x] Estrutura de navegação (Sidebar)
  - [x] Importação de EPUBs via file picker
  - [x] Drag & drop de arquivos EPUB
  - [x] Parser de metadados EPUB (título, autor, capa)
  - [x] Biblioteca em grid/list view
  - [x] Leitor EPUB com epub.js
  - [x] Temas de leitura (Light/Dark/Sepia)
  - [x] Ajuste de fonte
  - [x] Índice/TOC interativo
  - [x] Salvamento de progresso automático
  - [x] Filtros de biblioteca (Todos/Lendo/Finalizados/Não iniciados)
- [x] Fase 2: Recursos de Leitura
  - [x] Destaques com cores (4 opções)
  - [x] Bookmarks/marcadores
  - [x] Notas em destaques
  - [x] Painel de lista de destaques
  - [x] Exportar destaques para Markdown
  - [x] Compartilhamento público/privado
- [ ] Fase 3: Sistema Social (Firebase)
- [ ] Fase 4: Sync e Polimento

## 🤝 Contribuindo

Contribuições são bem-vindas! Abra uma issue ou envie um pull request.

## 📄 Licença

MIT License - veja o arquivo [LICENSE](LICENSE) para detalhes.

---

Feito com 💚 para leitores
