export interface ApartmentRequestDTO {
    name: string;
    description: string;
    price: number;
    services: Set<String>;
    capacity: number;
    image: File;
}