import { isVertical } from "@/data/demo";
import type { BusinessVertical } from "@/types/demo";
export async function getAdminVertical(searchParams: Promise<{ negocio?: string }>): Promise<BusinessVertical> { const params = await searchParams; return isVertical(params.negocio) ? params.negocio : "barberia"; }
