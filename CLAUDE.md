# CLAUDE.md — Empório Coisas de Minas

> Documento de referência para qualquer agente de IA (Claude, Copilot, Cursor, etc.) que for trabalhar neste projeto. Leia até o fim antes de escrever código.

---

## 1. Visão Geral do Projeto

**Empório Coisas de Minas** é um aplicativo mobile de e-commerce para um marketplace de produtos artesanais regionais — queijos, cafés, doces, conservas, pães e bebidas — com foco na **Serra da Canastra, Minas Gerais**.

- **Tagline:** "Delícias da Canastra e outros trem…"
- **Plataformas:** iOS, Android e Web (mesmo código via Expo)
- **Estado atual:** Protótipo funcional com autenticação real (Firebase Auth) e Firestore configurado em produção. Catálogo de produtos ainda mockado nas telas.
- **Deploy web:** Vercel (`npx expo export -p web` → publica `dist/`)
- **Frame web:** No desktop o app aparece dentro de uma moldura 390×844 px simulando um celular; no mobile renderiza em tela cheia

---

## 2. Stack Técnica (versões exatas)

| Camada | Tecnologia | Versão |
|---|---|---|
| Framework | Expo | `~56.0.4` |
| Runtime | React | `19.2.3` |
| Runtime mobile | React Native | `0.85.3` |
| Runtime web | react-dom / react-native-web | `19.2.3` / `^0.21.2` |
| Linguagem | JavaScript / JSX | — (sem TypeScript) |
| Navegação | @react-navigation/native | `^7.2.4` |
| Stack nav | @react-navigation/native-stack | `^7.15.1` |
| Tab nav | @react-navigation/bottom-tabs | `^7.16.1` |
| Ícones | @expo/vector-icons (Ionicons) | `^15.0.2` |
| Gradientes | expo-linear-gradient | `^56.0.4` |
| Status bar | expo-status-bar | `~56.0.4` |
| Metro web | @expo/metro-runtime | `~56.0.12` |
| Safe area | react-native-safe-area-context | `^5.8.0` |
| Screens nativos | react-native-screens | `^4.25.2` |
| Fontes | @expo-google-fonts/plus-jakarta-sans + work-sans | `^0.4.2` |
| **Backend auth** | **Firebase** | **`^12.13.0`** |
| **Persistência auth** | **@react-native-async-storage/async-storage** | **`2.2.0`** |
| Estado global | React Context API (3 contextos) | — sem Zustand/Redux |
| Testes | Nenhum | — |
| Lint/Format | Nenhum configurado | — |

**Scripts npm:**
```bash
npm run start      # expo start
npm run android    # expo start --android
npm run ios        # expo start --ios
npm run web        # expo start --web
```

---

## 3. Estrutura de Pastas

```
emporio-app/
├── src/
│   ├── context/                        # ← NOVO — estado global
│   │   ├── AuthContext.jsx             # auth, login, logout, isAdmin
│   │   ├── CartContext.jsx             # carrinho, cupom, totais calculados
│   │   └── FavoritesContext.jsx        # favoritos, toggleFavorite, isFavorite
│   ├── navigation/
│   │   └── AppNavigator.jsx            # Stack + Tab navigator; proteção de rotas
│   ├── screens/                        # 14 telas (uma por arquivo .jsx)
│   │   ├── SplashScreen.jsx
│   │   ├── LoginScreen.jsx             # usa useAuth() → login()
│   │   ├── SignUpScreen.jsx
│   │   ├── HomeScreen.jsx
│   │   ├── CategoriesScreen.jsx
│   │   ├── CartScreen.jsx              # usa useCart() — sem estado local
│   │   ├── FavoritesScreen.jsx         # usa useFavorites() — sem estado local
│   │   ├── ProfileScreen.jsx           # usa useAuth() → logout()
│   │   ├── ProductDetailScreen.jsx     # usa useCart() + useFavorites()
│   │   ├── SearchScreen.jsx
│   │   ├── ListingScreen.jsx
│   │   ├── CheckoutScreen.jsx
│   │   ├── OrderConfirmationScreen.jsx
│   │   └── OrderTrackingScreen.jsx
│   ├── services/                       # ← NOVO — Firebase
│   │   ├── firebase.js                 # initializeApp + config
│   │   └── auth.js                     # signIn, signUp, signOut, onAuthStateChanged
│   └── theme/
│       └── index.js                    # Paleta de cores + fmt() (moeda BRL)
├── assets/                             # Ícones, logos, splash
├── web/
│   └── index.html                      # Wrapper web com moldura de celular
├── App.js                              # Raiz — fontes + AuthProvider > CartProvider > FavoritesProvider
├── index.js                            # Registro Expo
├── app.json                            # Config Expo (nome, ícones, orientação)
├── firebase.json                       # Config Firebase CLI (aponta para firestore.rules)
├── firestore.rules                     # Regras de segurança Firestore (produção)
├── firestore.indexes.json              # Índices Firestore (vazio por enquanto)
├── vercel.json                         # Deploy web
└── package.json
```

