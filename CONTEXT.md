# Empório Coisas de Minas — App Context

## Visão Geral

Aplicativo mobile de e-commerce para o **Empório Coisas de Minas**, marketplace de produtos artesanais regionais (queijos, cafés, doces, conservas, pães e bebidas) com foco na Serra da Canastra, Minas Gerais.

- **Tagline:** "Delícias da Canastra e outros trem…"
- **Plataforma:** Expo (iOS, Android, Web)
- **Estado atual:** Firebase Auth integrado e funcionando. Firestore criado em produção com regras de segurança. Context API implementada. Catálogo de produtos ainda mockado nas telas.
- **Deploy web:** Vercel (`npx expo export -p web` → `dist/`)

---

## Stack Técnica

| Camada | Tecnologia | Versão |
|---|---|---|
| Framework | Expo | ~56.0.4 |
| Runtime | React / React Native | 19.2.3 / 0.85.3 |
| Linguagem | JavaScript / JSX | sem TypeScript |
| Navegação | React Navigation 7 (Stack + Bottom Tabs) | ^7.x |
| Ícones | @expo/vector-icons (Ionicons) | ^15.0.2 |
| Gradientes | expo-linear-gradient | ^56.0.4 |
| Fontes | Plus Jakarta Sans + Work Sans (Google Fonts) | ^0.4.2 |
| **Auth / Backend** | **Firebase** | **^12.13.0** |
| **Persistência de sessão** | **@react-native-async-storage/async-storage** | **2.2.0** |
| Estado global | React Context API (3 contextos) | — sem Zustand/Redux |
| Web frame | Moldura 390×844 px no desktop via `web/index.html` | — |

---

## Estrutura de Arquivos

```
emporio-app/
├── src/
│   ├── context/                        # Estado global
│   │   ├── AuthContext.jsx             # auth, login, logout, isAdmin, isAuthenticated
│   │   ├── CartContext.jsx             # itens, cupom, totais calculados automaticamente
│   │   └── FavoritesContext.jsx        # favoritos, toggleFavorite, isFavorite
│   ├── navigation/
│   │   └── AppNavigator.jsx            # Stack + Tab + proteção de rotas via useAuth()
│   ├── screens/                        # 14 telas
│   │   ├── SplashScreen.jsx
│   │   ├── LoginScreen.jsx             # → useAuth() login()
│   │   ├── SignUpScreen.jsx
│   │   ├── HomeScreen.jsx
│   │   ├── CategoriesScreen.jsx
│   │   ├── CartScreen.jsx              # → useCart()
│   │   ├── FavoritesScreen.jsx         # → useFavorites()
│   │   ├── ProfileScreen.jsx           # → useAuth() logout()
│   │   ├── ProductDetailScreen.jsx     # → useCart() + useFavorites()
│   │   ├── SearchScreen.jsx
│   │   ├── ListingScreen.jsx
│   │   ├── CheckoutScreen.jsx
│   │   ├── OrderConfirmationScreen.jsx
│   │   └── OrderTrackingScreen.jsx
│   ├── services/                       # Integrações Firebase
│   │   ├── firebase.js                 # initializeApp + firebaseConfig
│   │   └── auth.js                     # signIn, signUp, signOut, onAuthStateChanged
│   └── theme/
│       └── index.js                    # Paleta de cores + fmt() (moeda BRL)
├── assets/                             # Ícones, logos, splash
├── web/
│   └── index.html                      # Wrapper web com moldura de celular
├── App.js                              # Fontes + AuthProvider > CartProvider > FavoritesProvider
├── index.js                            # Registro Expo
├── app.json                            # Config Expo
├── firebase.json                       # Config Firebase CLI
├── firestore.rules                     # Regras de segurança Firestore (produção)
├── firestore.indexes.json              # Índices Firestore
└── vercel.json                         # Deploy web
```

---

## Navegação e Proteção de Rotas

```
Stack (root) — controlado por AppNavigator via useAuth()

[NÃO AUTENTICADO]
├── Splash              → auto-navega para Login após ~3s
├── Login
└── SignUp

[AUTENTICADO]
├── Main ─── Tab Bar (5 abas)
│   ├── Home
│   ├── Categorias
│   ├── Carrinho
│   ├── Favoritos
│   └── Perfil
├── ProductDetail
├── Search
├── Listing
├── Checkout
├── OrderConfirmation
└── OrderTracking
```

- Logout: chamar `logout()` do AuthContext — o `onAuthStateChanged` limpa `user` e o AppNavigator troca o stack automaticamente. **Nunca** usar `navigation.navigate('Login')` manualmente.
- Aba aninhada: `navigation.navigate('Main', { screen: 'Carrinho' })`

---

## Telas e Funcionalidades

