# Empório Coisas de Minas — Resumo do Projeto

## O que é
App mobile de e-commerce para o **Empório Coisas de Minas**, marketplace de produtos artesanais regionais (queijos, cafés, doces, conservas, pães e bebidas) com foco na **Serra da Canastra, Minas Gerais**.

- **Tagline:** "Delícias da Canastra e outros trem…"
- **Plataformas:** iOS, Android e Web (mesmo código via Expo)
- **Estado atual:** Firebase Auth integrado e funcional. Firestore em produção com regras de segurança. Context API implementada. Catálogo ainda mockado nas telas.
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
| Fontes | Plus Jakarta Sans + Work Sans | ^0.4.2 |
| **Auth / Banco** | **Firebase** | **^12.13.0** |
| **Persistência auth** | **@react-native-async-storage/async-storage** | **2.2.0** |
| Estado global | Context API (3 contextos) | sem Zustand/Redux |

---

## Estrutura de Arquivos

```
emporio-app/
├── src/
│   ├── context/
│   │   ├── AuthContext.jsx        # user, login, logout, isAdmin
│   │   ├── CartContext.jsx        # itens, cupom, totais calculados
│   │   └── FavoritesContext.jsx   # favoritos, toggleFavorite, isFavorite
│   ├── navigation/AppNavigator.jsx  # Stack+Tabs; troca auth/app stack via user
│   ├── screens/                   # 14 telas (.jsx)
│   ├── services/
│   │   ├── firebase.js            # initializeApp
│   │   └── auth.js                # signIn, signUp, signOut, onAuthStateChanged
│   └── theme/index.js             # paleta C + fmt()
├── App.js                         # fontes + 3 providers aninhados
├── firestore.rules                # regras de segurança Firestore (produção)
├── firebase.json                  # config Firebase CLI
└── vercel.json                    # deploy web
```

---

## Navegação e Proteção de Rotas

```
AppNavigator verifica user (Firebase):

[NÃO AUTENTICADO] → Splash → Login → SignUp
[AUTENTICADO]     → Main (Tabs: Home | Categorias | Carrinho | Favoritos | Perfil)
                    + ProductDetail, Search, Listing, Checkout, OrderConfirmation, OrderTracking
```

- Logout: `logout()` do AuthContext → AppNavigator redireciona automaticamente
- Aba aninhada: `navigation.navigate('Main', { screen: 'Carrinho' })`

---

## Context API — 3 Contextos

### `useAuth()` — AuthContext
`{ user, loading, isAuthenticated, isAdmin, login(email,pwd), signup(email,pwd), logout() }`
- Auth real via Firebase; sessão persistida via AsyncStorage/localStorage
- `isAdmin` = `user.email === 'emporiominas00@gmail.com'`
- Logout não precisa de navegação manual — AppNavigator detecta automaticamente

### `useCart()` — CartContext
`{ items, coupon, setCoupon, couponApplied, applyCoupon, removeCoupon, addItem, removeItem, updateQuantity, clearCart, subtotal, totalItems, shipping, discount, total }`
- `addItem`: dedupe por id, soma qty se já existir
- Cupom `CANASTRA10` → R$ 11,00 off; frete R$ 15,90
- Totais calculados automaticamente via `useMemo`
- ⚠️ Em memória — não persiste no Firestore ainda

### `useFavorites()` — FavoritesContext
`{ favorites, count, addFavorite, removeFavorite, isFavorite(id), toggleFavorite(product), clearFavorites }`
- ⚠️ Em memória — não persiste no Firestore ainda

---

## Telas e Funcionalidades (14 telas)

| Tela | O que faz | Contexto |
|---|---|---|
| **Splash** | Logo animada, barra de progresso, auto-navega → Login | — |
| **Login** | Firebase Auth real, mensagens de erro PT-BR | `useAuth` |
| **SignUp** | Cadastro Firebase | — |
| **Home** | Carrossel 4,5s, 6 chips de categoria, cards com gradiente/preço/rating | — |
| **Categories** | Grade de categorias | — |
| **Cart** | Qtd, remove, limpa, cupom CANASTRA10, frete, totais | `useCart` |
| **Favorites** | Lista, remove, empty state + CTA | `useFavorites` |
| **Profile** | Avatar, stats, menu, pedidos recentes, logout | `useAuth` |
| **ProductDetail** | Galeria, seletor peso, qty, botão Adicionar, coração | `useCart` + `useFavorites` |
| **Search** | Histórico, atalhos, resultados em tempo real | — |
| **Listing** | Listagem filtrada | — |
| **Checkout** | Progress bar, PAC/SEDEX, PIX/Cartão/Boleto (mock) | — |
| **OrderConfirmation** | Resumo do pedido | — |
| **OrderTracking** | Timeline 5 etapas, info Correios (mock) | — |