**Fluxo de boot:**
`index.js` → `App.js` (carrega fontes com `useFonts`) → `AppCore` (monta providers: Auth > Cart > Favorites > SafeArea > NavigationContainer) → `AppNavigator` (aguarda Firebase resolver `loading`, depois mostra Splash para todos os usuários).

---

## 4. Navegação e Proteção de Rotas

```
Stack (root) — stack único, sem bifurcação por autenticação
│
├── Splash                  → auto-navega para Main após ~3 s
├── Main ─── Tab Bar (5 abas)
│   ├── Home
│   ├── Categorias
│   ├── Carrinho
│   ├── Favoritos
│   └── Perfil              → estado vazio se não logado; perfil completo se logado
├── Login                   → acessado por navegação (não é barreira de entrada)
├── SignUp
├── ProductDetail
├── Search
├── Listing
├── Checkout                → exibe modal de auth para usuário não logado
├── OrderConfirmation
└── OrderTracking
```

- O app é acessível sem login. Qualquer pessoa chega direto ao `Main` ao abrir o app.
- **Checkout** exibe um `Modal` ao abrir: "Entrar / Criar conta" → navega para `Login`; "Continuar como visitante" → fecha o modal e segue normalmente.
- **ProfileScreen** quando não logado: exibe estado vazio com botão "Entrar / Criar conta" → `navigation.navigate('Login')`.
- **Logout** no ProfileScreen chama `logout()` do AuthContext → `user` vira `null` → ProfileScreen re-renderiza para o estado de visitante automaticamente.
- **LoginScreen** após login bem-sucedido: usa `navigation.goBack()` se houver tela anterior na pilha, senão `navigation.replace('Main')`.
- Para navegar até uma aba a partir de um screen do stack raiz use: `navigation.navigate('Main', { screen: 'Carrinho' })`.

**Tab bar:** ícones Ionicons, ativo `#52170c` (marrom), inativo `#8a7a76`, fonte WorkSans 10 px.

---

## 5. As 14 Telas

| # | Tela | O que faz | Contexto usado |
|---|---|---|---|
| 1 | **SplashScreen** | Logo com fade-in + spring scale, barra de progresso, fundo `#ede3d8`, "DESDE 2022". Auto-navega para **Main** após ~3 s. | — |
| 2 | **LoginScreen** | Tabs Login/Cadastro, toggle senha. Chama `login()` do AuthContext; Firebase Auth valida. Após login: `goBack()` ou `replace('Main')`. | `useAuth` |
| 3 | **SignUpScreen** | Formulário de cadastro. Chama `signUp()` do Firebase. | — |
| 4 | **HomeScreen** | Carrossel auto-rotativo (4,5 s), 6 chips de categoria, cards com gradiente, preço, avaliação e badge de promoção. | — |
| 5 | **CategoriesScreen** | Grade de categorias para navegação. | — |
| 6 | **CartScreen** | Ajuste de quantidade, subtotal + frete (R$ 15,90) + desconto, cupom `CANASTRA10` → R$ 11,00 off, botão limpar. | `useCart` |
| 7 | **FavoritesScreen** | Lista de favoritos com remoção. Empty state com CTA "Explorar produtos". | `useFavorites` |
| 8 | **ProfileScreen** | Se logado: avatar com iniciais, stats, menu, pedidos recentes, botão "Sair" → `logout()`. Se visitante: estado vazio com botão "Entrar / Criar conta". | `useAuth` |
| 9 | **ProductDetailScreen** | Galeria, seletor de peso, quantidade, avaliações, info do produtor. Botão "Adicionar" chama `addItem()` e navega para Carrinho. Coração chama `toggleFavorite()`. | `useCart` + `useFavorites` |
| 10 | **SearchScreen** | Histórico, atalhos de categorias, resultados em tempo real. | — |
| 11 | **ListingScreen** | Listagem filtrada de produtos. | — |
| 12 | **CheckoutScreen** | Exibe Modal de auth ao abrir (se visitante): "Entrar / Criar conta" ou "Continuar como visitante". Progress indicator, frete PAC/SEDEX, PIX (countdown 15 min) / Cartão / Boleto. | `useAuth` |
| 13 | **OrderConfirmationScreen** | Resumo do pedido com itens e preços. | — |
| 14 | **OrderTrackingScreen** | Timeline 5 etapas, info transportadora (Correios PAC) + nº rastreio. | — |

