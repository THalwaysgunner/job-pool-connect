export type Language = "en" | "he" | "es";

export const languageNames: Record<Language, string> = {
  en: "English",
  he: "עברית",
  es: "Español",
};

export const translations: Record<Language, Record<string, string>> = {
  en: {
    // Sidebar - Admin
    "admin.panel": "Admin Panel",
    "nav.dashboard": "Dashboard",
    "nav.users": "Users",
    "nav.jobs": "Jobs",
    "nav.companies": "Companies",
    "nav.legalFiles": "Legal Files",
    "nav.alerts": "Alerts",
    "nav.signOut": "Sign Out",

    // Sidebar - Client
    "client.panel": "Client Panel",
    "nav.myJobs": "My Jobs",
    "nav.settings": "Settings",

    // Sidebar - Provider
    "provider.panel": "Provider Panel",
    "nav.jobPool": "Job Pool",

    // Header actions
    "header.accountSettings": "Account Settings",
    "header.logOut": "Log Out",
    "header.language": "Language",

    // Notifications
    "notifications.title": "Notifications",
    "notifications.markAllRead": "Mark all read",
    "notifications.empty": "No notifications",
  },
  he: {
    // Sidebar - Admin
    "admin.panel": "פאנל ניהול",
    "nav.dashboard": "לוח בקרה",
    "nav.users": "משתמשים",
    "nav.jobs": "עבודות",
    "nav.companies": "חברות",
    "nav.legalFiles": "מסמכים משפטיים",
    "nav.alerts": "התראות",
    "nav.signOut": "התנתק",

    // Sidebar - Client
    "client.panel": "פאנל לקוח",
    "nav.myJobs": "העבודות שלי",
    "nav.settings": "הגדרות",

    // Sidebar - Provider
    "provider.panel": "פאנל ספק",
    "nav.jobPool": "מאגר עבודות",

    // Header actions
    "header.accountSettings": "הגדרות חשבון",
    "header.logOut": "התנתק",
    "header.language": "שפה",

    // Notifications
    "notifications.title": "התראות",
    "notifications.markAllRead": "סמן הכל כנקרא",
    "notifications.empty": "אין התראות",
  },
  es: {
    // Sidebar - Admin
    "admin.panel": "Panel de Admin",
    "nav.dashboard": "Panel",
    "nav.users": "Usuarios",
    "nav.jobs": "Trabajos",
    "nav.companies": "Empresas",
    "nav.legalFiles": "Archivos Legales",
    "nav.alerts": "Alertas",
    "nav.signOut": "Cerrar Sesión",

    // Sidebar - Client
    "client.panel": "Panel de Cliente",
    "nav.myJobs": "Mis Trabajos",
    "nav.settings": "Configuración",

    // Sidebar - Provider
    "provider.panel": "Panel de Proveedor",
    "nav.jobPool": "Pool de Trabajos",

    // Header actions
    "header.accountSettings": "Configuración de Cuenta",
    "header.logOut": "Cerrar Sesión",
    "header.language": "Idioma",

    // Notifications
    "notifications.title": "Notificaciones",
    "notifications.markAllRead": "Marcar todo leído",
    "notifications.empty": "Sin notificaciones",
  },
};
