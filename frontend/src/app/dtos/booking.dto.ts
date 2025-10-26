
export interface BookingDTO {
    id: number;
    userId: number;
    apartmentId: number;
    startDate: Date;
    endDate: Date;
    cost: number;
    state: string;
    guests: number;
    createdAt: Date;
}