# CLAUDE.md — Empório Coisas de Minas

> Documento de referência para qualquer agente de IA (Claude, Copilot, Cursor, etc.) que for trabalhar neste projeto. Leia até o fim antes de escrever código.

---

## 1. Visão Geral do Projeto

**Empório Coisas de Minas** é um aplicativo mobile de e-commerce para um marketplace de produtos artesanais regionais — queijos, cafés, doces, conservas, pães e bebidas — com foco na **Serra da Canastra, Minas Gerais**.

- **Tagline:** "Delícias da Canastra e outros trem…"
- **Plataformas:** iOS, Android e Web (mesmo código via Expo)
- **Estado atual:** Protótipo funcional com autenticação real (Firebase Auth), Firestore configurado em produção e serviço `firestore.js` implementado. Telas conectadas ao Firestore. **Sem fallback para dados mock e sem SEED_PRODUCTS** — se a coleção estiver vazia, o app mostra empty state. Para popular o Firestore, use `DB.seedDadosIniciais()` no console do painel admin.
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
| Ícones extras | phosphor-react-native | `latest` |
| SVG | react-native-svg | SDK 56 compat |
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
│   ├── screens/                        # 17 telas (uma por arquivo .jsx)
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
│   │   ├── OrderTrackingScreen.jsx
│   │   ├── SubcategoryScreen.jsx          # subcategorias de uma categoria pai
│   │   ├── EditProfileScreen.jsx          # edição de nome, telefone, data nasc. e endereço de entrega
│   │   ├── MyOrdersScreen.jsx             # lista de pedidos com filtros por status
│   │   ├── HelpScreen.jsx                 # FAQ em acordeão + botão WhatsApp para suporte
│   │   ├── PrivacyScreen.jsx              # redefinir senha, política de privacidade LGPD, excluir conta
│   │   ├── NotificationsScreen.jsx        # toggles de preferências de notificação com persistência no Firestore
│   │   └── AddressesScreen.jsx            # múltiplos endereços com ViaCEP, endereço padrão, editar/excluir
│   ├── services/                       # Firebase
│   │   ├── firebase.js                 # initializeApp + config
│   │   ├── auth.js                     # signIn, signUp, signOut, onAuthStateChanged
│   │   └── firestore.js                # getProducts, getProductsByCategory, searchProducts, getProductById, createUserProfile
│   │                                   # getFavorites, setFavorite, deleteFavorite, clearFavoriteDocs
│   │                                   # getCartItems, setCartItem, deleteCartItem, clearCartItems
│   │                                   # getOrder, addOrder
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
├── api/
│   └── calcular-frete.js               # Vercel Serverless Function — proxy para API do Melhor Envio (evita CORS)
├── vercel.json                         # Deploy web + rota /api/* para serverless functions
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
| 3 | **SignUpScreen** | Formulário de cadastro (nome, e-mail, telefone, senha). Valida campos obrigatórios, confirmação de senha e mínimo 6 caracteres. Chama `signup()` do AuthContext; após sucesso, cria documento `/users/{uid}` via `createUserProfile()`. Navega para `Main` com `replace`. | `useAuth` |
| 4 | **HomeScreen** | Carrossel auto-rotativo (4,5 s), 6 chips de categoria, cards de produto. `ProductCard` exibe `images[0]` ou `imageUrl` do Firestore como fundo do card; gradiente como placeholder quando sem foto. | — |
| 5 | **CategoriesScreen** | Grade de categorias derivada dinamicamente dos produtos ativos no Firestore. Só exibe categorias com ≥1 produto; empty state se nenhum produto. Visual (emoji, cores) vem de `CAT_META` local; categorias desconhecidas recebem fallback padrão. | — |
| 6 | **CartScreen** | Ajuste de quantidade, subtotal + frete (R$ 15,90) + desconto, cupom `CANASTRA10` → R$ 11,00 off, botão limpar. Miniatura do item exibe `images[0]` ou `imageUrl`; gradiente como placeholder (com fallback `['#e0c090','#a07030']` quando `colors` ausente). | `useCart` |
| 7 | **FavoritesScreen** | Lista de favoritos com remoção. Empty state com CTA "Explorar produtos". Card exibe `images[0]` ou `imageUrl`; gradiente como placeholder. Preço formatado com `fmt()`. | `useFavorites` |
| 8 | **ProfileScreen** | Se logado: avatar com iniciais, stats, menu, pedidos recentes, botão "Sair" → `logout()`. Se visitante: estado vazio com botão "Entrar / Criar conta". | `useAuth` |
| 9 | **ProductDetailScreen** | Galeria, seletor de peso, quantidade, avaliações, info do produtor. Botão "Adicionar" chama `addItem()` e navega para Carrinho. Coração chama `toggleFavorite()`. Hero mostra `images[0]` ou `imageUrl` do Firestore; gradiente como placeholder quando sem foto. | `useCart` + `useFavorites` |
| 10 | **SearchScreen** | Histórico, atalhos de categorias, resultados em tempo real. | — |
| 11 | **ListingScreen** | Listagem filtrada de produtos. | — |
| 12 | **CheckoutScreen** | Exibe Modal de auth ao abrir (se visitante). Progress indicator, frete PAC/SEDEX (R$15,90/R$28,90), PIX (countdown 15 min) / Cartão / Boleto. Resumo usa valores reais do CartContext (`subtotal`, `totalItems`, `discount`, `couponApplied`). "Confirmar Pagamento" chama `addOrder()`, limpa o carrinho e navega para `OrderConfirmation` passando `orderId`. Endereço ainda é placeholder. | `useAuth` + `useCart` |
| 13 | **OrderConfirmationScreen** | Recebe `orderId` via `route.params`. Se usuário logado e `orderId` presente: busca o pedido com `getOrder()` e exibe dados reais (número `#XXXXXX`, data, itens, total, método de pagamento). Enquanto carrega: `ActivityIndicator` centralizado. Visitante ou erro: exibe confirmação genérica com dados mock sem quebrar. | `useAuth` |
| 14 | **OrderTrackingScreen** | Timeline 5 etapas, info transportadora (Correios PAC) + nº rastreio. | — |

---

## 6. Context API — os 3 Contextos

### `AuthContext` (`src/context/AuthContext.jsx`)

```js
const { user, loading, isAuthenticated, isAdmin, login, loginWithGoogle, signup, logout } = useAuth();
```

| Valor/Função | Tipo | Descrição |
|---|---|---|
| `user` | `FirebaseUser \| null` | Objeto do usuário autenticado |
| `loading` | `boolean` | `true` enquanto Firebase verifica sessão no boot |
| `isAuthenticated` | `boolean` | Atalho para `!!user` |
| `isAdmin` | `boolean` | `true` se `user.email === 'emporiominas00@gmail.com'` |
| `login(email, pwd)` | `Promise` | Chama Firebase `signInWithEmailAndPassword`; lança erro com `code` |
| `loginWithGoogle()` | `Promise` | `signInWithPopup` + `GoogleAuthProvider` — funciona na web; retorna erro amigável no nativo |
| `signup(email, pwd)` | `Promise` | Chama Firebase `createUserWithEmailAndPassword` |
| `logout()` | `Promise` | Chama Firebase `signOut`; AppNavigator redireciona automaticamente |

**Persistência:** Firebase Auth persiste sessão via AsyncStorage (mobile) e localStorage (web) — usuário continua logado após reiniciar o app.

**Admin:** verificado pelo e-mail `emporiominas00@gmail.com` — deve bater com `isAdmin()` no `firestore.rules`.

---

### `CartContext` (`src/context/CartContext.jsx`)

```js
const {
  items, hydrating,
  coupon, setCoupon, couponApplied,
  applyCoupon, removeCoupon,
  addItem, removeItem, updateQuantity, clearCart,
  subtotal, totalItems, shipping, discount, total
} = useCart();
```

| Regra de negócio | Valor |
|---|---|
| Cupom válido | Buscado da coleção `/cupons` no Firestore via `getCupons()`; valida `status === 'ativo'` e pedido mínimo (`minOrder`/`minimo`); desconto usa `discountValue`/`valor`/`discount` do documento |
| Frete fixo | R$ 15,90 (quando há itens) |
| `addItem(item)` | Faz dedupe por `id`; se o item já existe, soma a quantidade |
| `updateQuantity(id, 0)` | Remove o item |
| `subtotal`, `totalItems`, `shipping`, `discount`, `total` | Calculados via `useMemo` automaticamente |
| `hydrating` | `true` enquanto a leitura inicial de `/users/{uid}/cart` não terminou |

**Persistência:** ao logar, hidrata de `/users/{uid}/cart`. Cada mutação (`addItem`, `removeItem`, `updateQuantity`, `clearCart`) sincroniza com Firestore se `user` estiver presente. Ao deslogar, limpa o state sem apagar o Firestore. Usuário não logado usa memória normalmente.

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
- `toggleFavorite(product)` — adiciona se não existe, remove se existe; sincroniza com Firestore se logado

