# NEAT JavaScript Implementation

Uma implementação completa do algoritmo **NEAT (NeuroEvolution of Augmenting Topologies)** em JavaScript para jogos web.

## 📋 Visão Geral

Este sistema permite que redes neurais evoluam automaticamente para jogar qualquer jogo, crescendo em complexidade conforme necessário. A implementação é baseada no algoritmo NEAT original e inclui todas as funcionalidades principais.

## 🚀 Como Integrar em Seus Jogos

### 1. Incluir os Scripts

```html
<!-- Scripts NEAT (ordem importante) -->
<script src="NEAT_JavaScript_Conversion/NumberGenerator.js"></script>
<script src="NEAT_JavaScript_Conversion/Configuration.js"></script>
<script src="NEAT_JavaScript_Conversion/BinaryIO.js"></script>
<script src="NEAT_JavaScript_Conversion/Activation.js"></script>
<script src="NEAT_JavaScript_Conversion/DAG.js"></script>
<script src="NEAT_JavaScript_Conversion/Network.js"></script>
<script src="NEAT_JavaScript_Conversion/Genome.js"></script>
<script src="NEAT_JavaScript_Conversion/Mutator.js"></script>
<script src="NEAT_JavaScript_Conversion/NetworkGenerator.js"></script>
<script src="NEAT_JavaScript_Conversion/NEAT.js"></script>
```

### 2. Criar a Classe do Jogo com NEAT

