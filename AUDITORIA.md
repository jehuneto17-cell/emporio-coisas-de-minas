# Auditoria — Empório Coisas de Minas (App Mobile)
Data: 2026-07-19

> Auditoria somente de leitura. Nenhum arquivo foi alterado. Todos os itens abaixo foram confirmados lendo o código-fonte diretamente (arquivo:linha citados). Onde há incerteza sobre o comportamento em produção (ex.: regras do Firestore realmente publicadas), isso está sinalizado explicitamente.

---

## 🔴 Crítico (corrigir o quanto antes)

### 1. Token de produção do Melhor Envio commitado em texto puro no Git
`api/calcular-frete.js:4-6` — o token JWT completo está hardcoded como fallback:
```js
const MELHOR_ENVIO_TOKEN =
  process.env.MELHOR_ENVIO_TOKEN ||
  'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...'
```
Decodificado, este token é **válido até 21/06/2027** (`exp`), foi emitido em 21/06/2026 (`iat`), e tem escopos amplíssimos: `products-destroy`, `products-write`, `users-write`, `webhooks-delete`, `shipping-generate`, `shipping-cancel`, entre outros. Ou seja, **não é o token "revogado" que o CLAUDE.md descreve** — é um token ativo, de produção, com poder de apagar produtos e gerenciar webhooks, gravado em 3 commits do histórico Git (`2dff1b1`, `5530240`, `de43f4a`). Qualquer pessoa com acesso ao repositório (ou ao histórico, mesmo que o arquivo seja "corrigido" depois) pode extrair e usar esse token.
**Ação:** revogar/rotacionar este token imediatamente no painel do Melhor Envio, remover o valor hardcoded (deixar só `process.env.MELHOR_ENVIO_TOKEN`, sem fallback), e considerar reescrever o histórico do Git ou pelo menos tratar o token como comprometido.

### 2. Checkout completamente não funcional no app nativo (iOS/Android) — frete, PIX e cartão
`src/screens/CheckoutScreen.jsx:15-36` define 4 URLs de API assim:
```js
const FRETE_API_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
  ? 'https://emporio-coisas-de-minas.vercel.app/api/calcular-frete'
  : 'http://localhost:8081/api/calcular-frete';
```
(mesmo padrão em `PIX_API_URL`, `CARTAO_API_URL`, `VERIFICAR_API_URL`). No app nativo (Expo Go ou build iOS/Android), **não existe `window`** — logo `typeof window !== 'undefined'` é sempre `false`, e todas as 4 URLs caem em `http://localhost:8081/...`, um endereço que só existe na máquina de desenvolvimento. **Resultado: cálculo de frete, geração de PIX, pagamento com cartão e verificação de status do PIX não funcionam em nenhuma build nativa do app** — só funcionam quando o app roda como site (Vercel). Isso é coerente com o achado de que o pagamento por cartão já é bloqueado explicitamente no nativo (`tokenizarCartao` exige `Platform.OS === 'web'`), mas o frete e o PIX deveriam funcionar em qualquer plataforma e não funcionam.
**Ação:** usar a URL relativa (`/api/...`, resolvida pelo próprio Expo/host) quando rodando web, e para nativo apontar sempre para o domínio de produção do Vercel (nunca `localhost`) — ou usar uma variável de ambiente/config por ambiente.

### 3. Estoque decrementado antes da confirmação do pagamento, sem estorno
`src/screens/CheckoutScreen.jsx:493` chama `await decrementarEstoque(items)` logo após criar o pedido (linha 445) — **antes** de saber se o PIX será pago (`gerarPixReal`, chamado depois) ou se o cartão será aprovado (`tokenizarCartao`/cobrança, chamado depois). Não existe nenhuma função de estorno de estoque no código (`incrementarEstoque` não existe — confirmado). Consequência: todo PIX abandonado/expirado/rejeitado e todo cartão recusado **decrementa estoque real de produtos que nunca foram efetivamente vendidos**, sem qualquer mecanismo de correção automática.