**Persistência:** ao logar, hidrata de `/users/{uid}/favorites`. `toggleFavorite`, `addFavorite`, `removeFavorite` e `clearFavorites` sincronizam com Firestore quando `user` presente. Ao deslogar, limpa o state. Usuário não logado usa memória.

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
/produtos/{productId}            → catálogo de produtos (serviço: firestore.js)
/categorias/{categoryId}         → categorias gerenciadas pelo painel admin (getCategories em firestore.js)
/pedidos/{orderId}               → espelho de pedidos para o painel admin (addPedidoAdmin em firestore.js)
/users/{uid}                     → perfil do usuário
/users/{uid}/cart/{itemId}       → itens do carrinho
/users/{uid}/favorites/{itemId}  → favoritos
/users/{uid}/orders/{orderId}    → pedidos
```

### Schema de produto (`/produtos/{id}`)

O **painel admin** (`adm coisas de minas/edit-app.jsx`) salva os seguintes campos:

```
name: string           // "Queijo Canastra Maturado 60 dias"
description: string    // descrição curta (shortDesc do formulário admin)
longDesc: string       // descrição completa
producer: string       // "Fazenda São João"
location: string       // "Serra da Canastra · MG"
price: number          // 54.90  (sempre número)
promo: number | null   // preço promocional em R$ (ex: 46.67); null se sem promoção
stock: number          // quantidade em estoque
minStock: number       // estoque mínimo para alerta
category: string       // "queijos" | "cafes" | "doces" | etc.
subcategory: string    // subcategoria opcional
status: string         // "Ativo" | "Inativo" | "Rascunho"
visible: boolean       // aparece no app
featured: boolean      // aparece nos destaques da HomeScreen
allowReviews: boolean
verified: boolean      // produtor verificado
tags: string[]
meta: string           // meta descrição SEO
initials: string       // 2 primeiras letras do nome (ex: "QC")
```

O **app mobile** consome via `mapProduct()` em `src/services/firestore.js`, que adapta:
- `promo` → `sale` (% de desconto calculado: `round((1 - promo/price) * 100)`)
- `rating` / `reviewCount` → default `0` (ainda não implementado no admin)
- `weights` / `colors` → default `[]` (opcional; admin não salva ainda)
- `categoryLabel` → `raw.categoryLabel || raw.category` (admin não salva label ainda)
- Produtos com `visible: false` ou `status: 'Inativo'` são filtrados automaticamente

### Schema de banner (`/banners/{id}`)

```
title: string        // título exibido no carrossel (quando sem imageUrl)
subtitle: string     // subtítulo exibido abaixo do título
badge: string        // etiqueta no topo (ex: "DESTAQUE DA SEMANA")
bg: string           // cor hex do gradiente inicial (ex: "#52170c")
bg2: string          // cor hex do gradiente final (ex: "#6f2c1f")
imageUrl: string     // URL da imagem de fundo (opcional; sobrepõe o gradiente)
productId: string    // id do produto para navegar ao tocar (opcional)
active: boolean      // false = não exibe no app (filtrado por getBanners)
order: number        // ordem de exibição (crescente)
```

### Regras de Segurança (resumo)
| Coleção | Leitura | Escrita |
|---|---|---|
| `/produtos` | **Pública** (sem auth) | Só admin |
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
- **Dados mockados:** ainda existem em `CartContext.INITIAL_ITEMS` e `FavoritesContext.INITIAL_FAVORITES` — não persistem. O catálogo de produtos é gerenciado por `firestore.js` (Firestore sem fallback — empty state se vazio)
- **Preços:** sempre `number` no Firestore e nos objetos de produto. Use `fmt(p.price)` para exibir. Nunca armazene string "R$ 54,90"
- **Catálogo:** buscar produtos via funções de `src/services/firestore.js` — nunca hardcode arrays de produtos nas telas

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
✅ **ProductDetailScreen** — usa `route.params.product` com todos os campos reais; `addItem()` e `toggleFavorite()` conectados; total calculado com `fmt()`
✅ **Cupom `CANASTRA10`** → R$ 11,00 off (lógica no CartContext)
✅ **3 métodos de pagamento** simulados (PIX com countdown, Cartão, Boleto)
✅ **Frete** PAC/SEDEX
✅ **Timeline de rastreamento** com 5 etapas
✅ **Firestore** criado em modo de produção com regras de segurança publicadas
✅ **Regras do Firestore** — coleção `/produtos` com leitura pública + admin gerencia catálogo; usuário acessa só seus dados
✅ **`firebase.json` + `firestore.rules` + `firestore.indexes.json`** versionados no projeto
✅ **Deploy web** funcionando no Vercel com moldura de celular em desktop
✅ **`src/services/firestore.js`** — `getProducts`, `getProductsByCategory`, `searchProducts`, `getProductById`. Sem `SEED_PRODUCTS` nem `seedProducts` — sem dados mock no código do app
✅ **CategoriesScreen** — lista de categorias 100% dinâmica: derivada dos produtos ativos no Firestore via `buildCategories()`. Só exibe categorias com ≥1 produto. Empty state "Nenhuma categoria disponível ainda" quando Firestore vazio. Array fixo `CATEGORIES` removido; visual (emoji, cores) vem de `CAT_META` local com fallback para categorias novas
✅ **HomeScreen** — conectada ao Firestore; usa `useFavorites` + `useCart` dos contextos (removido estado local que violava Regra #6)
✅ **ListingScreen** — conectada ao Firestore com filtro por categoria e ordenação client-side
✅ **SearchScreen** — busca todos os produtos no mount, filtra localmente ao digitar
✅ **Coleção renomeada** de `/products` para `/produtos` (inglês → português) nas regras e no serviço
✅ **Schema reconciliado** — `mapProduct()` adapta campos do painel admin para o formato do app: `promo→sale`, `rating/reviewCount→0`, `weights/colors→[]`, filtro de `visible` e `status`
✅ **Fallback de dados mock removido** — `fetchAll()` não cai mais em `SEED_PRODUCTS` quando Firestore está vazio; retorna array vazio e as telas exibem empty state
✅ **ProductDetailScreen** — hero exibe foto real do produto (`images[0]` ou `imageUrl` do Firestore); gradiente `product.colors` mantido como placeholder quando sem foto
✅ **HomeScreen** — `ProductCard` exibe foto real (`images[0]` ou `imageUrl`) via `Image` com `absoluteFillObject` dentro do `LinearGradient`; gradiente permanece como placeholder quando sem foto. Coração de favorito corrigido: cor cinza (`C.subtle`) quando não favoritado, marrom (`C.brown` = `#52170c`) quando favoritado — conectado a `isFavorite`/`toggleFavorite` do `FavoritesContext`
✅ **CartScreen** — miniatura de item exibe foto real (`images[0]` ou `imageUrl`); fallback de cores corrigido (`colors ?? ['#e0c090','#a07030']`) para evitar crash quando produto do Firestore não tem `colors`
✅ **FavoritesContext** — `INITIAL_FAVORITES` (4 produtos mock) removido; favoritos iniciam vazios (`useState([])`)
✅ **CartContext** — `INITIAL_ITEMS` (3 produtos mock) removido; carrinho inicia vazio (`useState([])`); cupom inicia sem código (`''`) e sem aplicação (`false`)
✅ **Login com Google** — `auth.js` exporta `signInWithGoogle()` (`GoogleAuthProvider` + `signInWithPopup`; nativo retorna erro amigável sem crashar); `AuthContext` expõe `loginWithGoogle`; `LoginScreen` botão Google conectado com `loadingGoogle` state e mesma lógica de navegação pós-login. `console.log('clicou google')` e `console.log('chamando loginWithGoogle...')` adicionados em `handleGoogleSignIn` para diagnóstico — remover após confirmar funcionamento
✅ **LoginScreen** — link "Cadastre-se grátis" corrigido: saiu de `<Text onPress>` aninhado (não dispara no Android) para `<TouchableOpacity>` próprio navegando para `SignUp`; link "Continuar navegando sem login →" navega para `Main` via `replace`
✅ **FavoritesScreen** — card exibe foto real (`images[0]` ou `imageUrl`) com mesmo padrão `absoluteFillObject`; fallback de cores; preço formatado com `fmt()` para produtos reais (número) com compatibilidade para strings legadas
✅ **SignUpScreen** — bugfix crítico: botão "Criar minha conta grátis" agora chama `signup(email, pwd)` do `useAuth()` (antes navegava para `Main` sem criar usuário). Validações: nome/e-mail/senha obrigatórios, confirmação de senha, mínimo 6 caracteres. Após auth criado, chama `createUserProfile(uid, { name, email, phone })` para gravar `/users/{uid}` no Firestore. Loading state + mensagens de erro em PT-BR via `getAuthErrorMessage`.
✅ **`createUserProfile(uid, data)`** adicionado em `src/services/firestore.js` — grava `{ name, email, phone, createdAt }` em `/users/{uid}` via `setDoc` + `serverTimestamp()`
✅ **Persistência de favoritos** — `FavoritesContext` conectado ao Firestore: hidrata de `/users/{uid}/favorites` no login; `toggleFavorite`/`addFavorite`/`removeFavorite`/`clearFavorites` sincronizam com Firestore quando logado; desloga limpa só o state. Funções `getFavorites`, `setFavorite`, `deleteFavorite`, `clearFavoriteDocs` adicionadas ao `firestore.js`
✅ **Persistência de carrinho** — `CartContext` conectado ao Firestore: hidrata de `/users/{uid}/cart` no login com estado `hydrating`; `addItem`/`removeItem`/`updateQuantity`/`clearCart` sincronizam com Firestore quando logado; desloga limpa só o state. Funções `getCartItems`, `setCartItem`, `deleteCartItem`, `clearCartItems` adicionadas ao `firestore.js`
✅ **Pedidos salvos no Firestore** — `addOrder(uid, orderData)` grava em `/users/{uid}/orders/{Date.now()}`; `getOrder(uid, orderId)` lê o pedido pelo id. Ambas as funções adicionadas ao `firestore.js`
✅ **CheckoutScreen conectado ao carrinho real** — usa `useCart()` para `subtotal`, `totalItems`, `discount`, `couponApplied`, `clearCart`; desconto só exibido quando cupom aplicado; `shippingCost`/`checkoutTotal` calculados localmente com base na escolha PAC/SEDEX. Botão "Confirmar Pagamento" chama `addOrder(user?.uid, {...})`, limpa o carrinho e navega para `OrderConfirmation` passando `{ orderId }`. Visitante: pedido não salvo no Firestore mas fluxo segue normalmente
✅ **OrderConfirmationScreen conectada ao Firestore** — recebe `orderId` via `route.params`; busca pedido com `getOrder()`; exibe número real `#XXXXXX` (últimos 6 dígitos do timestamp), data formatada, itens reais com `fmt(price * qty)`, total real e método de pagamento real. Fallback para dados mock quando visitante, erro ou `orderId` ausente. `ActivityIndicator` durante carregamento
✅ **Seed do Firestore ajustado** — `seedDadosIniciais()` em `adm coisas de minas/firestore.js` atualizado: produtos agora incluem `visible`, `featured`, `description`, `longDesc`, `producer`, `location`, `imageUrl`, `images`; campo `category` corrigido para minúsculas sem acento (`'queijos'`, `'cafes'`, `'doces'`, `'embutidos'`, `'bebidas'`, `'conservas'`, `'padaria'`, `'mel'`); destaques: QJ-001 e CF-002 com `featured: true`
✅ **ProfileScreen com dados reais** — nome, e-mail e "Membro desde" exibem dados reais do Firebase Auth + perfil do Firestore; stats conectados a `orders.length` (pedidos reais) e `count` do `FavoritesContext` (favoritos reais); pedidos recentes carregados do Firestore e ordenados por data; `ActivityIndicator` durante carregamento; itens de menu com texto completo (removido `marginLeft: 'auto'` do chevron que causava truncamento)
✅ **`getUserProfile(uid)`** adicionado em `src/services/firestore.js` — `getDoc` de `/users/{uid}`; retorna dados do perfil ou `null`
✅ **`getUserOrders(uid)`** adicionado em `src/services/firestore.js` — `getDocs` de `/users/{uid}/orders`; retorna array de pedidos
✅ **CategoriesScreen conectada à coleção `/categorias`** (2026-06-07) — `getCategories()` adicionado em `firestore.js`: lê `/categorias`, filtra `visible !== false` e sem `parentId`, cruza com produtos ativos para calcular `count`, ordena por `order`. `CategoriesScreen` reescrita para usar `getCategories()` em vez de derivar dos produtos; usa campos `cat.name`, `cat.icon`, `cat.grad` salvos pelo painel admin; gradiente gerado a partir de `cat.grad` via `gradientColors()`; chevron adicionado nos cards
✅ **HomeScreen — chips de categoria conectados ao Firestore** (2026-06-07) — removido array `CATS` hardcoded; adicionado `useState([])` para `categories` e `useEffect` que chama `getCategories()`; `cat` inicializado com `''`; `CATS.map` substituído por `categories.map` usando `c.icon` e `c.name` do Firestore; toque no chip navega para `Listing` passando o objeto `category` real
✅ **HomeScreen — carrossel conectado à coleção `/banners`** (2026-06-08) — `const SLIDES` hardcoded removido; `getBanners()` adicionado em `firestore.js` (lê `/banners`, filtra `active !== false`, ordena por `order`); `HomeScreen` carrega banners via `useEffect` + `useState([])`; intervalo do slide usa `banners.length` dinamicamente; bloco JSX do banner substituído: exibe `imageUrl` via `Image absoluteFillObject` quando presente, senão gradiente com `badge`/`title`/`subtitle`; toque no banner navega para `ProductDetail` se `productId` estiver definido; dots refletem quantidade real de banners; banner some se coleção estiver vazia. `getProductById` importado junto
✅ **HomeScreen — correções visuais do banner com imagem** (2026-06-08) — `bannerCircle` (círculo decorativo de gradiente) suprimido quando banner tem `imageUrl` (evita sobreposição desnecessária); altura do banner aumentada de `minHeight: 152` para `height: 200` para melhor aproveitamento da foto; `padding: 18` removido do estilo `banner` (imagem ocupa 100% via `absoluteFillObject`)
✅ **ProductDetailScreen — badge de categoria com nome real** (2026-06-08) — badge exibia o ID do Firestore (`product.category`) em vez do nome legível; corrigido com `useEffect` que chama `getAllCategories()` e busca `cats.find(c => c.id === product.category)`; resultado armazenado em `catName`; badge exibe `catName || 'Produto'`; função `getCatEmoji` removida (não mais usada)
✅ **`getAllCategories()`** adicionado em `src/services/firestore.js` (2026-06-08) — retorna todas as categorias da coleção `/categorias` sem filtro de `parentId` ou `visible`, permitindo resolver o nome de subcategorias pelo `id`; `getCategories()` mantida intacta (usada por `CategoriesScreen` e `HomeScreen`)
✅ **ProductDetailScreen — descrição completa com "Ler mais / Ler menos"** (2026-06-08) — adicionado estado `expanded`; seção "Sobre o produto" exibe `description` (curta) sempre visível e `longDesc` (completa) expandível via botão "Ler mais →" / "Ler menos ↑"; seção visível quando ao menos um dos campos existe; estilos `lerMaisBtn` e `lerMaisText` adicionados (cor `C.terra`)
✅ **ProductDetailScreen — longDesc respeita parágrafos** (2026-06-08) — `longDesc` renderizada com `split('\n').filter(l => l.trim()).map(...)`, cada parágrafo em um `<Text>` separado dentro de um `<View>`; linhas em branco ignoradas; `marginBottom: 8` entre parágrafos
✅ **ProductDetailScreen — seção "Produtos similares"** (2026-06-08) — grade 2 colunas exibida após o card de entrega; busca até 8 produtos da mesma categoria (ou subcategoria) via `getSimilarProducts()`; cada card exibe foto real ou gradiente placeholder (aspectRatio 1:1), nome (2 linhas) e preço; toque usa `navigation.replace('ProductDetail', { product: p })` para navegar entre similares; layout `flexWrap` igual ao estilo da Home
✅ **`getSimilarProducts(categoryId, excludeId)`** adicionado em `src/services/firestore.js` (2026-06-08) — filtra produtos com `category` ou `subcategory` igual ao `categoryId`, exclui o produto atual pelo `id`, retorna até 8 resultados
✅ **phosphor-react-native + react-native-svg instalados** (2026-06-13) — `npx expo install phosphor-react-native react-native-svg`; `react-native-svg` já estava presente como módulo nativo compatível com SDK 56; `phosphor-react-native` adicionado com 14 pacotes. Biblioteca disponível para uso em qualquer tela com `import { IconName } from 'phosphor-react-native'`
✅ **HomeScreen — animação de slide com sobreposição no carrossel** (2026-06-13) — adicionados `nextSlide` (state) e `nextSlideAnim` (Animated.Value ref); `goToSlide` agora roda `Animated.parallel` com ambas as animações simultaneamente (400 ms): banner atual sai para a esquerda enquanto o próximo entra pela direita; ao fim, `slide` é atualizado, `nextSlide` zerado e ambos os valores de animação resetados para 0; estrutura JSX do banner reestruturada com `View overflow:hidden` contendo o banner atual e o próximo (`position:absolute`) renderizados em paralelo durante a transição; guarda `if (next === slideRef.current) return` evita animações duplicadas
✅ **HomeScreen — fix stale closure no carrossel de banners** (2026-06-13) — adicionado `slideRef = React.useRef(0)` para rastrear o slide atual fora do closure; `goToSlide(next)` atualiza `slideRef.current = next` antes de animar; `setInterval` usa `slideRef.current` em vez de `slide` — elimina o bug onde o carrossel ficava preso no banner inicial
✅ **HomeScreen — animação de slide horizontal no carrossel de banners** (2026-06-13) — importados `Animated` e `Dimensions` do React Native; adicionados `screenWidth` (largura útil descontando padding) e `slideAnim` (`Animated.Value`); função `goToSlide(next)` anima saída para a esquerda (250 ms), troca o slide, anima entrada da direita (250 ms) via `useNativeDriver: true`; `setInterval` do carrossel atualizado para chamar `goToSlide` em vez de `setSlide` diretamente; `LinearGradient` do banner envolvido em `<Animated.View style={{ transform: [{ translateX: slideAnim }] }}>` para aplicar a translação; dots atualizam via `goToSlide(i)` ao toque
✅ **CategoriesScreen — ícones Phosphor substituem emoji/gradiente** (2026-06-13) — importados `Jar`, `Cake`, `Pepper`, `FireSimple`, `Bread`, `Wine`, `ShoppingBag` de `phosphor-react-native`; função `getCatIcon(name)` mapeia o nome da categoria para o ícone correspondente com fallback `ShoppingBag`; bloco `LinearGradient + Text emoji` substituído por `View catIconWrap` com fundo `#fdf5ec` e `borderRadius: 12`; import de `LinearGradient` e função `gradientColors` removidos da tela; estilo `catCard` mantido sem `overflow: hidden` (desnecessário sem gradiente)
✅ **ListingScreen — 3 correções visuais** (2026-06-13) — título agora usa `category?.name || category?.label` (corrige exibição com objetos do Firestore); `paddingTop: 8` adicionado ao `filtersRow` (remove espaço vazio abaixo do header); array `FILTERS` migrado para objetos `{ key, label }` com `.map` e `useMemo` atualizados para usar `.key` (evita corte do chip "Melhor Avaliado")
✅ **ListingScreen — reescrita completa com FlatList** (2026-06-13) — arquivo reescrito do zero: `ScrollView` substituído por `FlatList` com `numColumns={2}` e `columnWrapperStyle` para grid de 2 colunas sem espaço vazio; filtros também migrados para `FlatList` horizontal; `renderProduct` extraído como função separada; empty state com ícone `cube-outline` adicionado; `setLoading(true)` no início do `useEffect`; `.catch(() => setProducts([]))` adicionado para resiliência; chaves dos filtros migradas para lowercase (`todos`, `vendidos`, `preco`, `maior`)
✅ **ListingScreen — ajustes de filtro e header** (2026-06-13) — filtro "Melhor Avaliado" substituído por "Maior Preço" (`key: 'maior'`, ordena por `b.price - a.price`); botão de opções no header restaurado com `TouchableOpacity` e ícone `options-outline` (substituía `View` fantasma)
✅ **HomeScreen — chips de categoria com ícones Phosphor** (2026-06-13) — emojis substituídos por ícones Phosphor (`Jar`, `Cake`, `Pepper`, `FireSimple`, `Bread`, `Wine`, `ShoppingBag`); função `getCatIcon(name, size, color)` adicionada após os imports; cor do ícone muda para `#fff` quando chip ativo (`on = true`); estilo `catEmoji` removido do StyleSheet
✅ **ListingScreen — foto real nos cards de produto** (2026-06-13) — `Image` adicionado ao import do React Native; dentro do `LinearGradient` de cada card, IIFE renderiza `<Image source={{ uri: img }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />` quando `p.images[0]` ou `p.imageUrl` existe; gradiente permanece como placeholder quando sem foto
✅ **EditProfileScreen** (2026-06-13) — tela `src/screens/EditProfileScreen.jsx` criada: carrega perfil do Firestore via `getUserProfile()`, formulário com campos nome, WhatsApp, data de nascimento (seção "Dados pessoais") e CEP, rua, número, complemento, bairro, cidade, estado (seção "Endereço de entrega"); salva via `updateUserProfile(uid, { merge: true })`; avatar com iniciais e botão "Alterar foto" (UI apenas, sem upload); `KeyboardAvoidingView` para iOS; `ActivityIndicator` durante carga e salvamento. `updateUserProfile(uid, data)` adicionado em `firestore.js` (usa `setDoc` com `merge: true`). Rota `EditProfile` registrada em `AppNavigator.jsx`. Botão lápis no `ProfileScreen` conectado a `navigation.navigate('EditProfile')`
✅ **Navegação para subcategorias** (2026-06-13) — `getSubcategories(parentId)` adicionado em `firestore.js`: lê `/categorias`, filtra por `parentId` e `visible !== false`, calcula `count` de produtos com `category === parentId && subcategory === c.id`; `SubcategoryScreen.jsx` criada em `src/screens/`: exibe header com botão voltar, card "Todos de {categoria}" no topo que navega para `Listing`, lista de subcategorias com ícones Phosphor e chevron, empty state com CTA direto para `Listing`; subcategoria navega para `Listing` passando `{ ...sub, isSubcategory: true, parentId }`; `AppNavigator.jsx` registra `<Stack.Screen name="Subcategory" component={SubcategoryScreen} />`; `CategoriesScreen` atualizado: `onPress` agora navega para `Subcategory` em vez de `Listing`
✅ **ProfileScreen — navegação ao item Favoritos no menu do perfil** (2026-06-14) — array `MENU` atualizado com campo `screen` em cada item (`null` para itens sem tela, `'Favoritos'` para o item de favoritos); `TouchableOpacity` do menu recebe `onPress` que chama `navigation.navigate('Main', { screen: item.screen })` quando `item.screen` está definido; demais itens (Pedidos, Endereços, Pagamento, Notificações etc.) permanecem com `screen: null` e não navegam até serem implementados
✅ **HelpScreen** (2026-06-14) — FAQ em acordeão (8 perguntas frequentes) com toggle de abertura/fechamento por item; botão WhatsApp abre `wa.me` com mensagem pré-preenchida; registrada no `AppNavigator` como `<Stack.Screen name="Help">`; item "Ajuda e Suporte" no array `MENU` do `ProfileScreen` atualizado para `screen: 'Help', target: 'stack'`
✅ **MyOrdersScreen + navegação no menu do ProfileScreen** (2026-06-14) — `src/screens/MyOrdersScreen.jsx` criada: lista todos os pedidos do usuário (`getUserOrders`) com filtros por status (Todos / Pendente / Em Transporte / Entregue); cada card exibe ID curto, data, badge de status colorido, contagem de itens, método de pagamento, total e link "Rastrear pedido"; estados de loading, vazio (com CTA "Explorar produtos") e visitante não logado. Registrada no `AppNavigator` como `<Stack.Screen name="MyOrders">`. Array `MENU` do `ProfileScreen` atualizado com campo `target: 'stack' | 'tab' | null`; `onPress` diferencia `stack` (`navigation.navigate(screen)`) de `tab` (`navigation.navigate('Main', { screen })`) para rotear corretamente
✅ **Google Login: signInWithPopup → signInWithRedirect** (2026-06-14) — `src/services/auth.js` atualizado: import de `signInWithPopup` trocado por `signInWithRedirect` + `getRedirectResult`; `signInWithGoogle` agora chama `signInWithRedirect`; nova função `getGoogleRedirectResult()` exportada. `src/context/AuthContext.jsx` atualizado: importa `getGoogleRedirectResult`; `useEffect` adicionado para capturar o resultado do redirect ao montar o provider (compatibilidade com navegadores mobile que bloqueiam popups)
✅ **Fix: AuthContext captura corretamente o usuário do getRedirectResult** (2026-06-14) — `useEffect` do redirect result reescrito: agora trata o `.then(result)` e chama `setUser(result.user)` quando o usuário retorna após o redirect do Google; erros `auth/no-auth-event` e `auth/argument-error` suprimidos (esperados quando não há redirect em andamento); demais erros continuam logados via `console.warn`
✅ **Google Login reimplementado com expo-auth-session** (2026-06-14) — `expo-auth-session`, `expo-crypto` e `expo-web-browser` instalados; `src/services/auth.js` reescrito: remove `signInWithRedirect`/`getRedirectResult`/`signInWithGoogle`, adiciona `signInWithGoogleCredential(idToken)` (usa `GoogleAuthProvider.credential` + `signInWithCredential`), `WebBrowser.maybeCompleteAuthSession()` no topo; `src/screens/LoginScreen.jsx`: adiciona `Google.useAuthRequest({ webClientId })`, `useEffect` que processa `response` e chama `signInWithGoogleCredential`, `handleGoogleSignIn` simplificado para `promptAsync()`; `src/context/AuthContext.jsx`: remove `signInWithGoogle`, `getGoogleRedirectResult` e `useEffect` de redirect — `loginWithGoogle` removido do contexto; `app.json` atualizado com plugin `expo-web-browser` (adicionado pelo `expo install`)
✅ **Fix: captura correta do id_token do Google na web via expo-auth-session** (2026-06-14) — `useEffect` que processa `response` atualizado: `id_token` agora buscado com fallback `response.params?.id_token ?? response.authentication?.idToken` para cobrir diferenças de comportamento entre web e nativo; erro explícito exibido quando token não está presente em nenhum dos caminhos
✅ **Fix: Google Auth configurado com responseType id_token para funcionar na web** (2026-06-14) — `Google.useAuthRequest` atualizado com `responseType: 'id_token'` e `usePKCE: false`; necessário na web para que o Google retorne o `id_token` diretamente nos `response.params` em vez de um `code` que exigiria troca server-side
✅ **PrivacyScreen** (2026-06-14) — tela `src/screens/PrivacyScreen.jsx` criada com 3 seções: (1) "Segurança da conta" com ações "Redefinir senha" (modal que chama `sendPasswordResetEmail` do Firebase e exibe feedback de sucesso) e "Excluir minha conta" (modal com reautenticação por senha via `reauthenticateWithCredential` + `deleteUser`, seguido de `logout()`); (2) "Política de Privacidade" em acordeão com 6 tópicos cobrindo coleta de dados, uso, armazenamento, direitos LGPD, cookies e contato; (3) nota de rodapé sobre LGPD. `sendPasswordResetEmail(email)` e `deleteAccount(password)` adicionados em `src/services/auth.js`. Rota `Privacy` registrada no `AppNavigator.jsx`. Item "Privacidade e Segurança" no array `MENU` do `ProfileScreen` atualizado para `screen: 'Privacy', target: 'stack'`
✅ **NotificationsScreen** (2026-06-15) — tela `src/screens/NotificationsScreen.jsx` criada com 6 toggles de preferências de notificação agrupados em 3 seções (Pedidos, Produtos, Geral); preferências carregadas de `/users/{uid}/settings/notifications` no mount e salvas otimisticamente a cada toggle via `setDoc` com `merge: true`; `ActivityIndicator` durante carregamento; card informativo sobre push notifications futuras; rota `Notifications` registrada no `AppNavigator.jsx`; item "Notificações" no array `MENU` do `ProfileScreen` atualizado para `screen: 'Notifications', target: 'stack'`
✅ **Fix: cor dos toggles de notificação** (2026-06-15) — `Switch` no `ToggleItem` de `NotificationsScreen.jsx` atualizado: `thumbColor` explicitado como `value ? '#fff' : '#fff'`; `style={{ transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] }}` adicionado para escala levemente menor; `trackColor` com `C.terra` mantido para estado ativo
✅ **Fix: espaçador invisível no header da NotificationsScreen** (2026-06-15) — espaçador do lado direito do header trocado de `<View style={styles.backBtn} />` (que exibia fundo branco e borda aparecendo como botão fantasma) para `<View style={{ width: 40 }} />` transparente; título permanece centralizado
✅ **AddressesScreen** (2026-06-15) — tela `src/screens/AddressesScreen.jsx` criada com gerenciamento de múltiplos endereços: lista endereços salvos em `/users/{uid}/addresses` com badge "Padrão", chips de tipo (Casa/Trabalho/Outro), botões editar/excluir e ação "Definir como padrão"; formulário em bottom sheet animado com busca automática de endereço via ViaCEP ao digitar o CEP; empty state com CTA; estado de visitante não logado. Funções `getAddresses`, `saveAddress`, `deleteAddress`, `setDefaultAddress` adicionadas em `firestore.js`. Rota `Addresses` registrada no `AppNavigator.jsx`. Item "Endereços" no `MENU` do `ProfileScreen` atualizado para `screen: 'Addresses', target: 'stack'`
✅ **Fix: outline de foco removido nos inputs da AddressesScreen** (2026-06-15) — `outlineStyle: 'none'` adicionado ao estilo `fieldInput` no `StyleSheet` de `AddressesScreen.jsx`; remove o outline preto padrão do navegador web nos campos de texto
✅ **Fix: regras do Firestore atualizadas** (2026-06-15) — `firestore.rules` atualizado com regras para subcoleções `/users/{uid}/addresses` e `/users/{uid}/settings` (ambas `allow read, write: if isOwner(uid)`); cabeçalho do arquivo atualizado para documentar as novas coleções; regras devem ser publicadas manualmente via Firebase Console ou `firebase deploy --only firestore:rules`
✅ **Fix: exclusão de endereços na AddressesScreen** (2026-06-15) — `handleDelete` corrigido: `await load()` substituído por atualização otimista `setAddresses(prev => prev.filter(a => a.id !== id))`; evita reload desnecessário do Firestore após excluir; erro capturado com `console.warn` e mensagem mais descritiva
✅ **Fix: confirmação de exclusão de endereço compatível com web e mobile** (2026-06-15) — `handleDelete` reescrito com bifurcação `Platform.OS === 'web'`: na web usa `window.confirm()` (nativo do browser); no mobile usa `Alert.alert` com `new Promise(resolve => ...)` para aguardar a resposta do usuário antes de executar a exclusão; elimina o problema em que o `Alert` no mobile não aguardava a confirmação
✅ **Modal de confirmação personalizado para excluir endereço** (2026-06-15) — `window.confirm` e `Alert.alert` substituídos por modal React Native customizado em `AddressesScreen.jsx`: estado `confirmId` guarda o id pendente de exclusão; `handleDelete` apenas seta `confirmId`; `confirmDelete` executa a exclusão e reseta o estado; modal com ícone de lixeira, título, descrição e botões "Cancelar" / "Excluir" estilizados; funciona identicamente em web, iOS e Android sem APIs nativas
✅ **Fix: proporção do banner na HomeScreen** (2026-06-15) — estilo `banner` alterado de `height: 200` fixo para `width: '100%', aspectRatio: 2.13` (equivalente a 1170/550), permitindo que a altura seja calculada automaticamente conforme a proporção real das imagens de banner; `resizeMode` da `Image` do banner (atual e próximo, dentro da animação de slide) trocado de `"cover"` para `"contain"` para exibir a imagem completa sem cortes
✅ **SplashScreen redesenhada** (2026-06-15) — SplashScreen reescrita com fundo escuro marrom (`#52170c`), glow dourado atrás do logo, ornamentos animados (linhas + losango dourado) acima e abaixo do logo, tagline em itálico ("Delícias da Canastra e outros trem…") com fade-in + translateY, e logo `assets/logo-cream.png` (versão clara do logo, para contraste com o fundo escuro) substituindo o `assets/logo.png` anterior; duração total da splash aumentada de 3000ms para 3200ms para acomodar as novas animações
✅ **Fix: glow e proporção da logo na SplashScreen** (2026-06-15) — `View` do glow dourado removida do JSX e estilo `glow` removido do StyleSheet (efeito não estava funcionando bem visualmente); proporção da logo corrigida de `width * 0.72` / `(767/1546)` para `width * 0.65` / `(920/1100)`, compatível com as dimensões reais do `logo-cream.png`; fundo do `container` passou de `backgroundColor` sólido para um `LinearGradient` (`#6f2c1f → #52170c → #3a0f08`, vertical) envolvendo todo o conteúdo da tela, criando um degradê sutil em vez de cor chapada
✅ **Fix: proporção quadrada da logo-cream na SplashScreen** (2026-06-15) — estilo `logo` ajustado novamente: `width * 0.65` / `(920/1100)` substituído por `width * 0.60` para largura **e** altura, já que `logo-cream.png` é aproximadamente quadrada
✅ **`assets/logo-cream.png` atualizada** (2026-06-15) — arquivo substituído por nova versão com logo na cor dourada (`#d8a360`-ish) e fundo transparente (em vez da versão clara/cream usada anteriormente sobre fundo escuro); usada pela `SplashScreen`
✅ **`assets/logo-cream.png` — versão final** (2026-06-15) — arquivo substituído novamente pela versão final 1080x1080 com fundo transparente e cor dourada (ajuste fino de cor/resolução em relação à versão anterior); usada pela `SplashScreen`
✅ **`assets/logo-cream.png` — fundo verdadeiramente transparente** (2026-06-15) — arquivo substituído mais uma vez pela versão com background removido via ferramenta dedicada (`-removebg-preview`), corrigindo resquícios de fundo branco/sólido que ainda apareciam nas versões anteriores; usada pela `SplashScreen`
✅ **`assets/logo-cream.png` — versão final definitiva** (2026-06-16) — arquivo substituído pela versão `Alterar_cor_da_logo__3_-removebg-preview.png`: novo refinamento de cor dourada com fundo 100% transparente removido via removebg; usada pela `SplashScreen`
✅ **Fix: getProductsByCategory corrigida para filtrar por categoria pai e subcategoria** (2026-06-16) — query Firestore com `where('category', '==')` substituída por filtro client-side sobre `fetchAll()`: agora retorna produtos onde `p.category === categoryId || p.subcategory === categoryId`, permitindo que a `ListingScreen` exiba produtos corretamente ao navegar via `SubcategoryScreen`
✅ **Fix: emojis removidos das categorias populares na SearchScreen** (2026-06-16) — chips de categoria exibem apenas `c.name` sem o emoji do campo `icon`
✅ **Fix: imagem real nos resultados da SearchScreen** (2026-06-16) — `LinearGradient` fixo substituído por bloco condicional: exibe `Image` com `images[0]` ou `imageUrl` quando disponível; gradiente permanece como placeholder quando sem foto; `overflow: hidden` adicionado ao `resultImg` para `borderRadius` funcionar no iOS
✅ **Fix: outline removido no input de busca da SearchScreen** (2026-06-16) — `outlineStyle: 'none'` adicionado ao estilo `searchText`; remove o outline preto padrão do navegador web no campo de busca
✅ **SearchScreen — histórico real e categorias do Firestore** (2026-06-16) — constantes hardcoded `RECENT` e `POPULAR` removidas; histórico de buscas salvo no `AsyncStorage` (chave `search_history`): deduplicado, limitado a 5 entradas, salvo automaticamente 1,5s após o usuário parar de digitar, botão "Limpar" apaga do AsyncStorage e do estado; seção "Buscas Recentes" só exibida quando há histórico; "Categorias Populares" carregadas do Firestore via `getCategories()` (até 6 itens, com emoji/ícone do campo `icon`), só exibida quando Firestore retorna resultados
✅ **NotificationsPanel** (2026-06-16) — `src/screens/NotificationsPanel.jsx` criado: painel de notificações com lista ordenada por data (`/users/{uid}/notifications`); boas-vindas automática criada no Firestore se coleção estiver vazia; marcar como lida ao tocar (otimístico + sync Firestore); botão "Marcar todas" com `ActivityIndicator`; badge de ponto azul para não lidas; barra lateral colorida nos cards não lidos; `TYPE_CONFIG` mapeia tipos (`welcome`, `order`, `promo`, `system`) para ícone e cor; helper exportado `getUnreadCount(uid)` para uso futuro em badges; botão sino da `HomeScreen` conectado via `navigation.navigate('NotificationsPanel')`; rota registrada no `AppNavigator.jsx`
✅ **NotificationsPanel: limpeza automática de notificações** (2026-06-16) — `deleteDoc` adicionado ao import do Firestore; constantes `MAX_NOTIFICATIONS = 20` e `THIRTY_DAYS_MS`; função `cleanOldNotifications(uid, docs)` apaga notificações com mais de 30 dias e, se ainda restar mais de 20, remove as mais antigas; chamada na função `load` antes de setar os itens; `freshSnap` relido após limpeza para garantir lista atualizada
✅ **Fix: mensagem de boas-vindas atualizada no NotificationsPanel** (2026-06-16) — `WELCOME_NOTIF.title` atualizado para `'Bem-vindo ao Empório Coisas de Minas! 🎉'` e `body` para texto mais acolhedor; afeta apenas novos usuários sem notificações (criação automática ao abrir o painel pela primeira vez)
✅ **Fix: SubcategoryScreen navega direto para Listing quando não há subcategorias** (2026-06-21) — `useEffect` atualizado: se `getSubcategories()` retorna array vazio, chama `navigation.replace('Listing', { category: parentCategory })` imediatamente, pulando a tela de subcategorias; caso contrário exibe a lista normalmente
✅ **Fix: "Ver todos" de Novidades e Destaques filtra corretamente na ListingScreen** (2026-06-16) — `HomeScreen`: `sort: 'newest'` → `filter: 'new'` no `onSeeAll` de Novidades; `ListingScreen`: `useEffect` atualizado para tratar `filter === 'new'` (ordena por `createdAt` desc, limita 10) e `filter === 'featured'` (filtra `p.featured`); título do header derivado do filtro: "Novidades", "Destaques" ou nome da categoria
✅ **Fix: ícones Phosphor nas categorias da HomeScreen** (2026-06-16) — emojis substituídos por ícones Phosphor (`Jar`, `Cake`, `Pepper`, `FireSimple`, `Bread`, `Wine`, `ShoppingBag`); função `getCatIcon(name, size, color)` idêntica à `CategoriesScreen`; `catEmoji` style removido do uso (mantido no StyleSheet mas não referenciado)
✅ **Fix: emoji das categorias na HomeScreen** (2026-06-16) — `catCircle` aumentado para 64×64 com `borderRadius: 32` e fundo `C.softCream` (sem sombra); `catEmoji` com `fontSize: 28`, `lineHeight: 36` e `textAlign: 'center'` para centralização correta do emoji
✅ **Fix: categorias com nome completo e banner preenchendo o espaço** (2026-06-16) — `catName` com `numberOfLines={2}` e `lineHeight: 15`; `catItem` com `width: 72` para acomodar 2 linhas; imagem do banner com `resizeMode="cover"` e posição `absoluteFill` (`top/left/right/bottom: 0`, `width/height: 100%`) para preencher o container inteiro
✅ **HomeScreen redesenhada** (2026-06-16) — arquivo reescrito com nova arquitetura: `ProductCard` (lista horizontal) e `ProductGridCard` (grade 2 colunas) como componentes separados; `BannerCarousel` isolado com `ScrollView` horizontal paginado e timer auto-restart após interação manual; `SectionHeader` reutilizável; saudação dinâmica por horário (`greeting()`); seções condicionais — Banners, Categorias (emoji do Firestore), Destaques (`featured: true`), Novidades (ordenadas por `createdAt`), Mais Vendidos; badge do sino exibe count numérico real (`getUnreadCount`) com fallback `'9+'`; `addToCart` corrigido para `addItem` (nome real do CartContext); cards e grades navegam para `ProductDetail` via `onPress`
✅ **Fix: espaço entre localização e saudação na HomeScreen** (2026-06-21) — `greetingWrap.marginTop` reduzido de `16` para `6` para aproximar a saudação da barra de localização acima
✅ **Fix: botão do carrinho na FavoritesScreen** (2026-06-21) — `useCart` importado; `addItem` conectado ao `onPress` do `cartBtn`; botão agora adiciona o produto ao carrinho com `qty: 1`
✅ **HomeScreen: seções Doces em Geral e Antepastos, Patês e Pastas substituem Mais Vendidos** (2026-06-21) — seção "Mais Vendidos" removida; dois novos `useState` (`doces`, `antepastos`) e carregamento via `getProductsByCategory('TyLolkWBnAXMLgxCwL75')` e `getProductsByCategory('gAFuanOffULW48wD066v')` adicionados ao `Promise.all` do `useEffect`; cada seção exibe grade 2 colunas de `ProductGridCard` com até 4 itens; "Ver todos" navega para `SubcategoryScreen` com o ID da categoria correspondente
✅ **Fix: botão "+" nos cards da HomeScreen navega para ProductDetail** (2026-06-21) — `onPress` do botão "+" em `ProductCard` e `ProductGridCard` alterado de `onAddCart(product)` para `onPress(product)`, fazendo o "+" abrir a tela de detalhes do produto em vez de adicionar ao carrinho diretamente
✅ **Fix: botão "-" no CartScreen remove item quando quantidade chega a 1** (2026-06-21) — `onPress` do botão "-" em `CartScreen` alterado de `updateQuantity(it.id, Math.max(1, it.qty - 1))` (que travava em 1) para lógica condicional: se `it.qty <= 1` chama `removeItem(it.id)`, senão `updateQuantity(it.id, it.qty - 1)`; produto é removido automaticamente ao zerar
✅ **EditProfileScreen: seção de endereço removida** (2026-06-21) — estados de endereço (`cep`, `street`, `number`, `complement`, `neighborhood`, `city`, `state`), preenchimento no `useEffect` e card "Endereço de entrega" removidos; `handleSave` atualizado para salvar apenas `name`, `phone` e `birthDate`; endereços gerenciados pela `AddressesScreen` dedicada
✅ **Fix: outline removido no input de cupom do CartScreen** (2026-06-21) — `outlineStyle: 'none'` adicionado ao estilo `couponText`; remove o outline preto padrão do navegador web no campo de cupom
✅ **Fix: outline preto removido do TextInput no LoginScreen** (2026-06-29) — `outlineStyle="none"` adicionado como prop direta no `TextInput` do componente `Field` em `LoginScreen.jsx`; remove o outline preto padrão do navegador web nos campos de e-mail e senha da tela de login
✅ **Fix: outline preto removido do TextInput no SignUpScreen** (2026-06-29) — `outlineStyle="none"` adicionado como prop direta no `TextInput` do componente `Field` em `SignUpScreen.jsx`; remove o outline preto padrão do browser na web nos campos do formulário de cadastro
✅ **Integração Melhor Envio + endereço real no CheckoutScreen** (2026-06-21) — `CheckoutScreen` reescrito: (1) endereço padrão carregado do Firestore via `getAddresses(uid)` (fallback para o primeiro da lista); exibido com label, logradouro, cidade/estado/CEP reais; botão "Alterar" navega para `AddressesScreen`; (2) frete calculado via API sandbox do Melhor Envio (`POST /api/v2/me/shipment/calculate`) com CEP de origem fixo `37900-900`; opções filtradas (`!opt.error`), ordenadas por preço, primeira selecionada automaticamente; loading spinner, mensagem de erro e botão "Tentar novamente"; (3) `shippingCost` derivado do preço real da opção selecionada; (4) `handleConfirm` salva `shippingMethod`, `shippingCompany`, `shippingCost` e `deliveryAddress` reais no Firestore; token Melhor Envio como constante com `// TODO: mover para variável de ambiente`
✅ **Proxy Vercel para cálculo de frete — resolve CORS** (2026-06-21) — `api/calcular-frete.js` criada como Vercel Serverless Function: recebe POST do app, encaminha para API sandbox do Melhor Envio com token de autenticação no servidor (token nunca exposto ao browser); headers CORS configurados para aceitar chamadas da origem do app; `vercel.json` atualizado com rewrite `/api/(.*)` antes do catch-all `/*→index.html`; `CheckoutScreen` atualizado para chamar `/api/calcular-frete` em vez da URL direta do Melhor Envio, sem headers de autenticação no cliente
✅ **Frete com peso e dimensões reais do carrinho** (2026-06-22) — `mapProduct()` em `firestore.js` agora inclui `weight`, `weightHeight`, `weightWidth`, `weightLength` (campos salvos pelo painel admin, com default `0`). `CheckoutScreen.calculateShipping` busca os dados reais de cada item via `getProductById` (paralelo com `Promise.all`), acumula `totalWeight` (kg × qty), `maxHeight`, `maxWidth` e `totalLength` (cm × qty), respeita os mínimos exigidos pelo Melhor Envio (`weight≥0.1`, `height≥2`, `width≥11`, `length≥16`) e passa o pacote real no body do POST; fallback automático para valores genéricos em caso de erro de leitura. Console.logs de debug do `useEffect` do CEP removidos.
✅ **Hardening do cálculo de frete + diagnóstico do token** (2026-06-22) — `api/calcular-frete.js`: agora repassa o **status real** do Melhor Envio (ex.: `401 Unauthenticated`) em vez de mascarar tudo como `200`, loga a resposta upstream e suporta `MELHOR_ENVIO_TOKEN` via variável de ambiente do Vercel (constante vira fallback); erro de rede retorna `502`. `CheckoutScreen.calculateShipping`: adicionado **timeout de 15s** via `AbortController` (o spinner "Calculando frete…" nunca mais trava indefinidamente), logs detalhados em cada etapa (`[Frete] ...`), e a mensagem de erro agora surfaceia o motivo real retornado pela API. **Diagnóstico:** o token atual do Melhor Envio é rejeitado tanto no sandbox quanto na produção com `{"message":"Unauthenticated."}` (testado via `curl` em `/api/v2/me`), apesar de não estar expirado por data (iat 2026-06-21, exp 2027-06-21) — ou seja, token revogado/inválido. **O frete só voltará a retornar transportadoras quando um token válido for gerado** e definido como env var `MELHOR_ENVIO_TOKEN` no Vercel — ver Seção 11
✅ **Filtro de transportadoras preferidas com fallback automático** (2026-06-22) — `CheckoutScreen.calculateShipping` atualizado: array `PREFERRED_SERVICES = ['.Package', 'PAC', 'SEDEX', 'Express']` filtra as opções retornadas pelo Melhor Envio; se nenhuma transportadora preferida cobrir o CEP de destino, exibe todas as disponíveis como fallback (`allValid`); ordenação por preço mantida em ambos os caminhos
✅ **ProductDetailScreen — card de entrega com peso real e visual original** (2026-06-22) — card de entrega reescrito para texto inline único: quando `product.weight > 0` exibe `"Produto de Xkg · "` (ou `Xg` se < 1 kg) seguido de `"Frete calculado no checkout"` em negrito; quando sem peso exibe apenas `"Frete calculado no checkout"` em negrito; `View` intermediária e linha de dimensões removidas, mantendo o layout original de uma linha com ícone + texto
✅ **Fix: frete e total corretos no CartScreen** (2026-06-22) — `SummaryRow` de frete alterado para texto `"Calculado no checkout"` (sem valor fixo); linha "Entrega em até 3 dias úteis" removida; label "Total" alterado para "Subtotal" e valor trocado de `total` (que incluía R$ 15,90 fixo) para `subtotal - discount`; botão "Finalizar Pedido" também atualizado para `subtotal - discount`