---

## 6. Context API — os 3 Contextos

### `AuthContext` (`src/context/AuthContext.jsx`)

```js
const { user, loading, isAuthenticated, isAdmin, login, signup, logout } = useAuth();
```

| Valor/Função | Tipo | Descrição |
|---|---|---|
| `user` | `FirebaseUser \| null` | Objeto do usuário autenticado |
| `loading` | `boolean` | `true` enquanto Firebase verifica sessão no boot |
| `isAuthenticated` | `boolean` | Atalho para `!!user` |
| `isAdmin` | `boolean` | `true` se `user.email === 'emporiominas00@gmail.com'` |
| `login(email, pwd)` | `Promise` | Chama Firebase `signInWithEmailAndPassword`; lança erro com `code` |
| `signup(email, pwd)` | `Promise` | Chama Firebase `createUserWithEmailAndPassword` |
| `logout()` | `Promise` | Chama Firebase `signOut`; AppNavigator redireciona automaticamente |

**Persistência:** Firebase Auth persiste sessão via AsyncStorage (mobile) e localStorage (web) — usuário continua logado após reiniciar o app.

**Admin:** verificado pelo e-mail `emporiominas00@gmail.com` — deve bater com `isAdmin()` no `firestore.rules`.

---

### `CartContext` (`src/context/CartContext.jsx`)

```js
const {
  items, coupon, setCoupon, couponApplied,
  applyCoupon, removeCoupon,
  addItem, removeItem, updateQuantity, clearCart,
  subtotal, totalItems, shipping, discount, total
} = useCart();
```

| Regra de negócio | Valor |
|---|---|
| Cupom válido | `CANASTRA10` → R$ 11,00 de desconto |
| Frete fixo | R$ 15,90 (quando há itens) |
| `addItem(item)` | Faz dedupe por `id`; se o item já existe, soma a quantidade |
| `updateQuantity(id, 0)` | Remove o item |
| `subtotal`, `totalItems`, `shipping`, `discount`, `total` | Calculados via `useMemo` automaticamente |

⚠️ **Carrinho não persiste** — os dados são em memória. Zera ao recarregar o app. `INITIAL_ITEMS` mantém 3 itens mockados para UX do protótipo (remover quando o catálogo vier do Firestore).

---

### `FavoritesContext` (`src/context/FavoritesContext.jsx`)

```js
const {
  favorites, count,
  addFavorite, removeFavorite,
  isFavorite, toggleFavorite, clearFavorites
} = useFavorites();
```

- `isFavorite(id)` — retorna `boolean`; usado em `ProductDetailScreen` para o ícone de coração
- `toggleFavorite(product)` — adiciona se não existe, remove se existe

⚠️ **Favoritos não persistem** — mesma situação do carrinho. `INITIAL_FAVORITES` tem 4 itens mock (remover quando vier do Firestore).

---

## 7. Firebase — Configuração

### Projeto
- **ID:** `emporio-coisas-de-minas`
- **Auth domain:** `emporio-coisas-de-minas.firebaseapp.com`

### Firebase Auth (✅ ativo)
- Provider: **E-mail/Senha**
- Persistência: AsyncStorage (iOS/Android) + browserLocalPersistence (Web)
- Mensagens de erro localizadas em PT-BR em `src/services/auth.js`

### Firestore (✅ criado em produção)
Regras em `firestore.rules`. Estrutura de coleções esperada:

```
/products/{productId}            → catálogo (mock por enquanto)
/users/{uid}                     → perfil do usuário
/users/{uid}/cart/{itemId}       → itens do carrinho (TODO: conectar)
/users/{uid}/favorites/{itemId}  → favoritos (TODO: conectar)
/users/{uid}/orders/{orderId}    → pedidos (TODO: implementar)
```

