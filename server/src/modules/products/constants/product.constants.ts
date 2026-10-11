import { AttributeDataType, ProductRoleType, ProductStatus, ProductVariantType } from '@prisma/client'

export const PRODUCT_STATUS_VALUES = [ProductStatus.ACTIVE, ProductStatus.INACTIVE] as const
export const PRODUCT_ROLE_VALUES = [ProductRoleType.MERCHANDISE, ProductRoleType.SUPPLY, ProductRoleType.FINISHED_PRODUCT] as const
export const PRODUCT_VARIANT_VALUES = [ProductVariantType.WITH_VARIANTS, ProductVariantType.BASIC] as const
export const ATTRIBUTE_DATA_TYPE_VALUES = [AttributeDataType.TEXT, AttributeDataType.NUMBER] as const
