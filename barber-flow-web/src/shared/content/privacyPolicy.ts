/**
 * Contenido de la política de privacidad (bilingüe EN/ES). Vive como datos tipados, y no como un
 * HTML estático, porque el servidor de producción (`serve -s`) responde la app para cualquier ruta
 * y nunca sirve archivos de carpeta: una página estática en /privacy-policy/ no era alcanzable.
 *
 * Convención de texto: `**negrita**` se renderiza como énfasis (ver `splitBold`).
 */

export type PolicyLang = 'en' | 'es';

type Localized<T> = Record<PolicyLang, T>;

export type PolicyBlock =
  | { type: 'paragraph'; text: Localized<string> }
  | { type: 'list'; items: Localized<string[]> }
  | { type: 'callout'; icon: string; text: Localized<string> }
  | { type: 'table'; headers: Localized<string[]>; rows: Localized<string[][]> };

export interface PolicySection {
  id: string;
  title: Localized<string>;
  blocks: PolicyBlock[];
}

export const PRIVACY_POLICY_BRAND = 'HairCutsFlow CR';
export const PRIVACY_POLICY_OPERATOR = 'Guillermo Ramirez';
export const PRIVACY_POLICY_CONTACT_EMAIL = 'barber.flow.cr@gmail.com';
export const PRIVACY_POLICY_PUBLIC_URL = 'https://www.haircutsflowcr.com/privacy-policy';
export const PRIVACY_POLICY_LAST_UPDATED = '2026-11-20';

export const PRIVACY_POLICY_HERO: {
  eyebrow: Localized<string>;
  title: Localized<string>;
  subtitle: Localized<string>;
  lastUpdated: Localized<string>;
  contents: Localized<string>;
} = {
  eyebrow: { en: 'Legal Document', es: 'Documento Legal' },
  title: { en: 'Privacy Policy', es: 'Política de Privacidad' },
  subtitle: {
    en: `How ${PRIVACY_POLICY_BRAND} collects, uses, and protects your personal information.`,
    es: `Cómo ${PRIVACY_POLICY_BRAND} recopila, usa y protege tu información personal.`,
  },
  lastUpdated: {
    en: 'Last updated: November 20, 2026',
    es: 'Última actualización: 20 de noviembre de 2026',
  },
  contents: { en: 'Contents', es: 'Contenido' },
};

export const PRIVACY_POLICY_INTRO: Localized<string> = {
  en: `**Your privacy matters.** ${PRIVACY_POLICY_BRAND} is a barbershop management tool for professional barbers. We collect only the data necessary to make the app work — no advertising, no analytics tracking, no data sold to third parties.`,
  es: `**Tu privacidad importa.** ${PRIVACY_POLICY_BRAND} es una herramienta de gestión de barberías para barberos profesionales. Solo recopilamos los datos necesarios para que la app funcione — sin publicidad, sin seguimiento analítico, sin venta de datos a terceros.`,
};

