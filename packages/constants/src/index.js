"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CORRELATION_ID_HEADER = exports.AMQP_EXCHANGES = exports.DomainEvents = exports.ShippingStatus = exports.PaymentStatus = exports.OrderStatus = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["CUSTOMER"] = "CUSTOMER";
    UserRole["ADMIN"] = "ADMIN";
    UserRole["SELLER"] = "SELLER";
    UserRole["SUPPORT"] = "SUPPORT";
    UserRole["SUPER_ADMIN"] = "SUPER_ADMIN";
})(UserRole || (exports.UserRole = UserRole = {}));
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["PENDING"] = "PENDING";
    OrderStatus["PAYMENT_PENDING"] = "PAYMENT_PENDING";
    OrderStatus["PAID"] = "PAID";
    OrderStatus["PROCESSING"] = "PROCESSING";
    OrderStatus["SHIPPED"] = "SHIPPED";
    OrderStatus["DELIVERED"] = "DELIVERED";
    OrderStatus["CANCELLED"] = "CANCELLED";
    OrderStatus["REFUNDED"] = "REFUNDED";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "PENDING";
    PaymentStatus["COMPLETED"] = "COMPLETED";
    PaymentStatus["FAILED"] = "FAILED";
    PaymentStatus["REFUNDED"] = "REFUNDED";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var ShippingStatus;
(function (ShippingStatus) {
    ShippingStatus["PENDING"] = "PENDING";
    ShippingStatus["PREPARING"] = "PREPARING";
    ShippingStatus["IN_TRANSIT"] = "IN_TRANSIT";
    ShippingStatus["DELIVERED"] = "DELIVERED";
    ShippingStatus["FAILED"] = "FAILED";
})(ShippingStatus || (exports.ShippingStatus = ShippingStatus = {}));
var DomainEvents;
(function (DomainEvents) {
    DomainEvents["USER_REGISTERED"] = "user.registered";
    DomainEvents["ORDER_CREATED"] = "order.created";
    DomainEvents["ORDER_CANCELLED"] = "order.cancelled";
    DomainEvents["PAYMENT_COMPLETED"] = "payment.completed";
    DomainEvents["PAYMENT_FAILED"] = "payment.failed";
    DomainEvents["INVENTORY_RESERVED"] = "inventory.reserved";
    DomainEvents["INVENTORY_RELEASED"] = "inventory.released";
    DomainEvents["SHIPMENT_DISPATCHED"] = "shipment.dispatched";
    DomainEvents["PRODUCT_UPDATED"] = "product.updated";
})(DomainEvents || (exports.DomainEvents = DomainEvents = {}));
exports.AMQP_EXCHANGES = {
    DOMAIN_EVENTS: 'omni.domain.events',
    DEAD_LETTER: 'omni.dead.letter',
};
exports.CORRELATION_ID_HEADER = 'x-correlation-id';
//# sourceMappingURL=index.js.map