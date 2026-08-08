import $api from "@/entities/http-service";
import type {
  AnalyticsDashboard,
  AnalyticsPeriod,
} from "../model/analytics";

export async function fetchAnalytics(
  period: AnalyticsPeriod,
  limit: number,
  signal?: AbortSignal,
) {
  const { data } = await $api.get<AnalyticsDashboard>("/admin/analytics", {
    params: { period, limit },
    signal,
  });
  return data;
}