### Regras de Segurança (resumo)
| Coleção | Leitura | Escrita |
|---|---|---|
| `/products` | Qualquer autenticado | Só admin |
| `/users/{uid}` | Próprio dono + admin | Só dono |
| `/users/{uid}/cart` | Só dono | Só dono |
| `/users/{uid}/favorites` | Só dono | Só dono |
| `/users/{uid}/orders` | Dono + admin | Dono cria; admin atualiza status; ninguém deleta |
| Qualquer outra | ❌ Bloqueado | ❌ Bloqueado |

**Admin atual:** `emporiominas00@gmail.com` (verificação por e-mail no token).
**Upgrade futuro:** trocar para Firebase Custom Claims (`request.auth.token.admin == true`).

**Para re-publicar regras via CLI:**
```powershell
firebase use emporio-coisas-de-minas
firebase deploy --only firestore:rules
```

---

## 8. Paleta de Cores (`src/theme/index.js`)

| Token | Hex | Uso |
|---|---|---|
| `cream` | `#fcf9f5` | Fundo principal |
| `brown` | `#52170c` | Acento primário (CTAs, headers, tab ativo) |
| `terra` | `#964904` | Status "em trânsito", botões secundários |
| `ochre` | `#d8a360` | Estrelas, destaques |
| `muted` | `#54433f` | Texto secundário |
| `subtle` | `#87726e` | Texto terciário |
| `border` | `#dac1bc` | Bordas |
| `ink` | `#1c1c1a` | Texto principal |
| `softCream` | `#f6efe3` | Fundo suave |
| `chip` | `#f0ede9` | Chips/tags |
| `card` | `#ffffff` | Fundo de cards |
| `greenBg/Fg/Ln` | `#e8f5e9` / `#2e7d32` / `#4caf50` | Status "entregue" |

**Utilitário de moeda BRL:**
```js
fmt(n) // → 'R$ ' + n.toFixed(2).replace('.', ',')
// fmt(54.9) === "R$ 54,90"
```

**Fontes:**
- `PlusJakartaSans_600SemiBold / 700Bold / 800ExtraBold` — títulos e destaques
- `WorkSans_400Regular / 500Medium / 600SemiBold` — corpo e UI

---

## 9. Padrões de Código

- **Sem TypeScript** — tudo em `.jsx` / `.js`
- **Sem ESLint, sem Prettier, sem testes** configurados
- **Cores e moeda:** sempre via `src/theme/index.js` — não hardcode hex nem `R$`
- **Ícones:** sempre Ionicons via `@expo/vector-icons`
- **Gradientes:** sempre via `expo-linear-gradient`
- **Navegação:** sempre via `navigation.navigate(...)` do React Navigation 7
- **Contextos:** sempre via hooks (`useAuth`, `useCart`, `useFavorites`) — nunca importar os contextos diretamente
- **Telas:** uma por arquivo em `src/screens/NomeScreen.jsx`; registrar em `AppNavigator.jsx`
- **Logout:** chamar `logout()` do `useAuth()` — nunca `navigation.navigate('Login')` (redireciona automaticamente)
- **Aba aninhada:** para navegar de um screen do stack raiz para uma aba: `navigation.navigate('Main', { screen: 'Carrinho' })`
- **Dados mockados:** ainda existem em `CartContext.INITIAL_ITEMS`, `FavoritesContext.INITIAL_FAVORITES` e em várias telas — não persistem

---

## 10. O Que Já Está Feito

