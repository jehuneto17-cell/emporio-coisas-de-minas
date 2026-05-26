# Empório Coisas de Minas — App Context

## Visão Geral

Aplicativo mobile de e-commerce para o **Empório Coisas de Minas**, um marketplace de produtos artesanais regionais (queijos, cafés, doces, conservas, pães e bebidas) com foco na Serra da Canastra, Minas Gerais.

- **Tagline:** "Delícias da Canastra e outros trem…"
- **Plataforma:** Expo (iOS, Android, Web)
- **Estado atual:** Protótipo funcional com dados mockados — sem backend real
- **Deploy web:** Vercel (`npx expo export -p web` → `dist/`)

---

## Stack Técnica

| Camada | Tecnologia |
|---|---|
| Framework | Expo ~56.0.4 |
| Runtime | React 19.2.3 / React Native 0.85.3 |
| Linguagem | JavaScript / JSX (sem TypeScript) |
| Navegação | React Navigation 7 (Stack + Bottom Tabs) |
| Ícones | @expo/vector-icons (Ionicons) |
| Gradientes | expo-linear-gradient |
| Fontes | Plus Jakarta Sans + Work Sans (Google Fonts) |
| Estado | React hooks locais (useState) — sem Zustand/Redux |
| Persistência | Nenhuma — dados resetam ao reiniciar o app |
| Web frame | Moldura 390×844 px no desktop via `web/index.html` |

---

## Estrutura de Arquivos

```
emporio-app/
├── src/
│   ├── navigation/
│   │   └── AppNavigator.jsx        # Stack + Tab navigator raiz
│   ├── screens/                    # 14 telas
│   │   ├── SplashScreen.jsx
│   │   ├── LoginScreen.jsx
│   │   ├── SignUpScreen.jsx
│   │   ├── HomeScreen.jsx
│   │   ├── CategoriesScreen.jsx
│   │   ├── CartScreen.jsx
│   │   ├── FavoritesScreen.jsx
│   │   ├── ProfileScreen.jsx
│   │   ├── ProductDetailScreen.jsx
│   │   ├── SearchScreen.jsx
│   │   ├── ListingScreen.jsx
│   │   ├── CheckoutScreen.jsx
│   │   ├── OrderConfirmationScreen.jsx
│   │   └── OrderTrackingScreen.jsx
│   └── theme/
│       └── index.js                # Paleta de cores + fmt() (moeda BRL)
├── assets/                         # Ícones, logos, splash
├── web/
│   └── index.html                  # Wrapper web com moldura de celular
├── App.js                          # Raiz — carrega fontes, monta navigator
├── index.js                        # Registro Expo
├── app.json                        # Config Expo (nome, ícones, orientação)
├── vercel.json                     # Deploy web
└── CLAUDE.md / AGENTS.md           # Instruções para agentes de IA
```

---

## Navegação

```
Stack (root)
├── Splash              → auto-navega para Login após ~3s
├── Login
├── SignUp
├── Main ─── Tab Bar (5 abas)
│   ├── Home
│   ├── Categorias
│   ├── Carrinho
│   ├── Favoritos
│   └── Perfil
├── ProductDetail       (modal push)
├── Search
├── Listing
├── Checkout
├── OrderConfirmation
└── OrderTracking
```

Tab bar: ícones Ionicons, cor ativa `#52170c` (marrom), inativa `#8a7a76`, fonte WorkSans 10 px.

---

## Telas e Funcionalidades

### Splash
- Logo centralizada com animação fade-in + spring scale
- Barra de progresso animada
- Fundo `#ede3d8`, texto "DESDE 2022"

### Login / SignUp
- Tabs Login / Cadastro
- Credenciais demo: `joao.silva@gmail.com` / `canastra2026`
- Toggle mostrar/ocultar senha

### Home
- Carrossel auto-rotativo (4,5 s) com 3 produtos em destaque
- 6 chips de categoria: Queijos 🧀 Cafés ☕ Doces 🍬 Conservas 🫙 Pães 🍞 Vinhos 🍷
- Cards de produto com gradiente, preço, avaliação e badge de promoção

### ProductDetail
- Galeria de imagens com indicadores de ponto
- Seletor de peso (200g / 400g / 600g / 1 kg)
- Controle de quantidade
- Avaliações com estrelas
- Info do produtor com localização e badge "verificado"

### Cart
- Ajuste de quantidade por item
- Subtotal + frete (R$ 15,90) + desconto
- Cupom `CANASTRA10` → R$ 11,00 de desconto
- Botão limpar carrinho

### Search
- Histórico de buscas recentes
- Atalhos para categorias populares
- Resultados em tempo real

### Favorites
- Salvar / remover produtos
- Empty state com CTA "Explorar produtos"

### Profile
- Avatar com iniciais (fundo gradiente)
- Stats: pedidos, itens salvos, total gasto
- Menu com Pedidos, Endereços, Pagamento, Notificações, Ajuda etc.
- Lista de pedidos recentes com status

### Checkout
- Progress indicator (Carrinho → Pagamento → Confirmação)
- Seleção de frete: PAC ou SEDEX
- Métodos: PIX (countdown 15 min), Cartão de Crédito, Boleto

### OrderConfirmation / OrderTracking
- Resumo de pedido com itens e preços
- Timeline com 5 etapas de rastreamento
- Info da transportadora (Correios PAC) + número de rastreio

---

## Paleta de Cores (`src/theme/index.js`)

| Token | Hex | Uso |
|---|---|---|
| `cream` | `#fcf9f5` | Fundo principal |
| `brown` | `#52170c` | Acento primário (CTAs, headers) |
| `terra` | `#964904` | Status "em trânsito" |
| `ochre` | `#d8a360` | Estrelas, destaques |
| `muted` | `#54433f` | Texto secundário |
| `subtle` | `#87726e` | Texto terciário |
| `border` | `#dac1bc` | Bordas |
| `ink` | `#1c1c1a` | Texto principal |
| `softCream` | `#f6efe3` | Fundo suave |
| `chip` | `#f0ede9` | Chips/tags |

Utilitário: `fmt(n)` → `'R$ ' + n.toFixed(2).replace('.', ',')` (moeda BRL)

---

## Padrões de Código

- Dados mockados hardcoded em cada tela (arrays PRODUCTS, SLIDES etc.) — nenhum fetch real
- Estado 100% local com `useState`; dados não persistem entre sessões
- Sem TypeScript, sem ESLint configurado, sem testes automatizados
- Fontes carregadas em `App.js` com `useFonts`; app trava na splash até carregar
- Web: moldura de celular 390×844 em desktop via `web/index.html`; mobile renderiza full-screen

---

## Próximos Passos Naturais

- Integrar backend real (Supabase / Firebase) para produtos, auth e pedidos
- Adicionar persistência de carrinho e favoritos (AsyncStorage ou banco)
- Implementar estado global (Context API ou Zustand) para carrinho/auth
- Adicionar TypeScript
- Configurar ESLint + Prettier
- Implementar gateway de pagamento (PIX real, Stripe etc.)
- Rastreamento de pedidos com integração Correios
