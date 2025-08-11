# Flappy NEAT — Notas de engenharia e solução do bug de convergência em 2 grupos

Este projeto usa uma implementação tipo NEAT (NeuroEvolution of Augmenting Topologies) adaptada para o Flappy Bird.

Este documento resume:
- O que causou o comportamento de convergir para 2 grupos (pássaros indo ao topo e ao chão em loop)
- Como diagnosticar e corrigir
- Boas práticas para futuros jogos

## Sintomas
- Geração 0 joga normalmente.
- A partir da geração 1: a população se divide em dois grupos estáveis — metade sobe e bate no topo, metade cai e bate no chão — repetindo em todas as gerações.

## Causa raiz
1. Inicialização inconsistente do cenário entre gerações
   - O primeiro par de canos aparecia imediatamente na geração 0, mas nas gerações seguintes surgia mais tarde (ou duplicado), mudando o “estímulo inicial”.
   - Essa assimetria fazia os indivíduos adotarem estratégias extremas e auto-reforçadas (atratores topo/baixo).

2. Spawn baseado em frames em vez de distância
   - A lógica de spawn usava frame count escalado pela velocidade. Ao acelerar, em vez de parecer “mais rápido”, surgiam mais canos por tempo, distorcendo o ambiente.

3. Simetria inicial e entradas pouco informativas
   - Todos os pássaros largavam exatamente iguais, e a rede inicialmente não percebia adequadamente o “centro do gap”, incentivando decisões simétricas.

4. Controle de pulo binário sem cooldown/threshold apropriados
   - Sem amortecimento, a saída saturada pode virar um oscilador (subir muito/ cair muito).

> Observação: apenas corrigir o ponto (1) já eliminou o loop extremo. Os demais itens tornam o sistema mais robusto e evitam regressões.

## Correções aplicadas no projeto
1. Mesmo cenário no início de cada geração
   - Limpar `pipes` e criar exatamente um cano imediatamente ao iniciar a geração, e resetar o acumulador de spawn:

```js
// Ao iniciar/apos evolve()
pipes = [];
createPipe();
this.pipeSpawnProgress = 0; // reset do acumulador de distância
```

2. Spawn por distância percorrida (não por frames)

```js
// Em vez de frameCount % k
this.pipeSpawnProgress += pipeSpeed * this.speed;
if (this.pipeSpawnProgress >= this.pipeBaseSpacingPx) {
  createPipe();
  this.pipeSpawnProgress = 0;
}
```

3. Inputs mais informativos para a rede
- Inclui distância vertical ao centro do gap do próximo cano, distância horizontal, velocidade normalizada, tamanho do gap, altura do cano superior.

4. Controle de pulo estável (Flappy clássico)
- Pulso discreto com `cooldown` e limiar (threshold) por pássaro para evitar sincronização perfeita:

```js
if (output > bird.flapThreshold && bird.flapCooldown <= 0) {
  bird.velocity = bird.jump;
  bird.flapCooldown = Math.max(3, Math.floor(6 / this.speed));
}
```

5. Diversidade e anti-saturação
- Pequenas variações de `gravity`, `jump` e `flapThreshold` por pássaro.
- Clamp de pesos em [-2, 2].
- Elitismo moderado (recomendado 5–10%).

6. NEAT mais fiel
- Mutação com adição de nós e conexões (via `Mutator.mutateGenome`).
- Crossover preservando estrutura do mais apto e mesclando conexões do outro.

## Como diagnosticar no futuro (checklist)
- Obstáculos iniciais:
  - Geração 0 e seguintes começam com o mesmo conteúdo na tela? O primeiro obstáculo nasce sempre no mesmo momento/distância?
- Spawn:
  - O espaçamento entre obstáculos é baseado em distância percorrida e permanece visualmente constante quando a velocidade muda?
- Estado inicial dos agentes:
  - Você injeta mínima aleatoriedade em `y`, `velocity` e thresholds para quebrar simetria?
- Entradas (inputs):
  - A rede recebe sinal do “centro do alvo” (ex.: centro do gap)? As entradas estão normalizadas e estáveis?
- Controle/Ativações:
  - Saída saturando demais? Threshold/cooldown configurados para evitar oscilação?
  - Ativações com ganho moderado e entradas “clampadas” para evitar overflow?
- Evolução:
  - Elitismo não muito alto (5–10%).
  - Seleção com torneio que não pegue apenas o topo absoluto.
  - Mutação com passos pequenos e ocasionais passos maiores; clamp de pesos.
- Topologia:
  - Se usar NEAT com topologia variável, garantir que o crossover lide com nós ocultos e que o gerador de rede respeite a ordem topológica.

## Exemplos mínimos de correção
- Reset por geração (após `evolve()`):

```js
pipes = [];
createPipe();
this.pipeSpawnProgress = 0;
score = 0;
frameCount = 0;
```

- Spawn por distância:

```js
// No update
this.pipeSpawnProgress += pipeSpeed * this.speed;
if (this.pipeSpawnProgress >= this.pipeBaseSpacingPx) {
  createPipe();
  this.pipeSpawnProgress = 0;
}
```

- Inputs úteis (exemplo):

```js
const gapCenterY = nextPipe.topHeight + pipeGap / 2;
const verticalToCenter = (gapCenterY - (bird.y + bird.height/2)) / canvas.height;
const inputs = [verticalToCenter, (bird.velocity + 10) / 20, (nextPipe.x - bird.x) / canvas.width, pipeGap / canvas.height, nextPipe.topHeight / canvas.height];
```

## Elitismo recomendado para população 600
- 5–8% é um bom intervalo. Você está usando 10% — é aceitável, mas 5% aumenta a diversidade quando houver sinais de convergência precoce.

## A rede adiciona/remove nós ocultos?
- Sim, adiciona (via split de conexão) e adiciona novas conexões (Mutator).
- Remoção física de nós não é realizada (seguindo NEAT clássico). É possível remover conexões para “desativar” nós.

---

Se este comportamento reaparecer, verifique primeiro o reset/primeiro obstáculo e o método de spawn. Em seguida, revise inputs, thresholds, diversidade e parâmetros de evolução.
