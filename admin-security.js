// ========================================
// ENHANCED SECURITY CONFIGURATION
// ========================================

const SECURITY_CONFIG = {
    // Admin Whitelist (case-insensitive)
    SYSTEM_ADMINS: [
        "sahin54481@gmail.com",
        "admin@adani.com"
    ].map(email => email.toLowerCase()),
    
    // Session timeout (30 minutes)
    SESSION_TIMEOUT: 30 * 60 * 1000,
    
    // Login attempt limits
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_TIME: 15 * 60 * 1000, // 15 minutes
    
    // IP whitelist (optional)
    ALLOWED_IPS: [], // Add specific IPs if needed
    
    // Activity logging
    LOG_ALL_ACTIONS: true,
    
    // Password requirements
    PASSWORD_MIN_LENGTH: 12,
    REQUIRE_SPECIAL_CHARS: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_UPPERCASE: true
};

// ========================================
// SECURITY FUNCTIONS
// ========================================

class AdminSecurity {
    constructor() {
        this.loginAttempts = {};
        this.lastActivity = Date.now();
        this.setupActivityMonitoring();
    }
    
    // Enhanced login validation
    async validateAdminLogin(email, password) {
        const normalizedEmail = email.toLowerCase();
        const ip = await this.getClientIP();
        
        // Check if IP is blocked
        if (this.isIPBlocked(ip)) {
            throw new Error('Access temporarily blocked. Try again later.');
        }
        
        // Check admin whitelist
        if (!SECURITY_CONFIG.SYSTEM_ADMINS.includes(normalizedEmail)) {
            await this.logFailedAttempt(ip, normalizedEmail, 'Invalid admin email');
            throw new Error('Access Denied: Invalid credentials.');
        }
        
        // Check login attempts
        const attemptsKey = `${ip}_${normalizedEmail}`;
        if (this.loginAttempts[attemptsKey] >= SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS) {
            this.blockIP(ip);
            throw new Error('Too many failed attempts. IP blocked for 15 minutes.');
        }
        
        // Firebase authentication
        try {
            const userCredential = await firebase.auth()
                .signInWithEmailAndPassword(normalizedEmail, password);
            
            // Double-check admin status
            if (SECURITY_CONFIG.SYSTEM_ADMINS.includes(userCredential.user.email.toLowerCase())) {
                this.resetAttempts(attemptsKey);
                await this.logSuccessLogin(ip, normalizedEmail);
                return userCredential;
            } else {
                throw new Error('Access Denied: Administrator privileges required.');
            }
        } catch (error) {
            await this.logFailedAttempt(ip, normalizedEmail, error.message);
            
            // Increment attempt counter
            this.loginAttempts[attemptsKey] = (this.loginAttempts[attemptsKey] || 0) + 1;
            
            // Check if max attempts reached
            if (this.loginAttempts[attemptsKey] >= SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS) {
                this.blockIP(ip);
            }
            
            throw new Error('Access Denied: ' + error.message);
        }
    }
    
    // IP management
    blockIP(ip) {
        const blockedIPs = JSON.parse(localStorage.getItem('blockedIPs') || '{}');
        blockedIPs[ip] = Date.now() + SECURITY_CONFIG.LOCKOUT_TIME;
        localStorage.setItem('blockedIPs', JSON.stringify(blockedIPs));
    }
    
    isIPBlocked(ip) {
        const blockedIPs = JSON.parse(localStorage.getItem('blockedIPs') || '{}');
        const blockTime = blockedIPs[ip];
        
        if (blockTime && Date.now() < blockTime) {
            return true;
        }
        
        // Remove expired blocks
        if (blockTime && Date.now() >= blockTime) {
            delete blockedIPs[ip];
            localStorage.setItem('blockedIPs', JSON.stringify(blockedIPs));
        }
        
        return false;
    }
    
    // Activity monitoring
    setupActivityMonitoring() {
        // Reset activity timer on user interaction
        ['click', 'mousemove', 'keydown', 'scroll'].forEach(event => {
            document.addEventListener(event, () => {
                this.lastActivity = Date.now();
            });
        });
        
        // Check session timeout every minute
        setInterval(() => {
            if (Date.now() - this.lastActivity > SECURITY_CONFIG.SESSION_TIMEOUT) {
                this.forceLogout('Session timeout due to inactivity');
            }
        }, 60000);
    }
    
    // Logging functions
    async logSuccessLogin(ip, email) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            event: 'SUCCESS_LOGIN',
            ip: ip,
            email: email,
            userAgent: navigator.userAgent
        };
        
        await this.saveLog(logEntry);
    }
    
    async logFailedAttempt(ip, email, reason) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            event: 'FAILED_LOGIN',
            ip: ip,
            email: email,
            reason: reason,
            userAgent: navigator.userAgent
        };
        
        await this.saveLog(logEntry);
    }
    
    async logAdminAction(action, details) {
        if (!SECURITY_CONFIG.LOG_ALL_ACTIONS) return;
        
        const admin = firebase.auth().currentUser;
        const logEntry = {
            timestamp: new Date().toISOString(),
            event: 'ADMIN_ACTION',
            adminEmail: admin ? admin.email : 'unknown',
            action: action,
            details: details,
            ip: await this.getClientIP()
        };
        
        await this.saveLog(logEntry);
    }
    
    async saveLog(logEntry) {
        try {
            await firebase.firestore().collection('securityLogs').add(logEntry);
        } catch (error) {
            console.error('Failed to save log:', error);
        }
    }
    
    // Utility functions
    async getClientIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            return 'unknown';
        }
    }
    
    resetAttempts(key) {
        delete this.loginAttempts[key];
    }
    
    forceLogout(reason) {
        console.log(`Forced logout: ${reason}`);
        firebase.auth().signOut();
        alert(`Session ended: ${reason}`);
        window.location.href = 'system-control.html';
    }
}

// Initialize security system
const adminSecurity = new AdminSecurity();
