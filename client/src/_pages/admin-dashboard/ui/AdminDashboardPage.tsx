"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { AlertCircle, BarChart3, RotateCcw } from "lucide-react";
import { fetchAnalytics } from "../api/analytics";
import type {
  AnalyticsDashboard,
  AnalyticsPeriod,
  RankedItem,
} from "../model/analytics";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/shared/ui/chart";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/shared/ui/empty";
import { LoadingReveal } from "@/shared/ui/heraldic-loader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/shared/ui/toggle-group";
import { FleurDeLis } from "@/shared/ui/brand";

const periodLabels: Record<AnalyticsPeriod, string> = {
  "7d": "7 дней",
  "30d": "30 дней",
  "90d": "90 дней",
  all: "Всё время",
};

const chartDefinitions: Array<{
  key: keyof Pick<
    AnalyticsDashboard,
    | "popularTracksByGenre"
    | "popularTracksByAlbum"
    | "popularGenres"
    | "popularAuthors"
    | "popularAlbumsByAuthor"
    | "popularAlbumTracksByAuthor"
  >;
  title: string;
  description: string;
  label: (item: RankedItem) => string;
}> = [
  {
    key: "popularTracksByGenre",
    title: "Треки по жанрам",
    description: "Запуски каждого трека внутри жанрового архива",
    label: (item) => `${item.genreName} · ${item.trackName}`,
  },
  {
    key: "popularTracksByAlbum",
    title: "Треки в альбомах",
    description: "Самые востребованные записи в составе альбомов",
    label: (item) => `${item.albumName} · ${item.trackName}`,
  },
  {
    key: "popularGenres",
    title: "Популярные жанры",
    description: "Суммарные запуски треков каждого жанра",
    label: (item) => item.name,
  },
  {
    key: "popularAuthors",
    title: "Популярные авторы",
    description: "Primary и feat-авторы получают полный credit",
    label: (item) => item.name,
  },
  {
    key: "popularAlbumsByAuthor",
    title: "Альбомы авторов",
    description: "Популярность альбомов в авторском разрезе",
    label: (item) => `${item.authorName} · ${item.albumName}`,
  },
  {
    key: "popularAlbumTracksByAuthor",
    title: "Треки альбомов авторов",
    description: "Детальная карта запусков внутри релизов",
    label: (item) =>
      `${item.authorName} · ${item.albumName} · ${item.trackName}`,
  },
];

function RankingChart({
  title,
  description,
  items,
  label,
}: {
  title: string;
  description: string;
  items: RankedItem[];
  label: (item: RankedItem) => string;
}) {
  const rows = items.map((item) => ({
    ...item,
    fullLabel: label(item),
    shortLabel:
      label(item).length > 28 ? `${label(item).slice(0, 27)}…` : label(item),
  }));

  return (
    <Card className="relative min-w-0 overflow-hidden border-bnr-line bg-bnr-surface/95 text-bnr-bone shadow-[0_18px_55px_hsl(var(--bnr-abyss)/.5)]">
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-bnr-violet via-bnr-lilac/70 to-transparent"
      />
      <CardHeader className="pb-3">
        <CardTitle className="font-cinzel text-xl tracking-wide">
          <h2>{title}</h2>
        </CardTitle>
        <CardDescription className="text-sm text-bnr-ash">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length ? (
          <>
            <div className="relative min-w-0 pl-3">
              <FleurDeLis
                aria-hidden="true"
                className="absolute -left-3 top-1/2 size-8 -translate-y-1/2 text-bnr-violet/20"
              />
              <ChartContainer
                config={{ listens: { label: "Запуски", color: "hsl(var(--bnr-violet))" } }}
                className="h-[260px] w-full min-w-0"
                aria-label={`${title}: горизонтальный рейтинг`}
              >
                <BarChart
                  accessibilityLayer
                  data={rows}
                  layout="vertical"
                  margin={{ left: 4, right: 12, top: 4, bottom: 4 }}
                >
                  <CartesianGrid horizontal={false} stroke="hsl(var(--bnr-line))" />
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="shortLabel"
                    width={118}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "hsl(var(--bnr-ash))", fontSize: 11 }}
                  />
                  <ChartTooltip cursor={{ fill: "hsl(var(--bnr-lilac) / .08)" }} content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="listens"
                    name="Запуски"
                    fill="hsl(var(--bnr-violet))"
                    radius={[0, 5, 5, 0]}
                    isAnimationActive={false}
                  />
                </BarChart>
              </ChartContainer>
            </div>
            <details className="mt-3 text-xs text-bnr-ash">
              <summary className="cursor-pointer rounded-sm py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bnr-lilac">
                Таблица данных
              </summary>
              <div className="bnr-scrollbar mt-2 overflow-x-auto">
                <table className="w-full min-w-72 border-collapse text-left">
                  <thead>
                    <tr className="border-b border-bnr-line">
                      <th className="py-2 pr-3 font-medium">Позиция</th>
                      <th className="py-2 pr-3 font-medium">Запись</th>
                      <th className="py-2 text-right font-medium">Запуски</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, index) => (
                      <tr key={`${row.id}-${row.fullLabel}`} className="border-b border-bnr-line/50">
                        <td className="py-2 pr-3 tabular-nums">{index + 1}</td>
                        <td className="py-2 pr-3 text-bnr-bone">{row.fullLabel}</td>
                        <td className="py-2 text-right tabular-nums">{row.listens}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </>
        ) : (
          <Empty className="min-h-[260px] border border-dashed border-bnr-line">
            <EmptyHeader>
              <EmptyMedia variant="icon"><BarChart3 aria-hidden="true" /></EmptyMedia>
              <EmptyTitle>Пока нет запусков</EmptyTitle>
              <EmptyDescription>Для выбранного периода архив ещё не собрал данные.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </CardContent>
    </Card>
  );
}

