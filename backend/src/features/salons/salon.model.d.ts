export declare const SalonModel: {
    create: (data: {
        name: string;
        email?: string;
        phone?: string;
        addressLine1?: string;
        city?: string;
        state?: string;
        postalCode?: string;
    }) => Promise<{
        name: string;
        email: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        addressLine1: string | null;
        addressLine2: string | null;
        city: string | null;
        state: string | null;
        country: string | null;
        postalCode: string | null;
        phone: string | null;
    }>;
    findAll: () => Promise<{
        name: string;
        email: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        addressLine1: string | null;
        addressLine2: string | null;
        city: string | null;
        state: string | null;
        country: string | null;
        postalCode: string | null;
        phone: string | null;
    }[]>;
};
//# sourceMappingURL=salon.model.d.ts.map