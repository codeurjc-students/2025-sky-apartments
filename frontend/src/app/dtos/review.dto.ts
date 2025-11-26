export interface ReviewDTO {
    id: number;
    userId: number;
    userName: string;
    apartmentId: number;
    date: Date;
    comment: string;
    rating: number;
}