```javascript
class GameNEAT {
    constructor(numInputs, numOutputs, populationSize = 1500) {
        this.neat = new NEAT(numInputs, numOutputs);
        this.populationSize = populationSize;
        this.players = [];
        this.generation = 0;
        this.running = false;
        this.speed = 1;
        this.bestScore = 0;
        this.bestGenome = null;
        this.obstacleSpawnProgress = 0;
        this.obstacleBaseSpacing = 180; // distância entre obstáculos
    }

    start() {
        this.running = true;
        this.createPopulation();
        this.generation = 1;
        console.log(`NEAT iniciado - Geração ${this.generation} com ${this.populationSize} players`);
    }

    createPopulation() {
        // Inicializar população manualmente
        this.neat.population = [];
        for (let i = 0; i < this.populationSize; i++) {
            const genome = new Genome(this.neat.inputs, this.neat.outputs);
            
            // Adicionar conexões iniciais
            const numConnections = Math.floor(Math.random() * 3) + 1;
            for (let j = 0; j < numConnections; j++) {
                const inputIdx = Math.floor(Math.random() * this.neat.inputs);
                const outputIdx = this.neat.inputs;
                const weight = (Math.random() - 0.5) * 4;
                genome.tryCreateConnection(inputIdx, outputIdx, weight);
            }
            
            this.neat.population.push({
                genome: genome,
                fitness: 0,
                network: null
            });
        }
        
        this.createPlayers();
    }

    createPlayers() {
        this.players = [];
        for (let i = 0; i < this.neat.population.length; i++) {
            this.players.push({
                // Propriedades básicas (adapte para seu jogo)
                x: 50,
                y: 300 + (Math.random() - 0.5) * 100, // pequena variação inicial
                width: 34,
                height: 24,
                velocity: (Math.random() - 0.5) * 2,
                alive: true,
                score: 0,
                fitness: 0,
                network: null,
                genome: this.neat.population[i].genome,
                // Parâmetros únicos para quebrar simetria
                actionThreshold: 0.55 + Math.random() * 0.2,
                actionCooldown: 0
            });
        }
    }

    update() {
        if (!this.running) return;

        // Atualizar spawn de obstáculos por distância
        this.obstacleSpawnProgress += gameSpeed * this.speed;
        if (this.obstacleSpawnProgress >= this.obstacleBaseSpacing) {
            this.createObstacle();
            this.obstacleSpawnProgress = 0;
        }

        let alivePlayers = 0;
        
        this.players.forEach((player, index) => {
            if (!player.alive) return;

            // Criar rede neural se não existe
            if (!player.network) {
                try {
                    player.network = NetworkGenerator.generateFromGenome(player.genome);
                } catch (error) {
                    console.warn(`Erro ao criar rede para player ${index}:`, error);
                    player.network = this.createSimpleNetwork();
                }
            }

            // Obter inputs do jogo
            const inputs = this.getInputs(player);
            
            // Executar rede neural
            let outputs = [0];
            try {
                player.network.execute(inputs);
                const result = player.network.getResult();
                outputs = result && result.length > 0 ? result : [0];
            } catch (error) {
                outputs = [Math.random()];
            }

            // Aplicar outputs ao jogador
            this.applyOutputs(player, outputs);

            // Atualizar física do jogador
            this.updatePlayerPhysics(player);

            // Verificar colisões
            if (this.checkCollision(player)) {
                player.alive = false;
                player.fitness = this.calculateFitness(player);
            } else {
                alivePlayers++;
                // Recompensa por sobreviver
                player.fitness += 0.1;
            }
        });

        // Se todos morreram, evoluir
        if (alivePlayers === 0) {
            this.evolve();
        }
    }

    // IMPLEMENTAR ESTES MÉTODOS PARA SEU JOGO ESPECÍFICO:

    getInputs(player) {
        // Retornar array com inputs normalizados (0-1 ou -1 a 1)
        // Exemplo genérico:
        return [
            player.y / canvas.height,           // Posição Y normalizada
            (player.velocity + 10) / 20,        // Velocidade normalizada
            // Adicione mais inputs específicos do seu jogo
        ];
    }

    applyOutputs(player, outputs) {
        // Aplicar as decisões da rede neural ao jogador
        // Exemplo genérico:
        if (outputs[0] > player.actionThreshold && player.actionCooldown <= 0) {
            // Executar ação principal (pular, atirar, mover, etc.)
            player.velocity = -8;
            player.actionCooldown = Math.max(2, Math.floor(8 / this.speed));
        }
        player.actionCooldown = Math.max(0, player.actionCooldown - this.speed);
    }

    updatePlayerPhysics(player) {
        // Atualizar física do jogador
        player.velocity += 0.5 * this.speed; // Gravidade
        player.y += player.velocity;
    }

    createObstacle() {
        // Criar novo obstáculo no jogo
        // Implementar conforme necessário
    }

    checkCollision(player) {
        // Verificar se o jogador colidiu
        // Retornar true se colidiu, false caso contrário
        return false;
    }

    calculateFitness(player) {
        // Calcular fitness do jogador
        // Maior fitness = melhor performance
        return player.score * 10 + player.fitness;
    }

    evolve() {
        // Atualizar fitness na população
        this.players.forEach((player, index) => {
            this.neat.population[index].fitness = player.fitness;
        });

        // Evolução customizada
        this.customEvolve();
        
        this.generation++;
        console.log(`Geração ${this.generation}`);

        // Salvar melhor genoma
        const bestPlayer = this.players.reduce((a, b) => (a.fitness > b.fitness ? a : b));
        this.bestGenome = this.copyGenome(bestPlayer.genome);

        // Resetar ambiente para nova geração
        this.resetEnvironment();

        // Criar nova geração
        this.createPlayers();
    }

    resetEnvironment() {
        // CRÍTICO: Garantir mesmo ambiente inicial para todas as gerações
        obstacles = [];
        this.createObstacle(); // Criar primeiro obstáculo imediatamente
        this.obstacleSpawnProgress = 0;
        score = 0;
        frameCount = 0;
    }

    customEvolve() {
        const sortedPopulation = [...this.neat.population].sort((a, b) => b.fitness - a.fitness);
        const nextGeneration = [];
        
        // Elitismo (10%)
        const eliteCount = Math.floor(this.populationSize * 0.1);
        for (let i = 0; i < eliteCount; i++) {
            nextGeneration.push({
                genome: this.copyGenome(sortedPopulation[i].genome),
                fitness: 0,
                network: null
            });
        }
        
        // Crossover (25%)
        const crossoverCount = Math.floor(this.populationSize * 0.25);
        for (let i = 0; i < crossoverCount; i++) {
            const parent1 = this.tournamentSelection(sortedPopulation);
            const parent2 = this.tournamentSelection(sortedPopulation);
            const child = this.crossover(parent1, parent2);
            this.mutateGenome(child);
            nextGeneration.push({
                genome: child,
                fitness: 0,
                network: null
            });
        }
        
        // Mutações (35%)
        const mutationCount = Math.floor(this.populationSize * 0.35);
        for (let i = 0; i < mutationCount; i++) {
            const parent = this.tournamentSelection(sortedPopulation);
            const child = this.copyGenome(parent.genome);
            this.mutateGenome(child);
            nextGeneration.push({
                genome: child,
                fitness: 0,
                network: null
            });
        }
        
        // Novos aleatórios (30%)
        const newCount = this.populationSize - nextGeneration.length;
        for (let i = 0; i < newCount; i++) {
            const genome = new Genome(this.neat.inputs, this.neat.outputs);
            const numConnections = Math.floor(Math.random() * 2) + 1;
            for (let j = 0; j < numConnections; j++) {
                const inputIdx = Math.floor(Math.random() * this.neat.inputs);
                const outputIdx = this.neat.inputs;
                const weight = (Math.random() - 0.5) * 4;
                genome.tryCreateConnection(inputIdx, outputIdx, weight);
            }
            nextGeneration.push({
                genome: genome,
                fitness: 0,
                network: null
            });
        }
        
        this.neat.population = nextGeneration;
    }

    tournamentSelection(sortedPopulation) {
        const tournamentSize = 5;
        const tournament = [];
        for (let i = 0; i < tournamentSize; i++) {
            const randomIndex = Math.floor(Math.random() * Math.min(sortedPopulation.length, this.populationSize * 0.6));
            tournament.push(sortedPopulation[randomIndex]);
        }
        return tournament.reduce((best, current) => current.fitness > best.fitness ? current : best);
    }

    crossover(parent1, parent2) {
        const baseParent = (parent1.fitness >= parent2.fitness) ? parent1 : parent2;
        const otherParent = (baseParent === parent1) ? parent2 : parent1;
        const child = this.copyGenome(baseParent.genome);
        
        // Misturar conexões do outro pai
        otherParent.genome.connections.forEach(conn => {
            if (Math.random() < 0.6) {
                child.tryCreateConnection(conn.from, conn.to, conn.weight);
            }
        });
        
        return child;
    }

    mutateGenome(genome) {
        try {
            Mutator.mutateGenome(genome);
        } catch (e) {
            // Fallback se mutação falhar
        }

        // Mutações adicionais
        genome.connections.forEach(conn => {
            if (Math.random() < 0.05) {
                conn.weight += (Math.random() - 0.5) * 0.2;
                conn.weight = Math.max(-2, Math.min(2, conn.weight));
            }
        });
    }

    copyGenome(genome) {
        const copy = new Genome(genome.info.inputs, genome.info.outputs);
        copy.info = { ...genome.info };
        copy.nodes = genome.nodes.map(node => ({ ...node }));
        copy.connections = genome.connections.map(conn => ({ ...conn }));
        
        copy.graph = new DAG();
        for (let i = 0; i < copy.nodes.length; i++) {
            copy.graph.createNode();
        }
        for (const connection of copy.connections) {
            copy.graph.createConnection(connection.from, connection.to);
        }
        
        return copy;
    }

    createSimpleNetwork() {
        return {
            execute: function(inputs) {
                this.lastResult = [Math.random()];
            },
            getResult: function() {
                return this.lastResult || [0.5];
            },
            lastResult: [0.5]
        };
    }
}
```

