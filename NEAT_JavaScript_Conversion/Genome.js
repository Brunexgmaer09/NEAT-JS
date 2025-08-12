// Genome - JavaScript equivalent of genome.hpp

class Genome {
    constructor(inputs = 0, outputs = 0) {
        // Create Network::Info equivalent
        this.info = { 
            inputs, 
            outputs, 
            hidden: 0,
            getNodeCount() {
                return this.inputs + this.hidden + this.outputs;
            }
        };
        this.nodes = [];
        this.connections = [];
        this.graph = new DAG();

        if (inputs > 0 && outputs > 0) {
            // Create input nodes (C++ uses reverse loop)
            for (let i = inputs; i > 0; i--) {
                this.createNode(Activation.None, false);
            }
            // Create output nodes (C++ uses reverse loop)
            // Usar Tanh no output para controle bidirecional [-1,1] melhor que Sigm
            for (let i = outputs; i > 0; i--) {
                this.createNode(Activation.Tanh, false);
            }
        }
    }

    getNodeCount() {
        return this.info.getNodeCount();
    }

    createNode(activation, hidden = true) {
        this.nodes.push({
            bias: 0.0,
            activation: activation,
            depth: 0
        });

        this.graph.createNode();

        // Update info if needed
        if (hidden) {
            this.info.hidden++;
        }

        // Return index of new node
        return this.nodes.length - 1;
    }

    tryCreateConnection(from, to, weight) {
        if (this.graph.createConnection(from, to)) {
            this.connections.push({ from, to, weight });
            return true;
        }
        return false;
    }

    createConnection(from, to, weight) {
        this.graph.createConnection(from, to);
        this.connections.push({ from, to, weight });
    }

    splitConnection(i) {
        if (i >= this.connections.length) {
            console.error(`Invalid connection ${i}`);
            return;
        }

        const connection = this.connections[i];
        const { from, to, weight } = connection;
        this.removeConnection(i);

        const nodeIdx = this.createNode(Activation.Relu);
        this.createConnection(from, nodeIdx, weight);
        this.createConnection(nodeIdx, to, 1.0);
    }

    removeConnection(i) {
        const connection = this.connections[i];
        this.graph.removeConnection(connection.from, connection.to);
        
        // Swap with last and remove
        this.connections[i] = this.connections[this.connections.length - 1];
        this.connections.pop();
    }

    getOrder() {
        const order = [];
        for (let i = 0; i < this.nodes.length; i++) {
            order.push(i);
        }

        order.sort((a, b) => this.nodes[a].depth - this.nodes[b].depth);
        return order;
    }

    computeDepth() {
        const nodeCount = this.nodes.length;

        // Compute order
        let maxDepth = 0;
        this.graph.computeDepth();
        
        for (let i = 0; i < nodeCount; i++) {
            this.nodes[i].depth = this.graph.nodes[i].depth;
            maxDepth = Math.max(this.nodes[i].depth, maxDepth);
        }

        // Set outputs to the last "layer"
        const outputDepth = Math.max(maxDepth, 1);
        for (let i = 0; i < this.info.outputs; i++) {
            this.nodes[this.info.inputs + i].depth = outputDepth;
        }
    }

    isInput(i) {
        return i < this.info.inputs;
    }

    isOutput(i) {
        return i >= this.info.inputs && i < this.info.inputs + this.info.outputs;
    }

    writeToFile(filename) {
        const writer = new BinaryWriter(filename);
        writer.write(this.info, 'info');
        writer.write(this.nodes, 'nodes');
        writer.write(this.connections.length, 'connectionCount');
        writer.write(this.connections, 'connections');
        return writer.save();
    }

    loadFromFile(filename, jsonString = null) {
        const reader = new BinaryReader(filename, jsonString);
        if (!reader.isValid()) {
            console.error(`Cannot open file "${filename}"`);
            return false;
        }

        // Clear graph
        this.graph.nodes = [];

        // Load info
        this.info = reader.read('info') || { inputs: 0, outputs: 0, hidden: 0 };
        
        // Load nodes
        const nodes = reader.read('nodes') || [];
        this.nodes = [];
        for (const nodeData of nodes) {
            this.nodes.push({ ...nodeData });
            this.graph.createNode();
        }

        // Load connections
        const connectionCount = reader.read('connectionCount') || 0;
        const connections = reader.read('connections') || [];
        this.connections = [];
        
        for (const connection of connections) {
            this.createConnection(connection.from, connection.to, connection.weight);
        }

        console.log(`"${filename}" loaded.`);
        return true;
    }
}