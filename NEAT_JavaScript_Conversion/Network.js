// Network - JavaScript equivalent of network.hpp

class Network {
    constructor() {
        this.slots = [];
        this.output = [];
        this.info = { inputs: 0, outputs: 0, hidden: 0 };
        this.max_depth = 0;
        this.connection_count = 0;
    }

    // Info helper methods
    getNodeCount() {
        return this.info.inputs + this.info.hidden + this.info.outputs;
    }

    // Initialize the slots vector
    initialize(info, connection_count) {
        this.info = { ...info };
        this.connection_count = connection_count;
        
        const totalSlots = this.getNodeCount() + connection_count;
        this.slots = new Array(totalSlots);
        
        // Initialize node slots
        for (let i = 0; i < this.getNodeCount(); i++) {
            this.slots[i] = {
                type: 'node',
                activation: ActivationFunction.none,
                sum: 0.0,
                bias: 0.0,
                connection_count: 0,
                depth: 0,
                getValue() {
                    return this.activation(this.sum + this.bias);
                }
            };
        }
        
        // Initialize connection slots  
        for (let i = this.getNodeCount(); i < totalSlots; i++) {
            this.slots[i] = {
                type: 'connection',
                to: 0,
                weight: 0.0,
                value: 0.0
            };
        }
        
        this.output = new Array(this.info.outputs).fill(0);
    }

    setNode(i, activation, bias, connection_count) {
        const node = this.getNode(i);
        node.activation = ActivationFunction.getFunction(activation);
        node.bias = bias;
        node.connection_count = connection_count;
    }

    setNodeDepth(i, depth) {
        this.slots[i].depth = depth;
        this.max_depth = Math.max(this.max_depth, depth);
    }

    setConnection(i, to, weight) {
        const connection = this.getConnection(i);
        connection.to = to;
        connection.weight = weight;
    }

    getConnection(i) {
        return this.slots[this.getNodeCount() + i];
    }

    getNode(i) {
        return this.slots[i];
    }

    getOutput(i) {
        return this.slots[this.info.inputs + this.info.hidden + i];
    }

    execute(input) {
        // Check compatibility
        if (input.length !== this.info.inputs) {
            console.error('Input size mismatch, aborting');
            return false;
        }

        // Reset nodes
        this.foreachNode((node) => {
            node.sum = 0.0;
        });

        // Initialize input
        for (let i = 0; i < this.info.inputs; i++) {
            this.slots[i].sum = input[i];
        }

        // Execute network
        let current_connection = 0;
        const node_count = this.getNodeCount();
        
        for (let i = 0; i < node_count; i++) {
            const node = this.slots[i];
            const value = node.getValue();
            
            for (let o = 0; o < node.connection_count; o++) {
                const connection = this.getConnection(current_connection++);
                connection.value = value * connection.weight;
                this.getNode(connection.to).sum += connection.value;
            }
        }

        // Update output
        for (let i = 0; i < this.info.outputs; i++) {
            this.output[i] = this.getOutput(i).getValue();
        }

        return true;
    }

    getResult() {
        return this.output.slice(); // Return copy
    }

    getDepth() {
        return this.max_depth;
    }

    foreachNode(callback) {
        const node_count = this.getNodeCount();
        for (let i = 0; i < node_count; i++) {
            callback(this.slots[i], i);
        }
    }

    foreachConnection(callback) {
        for (let i = 0; i < this.connection_count; i++) {
            callback(this.getConnection(i), i);
        }
    }
}