export declare const StaffModel: {
    create: (data: {
        name: string;
        email: string;
        phone?: string;
        jobRole: string;
        workingFrom: string;
        workingTo: string;
        weekOff: string;
        salonId: string;
        relationshipManagerId?: string;
    }) => Promise<{
        userId: string | null;
        salonId: string;
        name: string;
        email: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        phone: string | null;
        jobRole: string;
        workingFrom: string;
        workingTo: string;
        weekOff: string;
        status: boolean;
        relationshipManagerId: string | null;
    }>;
    findBySalon: (salonId: string) => Promise<({
        relationshipManager: {
            name: string;
            id: string;
            jobRole: string;
        } | null;
    } & {
        userId: string | null;
        salonId: string;
        name: string;
        email: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        phone: string | null;
        jobRole: string;
        workingFrom: string;
        workingTo: string;
        weekOff: string;
        status: boolean;
        relationshipManagerId: string | null;
    })[]>;
};
//# sourceMappingURL=staff.model.d.ts.map