### 4. `decrementarEstoque` tem condição de corrida (race condition) — risco de overselling
`src/services/firestore.js:451-472`:
```js
const snap = await getDoc(ref);                 // lê stock atual
const newStock = Math.max(0, currentStock - qty);
batch.update(ref, { stock: newStock, ... });     // escreve depois, sem revalidar
await batch.commit();
```
Isso é "ler, calcular em JS, depois gravar em lote" — **não é uma transação Firestore** (`runTransaction`). `writeBatch` garante atomicidade da escrita, mas não revalida o valor lido no momento do commit. Se dois clientes finalizarem pedido do mesmo produto quase ao mesmo tempo (ex.: estoque = 1, dois pedidos de qty 1 chegam em paralelo), **ambos podem ler `stock: 1`, ambos calculam `newStock: 0`, e ambos commitam com sucesso** — dois pedidos confirmados para 1 unidade real de estoque. A correção correta é usar `runTransaction`, que revalida a leitura no momento do commit e falha/repete automaticamente em caso de conflito.

### 5. `decrementarEstoque` provavelmente falha silenciosamente sempre (regra do Firestore não permite)
`firestore.rules:73-78` só permite `update`/`delete` em `/produtos` para `isAdmin()`. `decrementarEstoque` é chamado do `CheckoutScreen.jsx` no contexto do usuário comprador comum (não-admin) — ou seja, a escrita **deveria ser rejeitada pelas regras publicadas**, a menos que as regras realmente ativas em produção sejam diferentes deste arquivo. Como a função engole qualquer erro (`catch (e) { console.warn(...); }`, linha 470, sem relançar), esse possível bloqueio é **completamente invisível** — o checkout continua normalmente como se o estoque tivesse sido atualizado. **Verificar diretamente no Firebase Console se as regras publicadas batem com `firestore.rules`**; se baterem, o decremento de estoque nunca funcionou em produção.

### 6. Coleções usadas pelo app sem regra correspondente em `firestore.rules`
O arquivo de regras só cobre `/banners`, `/configuracoes`, `/produtos` e `/users/{uid}` (+ subcoleções `cart`, `favorites`, `orders`, `addresses`, `settings`). O catch-all final (`firestore.rules:129-131`) nega tudo mais. Porém o app lê/grava ativamente:
- **`/pedidos/{orderId}`** — `addPedidoAdmin`, `savePixData`, `updatePixStatus`, `getPedidoAdmin` (`src/services/firestore.js:159,175,186,216`) — espelho de pedidos usado pelo painel admin e pelo `OrderTrackingScreen`.
- **`/categorias/{id}`** — `getCategories`, `getAllCategories`, `getSubcategories` — usado por Home, Categorias, Subcategorias.
- **`/cupons/{id}`** — `getCupons`, usado pelo `CartContext.applyCoupon`.
- **`/users/{uid}/notifications/{id}`** — usado por `NotificationsPanel.jsx` — **subcoleções não herdam a regra do documento pai**, então mesmo estando dentro de `/users/{uid}`, precisa de bloco próprio.
- **`/clientes/{uid}`** — `upsertClienteAdmin`, chamado a cada login (`AuthContext.jsx:48`).

Todas essas chamadas estão em try/catch com `console.warn`, então falhas não derrubam o app — mas se as regras publicadas forem realmente as deste arquivo, **categorias, cupons, notificações, o espelho de pedidos do admin e o espelho de clientes estariam silenciosamente quebrados em produção agora**. Isso precisa ser conferido diretamente no Firebase Console (Firestore → Regras) — pode ser que o arquivo local esteja desatualizado em relação ao que foi de fato publicado.

### 7. Webhook do Melhor Envio sem verificação de assinatura/segredo
`api/webhook-melhor-envio.js:27-81` recebe `{ tracking, status, order_id }` via POST e **confia neles sem nenhuma validação de origem** (sem checar header de assinatura, sem segredo compartilhado). Como o handler usa Firebase Admin SDK (que ignora as regras do Firestore), qualquer pessoa que descubra essa URL pode forjar uma atualização de status para **qualquer pedido real**, por exemplo marcando-o como "Entregue" prematuramente ou injetando um código de rastreio falso. Além disso, essa é a única rota de `api/` que devolve `e.message` cru no erro (linha 79), vazando detalhes internos.
**Ação:** validar um header de assinatura/segredo do Melhor Envio antes de processar o payload.

