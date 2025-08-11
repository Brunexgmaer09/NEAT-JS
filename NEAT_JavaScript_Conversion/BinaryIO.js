// Binary I/O - JavaScript equivalent using JSON
class BinaryWriter {
    constructor(filename = null) {
        this.filename = filename;
        this.data = {};
    }

    write(data, key = 'default') {
        this.data[key] = data;
    }

    save() {
        const jsonString = JSON.stringify(this.data);
        if (this.filename && typeof localStorage !== 'undefined') {
            localStorage.setItem(this.filename, jsonString);
        }
        return jsonString;
    }
}

class BinaryReader {
    constructor(filename = null, jsonString = null) {
        this.filename = filename;
        this.data = {};
        this.valid = false;
        
        if (jsonString) {
            this.loadFromString(jsonString);
        } else if (filename && typeof localStorage !== 'undefined') {
            const stored = localStorage.getItem(filename);
            if (stored) this.loadFromString(stored);
        }
    }

    loadFromString(jsonString) {
        try {
            this.data = JSON.parse(jsonString);
            this.valid = true;
        } catch (error) {
            console.error('Failed to parse JSON:', error);
            this.valid = false;
        }
    }

    isValid() {
        return this.valid;
    }

    read(key = 'default') {
        return this.data[key];
    }

    readInto(target, key = 'default') {
        const data = this.read(key);
        if (data && typeof data === 'object') {
            Object.assign(target, data);
        }
    }
}