✅ **Espelho de pedidos na coleção `/pedidos` para o painel admin** (2026-06-23) — `addPedidoAdmin(uid, orderId, orderData, userProfile)` adicionado em `firestore.js`: grava em `/pedidos/{orderId}` os campos esperados pelo painel admin (`customer`, `customerEmail`, `customerPhone`, `initials`, `tint`, `city`, `number`, `total`, `freight`, `shipping`, `payment`, `status`, `tracking`, `products[]`, `address`, `deliveryAddress`, `createdAt`, `updatedAt`). `CheckoutScreen` atualizado: importa `addPedidoAdmin` e `getUserProfile`; logo após salvar em `/users/{uid}/orders`, chama `addPedidoAdmin` com os dados do pedido e o perfil do usuário; erros são capturados silenciosamente (não bloqueiam o fluxo do checkout)
✅ **OrderTrackingScreen — dados reais do Firestore** (2026-06-23) — tela reescrita com dados dinâmicos: busca em paralelo `getOrder(uid, orderId)` (coleção do usuário) e `getPedidoAdmin(orderId)` (espelho `/pedidos`); mescla status, código de rastreamento, transportadora e endereço priorizando os dados do admin (atualizados pelo painel); `buildTimeline()` constrói as 5 etapas com base no `status` real; `ActivityIndicator` durante carregamento; botão "Copiar código" usa `expo-clipboard`; placeholder estático e mapa removidos. `getPedidoAdmin(orderId)` e `getTrackingInfo(trackingCode)` adicionados em `firestore.js`
✅ **MyOrdersScreen — navegação passa `orderId` para OrderTrackingScreen** (2026-06-23) — `onPress` do card de pedido atualizado para `navigation.navigate('OrderTracking', { orderId: o.id })`, permitindo que a tela de rastreamento carregue o pedido correto
✅ **Espelho de usuários na coleção `/clientes` para o painel admin** (2026-06-24) — `upsertClienteAdmin(uid, data)` adicionado em `firestore.js`: grava em `/clientes/{uid}` os campos esperados pelo painel admin (`name`, `email`, `phone`, `city`, `status: 'ativo'`, `tier: 'Novo'`, `orders`, `spent`, `since`, `last`, `createdAt`, `updatedAt`) com `merge: true` para não sobrescrever dados existentes; `AuthContext` atualizado: importa `getUserProfile` e `upsertClienteAdmin`; callback do `onAuthStateChanged` tornado `async`; ao detectar usuário logado, busca o perfil do Firestore e chama `upsertClienteAdmin` — garante que o cliente apareça no painel admin tanto no cadastro quanto em logins subsequentes; erros capturados com `console.warn` sem bloquear o fluxo de autenticação
✅ **Sistema de avaliações de produtos** (2026-06-24) — `getReviews(productId)`, `getUserReview(productId, uid)`, `hasUserBoughtProduct(uid, productId)` e `submitReview(productId, uid, userName, rating, comment)` adicionados em `firestore.js`; avaliações salvas em `/produtos/{productId}/reviews/{uid}`; `submitReview` recalcula e atualiza `rating` e `reviewCount` no documento do produto após cada submissão. `ProductDetailScreen` atualizado: exibe resumo (nota média + estrelas + contagem), lista até 3 avaliações com avatar, nome e comentário; somente usuários que compraram o produto (`hasUserBoughtProduct`) veem o botão "Avaliar este produto"; formulário com seletor de estrelas e `TextInput` multiline; badge "Você já avaliou este produto" quando `userReview` presente; mensagem informativa para logados sem compra; `useAuth` importado para acessar `user`
✅ **MyOrdersScreen — miniaturas dos produtos e botão Avaliar** (2026-06-24) — `Image` adicionado ao import do React Native; `productImages` extrai até 3 thumbnails dos itens do pedido (`images[0]` ou `imageUrl`); grade de miniaturas 52×52 exibida entre o divider e o bottom row, com contador `+N` quando há mais de 3 itens; `onPress` removido do card inteiro; botão "Rastrear pedido" encapsulado em `TouchableOpacity` próprio com `flex: 1`; botão "Avaliar" (laranja) exibido ao lado direito apenas para pedidos com `status === 'entregue'`, navegando para `ProductDetail` do primeiro item do pedido; estilos `productImagesRow`, `productThumb`, `productThumbMore`, `productThumbMoreText`, `trackBtn`, `reviewBtn` e `reviewBtnText` adicionados
✅ **Fix: sincronização de status e uid entre `/pedidos` e `/users/orders`** (2026-06-24) — corrigido o espelhamento de pedidos para o painel admin. **(1) `/pedidos` agora salva o array `items` original** (`addPedidoAdmin` em `firestore.js`) além do `products[]` mapeado — necessário para o app sincronizar status via `uid` (o painel grava de volta em `/users/{uid}/orders/{orderId}`). **(2) Nome real do cliente** — `CheckoutScreen.handleConfirm` reestruturado: busca `getUserProfile(uid)` e monta `profileForPedido` com fallback `name: userProfile?.name || user.displayName || user.email || 'Cliente'` (antes pedidos de login Google apareciam como "Cliente" pois `/users/{uid}` não tinha `name`); `addPedidoAdmin` ganhou fallback secundário `userProfile?.email`; espelho protegido por `if (user?.uid && orderId)`; console.logs de diagnóstico (`[handleConfirm] user.uid / userProfile / items / deliveryAddress`) adicionados. **(3) Status case/acento-insensível no MyOrdersScreen** — `normalizeStatus()` (lowercase + `normalize('NFD')` + remoção de diacríticos) adicionada; `getStatusColor`, `getStatusLabel`, `matchesFilter` e a condição do botão "Avaliar" passam a usá-la. Antes `'Em trânsito'` (acentuado, gravado pelo admin) falhava em `.includes('transit')` e o pedido nunca casava com o filtro "Em Transporte"; agora aceita maiúsculo/minúsculo e acentos; `'Preparando'` mapeado e agrupado no filtro "Pendente"
✅ **Fix: desconto/cupom espelhado para o painel admin** (2026-06-29) — `addPedidoAdmin` em `firestore.js` agora grava `coupon` (código) e `discountValue` (valor) em `/pedidos` — nomes de campo exatos que o `order-detail-app.jsx` lê em `normalizeOrder` (`raw.coupon` / `raw.discountValue`); também grava `subtotal`. Antes o desconto era passado mas ignorado, fazendo o detalhe do admin exibir sempre "Desconto (—) − R$ 0,00" e o Total não reconciliar com subtotal+frete quando havia cupom. `CheckoutScreen` passa `coupon: couponApplied ? coupon : ''` tanto em `addOrder` (`/users/{uid}/orders`) quanto em `addPedidoAdmin` (`/pedidos`); `coupon` adicionado à desestruturação de `useCart()`
✅ **Fix: OrderConfirmationScreen com endereço real e navegação corrigida** (2026-06-29) — (1) bloco de endereço de entrega trocado do mock hardcoded ("João Silva / Rua das Flores, 123 / Itaú de Minas") para `order.deliveryAddress` real (label, rua, número, complemento, cidade, estado, CEP); fallback neutro "Endereço informado no checkout" para visitante/sem pedido; (2) botão "Rastrear" agora passa `{ orderId }` para `OrderTracking` (antes navegava sem params e a tela abria vazia); (3) botão "Ver Meus Pedidos" navega para `MyOrders` (antes ia para `Main`/Home)
✅ **Fix: validações no checkout — bloqueia confirmação sem endereço, sem frete e sem login** (2026-06-29) — `CheckoutScreen.jsx`: adicionadas 3 validações no início de `handleConfirm` (antes de `setConfirming(true)`): (1) visitante sem `user?.uid` → reabre o modal de auth em vez de tentar salvar pedido sem uid; (2) sem `deliveryAddress` → `Alert`/`window.alert` "Adicione um endereço de entrega antes de continuar" e retorna; (3) sem `method` e sem `shippingError` (frete ainda calculando) → alerta "Aguarde o cálculo do frete ou tente novamente" e retorna. `Alert` adicionado ao import do React Native.
✅ **Decremento automático de estoque ao confirmar pedido** (2026-07-04) — `firestore.js`: função `decrementarEstoque(items)` adicionada — percorre os itens do pedido, lê o estoque atual de cada produto via `getDoc`, calcula `Math.max(0, stock - qty)` e grava via `writeBatch` atômico; quando `newStock === 0` atualiza `status` para `'Esgotado'`; erros individuais são silenciosos. `CheckoutScreen.jsx`: `decrementarEstoque` importado e chamado com `await` imediatamente antes de `clearCart()` em `handleConfirm`, garantindo que `items` ainda está disponível. Imports `updateDoc` e `increment` adicionados ao import estático do `firebase/firestore`.
✅ **Sistema de cupons reescrito — busca do Firestore** (2026-07-04) — `CartContext.jsx` + `CartScreen.jsx`: `COUPON_CODE`/`COUPON_DISCOUNT` hardcoded removidos; `getCupons()` adicionada em `firestore.js` (lê coleção `/cupons`); `applyCoupon` tornou-se `async` — busca cupons do Firestore, valida `status === 'ativo'` e pedido mínimo (`minOrder`/`minimo`), extrai desconto de `discountValue`/`valor`/`discount`; estados `couponError` e `couponData` adicionados ao contexto; `discount` calculado a partir do valor real do cupom encontrado; `CartScreen` exibe mensagem de erro (vermelho) ou sucesso (verde) inline abaixo do campo de cupom; botão mostra `'...'` durante a busca e `'Aplicado ✓'` quando bem-sucedido
✅ **Fix: mensagem de erro/sucesso do cupom visível no CartScreen** (2026-07-04) — `CartScreen.jsx`: bloco do cupom reestruturado — a mensagem de erro/sucesso foi movida para DENTRO do `couponCard` (antes ficava fora do card e era cortada pelo layout); `couponCard` style simplificado (`flexDirection: 'row'` removido); novo wrapper interno `View flex:1` contém a linha de input+botão e a mensagem logo abaixo. `ProductDetailScreen.jsx`: `handleAddToCart` corrigido para passar `price: product.promo || product.price` — garante que o preço promocional (campo `promo` em R$ do Firestore, mantido pelo `mapProduct` via `...raw`) seja usado no carrinho quando disponível, evitando itens com `price: 0`
✅ **Fix: cria perfil /users/{uid} automaticamente para Google Login** (2026-07-04) — `AuthContext.jsx`: `onAuthStateChanged` agora cria automaticamente o documento `/users/{uid}` quando não existe — corrige Google Login (e qualquer provedor externo) que não salvava perfil no Firestore; usa `displayName` e `email` do Firebase Auth como dados iniciais; `createUserProfile` adicionado ao import do `firestore.js`
✅ **Fix: LoginScreen — removido debug do redirectUri + implementado "Esqueceu a senha?"** (2026-07-04) — `LoginScreen.jsx`: removido `useEffect` de debug que logava `request.redirectUri` no console e bloco JSX que exibia o URI na tela; implementado `handleForgotPassword` com `sendPasswordResetEmail` do Firebase — exige e-mail preenchido no campo acima, mostra "Enviando..." no botão durante a requisição e mensagem de sucesso em verde logo abaixo quando o link é enviado; erros exibidos via `error` state em vermelho; `sendPasswordResetEmail` adicionado ao import de `src/services/auth.js`
✅ **Fix: outline preto/azul do browser removido globalmente na web** (2026-07-04) — `web/index.html`: adicionado CSS global `input:focus, textarea:focus, select:focus { outline: none !important; box-shadow: none !important; }` logo após o reset; resolve o outline em qualquer campo de texto na versão web sem necessidade de `outlineStyle="none"` por componente
✅ **CheckoutScreen: PIX real e formulário de cartão via Mercado Pago** (2026-07-05) — `CheckoutScreen.jsx`: `gerarPixReal(orderId)` chama `/api/criar-pagamento-pix` após salvar o pedido — exibe QR Code base64 e código copia-cola com botão de copiar e feedback "✓ Código copiado!"; estado `pixData/pixLoading/pixCopied` gerenciam o fluxo; formulário de cartão com campos número (máscara 4-4-4-4), nome, validade (MM/AA) e CVV (secureTextEntry) com `formatCardNumber`/`formatExpiry`; estados `cardNumber/cardName/cardExpiry/cardCvv/cardError/cardLoading` adicionados; constantes `MP_PUBLIC_KEY`, `PIX_API_URL`, `CARTAO_API_URL` adicionadas; `TextInput` e `Image` adicionados ao import; styles `fieldLabel` e `cardInput` adicionados
✅ **Endpoints Mercado Pago — PIX e cartão** (2026-07-05) — `api/criar-pagamento-pix.js` + `api/criar-pagamento-cartao.js`: Vercel Serverless Functions para criar pagamentos reais via Mercado Pago Checkout Transparente; PIX gera `qr_code` (copia-cola) e `qr_code_base64` (imagem); cartão processa `token` gerado pelo SDK MP no frontend; ambos usam `X-Idempotency-Key: orderId` e lêem `MP_ACCESS_TOKEN` da env var do Vercel; CORS configurado para aceitar chamadas do app; status real do MP repassado em caso de erro
✅ **Fix: CSS global de outline expandido para React Native Web** (2026-07-05) — `web/index.html`: seletor CSS expandido para cobrir `:focus-visible`, `*:focus` e `[contenteditable]:focus` — necessário para React Native Web que usa divs com estilos inline; adicionado `-webkit-tap-highlight-color: transparent` para eliminar highlight de toque no mobile browser
✅ **SignUpScreen — Google Login + Facebook com aviso + senha mínima 8 chars** (2026-07-04) — `SignUpScreen.jsx`: botão Google implementado com `expo-auth-session` (mesmo fluxo do `LoginScreen`): `Google.useAuthRequest` com `responseType: 'id_token'`/`usePKCE: false`, `useEffect` processa `response` e chama `signInWithGoogleCredential`, `handleGoogleSignIn` chama `promptAsync()`; `SocialBtn` atualizado para aceitar `onPress` e `loading` (com `ActivityIndicator` e `opacity: 0.6` quando carregando); botão Facebook exibe mensagem de erro inline "Login com Facebook não disponível ainda. Use e-mail ou Google." em vez de ficar decorativo; validação de senha mínima corrigida de 6 para 8 caracteres (era inconsistente com o `placeholder` que já dizia "mínimo 8 caracteres")
✅ **Fix: botão Google no SignUpScreen desabilitado quando request=null** (2026-07-05) — `SignUpScreen.jsx`: `SocialBtn` aceita prop `disabled` e aplica `opacity: 0.5` + `disabled={loading || disabled}`; botão Google recebe `disabled={!request}` — evita que `promptAsync()` seja chamado antes do `expo-auth-session` estar pronto (causava silêncio total); `handleGoogleSignIn` agora verifica `!request` e exibe mensagem de erro antes de chamar `promptAsync`, com `try/catch` para capturar erros do `promptAsync` via `console.warn`
✅ **Fix: login redireciona para Main via navigation.reset** (2026-07-05) — `LoginScreen.jsx`: substituído `canGoBack()/goBack()` por `navigation.reset({ index: 0, routes: [{ name: 'Main' }] })` tanto em `handleSignIn` quanto no `useEffect` do Google Login — resolve bug na web (Vercel) onde `canGoBack()` retornava `true` e o `goBack()` voltava para a `SignUpScreen` em vez de ir para a loja
✅ **Fix: Google Auth duplicado removido do SignUpScreen** (2026-07-05) — `SignUpScreen.jsx`: removido Google Auth completo (`expo-auth-session`, `useAuthRequest`, `useEffect` de response, `handleGoogleSignIn`, `loadingGoogle`, `signInWithGoogleCredential`); botão Google agora navega para `LoginScreen` onde o fluxo já funciona corretamente no mobile browser; `SocialBtn` simplificado de volta (sem prop `disabled`); imports `useEffect` e `* as Google` removidos
✅ **PIX com polling automático de status** (2026-07-05) — `api/verificar-pagamento.js` criado: endpoint GET que consulta `GET /v1/payments/{paymentId}` no Mercado Pago e retorna `{ id, status, status_detail }`; usa `MP_ACCESS_TOKEN` da env var do Vercel; CORS configurado. `CheckoutScreen.jsx`: constante `VERIFICAR_API_URL` adicionada; estados `paymentStatus` (`pending|approved|rejected`) e `pollingInterval` adicionados; `gerarPixReal` inicia `setInterval` de 5s após obter `data.id` — detecta `approved`/`rejected`/`cancelled` e limpa o interval; footer do modal PIX exibe 3 estados distintos: banner verde "Pagamento confirmado!" + botão "Ver meu pedido →" (approved), banner vermelho "Pagamento não realizado" + botão "Tentar novamente" (rejected), spinner "Aguardando pagamento..." + botão "Já paguei ✓" (pending); ambas as navegações para `OrderConfirmation` passam `{ orderId: pixOrderId, paymentStatus }`. `OrderConfirmationScreen.jsx`: `paymentStatus` extraído de `route.params`; badge de status condicional — verde "Aprovado" quando `paymentStatus === 'approved'` ou método não-PIX, laranja "Aguardando" para PIX pendente; subtítulo `successSub` também condicional com mensagem de aguardo para PIX não confirmado
✅ **Fix: fluxo PIX corrigido — QR Code exibido em modal dedicado** (2026-07-05) — `CheckoutScreen.jsx`: estados `pixOrderId` e `showPixPayment` adicionados; `handleConfirm` bifurcado: PIX chama `gerarPixReal`, seta `showPixPayment(true)` e limpa o carrinho mas **não navega**; cartão e boleto limpam carrinho e navegam direto para `OrderConfirmation`; Modal dedicado (`visible={showPixPayment}`, `animationType="slide"`) exibe QR Code base64, código copia-cola, contador regressivo e botão "Já paguei ✓" que fecha o modal e navega para `OrderConfirmation` com `pixOrderId`
✅ **PIX inline no checkout com polling automático + QR salvo no Firestore para pagar depois** (2026-07-05) — `CheckoutScreen.jsx`: QR Code PIX exibido inline (sem modal), polling automático navega para confirmação ao detectar pagamento aprovado, bloqueia confirmação manual se PIX pendente; `firestore.js`: `savePixData` e `updatePixStatus` salvam QR e status no Firestore (`/users/{uid}/orders/{orderId}` + espelho `/pedidos/{orderId}` com status "Aguardando pagamento"/"Pago"); `MyOrdersScreen.jsx`: botão "Pagar PIX" (azul MP) para pedidos com status "aguardando pagamento" ou com `pixQrCode` salvo, navega para `OrderTracking`; `OrderTrackingScreen.jsx`: exibe QR Code salvo (base64 + copia-cola) para pedidos aguardando pagamento, com aviso de expiração em 30 min. Estados `showPixPayment`/`pixOrderId` removidos; adicionados `pixGenerated`/`currentOrderId`
✅ **Fix: botão "Pagar PIX" aparece para todos os pedidos PIX pendentes** (2026-07-05) — `MyOrdersScreen.jsx`: condição do botão "Pagar PIX" expandida para cobrir pedidos com `paymentMethod === 'pix'` e `pixStatus !== 'approved'`, independente do valor exato do status (aceita `status` incluindo "aguardando", igual a "pendente", ou presença de `pixQrCode`/`pixId`); `getStatusLabel` retorna "Aguardando Pagamento" e `getStatusColor` usa `#009ee3` (azul MP) para status "aguardando pagamento"
✅ **Filtro "Aguardando PIX" + botão Pagar PIX nos pedidos pendentes** (2026-07-05) — `MyOrdersScreen.jsx`: filtro "⏳ Aguardando PIX" adicionado ao array `FILTERS` e à lógica de `matchesFilter` (pedidos com `paymentMethod === 'pix'` e `pixStatus !== 'approved'`); botão "Pagar PIX" azul MP aparece para pedidos pix com `pixStatus !== 'approved'`; `getStatusLabel` retorna "Aguardando PIX"/"Pago" e `getStatusColor` usa `#009ee3` (aguardando) / `C.greenFg` (pago)
✅ **Fix: mensagens de erro do checkout inline** (2026-07-05) — `CheckoutScreen.jsx`: todos os `window.alert` e `Alert.alert` substituídos por `setCheckoutError`; banner vermelho com ícone e botão fechar exibido acima do bottomBar; estado `checkoutError` limpo ao trocar de aba de pagamento
✅ **Fix: addOrder respeita status recebido pelo caller** (2026-07-05) — `firestore.js`: `addOrder` agora usa `orderData.status || 'pendente'` em vez de `status: 'pendente'` hardcoded — permite que o caller (ex.: CheckoutScreen) passe `status: 'Aguardando pagamento'` para pedidos PIX sem ter o valor sobrescrito
✅ **Diagnóstico OrderTrackingScreen — logs de pixQrCode e pixStatus** (2026-07-05) — `OrderTrackingScreen.jsx`: logs temporários adicionados após `setOrder(orderData)` para confirmar se `pixQrCode` e `pixStatus` chegam corretamente ao carregar a tela
✅ **feat: valor total exibido no card Pagar com PIX** (2026-07-05) — `OrderTrackingScreen.jsx`: valor total do pedido exibido em destaque (badge verde com "Valor a pagar" + `fmt(order.total)`) entre o título e o texto de instrução do card PIX; só renderiza quando `order?.total` está presente
✅ **Diagnóstico fluxo PIX — logs em CheckoutScreen e savePixData** (2026-07-05) — `CheckoutScreen.jsx`: log da resposta da API PIX adicionado; validação explícita `if (!data.qr_code && !data.qr_code_base64)` lança erro descritivo; logs antes/depois do `savePixData` confirmam se uid/orderId estão presentes e se a função conclui. `firestore.js`: log adicionado no início do `try` de `savePixData` para confirmar execução. Objetivo: diagnosticar por que `pixQrCode` não estava sendo salvo no Firestore
✅ **SignUpScreen: campo CPF adicionado no formulário de cadastro** (2026-07-06) — `SignUpScreen.jsx`: estado `cpf` + função `formatCPF` com máscara automática `000.000.000-00`; campo renderizado após WhatsApp/Telefone com ícone `id-card-outline`; validação de 11 dígitos em `handleSignUp` antes de criar a conta; `createUserProfile` chamado com `cpf: cpf.trim()`; `firestore.js`: `createUserProfile` atualizado para aceitar e salvar campo `cpf` em `/users/{uid}`
✅ **CheckoutScreen: seletor Receber em casa / Retirar na loja** (2026-07-05) — `CheckoutScreen.jsx`: estado `deliveryMode` (`'delivery'|'pickup'`); card "Como quer receber?" com dois botões de seleção antes do endereço; modo `pickup` oculta os cards de Endereço e Método de Envio e exibe info da loja (Itaú de Minas · MG); `effectiveShippingCost = deliveryMode === 'pickup' ? 0 : shippingCost`; validações de endereço e frete condicionadas a `deliveryMode === 'delivery'`; `addOrder` e `addPedidoAdmin` recebem `deliveryMode`, `shippingMethod: 'Retirada na loja'`, `shippingCost: 0` e `deliveryAddress: { label: 'Retirada na loja', city: 'Itaú de Minas', state: 'MG' }` quando modo pickup; resumo exibe "Grátis" no frete para retirada; 4 estilos novos: `deliveryModeBtn`, `deliveryModeBtnActive`, `deliveryModeTxt`, `deliveryModeTxtActive`
✅ **AddressesScreen: campo CPF adicionado no formulário de endereço** (2026-07-06) — `AddressesScreen.jsx`: campo CPF adicionado no formulário de endereço com máscara automática; validação opcional de 11 dígitos; salvo junto com o endereço no Firestore.
✅ **api/gerar-etiqueta.js: endpoint para gerar etiqueta automaticamente no Melhor Envio** (2026-07-06) — adiciona ao carrinho ME, faz checkout e retorna URL de impressão e código de rastreio.
✅ **api/webhook-melhor-envio.js: endpoint webhook para receber notificações do Melhor Envio** (2026-07-06) — mapeia status (posted/in_transit/delivered) para status do app e atualiza /pedidos e /users/{uid}/orders automaticamente via Firebase Admin SDK.
✅ **MyOrdersScreen.jsx: ScrollView horizontal dos filtros corrigido para mobile web** (2026-07-11) — adicionado `flexGrow:0`, `flexShrink:0` nos chips e `fontSize` reduzido para caber na tela.
✅ **MyOrdersScreen.jsx: labels dos filtros simplificados e chips ainda mais compactos para caber na tela mobile** (2026-07-11) — labels encurtados ('⏳ Aguardando PIX'→'⏳ PIX', 'Em Transporte'→'Transporte') e chips reduzidos (`paddingHorizontal:10`, `height:32`, `fontSize:11`).
✅ **MyOrdersScreen.jsx: ScrollView horizontal dos filtros corrigido com bounces=false e paddingRight=32 para permitir scroll até o último chip** (2026-07-11) — adicionadas props `bounces={false}` e `decelerationRate="fast"` no ScrollView e `paddingRight` do `chipsRow` aumentado para 32.
✅ **MyOrdersScreen.jsx: filtros em flexWrap (sem scroll horizontal), thumbnails 68x68, cards com borderRadius 20 e padding 18, labels dos filtros restaurados completos** (2026-07-11) — `ScrollView` horizontal dos filtros substituído por `View` com `flexWrap: 'wrap'` (novo estilo `chipsWrap`); chips maiores (`paddingHorizontal: 14`, `height: 34`, `fontSize: 12`); miniaturas dos produtos aumentadas de 52×52 para 68×68 (`borderRadius: 12`); `productImagesRow` com `gap: 10`/`marginBottom: 14`; `orderCard` com `borderRadius: 20`/`padding: 18`; `orderId` e `orderTotal` em `fontSize: 18` (total em `PlusJakartaSans_800ExtraBold`); `list` com `gap: 14`/`paddingTop: 8`; labels dos filtros restaurados para forma completa ('⏳ Aguardando PIX', 'Em Transporte'); import de `ScrollView` removido.
✅ **MyOrdersScreen.jsx: filtro '✅ Pago' adicionado — pedidos com status pago agora aparecem no filtro dedicado** (2026-07-11) — chip `{ key: 'pago', label: '✅ Pago' }` adicionado ao array `FILTERS` (após 'Aguardando PIX'); caso `key === 'pago'` adicionado em `matchesFilter` retornando `normalizeStatus(order.status) === 'pago'`.
✅ **CheckoutScreen.jsx: acréscimo automático para cartão de crédito** (2026-07-11) — lê `taxaCredito` do Firestore (`configuracoes/pagamento`, padrão 3%), calcula `cardSurcharge`, exibe aviso laranja ao cliente e linha no resumo do pedido. `getConfiguracoes()` adicionada em `firestore.js` (espelha `DB.getConfiguracoes` do admin: doc `loja` mesclado na raiz, demais docs keyed por id). `firestore.rules`: coleção `/configuracoes` com leitura pública + escrita bloqueada no client (publicar via `firebase deploy --only firestore:rules`).
✅ **CheckoutScreen.jsx: tabs de pagamento dinâmicas** (2026-07-11) — lê `cartaoAtivo` e `boletoAtivo` de `configuracoes/pagamento` no Firestore e oculta as tabs desabilitadas no painel admin; estados `cartaoAtivo` (padrão `true`) e `boletoAtivo` (padrão `false`); array das `payTabs` montado condicionalmente (`['pix', ...(cartaoAtivo ? ['card'] : []), ...(boletoAtivo ? ['boleto'] : [])]`); PIX sempre visível.
✅ **CheckoutScreen.jsx + web/index.html: tokenização de cartão de crédito via SDK Mercado Pago** (2026-07-12) — SDK MP v2 carregado no web/index.html; função `tokenizarCartao()` gera token seguro com `mp.createCardToken()`; detecta bandeira via API do MP (bin dos 6 primeiros dígitos); campo CPF do titular adicionado; mensagens de erro amigáveis para rejeições comuns (saldo insuficiente, dados incorretos, cartão desabilitado); envia token + paymentMethodId + issuerId para `/api/criar-pagamento-cartao.js`; pagamento processado em produção real via Mercado Pago. Rejeição/erro mantém o usuário na tela com `setCardError` (sem navegar); botão "Confirmar Pagamento" desabilitado durante `cardLoading`; boleto (quando ativo) navega com `paymentStatus: 'pending'`. Requer env var `MP_ACCESS_TOKEN` (produção) no Vercel.
✅ **HomeScreen.jsx: localização alterada de "Itaú de Minas" para "Passos de Minas"** (2026-07-12)
✅ **app.json + assets/icon.png: ícone do app e splash screen configurados com a logo do Empório** (2026-07-14) — icon 1024x1024, adaptiveIcon com backgroundColor #52170c (C.brown), splash com resizeMode contain. `assets/icon.png` (antigo "A" azul do Expo) substituído pela logo real do Empório e copiado para `assets/android-icon-foreground.png` e `assets/favicon.png`
✅ **CheckoutScreen.jsx: card de localização clicável estilo WhatsApp na retirada + correção do endereço** (2026-07-19) — card com preview de mapa estático, endereço completo (Rua dos Piantinos, 657, Bairro Muarama, Passos-MG) e toque abre o Google Maps direto na localização da loja via `Linking.openURL`; corrigido texto "Itaú de Minas" (incorreto) para "Passos, MG" em 3 pontos do arquivo (card de retirada e dados de deliveryAddress salvos no pedido).
✅ **CheckoutScreen.jsx: imagem do mapa trocada para asset local** (2026-07-19) — a URL externa do OpenStreetMap não carregava; substituída por `assets/mapa-loja.png`, ilustração estilizada no estilo Minas Gourmet Modern com pin marrom e ícone de loja.
✅ **api/calcular-frete.js: removido token hardcoded do Melhor Envio** (2026-07-20) — token antigo (usado como fallback quando `MELHOR_ENVIO_TOKEN` não estava definido) removido completamente do código; agora o endpoint depende exclusivamente da env var do Vercel e retorna `500` explícito se ela não estiver configurada, mesmo padrão do `api/criar-pagamento-cartao.js` para o `MP_ACCESS_TOKEN`. **Atenção:** foi encontrado um arquivo `melhorenvio-token.json` **não rastreado** na raiz do projeto contendo um `access_token`/`refresh_token` do Melhor Envio em texto puro — não foi commitado nem adicionado ao `.gitignore` nesta sessão; recomenda-se mover esse arquivo para fora do repositório (ou apagá-lo) o quanto antes.
✅ **CheckoutScreen.jsx: token de autenticação Firebase enviado nas chamadas de pagamento (parte 1/2)** (2026-07-20) — função `getAuthToken()` adicionada dentro do componente (usa `user.getIdToken()` do Firebase Auth via `useAuth()`); header `Authorization: Bearer <token>` adicionado nas chamadas `fetch` para `FRETE_API_URL`, `PIX_API_URL` (criação), `VERIFICAR_API_URL` (polling de status) e `CARTAO_API_URL`; token omitido quando `user` é `null` (visitante), sem bloquear o fluxo. **Os endpoints (`api/calcular-frete.js`, `api/criar-pagamento-pix.js`, `api/criar-pagamento-cartao.js`, `api/verificar-pagamento.js`) ainda NÃO validam esse token** — essa é só a parte 1/2; a parte 2 (validação server-side com Firebase Admin SDK) fica pendente na Seção 11.
✅ **api/criar-pagamento-pix.js: autenticação Firebase + validação de total (2026-07-20)** — endpoint agora exige token Firebase válido (verificado via Admin SDK, `auth.verifyIdToken()`) e confirma que o `total` da cobrança bate com o `total` do pedido salvo em `users/{uid}/orders/{orderId}` (tolerância de R$ 0,01) antes de gerar o PIX; retorna `401` sem token/token inválido, `404` se o pedido não existe para aquele uid, `400` se o total divergir. `api/_firebaseAdmin.js` criado como módulo compartilhado (`auth`, `db`) usando o padrão modular `firebase-admin/app` + `firebase-admin/auth` + `firebase-admin/firestore` já usado em `api/webhook-melhor-envio.js`; header CORS `Access-Control-Allow-Headers` passou a incluir `Authorization`. **Apenas o endpoint de PIX foi atualizado nesta etapa** — cartão, etiqueta e verificar-pagamento ainda não exigem token (ver Seção 11).
✅ **api/criar-pagamento-cartao.js: autenticação Firebase + validação de total (2026-07-20)** — mesmo padrão aplicado em `criar-pagamento-pix.js`: importa `auth`/`db` de `./_firebaseAdmin.js`; exige `Authorization: Bearer <token>` (401 sem token ou token inválido); busca o pedido em `users/{uid}/orders/{orderId}` (404 se não existir) e valida que `total` da cobrança bate com `orderData.total` (tolerância R$ 0,01, 400 se divergir) antes de chamar a API do Mercado Pago; `token` do corpo da requisição (token de cartão gerado pelo SDK MP no frontend) renomeado internamente para `cardToken` para não colidir com o `token` de autenticação Firebase; header CORS `Access-Control-Allow-Headers` passou a incluir `Authorization`. Com isso, **PIX e cartão** já exigem autenticação Firebase — faltam apenas `api/calcular-frete.js`, `api/gerar-etiqueta.js` e `api/verificar-pagamento.js` (ver Seção 11).
✅ **api/webhook-melhor-envio.js: validação de assinatura HMAC + correção de erro 500 no teste de validação (2026-07-20)** — webhook agora valida o header `X-ME-Signature` (HMAC-SHA256 usando o Client Secret do app) antes de processar qualquer atualização de pedido, rejeitando requisições forjadas com `401`. Corrigido também o erro 500 que ocorria quando o Melhor Envio testava a URL ao salvar o webhook (corpo vazio causava erro ao desestruturar `req.body`) — agora responde `200 { ok: true, test: true }` quando não há assinatura nem corpo. `catch` final trocado de `res.status(500).json({ error: e.message })` para mensagem genérica (`'Erro interno.'`), evitando vazar detalhes internos ao chamador externo. Requer a variável de ambiente `MELHOR_ENVIO_CLIENT_SECRET` no Vercel (o Client Secret do aplicativo cadastrado no painel do Melhor Envio) — endpoint retorna `500` explícito se ela não estiver configurada.
✅ **api/webhook-melhor-envio.js: ajuste na validação para aceitar teste do painel (2026-07-20)** — o teste de validação de URL feito pelo painel do Melhor Envio ao cadastrar o webhook não inclui `X-ME-Signature` nem um `order_id` real; o endpoint agora reconhece esse padrão e responde `200` sem processar, ao invés de rejeitar com `401`. Requisições reais de atualização de pedido (que sempre têm `order_id`) continuam exigindo assinatura válida.
✅ **api/gerar-etiqueta.js: autenticação Firebase restrita ao admin (2026-07-20)** — endpoint gera etiquetas reais e pagas no Melhor Envio; diferente de PIX/cartão, este é chamado **exclusivamente pelo painel admin** (`adm coisas de minas/pedidos-app.jsx`, função `gerarEtiqueta()`), nunca pelo app do cliente — confirmado por busca no código antes de decidir a abordagem. Por isso a autorização não valida dono de pedido (`users/{uid}/orders`), e sim **restringe o acesso ao e-mail de admin**: importa só `auth` de `./_firebaseAdmin.js`; exige `Authorization: Bearer <token>` (401 sem token/token inválido); após decodificar, verifica `ADMIN_EMAILS.includes(decoded.email)` (mesma constante/e-mail `emporiominas00@gmail.com` usado em `AuthContext.jsx` do app) e retorna `403` se não for o admin; header CORS `Access-Control-Allow-Headers` passou a incluir `Authorization`. **Lado do painel admin** (`adm coisas de minas/pedidos-app.jsx`, `gerarEtiqueta()`): adicionado `const authToken = await firebase.auth().currentUser?.getIdToken()` (SDK compat já carregado globalmente via `auth-guard.js`) antes do `fetch`, com alerta "Sessão expirada" se `authToken` vier vazio; header `Authorization: Bearer <authToken>` adicionado à chamada. **Atenção:** o repositório `adm coisas de minas` tem apenas 1 commit antigo, nenhum remote configurado e todos os arquivos (incluindo `pedidos-app.jsx`) aparecem como untracked no `git status` — a alteração nesse arquivo foi feita em disco mas **não foi commitada nem versionada** nesta sessão (decisão do usuário); avaliar separadamente como/se versionar esse painel.
✅ **CheckoutScreen.jsx: URLs de API corrigidas para funcionar no app nativo (2026-07-20)** — `FRETE_API_URL`, `PIX_API_URL`, `CARTAO_API_URL` e `VERIFICAR_API_URL` usavam `typeof window !== 'undefined' && window.location.hostname !== 'localhost'` para escolher entre a URL de produção do Vercel e `http://localhost:8081` — em builds nativas (iOS/Android) essa checagem sempre caía no fallback `localhost:8081`, um endereço inacessível a partir de um dispositivo físico ou emulador, quebrando frete/PIX/cartão/verificação de pagamento fora da web. Substituído por `getApiBaseUrl()` baseado em `Platform.OS`: na web retorna `''` (caminho relativo, funciona tanto em produção quanto no dev server do Expo); no nativo retorna sempre `PRODUCTION_API_BASE` (`https://emporio-coisas-de-minas.vercel.app`), nunca localhost. Nomes das constantes mantidos inalterados. A checagem `typeof window === 'undefined' && Platform.OS !== 'web'` usada para gatear o SDK do Mercado Pago (carregado via `<script>` em `web/index.html`, só existe na web) foi mantida como está — não é uma URL, é um gate de feature legitimamente web-only.
✅ **firestore.js: decrementarEstoque agora usa runTransaction (2026-07-20)** — anteriormente usava leitura (`getDoc`) + `writeBatch`, sem revalidação atômica, podendo causar overselling em checkouts concorrentes do mesmo produto (dois clientes lendo o mesmo `stock` antes de qualquer escrita, ambos decrementando a partir do mesmo valor). Agora cada produto é decrementado numa transação individual via `runTransaction`, que o Firestore revalida e re-executa automaticamente em caso de conflito de leitura/escrita concorrente; falha em um produto é logada via `console.warn` e não interrompe o processamento dos demais itens do pedido. Assinatura da função (`decrementarEstoque(items)`) e chamada em `CheckoutScreen.jsx` inalteradas.
✅ **CheckoutScreen.jsx: decremento de estoque movido para após confirmação do pagamento (2026-07-20)** — anteriormente `decrementarEstoque(items)` era chamado logo na criação do pedido (`addOrder` + `addPedidoAdmin`), antes de qualquer confirmação de pagamento, causando desconto de estoque em PIX abandonados/expirados e cartões recusados, sem qualquer estorno. Chamada removida dessa posição. Agora o decremento só ocorre: **para PIX**, dentro do polling de `VERIFICAR_API_URL` (a cada 5s, dentro de `gerarPixReal`), no branch `vData.status === 'approved'`, logo após `updatePixStatus(..., 'approved')` e antes de `clearCart()`; **para cartão**, no bloco de sucesso do Mercado Pago dentro de `handleConfirm` (após o `fetch` a `CARTAO_API_URL` não cair em `!res.ok || data.status === 'rejected'`), logo após o comentário `// Pagamento aprovado!` e antes de `clearCart()`. **Boleto** não decrementa estoque (navega com `paymentStatus: 'pending'` — ainda é simulado, sem aprovação real confirmável). Confirmado por leitura do fluxo que `deliveryMode` (entrega/retirada) é ortogonal ao método de pagamento — não existe opção de pagamento na retirada sem gateway, então a mudança vale igualmente para pickup e delivery, sem caso especial de decremento imediato. Nenhum nome de função/variável alterado; apenas a posição das duas chamadas.
✅ **firestore.rules: arquivo local sincronizado com produção (2026-07-20)** — o arquivo estava desatualizado; a auditoria havia apontado coleções sem regra (`/pedidos`, `/categorias`, `/cupons`, `/clientes`, `/users/{uid}/notifications`), mas na verdade as regras publicadas em produção já cobriam todas corretamente. Arquivo local atualizado para refletir a realidade — nenhuma mudança de comportamento, apenas documentação correta. Não foi feito deploy de regras (não era necessário: produção já estava certa).
✅ **auth.js: exclusão de conta agora apaga dados reais do Firestore (2026-07-20)** — anteriormente `deleteAccount(password)` apagava apenas o usuário do Firebase Auth (após reautenticação com `EmailAuthProvider` + `reauthenticateWithCredential`, já existente), mantendo todos os dados no Firestore (pedidos, favoritos, carrinho, endereços, cliente) apesar da `PrivacyScreen.jsx` informar remoção permanente. Nova função interna `deleteUserFirestoreData(uid)` apaga as subcoleções `cart`, `favorites`, `orders`, `addresses`, `settings`, `notifications` de `/users/{uid}`, depois o documento `/users/{uid}` e o espelho `/clientes/{uid}`; chamada logo após a reautenticação e antes de `deleteUser(user)`. Assinatura de `deleteAccount(password)` inalterada; import de `getFirestore/doc/deleteDoc/collection/getDocs` adicionado a `firebase/firestore`, instância `db` local criada via `getFirestore(app)` (arquivo não tinha `db` próprio antes, diferente de `firestore.js`). **Limitação conhecida e aceita (decisão do usuário, 2026-07-20):** `firestore.rules` bloqueia `delete` em `/users/{uid}/orders/{orderId}` e `/clientes/{uid}` (`allow delete: if false`, proposital para preservar histórico de pedidos/comercial) — essas duas chamadas de `deleteDoc` falham silenciosamente (só `console.warn`), então pedidos e o espelho de cliente **não são de fato removidos** hoje; a mensagem "removidos permanentemente" da `PrivacyScreen` continua parcialmente otimista para esses dois casos. Resolver isso exigiria alterar as regras (fora do escopo desta tarefa). **Observação adicional:** `getAuthErrorMessage` não tem mensagem específica para `auth/requires-recent-login`, mas isso é mitigado na prática porque `deleteAccount` já reautentica com senha imediatamente antes de qualquer exclusão.
✅ **PrivacyScreen.jsx: texto de exclusão de conta corrigido (2026-07-20)** — a mensagem anterior (`Alert.alert('Conta excluída', 'Seus dados foram removidos permanentemente.')`) afirmava remoção "permanente" de todos os dados, o que não era preciso já que pedidos (`/users/{uid}/orders`) e o registro de cliente (`/clientes/{uid}`) são mantidos por obrigação fiscal/comercial (regra de segurança do Firestore impede sua exclusão intencionalmente — ver nota acima sobre `auth.js`). Texto agora comunica claramente essa distinção: dados pessoais (carrinho, favoritos, endereços, preferências) foram removidos; histórico de pedidos é mantido por período determinado conforme legislação fiscal e de defesa do consumidor. Nenhuma outra lógica da tela foi alterada.