### 8. Endpoints de pagamento sem nenhuma autenticação/autorização
`api/criar-pagamento-pix.js`, `api/criar-pagamento-cartao.js` e `api/gerar-etiqueta.js` aceitam POST de qualquer origem (`Access-Control-Allow-Origin: '*'`) e processam o `total` enviado no corpo da requisição **sem validar que ele corresponde a um pedido real no Firestore**, e sem qualquer verificação de que quem chama é um usuário autenticado do app. Na prática, qualquer pessoa que descubra essas URLs pode:
- Criar cobranças PIX reais na conta do Mercado Pago da loja com valor e e-mail arbitrários (`criar-pagamento-pix.js:12-25`).
- Tentar processar cobrança de cartão com um token MP válido, também com valor arbitrário (`criar-pagamento-cartao.js:12-29`).
- Gerar etiquetas de envio reais e pagas no Melhor Envio (`gerar-etiqueta.js`), gerando custo financeiro direto para a loja.
`api/verificar-pagamento.js` some ainda não valida sequer o método HTTP (os demais endpoints checam `req.method !== 'POST'`; este não tem guarda de método) e permite consultar o status de **qualquer `paymentId`**, não necessariamente de um pedido do próprio usuário.
**Ação:** no mínimo, validar `total` contra o pedido salvo no Firestore antes de criar a cobrança, e considerar exigir um token de sessão do Firebase Auth nesses endpoints.

### 9. Exclusão de conta não apaga dados do Firestore (gap de LGPD)
`src/screens/PrivacyScreen.jsx:97` exibe ao usuário: **"Conta excluída — Seus dados foram removidos permanentemente"** após `handleDeleteAccount` rodar. Porém `deleteAccount()` em `src/services/auth.js:60-66` só chama `deleteUser(user)` do Firebase Auth — **nenhum documento do Firestore é apagado** (`/users/{uid}`, `/users/{uid}/orders`, `/favorites`, `/cart`, `/addresses`, `/clientes/{uid}`, os pedidos em `/pedidos` continuam existindo). A própria tela de Privacidade (`PrivacyScreen.jsx:27-28`) cita a LGPD e promete exclusão de dados mediante esse botão. Hoje isso é uma alegação falsa mostrada ao usuário — os dados pessoais permanecem no banco após a "exclusão".

---

## 🟡 Importante (deveria corrigir em breve)

### 10. Erro de confirmação do pedido não mostra nada ao usuário
`src/screens/CheckoutScreen.jsx:559-561` (catch mais externo de `handleConfirm`) só faz `console.warn('[Checkout] error', e)` — se `addOrder` falhar por qualquer motivo não previsto nos caminhos já tratados, o botão simplesmente para de girar e o usuário não recebe nenhuma mensagem de erro ou orientação.

### 11. Intervalo de polling do PIX nunca é limpo ao sair da tela
`src/screens/CheckoutScreen.jsx:65,299-319` — o `setInterval` que verifica status do PIX a cada 5s é armazenado em `pollingInterval` (`setPollingInterval(interval)`, linha 319), mas essa variável de estado **nunca é lida em nenhum outro lugar do arquivo** e não existe `useEffect` de cleanup que chame `clearInterval` ao desmontar a tela. Se o usuário sair do Checkout com um PIX pendente, o polling continua rodando indefinidamente em segundo plano, inclusive podendo disparar `navigation.navigate('OrderConfirmation', ...)` bem mais tarde, de forma inesperada, quando o usuário já está em outra parte do app.

### 12. Falha ao espelhar pedido para o painel admin é totalmente silenciosa
`src/screens/CheckoutScreen.jsx:488-490` — se `addPedidoAdmin` falhar, o pedido do cliente já foi salvo normalmente (`/users/{uid}/orders`), mas o espelho em `/pedidos` (usado pelo painel admin para a loja ver e processar o pedido) falha sem qualquer alerta, log persistente ou re-tentativa. A loja pode nunca saber que um pedido existe.

### 13. `getProductById` busca o catálogo inteiro para achar 1 produto
`src/services/firestore.js:82-85`:
```js
export async function getProductById(id) {
  const all = await fetchAll();
  return all.find((p) => p.id === id) ?? null;
}
```
Isso lê **todos os documentos** da coleção `/produtos` só para filtrar um. É chamado em `CheckoutScreen.jsx` dentro de `items.map(item => getProductById(...))` (linha 142) — ou seja, para um carrinho com N itens, o catálogo inteiro é buscado N vezes em paralelo no momento mais crítico do fluxo (cálculo de frete no checkout). Deveria usar `getDoc(doc(db, 'produtos', id))` diretamente.

