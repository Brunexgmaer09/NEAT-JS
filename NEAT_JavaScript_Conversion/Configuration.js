// Configuration - JavaScript equivalent of user/common/configuration.hpp
// Note: C++ uses namespace nt::conf with RealType = double
const conf = {
    RealType: Number, // JavaScript Number type (equivalent to double)
    
    // Mutation configuration - EXACT VALUES FROM C++
    mut: {
        new_node_proba: 0.05,      // C++: 0.05f
        new_conn_proba: 0.8,       // C++: 0.8f  
        new_value_proba: 0.2,      // C++: 0.2f
        weight_range: 1.0,         // C++: 1.0 (double)
        weight_small_range: 0.01,  // C++: 0.01 (double)
        mut_count: 4,              // C++: 4
        max_hidden_nodes: 30       // C++: 30
    },
    
    // Selection configuration
    sel: {
        population_size: 1000,     // C++: 1000
        max_iteration_time: 60.0,  // C++: 60.0f
        elite_ratio: 0.35          // C++: 0.35f  
    },
    
    // Network configuration
    net: {
        input_count: 8,   // C++: depends on control_type, default 8
        output_count: 1   // C++: 1
    }
};