### 3. Integração no Game Loop

```javascript
// Variáveis globais
let gameNEAT = null;
let neatMode = false;

// Inicializar NEAT
function iniciarNEAT() {
    neatMode = true;
    gameNEAT = new GameNEAT(5, 1, 1500); // 5 inputs, 1 output, 1500 população
    gameNEAT.start();
}

// No game loop principal
function gameLoop() {
    if (neatMode && gameNEAT) {
        gameNEAT.update();
    } else {
        // Lógica do jogo manual
    }
    
    draw();
    requestAnimationFrame(gameLoop);
}
```

## 🎮 Exemplos de Inputs por Tipo de Jogo

### Flappy Bird:
```javascript
getInputs(bird) {
    const nextPipe = this.getNextPipe(bird);
    const gapCenterY = nextPipe.topHeight + (pipeGap / 2);
    const birdCenterY = bird.y + bird.height / 2;
    
    return [
        (gapCenterY - birdCenterY) / canvas.height,    // Distância ao centro do gap
        (bird.velocity + 10) / 20,                     // Velocidade normalizada
        (nextPipe.x - bird.x) / canvas.width,          // Distância horizontal
        pipeGap / canvas.height,                       // Tamanho do gap
        nextPipe.topHeight / canvas.height             // Altura do cano superior
    ];
}
```

### Plataforma (Mario-like):
```javascript
getInputs(player) {
    return [
        player.x / mapWidth,                    // Posição X
        player.y / mapHeight,                   // Posição Y
        player.velocityX / maxVelocity,         // Velocidade X
        player.velocityY / maxVelocity,         // Velocidade Y
        nextObstacleDistance / screenWidth,     // Distância próximo obstáculo
        player.onGround ? 1 : 0,               // No chão?
        enemyDistance / screenWidth,            // Distância inimigo mais próximo
    ];
}
```

### Snake:
```javascript
getInputs(snake) {
    return [
        snake.head.x / boardWidth,              // Posição X cabeça
        snake.head.y / boardHeight,             // Posição Y cabeça
        food.x / boardWidth,                    // Posição X comida
        food.y / boardHeight,                   // Posição Y comida
        wallDistanceUp / boardHeight,           // Distância parede cima
        wallDistanceDown / boardHeight,         // Distância parede baixo
        wallDistanceLeft / boardWidth,          // Distância parede esquerda
        wallDistanceRight / boardWidth,         // Distância parede direita
        bodyCollisionRisk ? 1 : 0,             // Risco colisão corpo
    ];
}
```