### Splash
- Logo com fade-in + spring scale, barra de progresso animada, fundo `#ede3d8`, "DESDE 2022"
- Auto-navega para Login após ~3s (só visível se não autenticado)

### Login / SignUp
- Firebase Auth real — e-mail/senha
- Toggle mostrar/ocultar senha
- Mensagens de erro em PT-BR via `getAuthErrorMessage(code)`
- LoginScreen usa `login()` do AuthContext

### Home
- Carrossel auto-rotativo (4,5 s) com 3 produtos em destaque
- 6 chips de categoria: Queijos 🧀 Cafés ☕ Doces 🍬 Conservas 🫙 Pães 🍞 Vinhos 🍷
- Cards de produto com gradiente, preço, avaliação e badge de promoção

### ProductDetail
- Galeria de imagens com indicadores de ponto
- Seletor de peso (200g / 400g / 600g / 1 kg)
- Controle de quantidade; total calculado via `fmt()`
- Botão "Adicionar" chama `addItem()` do CartContext e navega para Carrinho
- Ícone de coração chama `toggleFavorite()` do FavoritesContext; estado derivado de `isFavorite()`
- ⚠️ Produto ainda hardcoded (TODO: usar `route.params.product`)

### Cart
- Conectada ao CartContext — sem estado local
- Ajuste de quantidade, remoção por item, limpar carrinho
- Subtotal + frete (R$ 15,90) + desconto
- Cupom `CANASTRA10` → R$ 11,00 de desconto
- Totais calculados via `useMemo` no CartContext
- ⚠️ Não persiste no Firestore ainda

### Search
- Histórico de buscas recentes
- Atalhos para categorias populares
- Resultados em tempo real

### Favorites
- Conectada ao FavoritesContext — sem estado local
- Remover favoritos via `removeFavorite()`
- Empty state com CTA "Explorar produtos"
- ⚠️ Não persiste no Firestore ainda

### Profile
- Avatar com iniciais (fundo gradiente)
- Stats: pedidos, itens salvos, total gasto
- Menu com Pedidos, Endereços, Pagamento, Notificações, Ajuda etc.
- Lista de pedidos recentes com status
- Botão "Sair" chama `logout()` do AuthContext

### Checkout
- Progress indicator (Carrinho → Pagamento → Confirmação)
- Seleção de frete: PAC ou SEDEX
- Métodos: PIX (countdown 15 min), Cartão de Crédito, Boleto
- ⚠️ Pagamento simulado — não salva pedido no Firestore

### OrderConfirmation / OrderTracking
- Resumo de pedido com itens e preços
- Timeline com 5 etapas de rastreamento
- Info da transportadora (Correios PAC) + número de rastreio
- ⚠️ Dados estáticos — sem integração real com Correios

---

## Firebase

### Projeto
- **ID:** `emporio-coisas-de-minas`
- **Auth domain:** `emporio-coisas-de-minas.firebaseapp.com`

### Firebase Auth (✅ ativo)
- Provider: E-mail/Senha
- Persistência: AsyncStorage (mobile) + browserLocalPersistence (web)
- Sessão restaurada automaticamente no boot via `onAuthStateChanged`

### Firestore (✅ em produção)
Regras publicadas em `firestore.rules`. Coleções planejadas:

```
/products/{productId}            → catálogo (ainda vazio — TODO popular)
/users/{uid}                     → perfil do usuário (TODO criar no signup)
/users/{uid}/cart/{itemId}       → carrinho (TODO conectar ao CartContext)
/users/{uid}/favorites/{itemId}  → favoritos (TODO conectar ao FavoritesContext)
/users/{uid}/orders/{orderId}    → pedidos (TODO salvar no checkout)
```

### Regras de Segurança (resumo)
| Coleção | Leitura | Escrita |
|---|---|---|
| `/products` | Qualquer autenticado | Só admin |
| `/users/{uid}` | Dono + admin | Só dono |
| `/users/{uid}/cart` | Só dono | Só dono |
| `/users/{uid}/favorites` | Só dono | Só dono |
| `/users/{uid}/orders` | Dono + admin | Dono cria; admin atualiza; ninguém deleta |
| Qualquer outra | ❌ | ❌ |

**Admin:** `emporiominas00@gmail.com` (verificação por e-mail no token JWT).

---

## Context API

### AuthContext — `src/context/AuthContext.jsx`
```js
const { user, loading, isAuthenticated, isAdmin, login, signup, logout } = useAuth();
```
- `user`: objeto FirebaseUser ou null
- `loading`: true enquanto Firebase verifica sessão no boot
- `isAdmin`: true se `user.email === 'emporiominas00@gmail.com'`
- `login(email, pwd)`: chama Firebase; lança erro com `code`
- `logout()`: chama Firebase; AppNavigator redireciona automaticamente