### 14. 207 cores hardcoded fora do tema `C.` em 22 arquivos de tela
Violação direta da Regra #5 do CLAUDE.md. Cores semânticas recorrentes reimplementadas como hex cru em vários arquivos, em vez de usar (ou criar) um token único em `src/theme/index.js`:
- Verde de sucesso `#2e7d32`/`#e8f5e9` — repetido em `CheckoutScreen.jsx`, `OrderTrackingScreen.jsx`, `LoginScreen.jsx`, `OrderConfirmationScreen.jsx` (o tema já tem `C.greenFg`/`C.greenBg` equivalentes e não são usados nesses pontos).
- Vermelho de erro/perigo `#c0392b`/`#d32f2f`/`#fdecea` — em pelo menos 6 arquivos (`AddressesScreen.jsx`, `LoginScreen.jsx`, `SignUpScreen.jsx`, `PrivacyScreen.jsx`, `CheckoutScreen.jsx`, `MyOrdersScreen.jsx`).
- Azul do Mercado Pago `#009ee3` — `MyOrdersScreen.jsx:41`, `CheckoutScreen.jsx:1088`, `OrderConfirmationScreen.jsx:299`.
- Verde "verificado" `#3a7a3a`/`#e7f1e6` — 4 usos em `ProductDetailScreen.jsx`, sem equivalente no tema.
- `#964904` (valor idêntico a `C.terra`) duplicado como literal em `HomeScreen.jsx:30` e `SubcategoryScreen.jsx:9`; `#d8a360` (= `C.ochre`) duplicado 3x em `SplashScreen.jsx`; `#ffb4a5` (= `C.rose`) duplicado em `SplashScreen.jsx:107`.
**Ação:** adicionar tokens (`C.danger`, `C.success`, `C.mpBlue` etc.) ao tema e substituir os literais.

### 15. `TextInput` sem `outlineStyle: 'none'` em 2 telas
`EditProfileScreen.jsx` (campo `fieldInput`, usado por todos os inputs da tela) e `PrivacyScreen.jsx` (input de redefinição de senha e input de senha para exclusão de conta) não têm `outlineStyle` nem inline nem no stylesheet — diferente do padrão aplicado nas demais 7 telas com `TextInput`. Nota: `web/index.html:14-22` já tem uma regra CSS global `*:focus { outline: none !important }` que cobre isso na versão web mesmo sem o `outlineStyle` por componente — então o impacto real hoje é baixo (cosmético/redundância), mas quebra a consistência do padrão documentado no CLAUDE.md.

### 16. Lógica de status do pedido duplicada e divergente em 4 telas
`MyOrdersScreen.jsx` (`normalizeStatus`, com remoção de acentos via NFD), `ProfileScreen.jsx` (`getStatusColor`/`getStatusLabel`, sem remoção de acentos), `OrderTrackingScreen.jsx` (`getStatusLabel`, outra variação) e `OrderConfirmationScreen.jsx` implementam separadamente a tradução de status para cor/rótulo. Como as implementações divergem (algumas tratam acento, outras não), **o mesmo pedido pode exibir status diferente dependendo da tela** — por exemplo `'Em trânsito'` (com acento, como o admin grava) pode não ser reconhecido em `ProfileScreen.jsx` do mesmo jeito que em `MyOrdersScreen.jsx`.

### 17. `firebase-admin` como dependência direta do app mobile
`package.json` lista `firebase-admin: ^13.10.0` junto com as dependências do Expo/React Native. Esse é um SDK server-only (Node.js), pesado, que não deveria fazer parte do bundle do app cliente — deveria viver isolado nas funções serverless (`api/`), não no `package.json` raiz que o Metro bundler usa para o app mobile.

---

## 🟢 Melhoria (não é bug, mas melhora qualidade)

