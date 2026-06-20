import {
  BusinessVertical,
  LoyaltyTier,
  Weekday,
} from "../generated/prisma/client.js";
import type { DemoSeedDefinition } from "./demo-seed.types.js";

export const barbershopDemo: DemoSeedDefinition = {
  key: "barberia",
  business: {
    slug: "velora-barberia-demo",
    name: "Velora Barbería Demo",
    vertical: BusinessVertical.BARBERSHOP,
  },
  location: {
    slug: "providencia-demo",
    name: "Sucursal Providencia Demo",
    addressLine: "Avenida Demo 120, Providencia",
    phone: "+56 9 0000 1100",
  },
  serviceCategories: [
    { slug: "cortes", name: "Cortes" },
    { slug: "barba", name: "Barba" },
    { slug: "cuidado", name: "Cuidado personal" },
  ],
  services: [
    { slug: "corte-clasico", name: "Corte clásico", categorySlug: "cortes", description: "Corte personalizado y terminaciones.", priceClp: 18000, durationMinutes: 40 },
    { slug: "corte-premium", name: "Corte premium", categorySlug: "cortes", description: "Asesoría, lavado, corte y peinado.", priceClp: 26000, durationMinutes: 60 },
    { slug: "perfilado-barba", name: "Perfilado de barba", categorySlug: "barba", description: "Diseño, perfilado y terminación.", priceClp: 14000, durationMinutes: 30 },
    { slug: "corte-barba", name: "Corte + barba", categorySlug: "barba", description: "Servicio combinado de corte y perfilado.", priceClp: 30000, durationMinutes: 75 },
    { slug: "afeitado-tradicional", name: "Afeitado tradicional", categorySlug: "barba", description: "Afeitado con preparación de piel y toalla tibia.", priceClp: 17000, durationMinutes: 40 },
    { slug: "limpieza-facial-express", name: "Limpieza facial express", categorySlug: "cuidado", description: "Limpieza e hidratación facial rápida.", priceClp: 16000, durationMinutes: 30 },
    { slug: "camuflaje-canas", name: "Color y camuflaje de canas", categorySlug: "cuidado", description: "Aplicación de color de acabado natural.", priceClp: 28000, durationMinutes: 50 },
  ],
  professionals: [
    { slug: "matias-rojas", displayName: "Matías Rojas", roleTitle: "Barbero senior", serviceSlugs: ["corte-clasico", "corte-premium", "perfilado-barba", "corte-barba", "afeitado-tradicional"] },
    { slug: "diego-munoz", displayName: "Diego Muñoz", roleTitle: "Barbero y colorista", serviceSlugs: ["corte-clasico", "corte-premium", "corte-barba", "camuflaje-canas"] },
    { slug: "tomas-silva", displayName: "Tomás Silva", roleTitle: "Especialista en barba y cuidado", serviceSlugs: ["perfilado-barba", "afeitado-tradicional", "limpieza-facial-express"] },
  ],
  packs: [
    { slug: "corte-barba-premium", name: "Corte + barba premium", description: "Corte premium y perfilado de barba.", priceClp: 36000, serviceSlugs: ["corte-premium", "perfilado-barba"] },
    { slug: "ritual-barba-limpieza", name: "Ritual barba + limpieza express", description: "Afeitado tradicional y limpieza facial express.", priceClp: 29000, serviceSlugs: ["afeitado-tradicional", "limpieza-facial-express"] },
  ],
  productCategories: [
    { slug: "cabello", name: "Cuidado del cabello" },
    { slug: "barba-rostro", name: "Barba y rostro" },
  ],
  products: [
    { slug: "pomada-fijacion", sku: "BAR-POM-001", name: "Pomada de fijación", categorySlug: "cabello", description: "Fijación flexible con acabado natural.", priceClp: 12990, onHand: 18, reorderPoint: 5 },
    { slug: "aceite-barba", sku: "BAR-ACE-001", name: "Aceite para barba", categorySlug: "barba-rostro", description: "Aceite hidratante de uso diario.", priceClp: 10990, onHand: 15, reorderPoint: 4 },
    { slug: "shampoo-fortalecedor", sku: "BAR-SHA-001", name: "Shampoo fortalecedor", categorySlug: "cabello", description: "Limpieza suave para uso frecuente.", priceClp: 13990, onHand: 12, reorderPoint: 4 },
    { slug: "cera-mate", sku: "BAR-CER-001", name: "Cera mate", categorySlug: "cabello", description: "Textura y control sin brillo.", priceClp: 11990, onHand: 20, reorderPoint: 6 },
    { slug: "after-shave-premium", sku: "BAR-AFT-001", name: "After shave premium", categorySlug: "barba-rostro", description: "Bálsamo calmante para después del afeitado.", priceClp: 14990, onHand: 10, reorderPoint: 3 },
  ],
  customers: [
    { key: "cliente-1", firstName: "Nicolás", lastName: "Pérez", phone: "+56 9 0000 1101", loyaltyTier: LoyaltyTier.STANDARD, priorityScore: 10, isManualVip: false, preferencesNotes: "Prefiere horarios durante la tarde." },
    { key: "cliente-2", firstName: "Sebastián", lastName: "Fuentes", phone: "+56 9 0000 1102", loyaltyTier: LoyaltyTier.PREFERRED, priorityScore: 45, isManualVip: false, preferencesNotes: "Prefiere acabado mate." },
    { key: "cliente-3", firstName: "Andrés", lastName: "Soto", phone: "+56 9 0000 1103", loyaltyTier: LoyaltyTier.VIP, priorityScore: 85, isManualVip: true, preferencesNotes: "Cliente demo frecuente; confirmar por WhatsApp." },
  ],
  recommendations: [
    { serviceSlug: "corte-premium", productSlug: "pomada-fijacion", message: "Ideal para mantener el peinado en casa." },
    { serviceSlug: "perfilado-barba", productSlug: "aceite-barba", message: "Ayuda a hidratar y ordenar la barba." },
    { serviceSlug: "afeitado-tradicional", productSlug: "after-shave-premium", message: "Complementa el cuidado posterior al afeitado." },
    { serviceSlug: "corte-clasico", productSlug: "cera-mate", message: "Aporta textura con acabado mate." },
  ],
  resources: [
    { slug: "sillon-barberia", name: "Sillón de barbería", serviceSlugs: ["corte-clasico", "corte-premium", "perfilado-barba", "corte-barba", "afeitado-tradicional"] },
    { slug: "lavacabezas", name: "Lavacabezas", serviceSlugs: ["corte-premium", "camuflaje-canas"] },
    { slug: "estacion-corte", name: "Estación de corte", serviceSlugs: ["corte-clasico", "corte-premium", "corte-barba"] },
  ],
  businessHours: [
    { weekday: Weekday.MONDAY, opensAtLocal: "10:00", closesAtLocal: "19:00" },
    { weekday: Weekday.TUESDAY, opensAtLocal: "10:00", closesAtLocal: "19:00" },
    { weekday: Weekday.WEDNESDAY, opensAtLocal: "10:00", closesAtLocal: "19:00" },
    { weekday: Weekday.THURSDAY, opensAtLocal: "10:00", closesAtLocal: "20:00" },
    { weekday: Weekday.FRIDAY, opensAtLocal: "10:00", closesAtLocal: "20:00" },
    { weekday: Weekday.SATURDAY, opensAtLocal: "09:30", closesAtLocal: "18:00" },
  ],
};