✅ **UI/UX completa** das 14 telas com fluxo navegável ponta-a-ponta
✅ **Splash → Main → Home → Detalhe → Carrinho → Checkout → Confirmação → Rastreio** funcionando (sem exigir login)
✅ **Tab bar** com 5 abas (Home, Categorias, Carrinho, Favoritos, Perfil)
✅ **Tema visual coeso** (paleta marrom/cream/ochre, fontes Plus Jakarta + Work Sans)
✅ **Firebase Auth real** — login, signup, logout com e-mail/senha
✅ **Sessão persistente** — usuário continua logado após fechar o app (AsyncStorage/localStorage)
✅ **Navegação aberta** — stack único sem bifurcação por autenticação; Login/SignUp acessados por navegação
✅ **Context API** — 3 contextos implementados (AuthContext, CartContext, FavoritesContext)
✅ **CartScreen** conectada ao CartContext (sem estado local)
✅ **FavoritesScreen** conectada ao FavoritesContext (sem estado local)
✅ **LoginScreen** usa `login()` do AuthContext; navega com `goBack()` ou `replace('Main')` após sucesso
✅ **ProfileScreen** — estado vazio para visitante com CTA "Entrar / Criar conta"; perfil completo + `logout()` para usuário logado
✅ **CheckoutScreen** — modal de autenticação para visitante: "Entrar / Criar conta" ou "Continuar como visitante"
✅ **ProductDetailScreen** — `addItem()` e `toggleFavorite()` conectados; total calculado com `fmt()`
✅ **Cupom `CANASTRA10`** → R$ 11,00 off (lógica no CartContext)
✅ **3 métodos de pagamento** simulados (PIX com countdown, Cartão, Boleto)
✅ **Frete** PAC/SEDEX
✅ **Timeline de rastreamento** com 5 etapas
✅ **Firestore** criado em modo de produção com regras de segurança publicadas
✅ **Regras do Firestore** — autenticados leem produtos, admin gerencia catálogo, usuário acessa só seus dados
✅ **`firebase.json` + `firestore.rules` + `firestore.indexes.json`** versionados no projeto
✅ **Deploy web** funcionando no Vercel com moldura de celular em desktop

---

## 11. O Que Ainda Falta

❌ **Catálogo real** — produtos ainda hardcoded em cada tela; coleção `/products` no Firestore está vazia
❌ **Carrinho não persiste** — `CartContext` usa `INITIAL_ITEMS` mockados; não lê/escreve `/users/{uid}/cart`
❌ **Favoritos não persistem** — `FavoritesContext` usa `INITIAL_FAVORITES` mockados; não lê/escreve `/users/{uid}/favorites`
❌ **ProductDetailScreen** — produto hardcoded; não usa `route.params.product`
❌ **Criação de perfil no signup** — `SignUpScreen` cria o usuário no Firebase Auth mas não cria documento em `/users/{uid}`
❌ **Pedidos reais** — CheckoutScreen não salva em `/users/{uid}/orders`
❌ **Gateway de pagamento real** — PIX, cartão e boleto são simulados
❌ **Rastreamento real** — timeline estática, sem integração Correios
❌ **Admin via Custom Claims** — atualmente por e-mail no token (menos seguro)
❌ **TypeScript** — projeto todo em JS
❌ **ESLint + Prettier** — sem formatação automática
❌ **Testes** — zero cobertura
❌ **CI/CD** — deploy web ainda manual

---

## 12. Próximos Passos (ordem de prioridade)

1. **Popular Firestore com produtos reais** — criar coleção `/products` e atualizar `HomeScreen`, `CategoriesScreen`, `ListingScreen` para buscar do Firestore com `getDocs` / `onSnapshot`

2. **Persistir carrinho no Firestore** — ao fazer login, carregar `/users/{uid}/cart`; a cada `addItem`/`removeItem`/`updateQuantity`, sincronizar com Firestore

3. **Persistir favoritos no Firestore** — mesma abordagem do carrinho em `/users/{uid}/favorites`

4. **ProductDetailScreen dinâmica** — aceitar `route.params.product` e usar os dados reais em vez de constantes hardcoded

5. **Criar perfil no signup** — após `createUserWithEmailAndPassword`, gravar documento em `/users/{uid}` com `{ name, email, createdAt }`

6. **Salvar pedidos no Firestore** — ao confirmar no `CheckoutScreen`, gravar em `/users/{uid}/orders/{orderId}` com `{ items, total, status: 'pendente', createdAt }`

7. **Gateway de pagamento real** — integrar PIX (Mercado Pago ou Pagar.me) e cartão (Stripe ou Asaas)

8. **Rastreamento Correios** — integrar API dos Correios com o número de rastreio

9. **Admin via Custom Claims** — substituir verificação por e-mail por `request.auth.token.admin == true` (mais seguro e escalável)

10. **TypeScript** — migrar incrementalmente (começar pelos contextos e serviços)

11. **ESLint + Prettier** — configuração padrão Expo

12. **Testes** — Jest + React Native Testing Library para CartContext e AuthContext primeiro

13. **CI/CD** — GitHub Actions para lint + testes + deploy automático no Vercel

---

