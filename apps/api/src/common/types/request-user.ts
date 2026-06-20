import type { BusinessVertical, MembershipRole } from "@velora/types";

export interface RequestMembership {
  id: string;
  businessId: string;
  businessSlug: string;
  businessName: string;
  businessVertical: BusinessVertical;
  role: MembershipRole;
}

export interface RequestUser {
  id: string;
  authSubject: string;
  email: string;
  memberships: readonly RequestMembership[];
}

export interface TenantContext {
  businessId: string;
  businessSlug: string;
  businessName: string;
  businessVertical: BusinessVertical;
  membershipId: string;
  role: MembershipRole;
  userId: string;
}