export const PRIVACY_POLICY_SECTIONS: PolicySection[] = [
  {
    id: 's1',
    title: { en: 'Information We Collect', es: 'Información que recopilamos' },
    blocks: [
      {
        type: 'paragraph',
        text: {
          en: `We collect the following types of information when you use ${PRIVACY_POLICY_BRAND}:`,
          es: `Recopilamos los siguientes tipos de información cuando usas ${PRIVACY_POLICY_BRAND}:`,
        },
      },
      {
        type: 'table',
        headers: {
          en: ['Data type', 'Examples', 'Required?', "Where it's stored"],
          es: ['Tipo de dato', 'Ejemplos', '¿Obligatorio?', 'Dónde se almacena'],
        },
        rows: {
          en: [
            ['Barber profile', 'Name, phone, email, shop name, shop phone', 'Name & phone required; others optional', 'Our servers'],
            ['Profile photo', 'Photo taken with camera or selected from gallery', 'Optional', 'Our servers'],
            ['Client data', 'Client first name, last name, phone, email', 'Name & phone required; email optional', 'Our servers'],
            ['Appointment data', 'Client name, phone, service, date, time, price', 'Required to create an appointment', 'Our servers'],
            ['App preferences', 'Theme (dark/light), language (EN/ES)', 'Optional', 'On your device only'],
            ['Authentication token', 'Encrypted JWT session token', 'Automatically generated on login', 'On your device only'],
          ],
          es: [
            ['Perfil del barbero', 'Nombre, teléfono, email, nombre del local, teléfono del local', 'Nombre y teléfono obligatorios; resto opcional', 'Nuestros servidores'],
            ['Foto de perfil', 'Foto tomada con cámara o seleccionada de galería', 'Opcional', 'Nuestros servidores'],
            ['Datos de clientes', 'Nombre, apellido, teléfono, email del cliente', 'Nombre y teléfono obligatorios; email opcional', 'Nuestros servidores'],
            ['Datos de citas', 'Nombre, teléfono, servicio, fecha, hora, precio', 'Obligatorio para crear una cita', 'Nuestros servidores'],
            ['Preferencias de la app', 'Tema (oscuro/claro), idioma (EN/ES)', 'Opcional', 'Solo en tu dispositivo'],
            ['Token de autenticación', 'Token de sesión JWT cifrado', 'Generado automáticamente al iniciar sesión', 'Solo en tu dispositivo'],
          ],
        },
      },
      {
        type: 'paragraph',
        text: {
          en: `**Your clients' data.** The client and appointment records you enter belong to you. You are responsible for having the right to store them. ${PRIVACY_POLICY_BRAND} processes them on your behalf, only to provide the service, and never uses them for its own purposes.`,
          es: `**Datos de tus clientes.** Los registros de clientes y citas que ingresas te pertenecen. Eres responsable de tener derecho a guardarlos. ${PRIVACY_POLICY_BRAND} los procesa en tu nombre, únicamente para prestar el servicio, y nunca los usa para fines propios.`,
        },
      },
      {
        type: 'callout',
        icon: '📵',
        text: {
          en: `**No tracking.** ${PRIVACY_POLICY_BRAND} does not use analytics services, crash reporters, advertising SDKs, or any third-party tracking technology. We do not track your behavior across other apps or websites.`,
          es: `**Sin rastreo.** ${PRIVACY_POLICY_BRAND} no utiliza servicios de análisis, reportes de errores, SDKs publicitarios ni ninguna tecnología de rastreo de terceros. No hacemos seguimiento de tu comportamiento en otras apps o sitios web.`,
        },
      },
    ],
  },
  {
    id: 's2',
    title: { en: 'How We Use Your Information', es: 'Cómo usamos tu información' },
    blocks: [
      {
        type: 'paragraph',
        text: {
          en: "All data collected is used exclusively to provide and operate the app's features:",
          es: 'Todos los datos recopilados se usan exclusivamente para brindar y operar las funcionalidades de la app:',
        },
      },
      {
        type: 'list',
        items: {
          en: [
            '**Appointments** — schedule, view, edit, and manage your daily and weekly bookings.',
            '**Client management** — build and maintain a client database for faster appointment creation.',
            '**Reports** — generate revenue summaries and appointment statistics for your shop.',
            '**Notifications** — in-app alerts for upcoming appointments and relevant updates.',
            '**Profile** — display your barber and shop information within the app.',
            '**Authentication** — keep your session secure so only you can access your account.',
          ],
          es: [
            '**Citas** — agenda, visualiza, edita y gestiona tus reservas diarias y semanales.',
            '**Gestión de clientes** — crea y mantén una base de datos de clientes para agendar citas más rápido.',
            '**Reportes** — genera resúmenes de ingresos y estadísticas de citas de tu local.',
            '**Notificaciones** — alertas dentro de la app para citas próximas y actualizaciones relevantes.',
            '**Perfil** — muestra tu información de barbero y de tu local dentro de la app.',
            '**Autenticación** — mantén tu sesión segura para que solo tú puedas acceder a tu cuenta.',
          ],
        },
      },
      {
        type: 'paragraph',
        text: {
          en: "We do not use your data for advertising, profiling, or any purpose beyond app functionality.",
          es: 'No usamos tus datos para publicidad, perfilado ni ningún fin más allá de las funcionalidades de la app.',
        },
      },
    ],
  },
  {
    id: 's3',
    title: { en: 'Data Storage & Security', es: 'Almacenamiento y seguridad' },
    blocks: [
      {
        type: 'list',
        items: {
          en: [
            'All data transmitted between the app and our servers is encrypted via **HTTPS/TLS**.',
            "In the mobile app, your authentication token is stored locally on your device using **Expo SecureStore**, which uses the device's secure hardware (Keychain on iOS, Keystore on Android).",
            'App preferences (theme, language) are stored locally on your device and never sent to our servers.',
            "On the web app (app.haircutsflowcr.com), your session token and preferences are stored in your browser's local storage, on your device only.",
            'Profile photos are uploaded to our servers and stored securely.',
            'We do not store your password in plain text; we only keep a secure hash of it.',
          ],
          es: [
            'Todos los datos transmitidos entre la app y nuestros servidores están cifrados con **HTTPS/TLS**.',
            'En la app móvil, tu token de autenticación se almacena localmente en tu dispositivo usando **Expo SecureStore**, que utiliza el hardware seguro del dispositivo (Keychain en iOS, Keystore en Android).',
            'Las preferencias de la app (tema, idioma) se almacenan localmente en tu dispositivo y nunca se envían a nuestros servidores.',
            'En la app web (app.haircutsflowcr.com), tu token de sesión y tus preferencias se guardan en el almacenamiento local de tu navegador, solo en tu dispositivo.',
            'Las fotos de perfil se suben a nuestros servidores y se almacenan de forma segura.',
            'No almacenamos tu contraseña en texto plano; solo guardamos un hash seguro de la misma.',
          ],
        },
      },
    ],
  },
  {
    id: 's4',
    title: { en: 'Data Sharing', es: 'Compartición de datos' },
    blocks: [
      {
        type: 'callout',
        icon: '🚫',
        text: {
          en: '**We do not sell or rent your personal data.** We never disclose it to advertisers or data brokers. The only third parties involved are the service providers listed below, which process data on our behalf to run the app.',
          es: '**No vendemos ni alquilamos tus datos personales.** Nunca los entregamos a anunciantes ni a intermediarios de datos. Los únicos terceros involucrados son los proveedores de servicio que se listan abajo, que procesan datos en nuestro nombre para operar la app.',
        },
      },
      {
        type: 'paragraph',
        text: {
          en: 'To operate the app we rely on these service providers:',
          es: 'Para operar la app usamos estos proveedores de servicio:',
        },
      },
      {
        type: 'list',
        items: {
          en: [
            '**Railway** — hosting of the application servers.',
            '**MongoDB Atlas** — database where your account, clients, and appointments are stored.',
            '**Resend** — delivery of transactional emails (welcome message and password recovery code) to the email address on your account.',
            '**Cloudflare** — domain name (DNS) and network security for haircutsflowcr.com.',
          ],
          es: [
            '**Railway** — alojamiento de los servidores de la aplicación.',
            '**MongoDB Atlas** — base de datos donde se guardan tu cuenta, clientes y citas.',
            '**Resend** — envío de correos transaccionales (mensaje de bienvenida y código de recuperación de contraseña) al correo de tu cuenta.',
            '**Cloudflare** — nombre de dominio (DNS) y seguridad de red de haircutsflowcr.com.',
          ],
        },
      },
      {
        type: 'paragraph',
        text: {
          en: 'Apart from these providers, data may be disclosed only in the following circumstances:',
          es: 'Fuera de estos proveedores, los datos solo podrían divulgarse en las siguientes circunstancias:',
        },
      },
      {
        type: 'list',
        items: {
          en: [
            'When required by applicable law or a valid legal order.',
            `To protect the rights, property, or safety of ${PRIVACY_POLICY_BRAND}, its users, or the public.`,
          ],
          es: [
            'Cuando lo exija la ley aplicable o una orden legal válida.',
            `Para proteger los derechos, la propiedad o la seguridad de ${PRIVACY_POLICY_BRAND}, sus usuarios o el público en general.`,
          ],
        },
      },
    ],
  },
  {
    id: 's5',
    title: { en: 'Your Rights', es: 'Tus derechos' },
    blocks: [
      {
        type: 'paragraph',
        text: {
          en: 'You have full control over your data. At any time, you may:',
          es: 'Tienes control total sobre tus datos. En cualquier momento puedes:',
        },
      },
      {
        type: 'list',
        items: {
          en: [
            '**Access** — view all personal data stored in your account through the app’s profile and settings screens.',
            '**Update** — edit your barber profile, shop information, and client records at any time.',
            '**Delete** — permanently delete your account and all associated data directly from the app via **Settings → Delete Account**. Deletion is immediate and irreversible.',
          ],
          es: [
            '**Acceder** — ver todos los datos personales almacenados en tu cuenta desde las pantallas de perfil y configuración.',
            '**Actualizar** — editar tu perfil de barbero, la información de tu local y los registros de clientes en cualquier momento.',
            '**Eliminar** — borrar permanentemente tu cuenta y todos los datos asociados desde la app en **Configuración → Eliminar cuenta**. La eliminación es inmediata e irreversible.',
          ],
        },
      },
      {
        type: 'callout',
        icon: '🗑️',
        text: {
          en: 'Account deletion removes all your data from our servers, including your profile, client list, and appointment history. This action cannot be undone.',
          es: 'La eliminación de la cuenta borra todos tus datos de nuestros servidores, incluyendo tu perfil, lista de clientes e historial de citas. Esta acción no se puede deshacer.',
        },
      },
    ],
  },
  {
    id: 's6',
    title: { en: 'Data Retention', es: 'Retención de datos' },
    blocks: [
      {
        type: 'paragraph',
        text: {
          en: 'We retain your data for as long as your account is active. When you delete your account, all associated personal data is permanently erased from our servers. Anonymized or aggregated data that cannot identify you may be retained for internal analysis.',
          es: 'Conservamos tus datos mientras tu cuenta esté activa. Cuando eliminas tu cuenta, todos los datos personales asociados son borrados permanentemente de nuestros servidores. Los datos anonimizados o agregados que no puedan identificarte pueden conservarse para análisis interno.',
        },
      },
    ],
  },
  {
    id: 's7',
    title: { en: "Children's Privacy", es: 'Privacidad infantil' },
    blocks: [
      {
        type: 'paragraph',
        text: {
          en: `${PRIVACY_POLICY_BRAND} is intended for use by professional barbers and business owners. The app is not directed at children under the age of 13, and we do not knowingly collect personal information from minors. If you believe we have inadvertently collected data from a child, please contact us immediately so we can delete it.`,
          es: `${PRIVACY_POLICY_BRAND} está dirigida a barberos profesionales y propietarios de negocios. La app no está orientada a menores de 13 años y no recopilamos intencionalmente información personal de menores. Si crees que hemos recopilado datos de un menor de forma inadvertida, contáctanos de inmediato para que podamos eliminarlos.`,
        },
      },
    ],
  },
  {
    id: 's8',
    title: { en: 'Changes to This Policy', es: 'Cambios a esta política' },
    blocks: [
      {
        type: 'paragraph',
        text: {
          en: 'We may update this Privacy Policy from time to time. When we do, the "Last updated" date at the top of the page will be revised. For significant changes, we will notify users through an in-app notice. Continued use of the app after changes are posted constitutes acceptance of the updated policy.',
          es: 'Podemos actualizar esta Política de Privacidad de vez en cuando. Cuando lo hagamos, se revisará la fecha de "Última actualización" al inicio de la página. Para cambios significativos, notificaremos a los usuarios mediante un aviso dentro de la app. El uso continuado de la app después de publicar los cambios constituye la aceptación de la política actualizada.',
        },
      },
    ],
  },
  {
    id: 's9',
    title: { en: 'Contact Us', es: 'Contáctanos' },
    blocks: [
      {
        type: 'paragraph',
        text: {
          en: `${PRIVACY_POLICY_BRAND} is operated by **${PRIVACY_POLICY_OPERATOR}**, who is responsible for the processing of personal data described in this policy.`,
          es: `${PRIVACY_POLICY_BRAND} es operado por **${PRIVACY_POLICY_OPERATOR}**, responsable del tratamiento de los datos personales descritos en esta política.`,
        },
      },
      {
        type: 'paragraph',
        text: {
          en: 'If you have any questions, concerns, or requests regarding this Privacy Policy or your personal data, please reach out to us. We aim to respond to all privacy-related inquiries within 5 business days.',
          es: 'Si tienes preguntas, inquietudes o solicitudes sobre esta Política de Privacidad o tus datos personales, comunícate con nosotros. Nos comprometemos a responder todas las consultas de privacidad dentro de 5 días hábiles.',
        },
      },
    ],
  },
];

export const PRIVACY_POLICY_FOOTER: Localized<string> = {
  en: `© 2026 ${PRIVACY_POLICY_BRAND} · ${PRIVACY_POLICY_OPERATOR}. All rights reserved. · This document is publicly available at www.haircutsflowcr.com/privacy-policy.`,
  es: `© 2026 ${PRIVACY_POLICY_BRAND} · ${PRIVACY_POLICY_OPERATOR}. Todos los derechos reservados. · Este documento está disponible públicamente en www.haircutsflowcr.com/privacy-policy.`,
};

/** Divide un texto con `**negrita**` en segmentos para renderizar sin HTML crudo. */
export const splitBold = (text: string): { text: string; bold: boolean }[] =>
  text
    .split('**')
    .map((part, index) => ({ text: part, bold: index % 2 === 1 }))
    .filter((segment) => segment.text.length > 0);