### Pong:
```javascript
getInputs(paddle) {
    return [
        paddle.y / canvas.height,               // Posição Y paddle
        ball.x / canvas.width,                  // Posição X bola
        ball.y / canvas.height,                 // Posição Y bola
        ball.velocityX / maxBallSpeed,          // Velocidade X bola
        ball.velocityY / maxBallSpeed,          // Velocidade Y bola
    ];
}
```

## 📊 Interface de Controle (Opcional)

```html
<!-- Controles NEAT -->
<div id="aiControls" style="display: none;">
    <h3>NEAT Controls</h3>
    <button onclick="gameNEAT.pause()">Pausar</button>
    <button onclick="gameNEAT.speedUp()">2x Speed</button>
    <button onclick="gameNEAT.slowDown()">0.5x Speed</button>
    <button onclick="gameNEAT.toggleTurbo()">10x Turbo</button>
    <button onclick="gameNEAT.reset()">Reset</button>
    <button onclick="voltarJogoManual()">Manual</button>
</div>

<!-- Estatísticas -->
<div id="statsCard" style="display: none;">
    <h3>NEAT Evolution</h3>
    <div>Geração: <span id="currentGeneration">0</span></div>
    <div>Vivos: <span id="playersAlive">0</span></div>
    <div>Melhor Score: <span id="bestScore">0</span></div>
    <div>Velocidade: <span id="gameSpeed">1x</span></div>
</div>
```

## 🔧 Pontos Críticos para Evitar Problemas

### 1. **Reset Consistente entre Gerações**
```javascript
resetEnvironment() {
    // SEMPRE limpar e recriar ambiente idêntico
    obstacles = [];
    this.createObstacle(); // Primeiro obstáculo imediato
    this.obstacleSpawnProgress = 0;
    score = 0;
    frameCount = 0;
}
```

### 2. **Spawn por Distância (não por frames)**
```javascript
// ✅ CORRETO - spawn baseado em distância
this.obstacleSpawnProgress += gameSpeed * this.speed;
if (this.obstacleSpawnProgress >= this.obstacleBaseSpacing) {
    this.createObstacle();
    this.obstacleSpawnProgress = 0;
}

// ❌ ERRADO - spawn baseado em frames
if (frameCount % 90 === 0) {
    this.createObstacle();
}
```

### 3. **Quebrar Simetria Inicial**
```javascript
createPlayers() {
    for (let i = 0; i < this.populationSize; i++) {
        this.players.push({
            y: 300 + (Math.random() - 0.5) * 100,        // Posição Y variada
            velocity: (Math.random() - 0.5) * 2,          // Velocidade inicial variada
            actionThreshold: 0.55 + Math.random() * 0.2,  // Threshold único
            // ... outros parâmetros
        });
    }
}
```

### 4. **Inputs Informativos**
```javascript
// ✅ BOM - input relativo ao objetivo
verticalToCenter = (targetY - playerY) / screenHeight;

// ❌ RUIM - input absoluto
playerY = player.y / screenHeight;
```

### 5. **Controle com Cooldown**
```javascript
applyOutputs(player, outputs) {
    if (outputs[0] > player.actionThreshold && player.actionCooldown <= 0) {
        // Executar ação
        player.actionCooldown = Math.max(2, Math.floor(8 / this.speed));
    }
    player.actionCooldown = Math.max(0, player.actionCooldown - this.speed);
}
```

## 📈 Parâmetros Recomendados

- **População**: 1000-2000 para jogos complexos, 500-1000 para simples
- **Elitismo**: 5-10% da população
- **Crossover**: 20-30%
- **Mutação**: 30-40%
- **Novos**: 20-30%
- **Inputs**: 3-10 (mais pode ser melhor, mas evolui mais devagar)
- **Outputs**: 1-4 (quantas ações o jogador pode fazer)

## 🚀 Performance

- Use `requestAnimationFrame` para sincronização
- Implemente modo turbo sem renderização
- Limite desenho de jogadores (máximo 300 visíveis)
- Cache cálculos pesados
- Use `Math.random()` ao invés de bibliotecas complexas

## ⚠️ Problemas Comuns e Soluções

### Convergência em 2 Grupos Extremos
- **Causa**: Reset inconsistente entre gerações
- **Solução**: Garantir ambiente idêntico no início de cada geração

### Evolução Muito Lenta
- **Causa**: Inputs pouco informativos ou fitness mal calibrado
- **Solução**: Revisar inputs e função de fitness

### Comportamento Repetitivo
- **Causa**: Falta de diversidade inicial
- **Solução**: Adicionar variação nos parâmetros iniciais

### Performance Ruim
- **Causa**: Muitos jogadores sendo renderizados
- **Solução**: Implementar modo turbo e limitar renderização

Este README fornece tudo que você precisa para integrar o NEAT em qualquer jogo web de forma consistente e eficaz!
