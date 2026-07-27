export declare enum UserRole {
    CUSTOMER = "CUSTOMER",
    ADMIN = "ADMIN",
    SELLER = "SELLER",
    SUPPORT = "SUPPORT",
    SUPER_ADMIN = "SUPER_ADMIN"
}
export declare enum OrderStatus {
    PENDING = "PENDING",
    PAYMENT_PENDING = "PAYMENT_PENDING",
    PAID = "PAID",
    PROCESSING = "PROCESSING",
    SHIPPED = "SHIPPED",
    DELIVERED = "DELIVERED",
    CANCELLED = "CANCELLED",
    REFUNDED = "REFUNDED"
}
export declare enum PaymentStatus {
    PENDING = "PENDING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    REFUNDED = "REFUNDED"
}
export declare enum ShippingStatus {
    PENDING = "PENDING",
    PREPARING = "PREPARING",
    IN_TRANSIT = "IN_TRANSIT",
    DELIVERED = "DELIVERED",
    FAILED = "FAILED"
}
export declare enum DomainEvents {
    USER_REGISTERED = "user.registered",
    ORDER_CREATED = "order.created",
    ORDER_CANCELLED = "order.cancelled",
    PAYMENT_COMPLETED = "payment.completed",
    PAYMENT_FAILED = "payment.failed",
    INVENTORY_RESERVED = "inventory.reserved",
    INVENTORY_RELEASED = "inventory.released",
    SHIPMENT_DISPATCHED = "shipment.dispatched",
    PRODUCT_UPDATED = "product.updated"
}
export declare const AMQP_EXCHANGES: {
    DOMAIN_EVENTS: string;
    DEAD_LETTER: string;
};
export declare const CORRELATION_ID_HEADER = "x-correlation-id";
//# sourceMappingURL=index.d.ts.map