// NEAT - Main integration file for JavaScript NEAT implementation
// Include all the necessary components

// This file combines all NEAT components into a single usable library
// You can either include individual files or use this combined approach

/**
 * Complete NEAT (NeuroEvolution of Augmenting Topologies) Implementation in JavaScript
 * 
 * Usage Example:
 * 
 * // Create a simple network
 * const genome = new Genome(3, 2); // 3 inputs, 2 outputs
 * 
 * // Generate network from genome
 * const network = NetworkGenerator.generateFromGenome(genome);
 * 
 * // Run network
 * const inputs = [0.5, -0.3, 0.8];
 * network.execute(inputs);
 * const outputs = network.getResult();
 * 
 * // Mutate genome
 * Mutator.mutateGenome(genome);
 * 
 * // Save/Load genome
 * const jsonData = genome.writeToFile('my_genome');
 * const newGenome = new Genome();
 * newGenome.loadFromFile('my_genome', jsonData);
 */

// Main NEAT class that provides convenient interface
class NEAT {
    constructor(inputs, outputs) {
        this.inputs = inputs;
        this.outputs = outputs;
        this.population = [];
        this.generation = 0;
        this.bestFitness = -Infinity;
        this.bestGenome = null;
    }

    // Initialize population with random genomes
    initializePopulation(populationSize = 150) {
        this.population = [];
        for (let i = 0; i < populationSize; i++) {
            const genome = new Genome(this.inputs, this.outputs);
            // Add some initial random connections
            this.addRandomConnections(genome, 2);
            this.population.push({
                genome: genome,
                fitness: 0,
                network: null
            });
        }
    }

    // Add random connections to a genome
    addRandomConnections(genome, count) {
        for (let i = 0; i < count; i++) {
            const inputIdx = RNGf.getRandIndex(genome.info.inputs);
            const outputIdx = genome.info.inputs + RNGf.getRandIndex(genome.info.outputs);
            genome.tryCreateConnection(inputIdx, outputIdx, RNGf.getFullRange(2.0));
        }
    }

    // Evaluate all networks in population
    evaluatePopulation(fitnessFunction) {
        for (const individual of this.population) {
            if (!individual.network) {
                individual.network = NetworkGenerator.generateFromGenome(individual.genome);
            }
            individual.fitness = fitnessFunction(individual.network);
            
            if (individual.fitness > this.bestFitness) {
                this.bestFitness = individual.fitness;
                this.bestGenome = this.copyGenome(individual.genome);
            }
        }
    }

    // Evolve population for one generation
    evolve() {
        // Sort by fitness (highest first)
        this.population.sort((a, b) => b.fitness - a.fitness);

        const survivalCount = Math.floor(this.population.length * 0.2); // Top 20%
        const survivors = this.population.slice(0, survivalCount);

        // Create next generation
        const nextGeneration = [];

        // Keep best performers
        for (const survivor of survivors) {
            nextGeneration.push({
                genome: this.copyGenome(survivor.genome),
                fitness: 0,
                network: null
            });
        }

        // Fill rest with mutations and crossovers
        while (nextGeneration.length < this.population.length) {
            if (RNGf.proba(0.8) && survivors.length > 1) {
                // Crossover
                const parent1 = RNGf.pickRandom(survivors);
                const parent2 = RNGf.pickRandom(survivors);
                const child = this.crossover(parent1.genome, parent2.genome);
                nextGeneration.push({
                    genome: child,
                    fitness: 0,
                    network: null
                });
            } else {
                // Mutation
                const parent = RNGf.pickRandom(survivors);
                const child = this.copyGenome(parent.genome);
                Mutator.mutateGenome(child);
                nextGeneration.push({
                    genome: child,
                    fitness: 0,
                    network: null
                });
            }
        }

        this.population = nextGeneration;
        this.generation++;
    }

    // Simple crossover (take random connections from both parents)
    crossover(genome1, genome2) {
        const child = new Genome(this.inputs, this.outputs);
        
        // Combine connections from both parents
        const allConnections = [...genome1.connections, ...genome2.connections];
        for (const connection of allConnections) {
            if (RNGf.proba(0.5)) {
                child.tryCreateConnection(connection.from, connection.to, connection.weight);
            }
        }

        return child;
    }

    // Copy a genome
    copyGenome(genome) {
        const copy = new Genome(genome.info.inputs, genome.info.outputs);
        copy.info = { ...genome.info };
        copy.nodes = genome.nodes.map(node => ({ ...node }));
        copy.connections = genome.connections.map(conn => ({ ...conn }));
        
        // Rebuild graph
        copy.graph = new DAG();
        for (let i = 0; i < copy.nodes.length; i++) {
            copy.graph.createNode();
        }
        for (const connection of copy.connections) {
            copy.graph.createConnection(connection.from, connection.to);
        }
        
        return copy;
    }

    // Get best network from current generation
    getBestNetwork() {
        if (!this.bestGenome) return null;
        return NetworkGenerator.generateFromGenome(this.bestGenome);
    }

    // Get current generation stats
    getStats() {
        if (this.population.length === 0) return null;
        
        const fitnesses = this.population.map(ind => ind.fitness);
        const avgFitness = fitnesses.reduce((sum, f) => sum + f, 0) / fitnesses.length;
        const minFitness = Math.min(...fitnesses);
        const maxFitness = Math.max(...fitnesses);

        return {
            generation: this.generation,
            avgFitness: avgFitness,
            minFitness: minFitness,
            maxFitness: maxFitness,
            bestFitness: this.bestFitness,
            populationSize: this.population.length
        };
    }
}

// Export everything if using modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        NEAT,
        Network,
        Genome,
        DAG,
        Mutator,
        NetworkGenerator,
        ActivationFunction,
        Activation,
        RNG,
        RNGf,
        conf,
        BinaryWriter,
        BinaryReader
    };
}