### CartContext — `src/context/CartContext.jsx`
```js
const {
  items, coupon, setCoupon, couponApplied,
  applyCoupon, removeCoupon,
  addItem, removeItem, updateQuantity, clearCart,
  subtotal, totalItems, shipping, discount, total
} = useCart();
```
- `addItem(item)`: dedupe por `id`; se existir, soma quantidade
- `updateQuantity(id, 0)`: remove o item
- Cupom `CANASTRA10` → R$ 11,00 off; frete R$ 15,90
- Totais calculados via `useMemo`
- ⚠️ Dados em memória — não sincroniza com Firestore

### FavoritesContext — `src/context/FavoritesContext.jsx`
```js
const { favorites, count, addFavorite, removeFavorite, isFavorite, toggleFavorite, clearFavorites } = useFavorites();
```
- `isFavorite(id)`: boolean — usado no ícone de coração
- `toggleFavorite(product)`: adiciona ou remove conforme estado atual
- ⚠️ Dados em memória — não sincroniza com Firestore

---

## Paleta de Cores (`src/theme/index.js`)

| Token | Hex | Uso |
|---|---|---|
| `cream` | `#fcf9f5` | Fundo principal |
| `brown` | `#52170c` | Acento primário (CTAs, headers) |
| `terra` | `#964904` | Status "em trânsito", botões secundários |
| `ochre` | `#d8a360` | Estrelas, destaques |
| `muted` | `#54433f` | Texto secundário |
| `subtle` | `#87726e` | Texto terciário |
| `border` | `#dac1bc` | Bordas |
| `ink` | `#1c1c1a` | Texto principal |
| `softCream` | `#f6efe3` | Fundo suave |
| `chip` | `#f0ede9` | Chips/tags |
| `card` | `#ffffff` | Fundo de cards |

Utilitário: `fmt(n)` → `'R$ ' + n.toFixed(2).replace('.', ',')` (moeda BRL)

---

## Padrões de Código

- Sem TypeScript — tudo em `.jsx` / `.js`
- Sem ESLint, Prettier ou testes configurados
- Cores e moeda: sempre via `src/theme/index.js` — não hardcode hex nem `R$`
- Ícones: sempre Ionicons via `@expo/vector-icons`
- Contextos: sempre via hooks (`useAuth`, `useCart`, `useFavorites`)
- Dados mockados ainda existem em: `CartContext.INITIAL_ITEMS`, `FavoritesContext.INITIAL_FAVORITES` e em várias telas (HomeScreen, ProductDetail, etc.)
- Fontes carregadas em `App.js` com `useFonts`; app aguarda na splash até carregar

---

## O Que Já Está Feito

✅ UI/UX completa das 14 telas com fluxo navegável ponta-a-ponta
✅ Firebase Auth real — login, signup, logout com e-mail/senha
✅ Sessão persistente via AsyncStorage (mobile) e localStorage (web)
✅ Proteção de rotas no AppNavigator via estado `user` do Firebase
✅ Context API — AuthContext, CartContext, FavoritesContext
✅ CartScreen conectada ao CartContext (sem estado local)
✅ FavoritesScreen conectada ao FavoritesContext (sem estado local)
✅ LoginScreen usa `login()` do AuthContext
✅ ProfileScreen usa `logout()` do AuthContext
✅ ProductDetailScreen: `addItem()` e `toggleFavorite()` conectados
✅ Firestore criado em produção com regras de segurança publicadas
✅ Admin configurado por e-mail: `emporiominas00@gmail.com`
✅ `firebase.json`, `firestore.rules` e `firestore.indexes.json` versionados
✅ Deploy web no Vercel funcionando

---

## Próximos Passos

1. Popular coleção `/products` no Firestore e buscar produtos nas telas
2. Persistir carrinho em `/users/{uid}/cart` (conectar CartContext ao Firestore)
3. Persistir favoritos em `/users/{uid}/favorites` (conectar FavoritesContext)
4. ProductDetailScreen dinâmica — usar `route.params.product`
5. Criar `/users/{uid}` no signup (nome, email, createdAt)
6. Salvar pedidos em `/users/{uid}/orders` no Checkout
7. Gateway de pagamento real (PIX, Cartão)
8. Rastreamento real via API dos Correios
9. Custom Claims no Firebase Admin SDK (upgrade do isAdmin por e-mail)
10. TypeScript, ESLint + Prettier, testes, CI/CD

---

## Observação importante

O projeto usa **Expo SDK 56** (versão recente, com mudanças significativas em relação às anteriores).
Documentação versionada: https://docs.expo.dev/versions/v56.0.0/
