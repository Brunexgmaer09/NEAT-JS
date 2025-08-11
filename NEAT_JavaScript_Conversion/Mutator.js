// Mutator - JavaScript equivalent of mutator.hpp

class Mutator {
    // Mutates a genome using the probabilities defined in conf.mut
    static mutateGenome(genome) {
        for (let i = 0; i < conf.mut.mut_count; i++) {
            if (RNGf.proba(0.25)) {
                if (RNGf.proba(0.5)) {
                    this.mutateBiases(genome);
                } else {
                    this.mutateWeights(genome);
                }
            }
        }

        if (RNGf.proba(conf.mut.new_node_proba) && 
            conf.mut.max_hidden_nodes > genome.info.hidden) {
            this.newNode(genome);
        }

        if (RNGf.proba(conf.mut.new_conn_proba)) {
            this.newConnection(genome);
        }
    }

    static mutateBiases(genome) {
        const node = this.pickRandom(genome.nodes);
        if (RNGf.proba(conf.mut.new_value_proba)) {
            node.bias = RNGf.getFullRange(conf.mut.weight_range);
        } else {
            if (RNGf.proba(0.25)) {
                node.bias += RNGf.getFullRange(conf.mut.weight_range);
            } else {
                node.bias += conf.mut.weight_small_range * 
                           RNGf.getFullRange(conf.mut.weight_range);
            }
        }
    }

    static mutateWeights(genome) {
        // Nothing to do if no connections
        if (genome.connections.length === 0) {
            return;
        }

        const connection = this.pickRandom(genome.connections);
        if (RNGf.proba(conf.mut.new_value_proba)) {
            connection.weight = RNGf.getFullRange(conf.mut.weight_range);
        } else {
            if (RNGf.proba(0.75)) {
                connection.weight += conf.mut.weight_small_range * 
                                   RNGf.getFullRange(conf.mut.weight_range);
            } else {
                connection.weight += RNGf.getFullRange(conf.mut.weight_range);
            }
        }
    }

    static newNode(genome) {
        // Nothing to do if no connections
        if (genome.connections.length === 0) {
            return;
        }

        const connectionIdx = this.getRandIndex(genome.connections.length);
        genome.splitConnection(connectionIdx);
    }

    static newConnection(genome) {
        // Pick first random node, input + hidden
        const count1 = genome.info.inputs + genome.info.hidden;
        let idx1 = this.getRandIndex(count1);
        
        // If the picked node is an output, offset it by the number of outputs to land on hidden
        if (idx1 >= genome.info.inputs && 
            idx1 < (genome.info.inputs + genome.info.outputs)) {
            idx1 += genome.info.outputs;
        }
        
        // Pick second random node, hidden + output
        const count2 = genome.info.hidden + genome.info.outputs;
        // Skip inputs
        const idx2 = this.getRandIndex(count2) + genome.info.inputs;

        // Assertions (converted to runtime checks)
        if (genome.isOutput(idx1)) {
            console.error('First node should not be output');
            return;
        }
        if (genome.isInput(idx2)) {
            console.error('Second node should not be input');
            return;
        }

        // Create the new connection
        if (!genome.tryCreateConnection(idx1, idx2, 
            RNGf.getFullRange(conf.mut.weight_range))) {
            // Connection creation failed (would create cycle or already exists)
        }
    }

    static getRandIndex(maxValue) {
        return Math.floor(RNGf.getUnder(maxValue));
    }

    static pickRandom(container) {
        const idx = this.getRandIndex(container.length);
        return container[idx];
    }
}