- **`CheckoutScreen.jsx` com 1133 linhas** — mistura seleção de entrega/retirada, endereço, cálculo de frete, fluxo PIX completo, tokenização e formulário de cartão, e resumo do pedido em um único arquivo. Bom candidato a dividir em subcomponentes (`PixPaymentPanel`, `CardPaymentForm`, `ShippingSelector`).
- **`src/services/firestore.js` com 532 linhas e 40+ funções exportadas** sem separação por domínio (produtos, pedidos, favoritos, carrinho, categorias, cupons, config, admin-mirror tudo no mesmo arquivo).
- **12 `console.log` de debug esquecidos em caminhos de pagamento**, incluindo payloads sensíveis (`CheckoutScreen.jsx:187,188,197,200,282,292,295,521`; `OrderTrackingScreen.jsx:72-74`; `firestore.js:151`) — alguns logam QR Code de PIX e UID inteiros no console do navegador. Deveriam ser removidos antes de builds de produção.
- **Padrão de fallback de imagem duplicado em ~8 telas** (`(p.images && p.images[0]) || p.imageUrl || null`) — bom candidato a um helper único `getProductImage(product)`.
- **Formatação de CPF duplicada em 3 arquivos** (`SignUpScreen.jsx`, `AddressesScreen.jsx`, `CheckoutScreen.jsx`) com a mesma lógica de máscara — poderia virar um utilitário compartilhado em `src/utils/format.js`.
- **`getCatIcon` (mapeamento de ícone de categoria) duplicado quase idêntico em 4 arquivos** (`HomeScreen.jsx`, `CategoriesScreen.jsx`, `SubcategoryScreen.jsx`).
- **Cartão "visitante não logado" reimplementado 3 vezes** (`ProfileScreen.jsx`, `MyOrdersScreen.jsx`, `AddressesScreen.jsx`) em vez de um componente compartilhado.
- **Listas principais renderizadas com `.map()` dentro de `ScrollView` em vez de `FlatList`** em `HomeScreen.jsx` (4 seções de produtos), `SearchScreen.jsx` (resultados de busca sem limite), `FavoritesScreen.jsx` e `CartScreen.jsx`. Baixo risco hoje (catálogo pequeno), mas escala mal.
- **Funções de item de lista recriadas a cada render** sem `useCallback`/`React.memo` (`ProductCard`/`ProductGridCard` em `HomeScreen.jsx`, `renderProduct` em `ListingScreen.jsx`, `renderOrder` em `MyOrdersScreen.jsx`) — não crítico no volume atual de dados.
- **`getGoogleRedirectResult()` em `src/services/auth.js:52-54`** é código morto — sempre retorna `Promise.resolve(null)` e não é chamado em lugar nenhum.
- **Funções quase idênticas em `firestore.js`** (`savePixData`/`updatePixStatus` escrevem os mesmos dois documentos com boilerplate repetido; `clearFavoriteDocs`/`clearCartItems` são estruturalmente idênticas) — poderiam virar helpers genéricos.
- **Catch vazio sem log algum** em `OrderTrackingScreen.jsx:86` (`catch (e) {}` no `handleCopy`) — baixo impacto (só a cópia do código PIX), mas deveria ao menos logar.
- Comentário com typo de sintaxe (`\ O doc...` em vez de `// O doc...`) em `src/services/firestore.js:485` — inofensivo (fica dentro de um bloco de comentário adjacente), mas vale corrigir.

---

## 📋 Resumo executivo

O app tem uma base sólida — Firebase Auth, contextos bem estruturados, fluxo de navegação coerente e boa cobertura de estados de carregamento/vazio na maioria das telas. Porém, para um app processando pagamentos reais, existem problemas graves e ativos: um token de produção do Melhor Envio com escopo amplo está commitado em texto puro no Git; o checkout (frete, PIX e cartão) provavelmente não funciona em nenhuma build nativa iOS/Android, apenas na versão web; o decremento de estoque acontece antes da confirmação do pagamento, sem estorno, e tem uma condição de corrida real que pode gerar overselling; os endpoints de pagamento e o webhook do Melhor Envio não têm nenhuma verificação de autenticação/assinatura, permitindo em teoria cobranças e atualizações de pedido forjadas por terceiros; e a tela de exclusão de conta afirma remover dados permanentemente sem de fato apagar nada do Firestore. Recomenda-se tratar os 9 itens críticos como bloqueadores antes de qualquer nova feature, priorizando nesta ordem: rotacionar o token exposto, corrigir as URLs de API para nativo, envolver o decremento de estoque numa transação Firestore movida para depois da confirmação do pagamento, e adicionar verificação de autenticação/assinatura aos endpoints de pagamento e ao webhook.