export function AdminDashboardPage() {
  const [period, setPeriod] = useState<AnalyticsPeriod>("30d");
  const [limit, setLimit] = useState(10);
  const [data, setData] = useState<AnalyticsDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    void fetchAnalytics(period, limit, controller.signal)
      .then(setData)
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) {
          setError(requestError instanceof Error ? requestError.message : "Не удалось открыть архив статистики");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [limit, period, reloadKey]);

  const trackingLabel = useMemo(() => {
    if (!data?.trackingSince) return "История по датам начнёт собираться после первого запуска";
    return `История событий собирается с ${new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium" }).format(new Date(data.trackingSince))}`;
  }, [data?.trackingSince]);

  const retry = useCallback(() => setReloadKey((value) => value + 1), []);

  return (
    <main className="min-w-0 px-3 py-5 text-bnr-bone sm:px-5 lg:px-7">
      <header className="relative mb-6 overflow-hidden border border-bnr-line bg-bnr-abyss/80 px-4 py-5 sm:px-6">
        <FleurDeLis aria-hidden="true" className="absolute -right-10 -top-12 size-48 text-bnr-violet/10" />
        <p className="text-[10px] uppercase tracking-[0.24em] text-bnr-lilac">Административный архив</p>
        <h1 className="mt-2 font-cinzel text-3xl font-semibold tracking-wide sm:text-4xl">Палата статистики</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-bnr-ash">Шесть независимых рейтингов отражают реальные запуски каталога и полный credit совместных релизов.</p>
      </header>

      <section aria-label="Фильтры статистики" className="mb-5 flex flex-col gap-3 border-y border-bnr-line py-4 sm:flex-row sm:items-center sm:justify-between">
        <ToggleGroup
          type="single"
          value={period}
          onValueChange={(value) => value && setPeriod(value as AnalyticsPeriod)}
          aria-label="Период статистики"
          className="flex-wrap justify-start"
        >
          {(Object.entries(periodLabels) as Array<[AnalyticsPeriod, string]>).map(([value, label]) => (
            <ToggleGroupItem key={value} value={value} aria-label={label} className="border border-bnr-line px-3 text-bnr-ash data-[state=on]:border-bnr-violet data-[state=on]:bg-bnr-violet/20 data-[state=on]:text-bnr-bone">
              {label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <div className="flex items-center gap-3">
          <label htmlFor="analytics-limit" className="text-xs uppercase tracking-wider text-bnr-ash">Размер рейтинга</label>
          <Select value={String(limit)} onValueChange={(value) => setLimit(Number(value))}>
            <SelectTrigger id="analytics-limit" className="w-24 border-bnr-line bg-bnr-surface text-bnr-bone">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[5, 10, 15, 20].map((value) => <SelectItem key={value} value={String(value)}>Топ {value}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </section>

      {error ? (
        <Alert variant="destructive" className="mb-5">
          <AlertCircle aria-hidden="true" />
          <AlertTitle>Статистика недоступна</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
            <span>{error}</span>
            <Button type="button" variant="outline" onClick={retry}><RotateCcw aria-hidden="true" data-icon="inline-start" />Повторить</Button>
          </AlertDescription>
        </Alert>
      ) : null}

      <LoadingReveal loading={loading} label="Открываем архив статистики" variant="page" className="min-h-[420px]">
        {data && !error ? (
          <>
            <p className="mb-4 text-xs text-bnr-ash">{trackingLabel}</p>
            <div className="grid min-w-0 grid-cols-1 gap-4 min-[900px]:grid-cols-2">
              {chartDefinitions.map((chart) => (
                <RankingChart
                  key={chart.key}
                  title={chart.title}
                  description={chart.description}
                  label={chart.label}
                  items={data[chart.key]}
                />
              ))}
            </div>
          </>
        ) : null}
      </LoadingReveal>
    </main>
  );
}
