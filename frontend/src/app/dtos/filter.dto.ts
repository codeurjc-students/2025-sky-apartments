export enum DateType {
  EVERY_DAY = 'EVERY_DAY',
  DATE_RANGE = 'DATE_RANGE',
  WEEK_DAYS = 'WEEK_DAYS',
  DATE_RANGE_WEEK_DAYS = 'DATE_RANGE_WEEK_DAYS'
}

export enum ConditionType {
  NONE = 'NONE',
  LAST_MINUTE = 'LAST_MINUTE',
  LONG_STAY = 'LONG_STAY'
}

export interface FilterDTO {
  id?: number;
  name: string;
  description: string;
  activated: boolean;
  increment: boolean;
  value?: number;
  dateType: DateType;
  startDate?: string;
  endDate?: string;
  weekDays?: string;
  conditionType?: ConditionType;
  anticipationHours?: number;
  minDays?: number;
  createdAt?: string;
  updatedAt?: string;
}