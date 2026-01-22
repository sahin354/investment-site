// ========================================
// SUPABASE SECURITY CONFIGURATION
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
    
    // Password requirements
    PASSWORD_MIN_LENGTH: 8,
    REQUIRE_SPECIAL_CHARS: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_UPPERCASE: true
};

// Import Supabase client
import { supabase } from './supabase.js';

class AdminSecurity {
    constructor() {
        this.loginAttempts = {};
        this.lastActivity = Date.now();
        this.session = null;
        this.setupActivityMonitoring();
    }
    
    // Enhanced login validation for Supabase
    async validateAdminLogin(email, password) {
        const normalizedEmail = email.toLowerCase();
        
        // Check admin whitelist
        if (!SECURITY_CONFIG.SYSTEM_ADMINS.includes(normalizedEmail)) {
            await this.logFailedAttempt(normalizedEmail, 'Invalid admin email');
            throw new Error('Access Denied: Invalid credentials.');
        }
        
        try {
            // Sign in with Supabase
            const { data, error } = await supabase.auth.signInWithPassword({
                email: normalizedEmail,
                password: password
            });
            
            if (error) throw error;
            
            // Double-check admin status
            if (SECURITY_CONFIG.SYSTEM_ADMINS.includes(data.user.email.toLowerCase())) {
                this.session = data.session;
                await this.logSuccessLogin(data.user.email);
                return data;
            } else {
                throw new Error('Access Denied: Administrator privileges required.');
            }
        } catch (error) {
            await this.logFailedAttempt(normalizedEmail, error.message);
            throw new Error('Access Denied: ' + error.message);
        }
    }
    
    // Check current session
    async checkCurrentSession() {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
            const user = data.session.user;
            if (SECURITY_CONFIG.SYSTEM_ADMINS.includes(user.email.toLowerCase())) {
                this.session = data.session;
                return true;
            }
        }
        return false;
    }
    
    // Activity monitoring
    setupActivityMonitoring() {
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
    
    // Logging functions for Supabase
    async logSuccessLogin(email) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            event: 'SUCCESS_LOGIN',
            email: email,
            user_agent: navigator.userAgent
        };
        
        await this.saveLog(logEntry);
    }
    
    async logFailedAttempt(email, reason) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            event: 'FAILED_LOGIN',
            email: email,
            reason: reason,
            user_agent: navigator.userAgent
        };
        
        await this.saveLog(logEntry);
    }
    
    async logAdminAction(action, details) {
        if (!this.session) return;
        
        const logEntry = {
            timestamp: new Date().toISOString(),
            event: 'ADMIN_ACTION',
            admin_email: this.session.user.email,
            action: action,
            details: details
        };
        
        await this.saveLog(logEntry);
    }
    
    async saveLog(logEntry) {
        try {
            const { error } = await supabase
                .from('security_logs')
                .insert([logEntry]);
            
            if (error) console.error('Failed to save log:', error);
        } catch (error) {
            console.error('Error saving log:', error);
        }
    }
    
    async forceLogout(reason) {
        console.log(`Forced logout: ${reason}`);
        await supabase.auth.signOut();
        alert(`Session ended: ${reason}`);
        window.location.href = 'system-control.html';
    }
    
    async logout() {
        await this.logAdminAction('LOGOUT', {});
        await supabase.auth.signOut();
        window.location.href = 'system-control.html';
    }
}

// Initialize security system
const adminSecurity = new AdminSecurity();
export { adminSecurity, SECURITY_CONFIG };
