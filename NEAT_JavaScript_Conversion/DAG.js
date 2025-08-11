// Directed Acyclic Graph - JavaScript equivalent of dag.hpp

class DAG {
    constructor() {
        this.nodes = [];
    }

    createNode() {
        this.nodes.push({
            incoming: 0,
            depth: 0,
            out: [],
            getOutConnectionCount() {
                return this.out.length;
            }
        });
        return this.nodes.length - 1;
    }

    createConnection(from, to) {
        // Ensure both nodes exist
        if (!this.isValid(from) || !this.isValid(to)) {
            return false;
        }

        // Ensure there is no cycle
        if (from === to) {
            return false;
        }

        if (this.isAncestor(to, from)) {
            return false;
        }

        // Ensure the connection doesn't already exist
        if (this.isParent(from, to)) {
            return false;
        }

        // Add the connection
        this.nodes[from].out.push(to);
        this.nodes[to].incoming++;
        return true;
    }

    isValid(i) {
        return i < this.nodes.length;
    }

    isParent(node1, node2) {
        return this.nodes[node1].out.includes(node2);
    }

    isAncestor(node1, node2) {
        const out = this.nodes[node1].out;
        return this.isParent(node1, node2) || 
               out.some(o => this.isAncestor(o, node2));
    }

    computeDepth() {
        const nodeCount = this.nodes.length;
        const startNodes = [];
        const incoming = this.nodes.map(n => n.incoming);

        // Initialize nodes with no incoming edges
        for (let i = 0; i < nodeCount; i++) {
            if (this.nodes[i].incoming === 0) {
                this.nodes[i].depth = 0;
                startNodes.push(i);
            }
        }

        // Process nodes in topological order
        while (startNodes.length > 0) {
            const idx = startNodes.pop();
            const node = this.nodes[idx];

            for (const childIdx of node.out) {
                incoming[childIdx]--;
                this.nodes[childIdx].depth = Math.max(
                    this.nodes[childIdx].depth, 
                    node.depth + 1
                );

                if (incoming[childIdx] === 0) {
                    startNodes.push(childIdx);
                }
            }
        }
    }

    getOrder() {
        const order = [];
        for (let i = 0; i < this.nodes.length; i++) {
            order.push(i);
        }

        order.sort((a, b) => this.nodes[a].depth - this.nodes[b].depth);
        return order;
    }

    removeConnection(from, to) {
        const connections = this.nodes[from].out;
        const index = connections.indexOf(to);
        if (index !== -1) {
            connections.splice(index, 1);
            this.nodes[to].incoming--;
        } else {
            console.warn(`Connection ${from} -> ${to} not found`);
        }
    }
}