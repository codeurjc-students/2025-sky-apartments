
export interface BookingDTO {
    id: number;
    userId: number;
    apartmentId: number;
    startDate: Date;
    endDate: Date;
    totalPrice: number;
    status: string;
    guests: number;
    createdAt: Date;
}