---

## 11. O Que Ainda Falta

❌ **Seed do Firestore pendente** — coleção `/produtos` ainda vazia em produção. Use `DB.seedDadosIniciais()` no console do painel admin para popular. O seed já inclui todos os campos necessários (`visible`, `featured`, `description`, `longDesc`, `producer`, `location`) e categorias em minúsculas. Sem o seed, as telas exibem empty state
❌ **Boleto real** — PIX e cartão já processam pagamento real via Mercado Pago; boleto ainda é simulado (navega direto para confirmação com `paymentStatus: 'pending'`) e permanece desativado por padrão (`boletoAtivo: false` em `configuracoes/pagamento`)
❌ **Token válido do Melhor Envio** — 🔴 **BLOQUEADOR ATIVO DO FRETE.** O token atual (em `api/calcular-frete.js`) é rejeitado com `{"message":"Unauthenticated."}` no sandbox e na produção. **Como resolver:** (1) gerar um novo token no painel sandbox (https://sandbox.melhorenvio.com.br → Configurações → Tokens, com escopo `shipping-calculate`); (2) no Vercel, definir a env var `MELHOR_ENVIO_TOKEN` com o novo valor (Settings → Environment Variables) e fazer redeploy; (3) o código já lê dessa env var automaticamente. Enquanto isso, o CheckoutScreen exibe a mensagem de erro real e botão "Tentar novamente" (sem travar o spinner)
❌ **Rastreamento real** — `getTrackingInfo()` implementado mas endpoint `/api/rastrear` ainda não existe no Vercel; integração Correios pendente
❌ **Admin via Custom Claims** — atualmente por e-mail no token (menos seguro)
❌ **TypeScript** — projeto todo em JS
❌ **ESLint + Prettier** — sem formatação automática
❌ **Testes** — zero cobertura
❌ **CI/CD** — deploy web ainda manual

---

## 12. Próximos Passos (ordem de prioridade)

1. **Seed do Firestore** — usar `DB.seedDadosIniciais()` no console do painel admin (campos completos já configurados). Depois administrar produtos pelo painel (`edit-app.jsx`) ou direto no Firebase Console

2. **Boleto real** — integrar boleto via Mercado Pago (PIX e cartão já estão em produção)

4. **Rastreamento Correios** — integrar API dos Correios com o número de rastreio

5. **Admin via Custom Claims** — substituir verificação por e-mail por `request.auth.token.admin == true` (mais seguro e escalável)

6. **TypeScript** — migrar incrementalmente (começar pelos contextos e serviços)

7. **ESLint + Prettier** — configuração padrão Expo

8. **Testes** — Jest + React Native Testing Library para CartContext e AuthContext primeiro

9. **CI/CD** — GitHub Actions para lint + testes + deploy automático no Vercel

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
O catálogo de produtos usa a coleção `/produtos` — schema documentado na seção 7. Para produtos, use sempre as funções de `src/services/firestore.js`.

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
