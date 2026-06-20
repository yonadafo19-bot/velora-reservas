import {
  BusinessVertical,
  LoyaltyTier,
  Weekday,
} from "../generated/prisma/client.js";
import type { DemoSeedDefinition } from "./demo-seed.types.js";

export const beautyStudioDemo: DemoSeedDefinition = {
  key: "beauty",
  business: {
    slug: "velora-beauty-studio-demo",
    name: "Velora Beauty Studio Demo",
    vertical: BusinessVertical.BEAUTY_STUDIO,
  },
  location: {
    slug: "nunoa-demo",
    name: "Sucursal Ñuñoa Demo",
    addressLine: "Calle Demostración 245, Ñuñoa",
    phone: "+56 9 0000 2100",
  },
  serviceCategories: [
    { slug: "manos-pies", name: "Manos y pies" },
    { slug: "mirada", name: "Cejas y pestañas" },
    { slug: "cuidado", name: "Cuidado facial y capilar" },
  ],
  services: [
    { slug: "manicure-permanente", name: "Manicure permanente", categorySlug: "manos-pies", description: "Preparación, esmaltado permanente y terminación.", priceClp: 22000, durationMinutes: 60 },
    { slug: "pedicure-spa", name: "Pedicure spa", categorySlug: "manos-pies", description: "Cuidado completo, exfoliación e hidratación.", priceClp: 28000, durationMinutes: 75 },
    { slug: "perfilado-cejas", name: "Perfilado de cejas", categorySlug: "mirada", description: "Diseño y perfilado según facciones.", priceClp: 12000, durationMinutes: 30 },
    { slug: "laminado-cejas", name: "Laminado de cejas", categorySlug: "mirada", description: "Orden y definición de cejas.", priceClp: 26000, durationMinutes: 60 },
    { slug: "lifting-pestanas", name: "Lifting de pestañas", categorySlug: "mirada", description: "Curvatura y realce de pestañas naturales.", priceClp: 30000, durationMinutes: 70 },
    { slug: "extension-pestanas-clasica", name: "Extensión de pestañas clásica", categorySlug: "mirada", description: "Aplicación clásica de acabado natural.", priceClp: 42000, durationMinutes: 110 },
    { slug: "limpieza-facial", name: "Limpieza facial", categorySlug: "cuidado", description: "Limpieza, exfoliación e hidratación.", priceClp: 32000, durationMinutes: 75 },
    { slug: "tratamiento-capilar-express", name: "Tratamiento capilar express", categorySlug: "cuidado", description: "Tratamiento hidratante y terminación.", priceClp: 24000, durationMinutes: 45 },
  ],
  professionals: [
    { slug: "camila-contreras", displayName: "Camila Contreras", roleTitle: "Especialista en manos y pies", serviceSlugs: ["manicure-permanente", "pedicure-spa"] },
    { slug: "valentina-herrera", displayName: "Valentina Herrera", roleTitle: "Especialista en mirada", serviceSlugs: ["perfilado-cejas", "laminado-cejas", "lifting-pestanas", "extension-pestanas-clasica"] },
    { slug: "javiera-morales", displayName: "Javiera Morales", roleTitle: "Especialista en cuidado integral", serviceSlugs: ["perfilado-cejas", "limpieza-facial", "tratamiento-capilar-express"] },
  ],
  packs: [
    { slug: "manos-cejas", name: "Manos + cejas", description: "Manicure permanente y perfilado de cejas.", priceClp: 30000, serviceSlugs: ["manicure-permanente", "perfilado-cejas"] },
    { slug: "pestanas-cejas", name: "Pestañas + cejas", description: "Lifting de pestañas y laminado de cejas.", priceClp: 50000, serviceSlugs: ["lifting-pestanas", "laminado-cejas"] },
    { slug: "pedicure-manicure", name: "Pedicure spa + manicure", description: "Pedicure spa y manicure permanente.", priceClp: 45000, serviceSlugs: ["pedicure-spa", "manicure-permanente"] },
  ],
  productCategories: [
    { slug: "manos", name: "Cuidado de manos" },
    { slug: "mirada", name: "Cuidado de cejas y pestañas" },
    { slug: "cabello-rostro", name: "Cabello y rostro" },
  ],
  products: [
    { slug: "aceite-cuticulas", sku: "BEA-ACE-001", name: "Aceite de cutículas", categorySlug: "manos", description: "Hidratación diaria para cutículas.", priceClp: 8990, onHand: 22, reorderPoint: 6 },
    { slug: "serum-pestanas", sku: "BEA-SER-001", name: "Sérum fortalecedor de pestañas", categorySlug: "mirada", description: "Cuidado complementario para pestañas.", priceClp: 16990, onHand: 12, reorderPoint: 4 },
    { slug: "gel-cejas", sku: "BEA-GEL-001", name: "Gel para cejas", categorySlug: "mirada", description: "Fijación ligera y transparente.", priceClp: 9990, onHand: 16, reorderPoint: 5 },
    { slug: "crema-manos", sku: "BEA-CRE-001", name: "Crema hidratante de manos", categorySlug: "manos", description: "Hidratación de rápida absorción.", priceClp: 10990, onHand: 18, reorderPoint: 5 },
    { slug: "mascarilla-capilar", sku: "BEA-MAS-001", name: "Mascarilla capilar", categorySlug: "cabello-rostro", description: "Tratamiento hidratante para uso semanal.", priceClp: 15990, onHand: 14, reorderPoint: 4 },
  ],
  customers: [
    { key: "cliente-1", firstName: "Fernanda", lastName: "Vega", phone: "+56 9 0000 2101", loyaltyTier: LoyaltyTier.STANDARD, priorityScore: 15, isManualVip: false, preferencesNotes: "Prefiere tonos neutros en manicure." },
    { key: "cliente-2", firstName: "Daniela", lastName: "Castro", phone: "+56 9 0000 2102", loyaltyTier: LoyaltyTier.PREFERRED, priorityScore: 50, isManualVip: false, preferencesNotes: "Prefiere horas durante la mañana." },
    { key: "cliente-3", firstName: "Paula", lastName: "Navarro", phone: "+56 9 0000 2103", loyaltyTier: LoyaltyTier.VIP, priorityScore: 90, isManualVip: true, preferencesNotes: "Cliente demo frecuente; confirmar por WhatsApp." },
  ],
  recommendations: [
    { serviceSlug: "manicure-permanente", productSlug: "aceite-cuticulas", message: "Complementa el cuidado diario de las cutículas." },
    { serviceSlug: "manicure-permanente", productSlug: "crema-manos", message: "Ayuda a mantener la hidratación de las manos." },
    { serviceSlug: "lifting-pestanas", productSlug: "serum-pestanas", message: "Recomendado para el cuidado posterior de las pestañas." },
    { serviceSlug: "laminado-cejas", productSlug: "gel-cejas", message: "Permite mantener las cejas ordenadas." },
    { serviceSlug: "tratamiento-capilar-express", productSlug: "mascarilla-capilar", message: "Prolonga el cuidado capilar en casa." },
  ],
  resources: [
    { slug: "mesa-manicure", name: "Mesa de manicure", serviceSlugs: ["manicure-permanente"] },
    { slug: "sillon-pedicure", name: "Sillón de pedicure", serviceSlugs: ["pedicure-spa"] },
    { slug: "camilla-facial", name: "Camilla facial", serviceSlugs: ["limpieza-facial"] },
    { slug: "estacion-pestanas", name: "Estación de pestañas", serviceSlugs: ["lifting-pestanas", "extension-pestanas-clasica"] },
  ],
  businessHours: [
    { weekday: Weekday.MONDAY, opensAtLocal: "09:30", closesAtLocal: "19:00" },
    { weekday: Weekday.TUESDAY, opensAtLocal: "09:30", closesAtLocal: "19:00" },
    { weekday: Weekday.WEDNESDAY, opensAtLocal: "09:30", closesAtLocal: "19:00" },
    { weekday: Weekday.THURSDAY, opensAtLocal: "09:30", closesAtLocal: "20:00" },
    { weekday: Weekday.FRIDAY, opensAtLocal: "09:30", closesAtLocal: "20:00" },
    { weekday: Weekday.SATURDAY, opensAtLocal: "10:00", closesAtLocal: "18:00" },
  ],
};
