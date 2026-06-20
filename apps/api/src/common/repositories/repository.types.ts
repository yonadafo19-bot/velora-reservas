export interface TenantOwned {
  businessId: string;
}

export type TenantWhere<T extends object = Record<string, never>> = Omit<T, "businessId">
  & TenantOwned;
