// ============================================================
// InPost API Type Definitions — strict, no `any`
// ============================================================

export type LockerStatus = 'AVAILABLE' | 'UNAVAILABLE' | 'NO_DATA';

export type PointStatus = 'Operating' | 'Disabled' | 'Temporarily Closed';

export type PointType = 'parcel_locker' | 'pop' | 'courier';

export type LocationType = 'Outdoor' | 'Indoor' | 'Indoor_controlled';

export interface LockerAvailabilityDetails {
  A: LockerStatus;
  B: LockerStatus;
  C: LockerStatus;
}

export interface LockerAvailability {
  status: LockerStatus;
  details: LockerAvailabilityDetails;
}

export interface Address {
  line1: string;
  line2: string;
}

export interface AddressDetails {
  city: string;
  province: string;
  post_code: string;
  street: string;
  building_number: string;
  flat_number: string | null;
}

export interface Location {
  longitude: number;
  latitude: number;
}

export interface AgencyExtended {
  name: string;
}

export interface OperatingHoursExtended {
  customer: string | null;
}

export interface Point {
  href: string;
  country: string;
  name: string;
  type: PointType[];
  status: PointStatus;
  location: Location;
  location_type: LocationType;
  location_category: string;
  location_date: string | null;
  location_description: string | null;
  location_description_1: string | null;
  location_description_2: string | null;
  distance: number | null;
  opening_hours: string;
  address: Address;
  address_details: AddressDetails;
  phone_number: string | null;
  payment_point_descr: string | null;
  functions: string[];
  partner_id: number;
  is_next: boolean;
  payment_available: boolean;
  virtual: string;
  recommended_low_interest_box_machines_list: string[] | null;
  apm_doubled: string | null;
  location_247: boolean;
  operating_hours_extended: OperatingHoursExtended;
  agency: string;
  agencies_extended: AgencyExtended[];
  image_url: string;
  easy_access_zone: boolean;
  air_index_level: string | null;
  physical_type: string;
  physical_type_mapped: string;
  physical_type_description: string | null;
  in_mobile_collect_excluded: boolean | null;
  in_mobile_send_excluded: boolean | null;
  in_mobile_return_excluded: boolean | null;
  express_delivery_send: boolean;
  express_delivery_collect: boolean;
  delivery_area_id: string | null;
  micro_area_id: string | null;
  agency_code: string | null;
  locker_availability: LockerAvailability;
  supported_locker_temperatures: string[] | null;
  unavailability_periods: string[] | null;
  mondial_relay_id: string;
  print_in_store: string | null;
}

export interface ApiResponse {
  href: string;
  count: number;
  page: number;
  per_page: number;
  total_pages: number;
  items: Point[];
  meta?: {
    href: string;
    count: number;
    page: number;
    per_page: number;
    total_pages: number;
  };
}

export interface FetchPointsParams {
  city?: string;
  country?: string;
  page?: number;
  perPage?: number;
  relativePoint?: string;
}