## 13. Regras Importantes para Agentes de IA

> **LEIA ANTES DE ESCREVER QUALQUER CÓDIGO.**

### 🚨 Regra #1 — Expo SDK 56 mudou MUITO
O projeto usa **Expo SDK 56**. **SEMPRE** consulte a doc versionada antes de escrever código:
👉 <https://docs.expo.dev/versions/v56.0.0/>
Não confie em memória sobre SDK 50/51/52 — APIs e configs podem ter mudado.

### 🚨 Regra #2 — React 19 e React Native 0.85
São versões muito recentes. Verifique compatibilidade antes de instalar qualquer biblioteca.

### 🔥 Regra #3 — Firebase está integrado
Firebase Auth **JÁ FUNCIONA** com login real. Firestore está criado em produção.
Não escreva código mock de autenticação — use `useAuth()` do AuthContext.

### 📋 Regra #4 — Não invente Firestore
Antes de ler ou escrever no Firestore, confirme se a coleção e os campos já existem.
O catálogo de produtos ainda **não está** no Firestore — não assuma que está.

### 🎨 Regra #5 — Use o tema, não hardcode
- Cores: importe de `src/theme/index.js`
- Moeda BRL: use `fmt(n)` do tema
- Ícones: sempre Ionicons via `@expo/vector-icons`

### 🔑 Regra #6 — Contextos são a fonte de verdade
- Dados de auth → `useAuth()`
- Dados de carrinho → `useCart()`
- Dados de favoritos → `useFavorites()`
- Nunca duplique estado local para dados que já estão em contexto

### 🚪 Regra #7 — Logout e navegação
Nunca use `navigation.navigate('Login')` para deslogar. Use `logout()` do AuthContext → `user` vira `null` → `ProfileScreen` re-renderiza para o estado de visitante automaticamente.
`navigation.navigate('Login')` é válido para convidar um visitante a se autenticar (ex.: botão no ProfileScreen ou modal do Checkout).
Para navegar para aba aninhada: `navigation.navigate('Main', { screen: 'NomeDaAba' })`.

### 📁 Regra #8 — Uma tela por arquivo
Telas vão em `src/screens/NomeScreen.jsx`. Registrar em `AppNavigator.jsx`.
Contextos vão em `src/context/NomeContext.jsx`.
Serviços Firebase vão em `src/services/`.

### 🧩 Regra #9 — Não adicione TypeScript silenciosamente
O projeto é JS puro. Migrar para TS é uma tarefa explícita aprovada pelo usuário.

### 🚫 Regra #10 — Não adicione dependências pesadas sem permissão
Antes de instalar Zustand, Redux, React Query, Tailwind, NativeWind etc., **pergunte**.

### 🌐 Regra #11 — Lembre da Web
Toda mudança precisa funcionar em iOS, Android **e Web**. Componentes web-only quebram mobile. APIs nativas precisam de fallback web.

### 🪟 Regra #12 — Ambiente Windows
O projeto roda em `C:\Projetos\...`. Comandos shell devem ser compatíveis com PowerShell.

### 🔄 Regra #13 — Atualizar o CLAUDE.md obrigatoriamente ao fim de cada sessão
Ao final de **qualquer** sessão de trabalho, antes de encerrar:

- Atualize o CLAUDE.md refletindo **tudo** que foi feito na sessão
- Mova itens concluídos de **"O Que Ainda Falta"** para **"O Que Já Está Feito"**
- Remova de **"Próximos Passos"** tudo que foi implementado
- Se criou arquivos novos, adicione-os na **Seção 3 — Estrutura de Pastas**
- Se criou novos contextos, serviços ou padrões, documente-os nas seções correspondentes
- Se o e-mail de admin ou qualquer config mudou, reflita nas seções de Firebase e Regras

> ⚠️ Nunca termine uma sessão sem atualizar o CLAUDE.md. Um documento desatualizado é pior do que nenhum documento — induz o próximo agente a trabalhar com premissas erradas.

### 🔒 Regra #14 — Nunca commite segredos
`service-account.json` e `set-admin-claim.js` jamais devem ir para o Git.
A API key do Firebase no `firebase.js` é pública (client-side) — isso é normal para Firebase.

### 🇧🇷 Regra #15 — Idioma
Textos da UI em **português brasileiro**. Comentários de código em PT-BR ou EN — siga o estilo do arquivo que estiver editando.
