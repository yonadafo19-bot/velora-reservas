import type { BusinessVertical, LoyaltyTier, Weekday } from "../generated/prisma/client.js";

export interface DemoService {
  slug: string;
  name: string;
  categorySlug: string;
  description: string;
  priceClp: number;
  durationMinutes: number;
}

export interface DemoProfessional {
  slug: string;
  displayName: string;
  roleTitle: string;
  serviceSlugs: readonly string[];
}

export interface DemoPack {
  slug: string;
  name: string;
  description: string;
  priceClp: number;
  serviceSlugs: readonly string[];
}

export interface DemoProduct {
  slug: string;
  sku: string;
  name: string;
  categorySlug: string;
  description: string;
  priceClp: number;
  onHand: number;
  reorderPoint: number;
}

export interface DemoCustomer {
  key: string;
  firstName: string;
  lastName: string;
  phone: string;
  loyaltyTier: LoyaltyTier;
  priorityScore: number;
  isManualVip: boolean;
  preferencesNotes: string;
}

export interface DemoResource {
  slug: string;
  name: string;
  serviceSlugs: readonly string[];
}

export interface DemoRecommendation {
  serviceSlug: string;
  productSlug: string;
  message: string;
}

export interface DemoSeedDefinition {
  key: string;
  business: {
    slug: string;
    name: string;
    vertical: BusinessVertical;
  };
  location: {
    slug: string;
    name: string;
    addressLine: string;
    phone: string;
  };
  serviceCategories: readonly { slug: string; name: string }[];
  services: readonly DemoService[];
  professionals: readonly DemoProfessional[];
  packs: readonly DemoPack[];
  productCategories: readonly { slug: string; name: string }[];
  products: readonly DemoProduct[];
  customers: readonly DemoCustomer[];
  recommendations: readonly DemoRecommendation[];
  resources: readonly DemoResource[];
  businessHours: readonly {
    weekday: Weekday;
    opensAtLocal: string;
    closesAtLocal: string;
  }[];
}
