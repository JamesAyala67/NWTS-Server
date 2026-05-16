// OFFICIAL PSGC API: https://psgc.gitlab.io/api/docs/v1
// Fetches provinces, cities, and barangays for dropdown
// Usage: const { provinces, cities, barangays } = useAddress(provinceCode, cityCode, barangayCode);

import { useQuery } from "@tanstack/react-query";
import axios from "axios";

// PSGC API Base URL
const PSGC_API = "https://psgc.cloud/api";
// Region 5 (Bicol Region)
const REGION_CODE = "0500000000";

// Custom hook to fetch provinces, cities, and barangays based on selected codes
export function useAddress(
  selectedProvince: string,
  selectedCity: string,
  selectedBarangay: string,
) {
  // Fetch provinces for the region
  const { data: provinces } = useQuery({
    queryKey: ["provinces", REGION_CODE],
    queryFn: () =>
      axios
        .get(`${PSGC_API}/regions/${REGION_CODE}/provinces`)
        .then((res) => res.data),
  });
  // Fetch cities when a province is selected, and barangays when a city is selected
  const { data: cities } = useQuery({
    queryKey: ["cities", selectedProvince],
    queryFn: () =>
      axios
        .get(`${PSGC_API}/provinces/${selectedProvince}/cities-municipalities`)
        .then((res) => res.data),
    enabled: !!selectedProvince,
  });
  // Fetch barangays when a city is selected
  const { data: barangays } = useQuery({
    queryKey: ["barangays", selectedCity],
    queryFn: () =>
      axios
        .get(`${PSGC_API}/cities-municipalities/${selectedCity}/barangays`)
        .then((res) => res.data),
    enabled: !!selectedCity,
  });

  return { provinces, cities, barangays };
}
