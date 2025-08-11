// Activation functions - JavaScript FIXED version
// Problema identificado: sigm muito steep causando comportamentos extremos

const Activation = {
    None: 0,
    Sigm: 1,
    Relu: 2,
    Tanh: 3
};

class ActivationFunction {
    static none(x) {
        return x;
    }

    static sigm(x) {
        // Suavizar e clamped
        const z = Math.max(-6, Math.min(6, x));
        return 1.0 / (1.0 + Math.exp(-1.5 * z));
    }

    static relu(x) {
        return Math.max(0, x);  // CORREÇÃO: ReLU padrão
    }

    static tanh(x) {
        // CORREÇÃO: Limitar entrada para evitar overflow
        const clampedX = Math.max(-10, Math.min(10, x));
        return Math.tanh(clampedX);
    }

    static getFunction(activation) {
        switch (activation) {
            case Activation.None:
                return this.none;
            case Activation.Sigm:
                return this.sigm;
            case Activation.Relu:
                return this.relu;
            case Activation.Tanh:
                return this.tanh;
            default:
                return this.none;
        }
    }
}