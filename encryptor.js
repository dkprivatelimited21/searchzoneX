/**
 * SearchZone Encryption Module
 * Secure link encryption/decryption utility
 */

class SearchZoneEncryptor {
    constructor() {
        this.key = 'searchzone_2024_secure_v2';
        this.version = '2.0';
    }

    // Simple but effective encryption
    encrypt(data) {
        try {
            const jsonStr = JSON.stringify(data);
            const encoded = btoa(this._transform(jsonStr, 7));
            return {
                data: encoded,
                version: this.version,
                timestamp: Date.now()
            };
        } catch (e) {
            console.error('Encryption error:', e);
            return null;
        }
    }

    decrypt(encryptedData) {
        try {
            if (typeof encryptedData === 'string') {
                encryptedData = { data: encryptedData };
            }
            
            const transformed = atob(encryptedData.data);
            const jsonStr = this._transform(transformed, -7);
            return JSON.parse(jsonStr);
        } catch (e) {
            console.error('Decryption error:', e);
            return null;
        }
    }

    // Transform string with shift cipher
    _transform(str, shift) {
        return str.split('').map(char => {
            const code = char.charCodeAt(0);
            return String.fromCharCode(code + shift);
        }).join('');
    }

    // Generate hash for integrity check
    generateHash(data) {
        let hash = 0;
        const str = JSON.stringify(data);
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash).toString(16);
    }

    // Secure storage with multiple layers
    secureStore(key, data) {
        const encrypted = this.encrypt(data);
        const hash = this.generateHash(data);
        
        const package = {
            encrypted: encrypted,
            hash: hash,
            timestamp: Date.now()
        };
        
        localStorage.setItem(key, JSON.stringify(package));
        return true;
    }

    // Secure retrieval with verification
    secureRetrieve(key) {
        const stored = localStorage.getItem(key);
        if (!stored) return null;
        
        try {
            const package = JSON.parse(stored);
            const decrypted = this.decrypt(package.encrypted);
            
            // Verify integrity
            const hash = this.generateHash(decrypted);
            if (hash !== package.hash) {
                console.warn('Data integrity check failed');
                return null;
            }
            
            return decrypted;
        } catch (e) {
            console.error('Retrieval error:', e);
            return null;
        }
    }

    // Export encrypted backup
    exportBackup() {
        const allData = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('searchzone_')) {
                allData[key] = localStorage.getItem(key);
            }
        }
        
        const encrypted = this.encrypt(allData);
        const blob = new Blob([JSON.stringify(encrypted)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `searchzone_backup_${new Date().toISOString().split('T')[0]}.enc`;
        a.click();
        
        setTimeout(() => URL.revokeObjectURL(url), 100);
    }

    // Import encrypted backup
    importBackup(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const encrypted = JSON.parse(e.target.result);
                const decrypted = this.decrypt(encrypted);
                
                if (decrypted) {
                    Object.keys(decrypted).forEach(key => {
                        localStorage.setItem(key, decrypted[key]);
                    });
                    alert('Backup restored successfully!');
                    window.location.reload();
                }
            } catch (err) {
                alert('Invalid backup file');
            }
        };
        reader.readAsText(file);
    }
}

// Initialize global encryptor
const searchzoneEncryptor = new SearchZoneEncryptor();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SearchZoneEncryptor;
}