import { FilterDTO } from "./filter.dto";

export interface FiltersByDateResponseDTO {
  checkInDate: string;
  checkOutDate: string;
  totalNights: number;
  filtersByDate: { [key: string]: FilterDTO[] };
}