---

## Firebase

- **Projeto:** `emporio-coisas-de-minas`
- **Auth:** E-mail/Senha ativo, sessão persistente
- **Firestore:** criado em modo produção

### Regras Firestore (publicadas)
| Coleção | Leitura | Escrita |
|---|---|---|
| `/products` | Autenticado | Só admin |
| `/users/{uid}` | Dono + admin | Só dono |
| `/users/{uid}/cart` | Só dono | Só dono |
| `/users/{uid}/favorites` | Só dono | Só dono |
| `/users/{uid}/orders` | Dono + admin | Dono cria; admin atualiza; ninguém deleta |
| Qualquer outra | ❌ | ❌ |

**Admin:** `emporiominas00@gmail.com` (email no token JWT).

### Coleções planejadas (ainda vazias)
```
/products/{id}               → catálogo — TODO popular
/users/{uid}                 → perfil — TODO criar no signup
/users/{uid}/cart/{id}       → carrinho — TODO conectar
/users/{uid}/favorites/{id}  → favoritos — TODO conectar
/users/{uid}/orders/{id}     → pedidos — TODO salvar no checkout
```

---

## Paleta de Cores (`src/theme/index.js`)

| Token | Hex | Uso |
|---|---|---|
| `cream` | `#fcf9f5` | Fundo principal |
| `brown` | `#52170c` | Primário (CTAs, headers, tab ativo) |
| `terra` | `#964904` | Status "em trânsito", botões secundários |
| `ochre` | `#d8a360` | Estrelas, destaques |
| `muted` | `#54433f` | Texto secundário |
| `subtle` | `#87726e` | Texto terciário |
| `border` | `#dac1bc` | Bordas |
| `ink` | `#1c1c1a` | Texto principal |
| `softCream` | `#f6efe3` | Fundo suave |
| `chip` | `#f0ede9` | Chips/tags |

`fmt(n)` → `'R$ ' + n.toFixed(2).replace('.', ',')`

---

## O Que Já Está Feito

✅ UI/UX das 14 telas com fluxo completo
✅ Firebase Auth real (login/signup/logout + sessão persistente)
✅ Proteção de rotas via AppNavigator (user state)
✅ Context API: AuthContext + CartContext + FavoritesContext
✅ Cart, Favorites, Login, Profile, ProductDetail conectados aos contextos
✅ Firestore em produção com regras de segurança publicadas
✅ Admin configurado: `emporiominas00@gmail.com`
✅ Deploy web no Vercel com moldura de celular em desktop

## O Que Ainda Falta

❌ Catálogo real — produtos mockados; `/products` no Firestore vazio
❌ Carrinho não persiste — CartContext é em memória
❌ Favoritos não persistem — FavoritesContext é em memória
❌ ProductDetailScreen hardcoded — não usa `route.params.product`
❌ Signup não cria `/users/{uid}` no Firestore
❌ Checkout não salva pedidos em `/users/{uid}/orders`
❌ Gateway de pagamento real (PIX, cartão)
❌ Rastreamento real (Correios)
❌ TypeScript, ESLint, Prettier, testes, CI/CD

---

## Próximos Passos (prioridade)

1. Popular `/products` e buscar nas telas
2. Persistir carrinho em `/users/{uid}/cart`
3. Persistir favoritos em `/users/{uid}/favorites`
4. ProductDetailScreen dinâmica com `route.params.product`
5. Criar perfil no signup em `/users/{uid}`
6. Salvar pedidos no Checkout
7. Gateway de pagamento real
8. Rastreamento Correios
9. Custom Claims (upgrade do isAdmin)
10. TypeScript + ESLint + testes + CI/CD

---

## Observação importante

O projeto usa **Expo SDK 56** — leia a doc versionada antes de escrever código:
https://docs.expo.dev/versions/v56.0.0/
