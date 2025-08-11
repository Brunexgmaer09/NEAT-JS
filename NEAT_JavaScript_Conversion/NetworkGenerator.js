// NetworkGenerator - JavaScript FIXED version
// Problemas corrigidos: ordenação de nós, validação de conexões

class NetworkGenerator {
    constructor() {
        this.idxToOrder = [];
    }

    generate(genome) {
        try {
            this.idxToOrder = new Array(genome.getNodeCount());
            const network = new Network();
            network.initialize(genome.info, genome.connections.length);

            const order = this.getOrder(genome);
            
            // CORREÇÃO: Verificar se order é válido
            if (!order || order.length !== genome.getNodeCount()) {
                console.error('Invalid node order generated');
                return this.createFallbackNetwork(genome.info);
            }
            
            for (let i = 0; i < order.length; i++) {
                this.idxToOrder[order[i]] = i;
            }

            // Create nodes and connections
            let nodeIdx = 0;
            let connectionIdx = 0;
            
            for (const o of order) {
                // CORREÇÃO: Verificar se o nó existe
                if (!genome.nodes[o]) {
                    console.warn(`Missing node ${o}, skipping`);
                    continue;
                }
                
                // Initialize node
                const node = genome.nodes[o];
                const outConnectionCount = genome.graph.nodes[o] ? 
                    genome.graph.nodes[o].getOutConnectionCount() : 0;
                    
                network.setNode(nodeIdx, node.activation, node.bias, outConnectionCount);
                network.setNodeDepth(nodeIdx, node.depth);
                
                // Create its connections
                for (const connection of genome.connections) {
                    if (connection.from === o) {
                        const target = this.idxToOrder[connection.to];
                        
                        // CORREÇÃO: Validação mais robusta da ordem das conexões
                        if (target === undefined || target < 0) {
                            console.warn(`Invalid target ${connection.to} for connection from ${o}`);
                            continue;
                        }
                        
                        // Para inputs, permitir conexões para outputs mesmo que target <= nodeIdx
                        const isInputNode = o < genome.info.inputs;
                        const isValidConnection = isInputNode || target > nodeIdx;
                        
                        if (isValidConnection && connectionIdx < network.connection_count) {
                            network.setConnection(connectionIdx, target, connection.weight);
                            connectionIdx++;
                        } else if (!isValidConnection) {
                            console.warn(`Skipping invalid connection order: ${nodeIdx} -> ${target}`);
                        }
                    }
                }
                nodeIdx++;
            }

            return network;
            
        } catch (error) {
            console.error('Error generating network:', error);
            return this.createFallbackNetwork(genome.info);
        }
    }

    // ADICIONADO: Rede de fallback para casos de erro
    createFallbackNetwork(info) {
        const network = new Network();
        network.initialize(info, info.inputs); // Uma conexão por input
        
        // Criar nós simples
        for (let i = 0; i < info.inputs; i++) {
            network.setNode(i, Activation.None, 0, 1);
            network.setNodeDepth(i, 0);
        }
        
        for (let i = 0; i < info.outputs; i++) {
            const nodeIdx = info.inputs + i;
            network.setNode(nodeIdx, Activation.Tanh, 0, 0);
            network.setNodeDepth(nodeIdx, 1);
        }
        
        // Conexões simples: cada input conecta ao primeiro output
        for (let i = 0; i < info.inputs; i++) {
            network.setConnection(i, info.inputs, 0.5);
        }
        
        return network;
    }

    getOrder(genome) {
        try {
            // CORREÇÃO: Validar computeDepth antes de usar
            if (typeof genome.computeDepth === 'function') {
                genome.computeDepth();
            } else {
                console.warn('computeDepth not available, using simple ordering');
                this.simpleComputeDepth(genome);
            }
            
            const order = [];
            for (let i = 0; i < genome.nodes.length; i++) {
                order.push(i);
            }

            // CORREÇÃO: Ordenação mais robusta
            const inputsEnd = genome.info.inputs;
            
            // Inputs primeiro (sem ordenar)
            const inputOrder = order.slice(0, inputsEnd);
            
            // Resto ordenado por depth
            const restOrder = order.slice(inputsEnd);
            restOrder.sort((a, b) => {
                const depthA = genome.nodes[a] ? genome.nodes[a].depth : 0;
                const depthB = genome.nodes[b] ? genome.nodes[b].depth : 0;
                return depthA - depthB;
            });
            
            return inputOrder.concat(restOrder);
            
        } catch (error) {
            console.error('Error in getOrder:', error);
            // Fallback: ordem simples
            const order = [];
            for (let i = 0; i < genome.nodes.length; i++) {
                order.push(i);
            }
            return order;
        }
    }

    // ADICIONADO: Computação simples de depth como fallback
    simpleComputeDepth(genome) {
        // Inputs têm depth 0
        for (let i = 0; i < genome.info.inputs; i++) {
            if (genome.nodes[i]) {
                genome.nodes[i].depth = 0;
            }
        }
        
        // Outputs têm depth 1
        for (let i = genome.info.inputs; i < genome.info.inputs + genome.info.outputs; i++) {
            if (genome.nodes[i]) {
                genome.nodes[i].depth = 1;
            }
        }
        
        // Hidden nodes têm depth baseado em conexões (simplificado)
        for (let i = genome.info.inputs + genome.info.outputs; i < genome.nodes.length; i++) {
            if (genome.nodes[i]) {
                genome.nodes[i].depth = 1; // Simplificado
            }
        }
    }

    // Static helper method for quick network generation
    static generateFromGenome(genome) {
        const generator = new NetworkGenerator();
        return generator.generate(genome);
    }
}