export interface BookingRequestDTO {
    userId: number;
    apartmentId: number;
    startDate: Date;
    endDate: Date;
    guests: number;
}