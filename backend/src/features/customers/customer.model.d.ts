export declare const CustomerModel: {
    create: (data: {
        name: string;
        phone: string;
        email?: string;
        gender?: string;
        dateOfBirth?: Date;
        notes?: string;
        salonId: string;
        branchId?: string;
    }) => Promise<{
        salon: {
            name: string;
            id: string;
        };
        branch: {
            name: string;
            id: string;
        } | null;
    } & {
        salonId: string;
        name: string;
        email: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        phone: string;
        branchId: string | null;
        gender: string | null;
        dateOfBirth: Date | null;
        notes: string | null;
        totalVisits: number;
        loyaltyPoints: number;
        lastVisitAt: Date | null;
    }>;
    findAll: () => Promise<({
        salon: {
            name: string;
            id: string;
        };
        branch: {
            name: string;
            id: string;
        } | null;
    } & {
        salonId: string;
        name: string;
        email: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        phone: string;
        branchId: string | null;
        gender: string | null;
        dateOfBirth: Date | null;
        notes: string | null;
        totalVisits: number;
        loyaltyPoints: number;
        lastVisitAt: Date | null;
    })[]>;
    findBySalon: (salonId: string) => Promise<({
        branch: {
            name: string;
            id: string;
        } | null;
    } & {
        salonId: string;
        name: string;
        email: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        phone: string;
        branchId: string | null;
        gender: string | null;
        dateOfBirth: Date | null;
        notes: string | null;
        totalVisits: number;
        loyaltyPoints: number;
        lastVisitAt: Date | null;
    })[]>;
    findById: (id: string) => Promise<({
        salon: {
            name: string;
            id: string;
        };
        branch: {
            name: string;
            id: string;
        } | null;
    } & {
        salonId: string;
        name: string;
        email: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        phone: string;
        branchId: string | null;
        gender: string | null;
        dateOfBirth: Date | null;
        notes: string | null;
        totalVisits: number;
        loyaltyPoints: number;
        lastVisitAt: Date | null;
    }) | null>;
    findByIdAndSalon: (id: string, salonId: string) => Promise<({
        branch: {
            name: string;
            id: string;
        } | null;
    } & {
        salonId: string;
        name: string;
        email: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        phone: string;
        branchId: string | null;
        gender: string | null;
        dateOfBirth: Date | null;
        notes: string | null;
        totalVisits: number;
        loyaltyPoints: number;
        lastVisitAt: Date | null;
    }) | null>;
    findByPhoneAndSalon: (phone: string, salonId: string) => Promise<{
        salonId: string;
        name: string;
        email: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        phone: string;
        branchId: string | null;
        gender: string | null;
        dateOfBirth: Date | null;
        notes: string | null;
        totalVisits: number;
        loyaltyPoints: number;
        lastVisitAt: Date | null;
    } | null>;
    update: (id: string, data: {
        name?: string;
        phone?: string;
        email?: string | null;
        gender?: string | null;
        dateOfBirth?: Date | null;
        notes?: string | null;
        branchId?: string | null;
    }) => Promise<{
        branch: {
            name: string;
            id: string;
        } | null;
    } & {
        salonId: string;
        name: string;
        email: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        phone: string;
        branchId: string | null;
        gender: string | null;
        dateOfBirth: Date | null;
        notes: string | null;
        totalVisits: number;
        loyaltyPoints: number;
        lastVisitAt: Date | null;
    }>;
    delete: (id: string) => Promise<{
        salonId: string;
        name: string;
        email: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        phone: string;
        branchId: string | null;
        gender: string | null;
        dateOfBirth: Date | null;
        notes: string | null;
        totalVisits: number;
        loyaltyPoints: number;
        lastVisitAt: Date | null;
    }>;
};
//# sourceMappingURL=customer.model.d.ts.map